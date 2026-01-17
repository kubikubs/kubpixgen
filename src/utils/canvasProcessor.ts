import { removeBackground } from '@imgly/background-removal';

interface PixelationOptions {
    pixelSize: number;
    colorCount: number;
    removeBg: boolean;
}

export const processImage = async (
    imageSrc: string,
    options: PixelationOptions
): Promise<string> => {
    const img = new Image();
    img.src = imageSrc;
    await new Promise((resolve) => (img.onload = resolve));

    let sourceImage: HTMLImageElement | ImageBitmap = img;

    // 1. Remove Background if requested
    if (options.removeBg) {
        try {
            const blob = await removeBackground(img);
            const url = URL.createObjectURL(blob);
            const bgRemovedImg = new Image();
            bgRemovedImg.src = url;
            await new Promise((resolve) => (bgRemovedImg.onload = resolve));
            sourceImage = bgRemovedImg;
        } catch (error) {
            console.error("Background removal failed:", error);
            // Fallback to original image if removal fails
        }
    }

    // 2. Pixelate
    return pixelate(sourceImage, options.pixelSize, options.colorCount);
};

const pixelate = (
    img: HTMLImageElement | ImageBitmap,
    pixelSize: number,
    colorCount: number
): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error("Could not get canvas context");

    const w = img.width;
    const h = img.height;

    // Calculate small dimensions
    const smW = Math.max(1, Math.floor(w / pixelSize));
    const smH = Math.max(1, Math.floor(h / pixelSize));

    // Draw small
    const smallCanvas = document.createElement('canvas');
    smallCanvas.width = smW;
    smallCanvas.height = smH;
    const smallCtx = smallCanvas.getContext('2d');
    if (!smallCtx) throw new Error("Could not get small canvas context");

    smallCtx.drawImage(img, 0, 0, smW, smH);

    // Get image data for color quantization
    const imgData = smallCtx.getImageData(0, 0, smW, smH);
    const data = imgData.data;

    // Quantize colors
    const palette = generatePalette(data, colorCount);
    applyPalette(data, palette);

    smallCtx.putImageData(imgData, 0, 0);

    // Draw back scaled up
    canvas.width = w;
    canvas.height = h;

    // Disable smoothing for pixelated look
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(smallCanvas, 0, 0, w, h);

    return canvas.toDataURL('image/png');
};

// Simple K-Means implementation
const generatePalette = (data: Uint8ClampedArray, k: number): number[][] => {
    const pixels: number[][] = [];
    for (let i = 0; i < data.length; i += 4) {
        // Skip fully transparent pixels
        if (data[i + 3] < 128) continue;
        pixels.push([data[i], data[i + 1], data[i + 2]]);
    }

    if (pixels.length === 0) return [[0, 0, 0]]; // Fallback

    // Initialize centroids randomly
    let centroids = [];
    for (let i = 0; i < k; i++) {
        centroids.push(pixels[Math.floor(Math.random() * pixels.length)]);
    }

    // Iterations (limit to 10 for performance)
    for (let iter = 0; iter < 10; iter++) {
        const clusters: number[][][] = Array.from({ length: k }, () => []);

        // Assign pixels to nearest centroid
        for (const p of pixels) {
            let minDist = Infinity;
            let clusterIdx = 0;
            for (let i = 0; i < k; i++) {
                const d = dist(p, centroids[i]);
                if (d < minDist) {
                    minDist = d;
                    clusterIdx = i;
                }
            }
            clusters[clusterIdx].push(p);
        }

        // Recalculate centroids
        let changed = false;
        for (let i = 0; i < k; i++) {
            if (clusters[i].length === 0) continue;
            const newCentroid = [0, 0, 0];
            for (const p of clusters[i]) {
                newCentroid[0] += p[0];
                newCentroid[1] += p[1];
                newCentroid[2] += p[2];
            }
            newCentroid[0] = Math.round(newCentroid[0] / clusters[i].length);
            newCentroid[1] = Math.round(newCentroid[1] / clusters[i].length);
            newCentroid[2] = Math.round(newCentroid[2] / clusters[i].length);

            if (dist(centroids[i], newCentroid) > 1) {
                centroids[i] = newCentroid;
                changed = true;
            }
        }
        if (!changed) break;
    }
    return centroids;
};

const applyPalette = (data: Uint8ClampedArray, palette: number[][]) => {
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;

        const current = [data[i], data[i + 1], data[i + 2]];
        let minDist = Infinity;
        let closest = palette[0];

        for (const color of palette) {
            const d = dist(current, color);
            if (d < minDist) {
                minDist = d;
                closest = color;
            }
        }

        data[i] = closest[0];
        data[i + 1] = closest[1];
        data[i + 2] = closest[2];
    }
};

const dist = (c1: number[], c2: number[]) => {
    return Math.sqrt(
        Math.pow(c1[0] - c2[0], 2) +
        Math.pow(c1[1] - c2[1], 2) +
        Math.pow(c1[2] - c2[2], 2)
    );
};
