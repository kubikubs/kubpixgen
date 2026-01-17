import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface ImageUploaderProps {
    onImageSelected: (file: File) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            onImageSelected(acceptedFiles[0]);
        }
    }, [onImageSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
        },
        multiple: false,
    });

    return (
        <div
            {...getRootProps()}
            className={`p-10 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50/10' : 'border-gray-600 hover:border-gray-500 hover:bg-white/5'}
      `}
        >
            <input {...getInputProps()} />
            {isDragActive ? (
                <p className="text-blue-400 font-medium">Drop the image here...</p>
            ) : (
                <div className="text-center space-y-2">
                    <p className="text-lg font-medium text-gray-200">Drag & drop an image here</p>
                    <p className="text-sm text-gray-400">or click to select one</p>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
