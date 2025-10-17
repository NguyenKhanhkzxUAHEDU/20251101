
import React from 'react';

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full space-y-4">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-400"></div>
    <p className="text-gray-400">AI đang phác thảo ý tưởng...</p>
  </div>
);

interface PlaceholderProps {
    children: React.ReactNode;
}

const Placeholder: React.FC<PlaceholderProps> = ({ children }) => (
    <div className="flex items-center justify-center h-full w-full bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-600">
        <p className="text-gray-500 text-center px-4">{children}</p>
    </div>
);


interface ResultDisplayProps {
  isLoading: boolean;
  generatedImage: string | null;
  error: string | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ isLoading, generatedImage, error }) => {
  return (
    <div className="flex-grow w-full h-full min-h-[300px] flex items-center justify-center">
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <Placeholder>
          <span className="text-red-400">Lỗi: {error}</span>
        </Placeholder>
      ) : generatedImage ? (
        <img src={generatedImage} alt="AI Generated Architecture" className="object-contain max-h-full max-w-full rounded-lg shadow-2xl" />
      ) : (
        <Placeholder>
            Thiết kế được tạo bởi AI sẽ xuất hiện ở đây.
        </Placeholder>
      )}
    </div>
  );
};

export default ResultDisplay;
