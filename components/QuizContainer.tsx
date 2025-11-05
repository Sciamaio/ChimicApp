import React from 'react';
import type { Theme } from '../types';
import Timer from './Timer';

interface QuizContainerProps {
  title: string;
  description: string;
  theme: Theme;
  time: number;
  onFinish: () => void;
  onNewGame: () => void;
  finishButtonText?: string;
  newGameButtonText?: string;
  children: React.ReactNode;
}

export const QuizContainer: React.FC<QuizContainerProps> = ({ 
  title, description, theme, time, onFinish, onNewGame, 
  finishButtonText = "Concludi Esercizio",
  newGameButtonText = "Nuova Partita",
  children 
}) => {
  return (
    <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto flex flex-col border border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-700 pb-4">
          <div>
            <h2 className={`text-2xl font-bold ${theme.text}`}>{title}</h2>
            <p className="text-gray-400 mt-1">{description}</p>
          </div>
          <Timer time={time} theme={theme} />
      </div>
      <div className="flex-grow">
        {children}
      </div>
       <div className="mt-8 flex flex-wrap justify-center gap-4 border-t border-gray-700 pt-6">
            <button onClick={onFinish} className={`px-6 py-3 font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${theme.button} ${theme.ring}`}>
             {finishButtonText}
           </button>
           <button onClick={onNewGame} className={`px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-900`}>
             {newGameButtonText}
           </button>
        </div>
    </div>
  );
};
