
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-5 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          AI Architect Vision
        </h1>
        <p className="text-gray-400 mt-2">
          Biến ý tưởng hình khối thành kiệt tác kiến trúc
        </p>
      </div>
    </header>
  );
};

export default Header;
