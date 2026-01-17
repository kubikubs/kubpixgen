import { useState, useEffect, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import Controls from './components/Controls';
import AnimationPreview from './components/AnimationPreview';
import { processImage } from './utils/canvasProcessor';

function App() {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [pixelSize, setPixelSize] = useState<number>(12);
    const [colorCount, setColorCount] = useState<number>(8);
    const [removeBg, setRemoveBg] = useState<boolean>(false);
    const [processing, setProcessing] = useState<boolean>(false);
    const [lineartMode, setLineartMode] = useState<boolean>(false);
    const [colorizeMode, setColorizeMode] = useState<'none' | 'warm' | 'cold' | 'custom'>('none');
    const [customColor, setCustomColor] = useState<string>('#ff0000');
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [enablePixelation, setEnablePixelation] = useState<boolean>(true);

    // Sprite State
    const [isSpriteSheet, setIsSpriteSheet] = useState<boolean>(false);
    const [rows, setRows] = useState<number>(4);
    const [cols, setCols] = useState<number>(4);
    const [fps, setFps] = useState<number>(8);

    const handleImageSelected = (file: File) => {
        const url = URL.createObjectURL(file);
        setOriginalImage(url);
        // Reset processed image when new image is uploaded
        setProcessedImage(null);
    };

    const runProcessing = useCallback(async () => {
        if (!originalImage) return;

        setProcessing(true);
        try {
            // Small delay to allow UI to update
            await new Promise(resolve => setTimeout(resolve, 100));

            const resultUrl = await processImage(originalImage, {
                pixelSize,
                colorCount,
                removeBg,
                lineartMode,
                colorizeMode,
                customColor,
                referenceImageSrc: referenceImage || undefined,
                enablePixelation,
            });
            setProcessedImage(resultUrl);
        } catch (error) {
            console.error("Processing failed", error);
            alert("Failed to process image. See console for details.");
        } finally {
            setProcessing(false);
        }
    }, [originalImage, pixelSize, colorCount, removeBg, lineartMode, colorizeMode, customColor, referenceImage, enablePixelation]);

    // Debounced auto-update (optional, currently disabled to prefer explicit export/process for bg removal which is heavy)
    // But for simple pixelation it's fast. Background removal is the bottleneck.
    // We can auto-update if strictly pixelating, but let's stick to "Export/Process" or just update when controls change if not removing bg.

    useEffect(() => {
        if (originalImage && !removeBg) {
            // Fast live preview if not removing background
            const timer = setTimeout(() => {
                runProcessing();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [originalImage, pixelSize, colorCount, removeBg, lineartMode, colorizeMode, customColor, referenceImage, runProcessing, enablePixelation]);


    const handleDownload = () => {
        if (processedImage) {
            const link = document.createElement('a');
            link.download = 'pixel-art.png';
            link.href = processedImage;
            link.click();
        } else if (originalImage) {
            // If they click export but we haven't processed yet (e.g. they just uploaded and hit export)
            // Trigger processing then download? Or just run processing.
            runProcessing();
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="mb-10 text-center">
                    <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
                        Pixel Art Converter
                    </h1>
                    <p className="text-gray-400">Transform your images into retro masterpieces</p>
                </header>

                <main className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">

                    <div className="space-y-8">
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <h2 className="text-xl font-semibold mb-4 text-gray-200">1. Upload Image</h2>
                            <ImageUploader onImageSelected={handleImageSelected} />
                        </div>

                        {originalImage && (
                            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                                <h2 className="text-xl font-semibold mb-4 text-gray-200">2. Settings</h2>
                                <Controls
                                    pixelSize={pixelSize}
                                    setPixelSize={setPixelSize}
                                    colorCount={colorCount}
                                    setColorCount={setColorCount}
                                    removeBg={removeBg}
                                    setRemoveBg={setRemoveBg}

                                    enablePixelation={enablePixelation}
                                    setEnablePixelation={setEnablePixelation}

                                    isSpriteSheet={isSpriteSheet}
                                    setIsSpriteSheet={setIsSpriteSheet}
                                    rows={rows}
                                    setRows={setRows}
                                    cols={cols}
                                    setCols={setCols}
                                    fps={fps}
                                    setFps={setFps}

                                    lineartMode={lineartMode}
                                    setLineartMode={setLineartMode}
                                    colorizeMode={colorizeMode}
                                    setColorizeMode={setColorizeMode}
                                    customColor={customColor}
                                    setCustomColor={setCustomColor}
                                    referenceImage={referenceImage}
                                    setReferenceImage={setReferenceImage}

                                    onExport={handleDownload}
                                    processing={processing}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="bg-checkered p-4 rounded-xl shadow-2xl min-h-[500px] flex items-center justify-center border border-gray-700 relative overflow-hidden group">
                            {!originalImage ? (
                                <div className="text-gray-500 font-medium">Preview will appear here</div>
                            ) : (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <img
                                        src={processedImage || originalImage}
                                        alt="Preview"
                                        className={`max-w-full max-h-[600px] object-contain shadow-2xl transition-all duration-300 ${processing ? 'blur-sm opacity-50' : 'image-pixelated'}`}
                                        style={{ imageRendering: 'pixelated' }}
                                    />
                                    {processing && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Styles for checkered background */}
                            <style>{`
                    .bg-checkered {
                        background-color: #1a1a1a;
                        background-image:
                            linear-gradient(45deg, #222 25%, transparent 25%),
                            linear-gradient(-45deg, #222 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #222 75%),
                            linear-gradient(-45deg, transparent 75%, #222 75%);
                        background-size: 20px 20px;
                        background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                    }
                `}</style>
                        </div>

                        {/* Live Animation Preview */}
                        {isSpriteSheet && (processedImage || originalImage) && (
                            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-200 mb-2">Live Animation Preview</h3>
                                <AnimationPreview
                                    imageSrc={processedImage || originalImage}
                                    rows={rows}
                                    cols={cols}
                                    fps={fps}
                                    isPlaying={true}
                                />
                            </div>
                        )}
                    </div>

                </main>
            </div>
        </div>
    );
}

export default App;
