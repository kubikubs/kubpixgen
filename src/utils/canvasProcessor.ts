import { removeBackground } from '@imgly/background-removal';

interface PixelationOptions {
    pixelSize: number;
    colorCount: number;
    removeBg: boolean;
    referenceImageSrc?: string;
    lineartMode: boolean;
    colorizeMode: 'none' | 'warm' | 'cold' | 'custom';
    customColor?: string;
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
        }
    }

    // 2. Lineart Extraction (if enabled)
    // We do this BEFORE pixelation/quantization if we want the "sketch" look,
    // OR we could do it on the small canvas. Let's do it on the source for quality lines.
    if (options.lineartMode) {
        sourceImage = await cleanLineart(sourceImage as HTMLImageElement);
    }

    // 3. Pixelate & Colorize & Quantize
    // We need to fetch the palette from reference image if provided
    let customPalette: number[][] | null = null;
    if (options.referenceImageSrc) {
        const refImg = new Image();
        refImg.src = options.referenceImageSrc;
        await new Promise((resolve) => (refImg.onload = resolve));
        customPalette = extractPalette(refImg, options.colorCount);
    }

    return pixelate(sourceImage, options.pixelSize, options.colorCount, options.colorizeMode, options.customColor, customPalette);
};

const cleanLineart = async (img: HTMLImageElement): Promise<HTMLImageElement> => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return img;

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        // Grayscale formula: 0.299R + 0.587G + 0.114B
        const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

        // Thresholding
        // If brightness < 128 (dark), make it black. Else white.
        // We can make this softer or sharper. Let's try flexible threshold.
        const threshold = 180; // Higher threshold = more lines detected
        const val = brightness < threshold ? 0 : 255;

        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;

        // Preserve original alpha, but if it's white (background), maybe make transparent?
        // User asked for "clean lineart", typically black lines on white. 
        // We'll keep alpha as is unless it was already transparent.
    }

    ctx.putImageData(imageData, 0, 0);

    const newImg = new Image();
    newImg.src = canvas.toDataURL();
    await new Promise(r => newImg.onload = r);
    return newImg;
};

// Helper: Extract palette from an image without modifying it
const extractPalette = (img: HTMLImageElement, k: number): number[][] => {
    const canvas = document.createElement('canvas');
    // Scale down for performance
    const w = 100;
    const h = (img.height / img.width) * 100;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [[0, 0, 0]];

    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    return generatePalette(data, k);
};


const pixelate = (
    img: HTMLImageElement | ImageBitmap,
    pixelSize: number,
    colorCount: number,
    colorizeMode: 'none' | 'warm' | 'cold' | 'custom',
    customColor?: string,
    forcedPalette?: number[][] | null
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

    // Get image data for processing
    const imgData = smallCtx.getImageData(0, 0, smW, smH);
    const data = imgData.data;

    // 1. Apply Color Filters (BEFORE quantization)
    if (colorizeMode !== 'none') {
        applyColorFilter(data, colorizeMode, customColor);
    }

    // 2. Quantize colors
    // If we have a forced palette (from reference image), use it.
    // Otherwise generate one from the current image data.
    const palette = forcedPalette || generatePalette(data, colorCount);

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


const applyColorFilter = (
    data: Uint8ClampedArray,
    mode: 'warm' | 'cold' | 'custom',
    customColorHex?: string
) => {
    let rTarget = 0, gTarget = 0, bTarget = 0;

    if (mode === 'custom' && customColorHex) {
        // Parse hex
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(customColorHex);
        if (result) {
            rTarget = parseInt(result[1], 16);
            gTarget = parseInt(result[2], 16);
            bTarget = parseInt(result[3], 16);
        }
    }

    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0) continue;

        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        if (mode === 'warm') {
            // Boost red/yellow
            r = Math.min(255, r * 1.2);
            g = Math.min(255, g * 1.1);
            b = b * 0.9;
        } else if (mode === 'cold') {
            // Boost blue/cyan
            r = r * 0.9;
            g = Math.min(255, g * 1.1);
            b = Math.min(255, b * 1.2);
        } else if (mode === 'custom') {
            // Blend with target color (overlay blending)
            // Simple approach: average or tint
            const strength = 0.3;
            r = r * (1 - strength) + rTarget * strength;
            g = g * (1 - strength) + gTarget * strength;
            b = b * (1 - strength) + bTarget * strength;
        }

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
    }
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
