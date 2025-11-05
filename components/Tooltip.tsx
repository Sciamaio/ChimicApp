import React from 'react';

interface ClickableTruncatedTextProps {
  text: string;
  maxLength: number;
  onShowTooltip: (text: string, context?: string) => void;
  context?: string;
}

export const ClickableTruncatedText: React.FC<ClickableTruncatedTextProps> = ({ text, maxLength, onShowTooltip, context }) => {
  if (text.length <= maxLength) {
    return <span>{text}</span>;
  }

  const truncatedText = text.slice(0, maxLength) + '...';

  return (
    <span className="flex items-center gap-1.5">
      <span>{truncatedText}</span>
      <button 
        onClick={() => onShowTooltip(text, context)} 
        className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
        aria-label="Mostra testo completo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </button>
    </span>
  );
};
