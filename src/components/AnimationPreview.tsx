import React, { useEffect, useRef, useState } from 'react';

interface AnimationPreviewProps {
    imageSrc: string | null;
    rows: number;
    cols: number;
    fps: number;
    isPlaying: boolean;
}

const AnimationPreview: React.FC<AnimationPreviewProps> = ({
    imageSrc,
    rows,
    cols,
    fps,
    isPlaying
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [frameIndex, setFrameIndex] = useState(0);
    const requestRef = useRef<number | null>(null);
    const previousTimeRef = useRef<number | undefined>(undefined);

    // Reset frame when image or grid changes
    useEffect(() => {
        setFrameIndex(0);
    }, [imageSrc, rows, cols]);

    const animate = (time: number) => {
        if (previousTimeRef.current !== undefined) {
            const deltaTime = time - previousTimeRef.current;
            const interval = 1000 / fps;

            if (deltaTime > interval) {
                setFrameIndex((prev) => (prev + 1) % (rows * cols));
                previousTimeRef.current = time - (deltaTime % interval);
            }
        } else {
            previousTimeRef.current = time;
        }

        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        }
    };

    useEffect(() => {
        if (isPlaying && imageSrc) {
            requestRef.current = requestAnimationFrame(animate);
        } else {
            if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
            previousTimeRef.current = undefined;
        }
        return () => {
            if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, fps, rows, cols, imageSrc]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageSrc) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.src = imageSrc;

        // We only draw when the image is loaded
        img.onload = () => {
            const spriteWidth = img.width / cols;
            const spriteHeight = img.height / rows;

            canvas.width = spriteWidth;
            canvas.height = spriteHeight;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Calculate current column and row
            const currentFrame = frameIndex % (rows * cols);
            const currentCol = currentFrame % cols;
            const currentRow = Math.floor(currentFrame / cols);

            // Draw specific frame
            ctx.imageSmoothingEnabled = false; // Keep it pixelated
            ctx.drawImage(
                img,
                currentCol * spriteWidth,
                currentRow * spriteHeight,
                spriteWidth,
                spriteHeight,
                0,
                0,
                spriteWidth,
                spriteHeight
            );
        };
    }, [imageSrc, frameIndex, rows, cols]);

    if (!imageSrc) return null;

    return (
        <div className="flex flex-col items-center">
            <div className="bg-gray-800 p-4 rounded-lg shadow-inner border border-gray-700 inline-block">
                {/* Checkerboard background for transparency */}
                <div className="bg-checkered rounded overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        className="max-w-[200px] max-h-[200px] object-contain w-auto h-auto"
                        style={{ imageRendering: 'pixelated' }}
                    />
                </div>
            </div>
            <p className="mt-2 text-xs text-gray-400 font-mono">
                Frame: {frameIndex + 1} / {rows * cols}
            </p>
        </div>
    );
};

export default AnimationPreview;
