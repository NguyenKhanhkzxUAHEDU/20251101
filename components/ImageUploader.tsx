
import React, { useCallback } from 'react';

interface UploadIconProps {
  className?: string;
}

const UploadIcon: React.FC<UploadIconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  uploadedImagePreview?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, uploadedImagePreview }) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageUpload(event.target.files[0]);
    }
  }, [onImageUpload]);

  return (
    <div className="w-full">
      <label
        htmlFor="file-upload"
        className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700 transition-colors duration-300"
      >
        {uploadedImagePreview ? (
          <img src={uploadedImagePreview} alt="Preview" className="object-contain h-full w-full rounded-lg p-2" />
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-400">
              <span className="font-semibold text-cyan-400">Nhấn để tải lên</span> hoặc kéo và thả
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, WEBP (tối đa 5MB)</p>
          </div>
        )}
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};

export default ImageUploader;
