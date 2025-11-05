import React from 'react';
import type { Theme } from '../types';

interface TimerProps {
  time: number;
  theme: Theme;
}

const Timer: React.FC<TimerProps> = ({ time, theme }) => {
  const minutes = Math.floor(time / 60).toString().padStart(2, '0');
  const seconds = (time % 60).toString().padStart(2, '0');

  return (
    <div className={`mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 rounded-lg ${theme.bg} bg-opacity-50 border ${theme.border}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${theme.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-xl font-mono font-bold text-white">{minutes}:{seconds}</span>
    </div>
  );
};

export default Timer;
