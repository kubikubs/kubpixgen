import React, { useRef } from 'react';

interface ControlsProps {
    pixelSize: number;
    setPixelSize: (size: number) => void;
    colorCount: number;
    setColorCount: (count: number) => void;
    removeBg: boolean;
    setRemoveBg: (remove: boolean) => void;

    lineartMode: boolean;
    setLineartMode: (mode: boolean) => void;

    colorizeMode: 'none' | 'warm' | 'cold' | 'custom';
    setColorizeMode: (mode: 'none' | 'warm' | 'cold' | 'custom') => void;
    customColor: string;
    setCustomColor: (color: string) => void;

    setReferenceImage: (img: string | null) => void;
    referenceImage: string | null;
    enablePixelation: boolean;
    setEnablePixelation: (enabled: boolean) => void;

    // Sprite Props
    isSpriteSheet: boolean;
    setIsSpriteSheet: (is: boolean) => void;
    rows: number;
    setRows: (n: number) => void;
    cols: number;
    setCols: (n: number) => void;
    fps: number;
    setFps: (n: number) => void;

    onExport: () => void;
    onExportGif?: () => void;
    processing: boolean;
    generatingGif?: boolean;
}

const Controls: React.FC<ControlsProps> = ({
    pixelSize,
    setPixelSize,
    colorCount,
    setColorCount,
    removeBg,
    setRemoveBg,
    lineartMode,
    setLineartMode,
    colorizeMode,
    setColorizeMode,
    customColor,
    setCustomColor,
    setReferenceImage,
    referenceImage,
    enablePixelation,
    setEnablePixelation,

    isSpriteSheet,
    setIsSpriteSheet,
    rows,
    setRows,
    cols,
    setCols,
    fps,
    setFps,

    onExport,
    onExportGif,
    processing,
    generatingGif,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const url = URL.createObjectURL(e.target.files[0]);
            setReferenceImage(url);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-6 w-full max-w-md max-h-[80vh] overflow-y-auto">

            <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition">Enable Pixelation</span>
                    <input
                        type="checkbox"
                        checked={enablePixelation}
                        onChange={(e) => setEnablePixelation(e.target.checked)}
                        className="accent-pink-500 h-5 w-5"
                    />
                </label>
            </div>

            {/* Pixel Resolution */}
            {enablePixelation && (
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Pixel Size (Resolution): {pixelSize}px
                    </label>
                    <input
                        type="range"
                        min="4"
                        max="64"
                        step="2"
                        value={pixelSize}
                        onChange={(e) => setPixelSize(Number(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
            )}

            {/* Sprite Sheet Settings */}
            <div className="border-t border-gray-700 py-2"></div>
            <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition">Treat as Sprite Sheet</span>
                    <input
                        type="checkbox"
                        checked={isSpriteSheet}
                        onChange={(e) => setIsSpriteSheet(e.target.checked)}
                        className="accent-orange-500 h-5 w-5"
                    />
                </label>

                {isSpriteSheet && (
                    <div className="grid grid-cols-2 gap-4 bg-gray-900 p-3 rounded-lg">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Cols (Horz)</label>
                            <input
                                type="number"
                                min="1"
                                value={cols}
                                onChange={(e) => setCols(Math.max(1, Number(e.target.value)))}
                                className="w-full bg-gray-700 rounded px-2 py-1 text-white text-sm focus:ring-1 focus:ring-orange-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Rows (Vert)</label>
                            <input
                                type="number"
                                min="1"
                                value={rows}
                                onChange={(e) => setRows(Math.max(1, Number(e.target.value)))}
                                className="w-full bg-gray-700 rounded px-2 py-1 text-white text-sm focus:ring-1 focus:ring-orange-500 outline-none"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs text-gray-400 mb-1">Animation Speed: {fps} FPS</label>
                            <input
                                type="range"
                                min="1"
                                max="24"
                                step="1"
                                value={fps}
                                onChange={(e) => setFps(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                        </div>
                    </div>
                )}
            </div>
            <div className="border-t border-gray-700 py-2"></div>

            {/* Color Count */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Palette Size
                </label>
                <div className="flex gap-2 flex-wrap">
                    {[2, 4, 8, 12, 16, 24, 32].map((count) => (
                        <button
                            key={count}
                            onClick={() => setColorCount(count)}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${colorCount === count
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {count}
                        </button>
                    ))}
                </div>
            </div>

            <div className="border-t border-gray-700 py-2"></div>

            {/* Reference Image */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Reference Image (Benchmark)</label>
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:bg-white/5 cursor-pointer transition relative"
                >
                    {referenceImage ? (
                        <div className="flex items-center gap-4">
                            <img src={referenceImage} alt="Ref" className="w-12 h-12 object-cover rounded shadow" />
                            <span className="text-sm text-green-400">Reference Loaded</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setReferenceImage(null); }}
                                className="ml-auto text-xs text-red-400 hover:text-red-300"
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">Click to upload reference style</p>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleRefImageUpload}
                        accept="image/*"
                    />
                </div>
                <p className="text-xs text-gray-500">Colors will be extracted from this image.</p>
            </div>

            <div className="border-t border-gray-700 py-2"></div>

            {/* Global Toggles */}
            <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition">Remove Background</span>
                    <input
                        type="checkbox"
                        checked={removeBg}
                        onChange={(e) => setRemoveBg(e.target.checked)}
                        className="accent-blue-500 h-5 w-5"
                    />
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition">Clean Lineart Mode</span>
                    <input
                        type="checkbox"
                        checked={lineartMode}
                        onChange={(e) => setLineartMode(e.target.checked)}
                        className="accent-purple-500 h-5 w-5"
                    />
                </label>
            </div>

            <div className="border-t border-gray-700 py-2"></div>

            {/* Colorize Filters */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Colorize / Filter</label>
                <div className="grid grid-cols-2 gap-2">
                    {(['none', 'warm', 'cold', 'custom'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setColorizeMode(mode)}
                            className={`px-3 py-2 rounded-md capitalize text-sm font-medium transition-all ${colorizeMode === mode
                                ? 'bg-indigo-600 text-white shadow-lg scale-105'
                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
                {colorizeMode === 'custom' && (
                    <div className="mt-3 flex items-center gap-3 bg-gray-900 p-2 rounded-lg">
                        <input
                            type="color"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="bg-transparent border-none h-8 w-8 cursor-pointer"
                        />
                        <span className="text-sm text-gray-400">{customColor}</span>
                    </div>
                )}
            </div>

            <button
                onClick={onExport}
                disabled={processing}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg text-white font-bold text-lg transition-transform active:scale-95 shadow-md flex justify-center items-center mt-4"
            >
                {processing ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Wait...
                    </>
                ) : (
                    'Export Result'
                )}
            </button>
        </div>
    );
};

export default Controls;
