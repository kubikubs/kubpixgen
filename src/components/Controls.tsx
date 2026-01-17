import React from 'react';

interface ControlsProps {
    pixelSize: number;
    setPixelSize: (size: number) => void;
    colorCount: number;
    setColorCount: (count: number) => void;
    removeBg: boolean;
    setRemoveBg: (remove: boolean) => void;
    onExport: () => void;
    processing: boolean;
}

const Controls: React.FC<ControlsProps> = ({
    pixelSize,
    setPixelSize,
    colorCount,
    setColorCount,
    removeBg,
    setRemoveBg,
    onExport,
    processing,
}) => {
    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-6 w-full max-w-md">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pixel Size: {pixelSize}px
                </label>
                <input
                    type="range"
                    min="4"
                    max="64"
                    step="4"
                    value={pixelSize}
                    onChange={(e) => setPixelSize(Number(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Color Palette Size
                </label>
                <div className="flex gap-2">
                    {[4, 8, 12, 16, 24, 32].map((count) => (
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

            <div className="flex items-center space-x-3">
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={removeBg}
                        onChange={(e) => setRemoveBg(e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-300">Remove Background</span>
                </label>
            </div>

            <button
                onClick={onExport}
                disabled={processing}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg text-white font-bold text-lg transition-transform active:scale-95 shadow-md flex justify-center items-center"
            >
                {processing ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                    </>
                ) : (
                    'Export Pixel Art'
                )}
            </button>
        </div>
    );
};

export default Controls;
