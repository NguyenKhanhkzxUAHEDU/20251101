
import React, { useState } from 'react';

interface ChevronDownIconProps {
  className?: string;
}

const ChevronDownIcon: React.FC<ChevronDownIconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

interface OptionGroupProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const OptionGroup: React.FC<OptionGroupProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-700 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-3 px-2 text-left font-semibold text-cyan-400 hover:bg-gray-700/50 rounded-md transition-colors"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="py-2 px-1 grid grid-cols-2 md:grid-cols-3 gap-3">
          {children}
        </div>
      )}
    </div>
  );
};

export default OptionGroup;
