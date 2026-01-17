import GIF from 'gif.js';

export const generateGif = async (
    imageSrc: string,
    rows: number,
    cols: number,
    fps: number
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;

        img.onload = () => {
            const gif = new GIF({
                workers: 2,
                quality: 10,
                workerScript: '/gif.worker.js', // Must serve this file from public/
                transparent: null, // Optional: '0x00FF00' etc if we knew transparent color
            });

            const spriteWidth = Math.floor(img.width / cols);
            const spriteHeight = Math.floor(img.height / rows);
            const delay = 1000 / fps;

            const canvas = document.createElement('canvas');
            canvas.width = spriteWidth;
            canvas.height = spriteHeight;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            // Slice frames
            for (let i = 0; i < rows * cols; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);

                // Clear canvas
                ctx.clearRect(0, 0, spriteWidth, spriteHeight);

                // Draw slice
                ctx.drawImage(
                    img,
                    col * spriteWidth,
                    row * spriteHeight,
                    spriteWidth,
                    spriteHeight,
                    0,
                    0,
                    spriteWidth,
                    spriteHeight
                );

                // Add to GIF
                gif.addFrame(ctx, { copy: true, delay: delay });
            }

            gif.on('finished', (blob: Blob) => {
                resolve(URL.createObjectURL(blob));
            });

            gif.render();
        };

        img.onerror = (err) => {
            reject(err);
        };
    });
};
