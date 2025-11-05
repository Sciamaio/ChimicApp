import React from 'react';
import type { SummaryData, Theme } from '../types';

interface SummaryModalProps {
  summary: SummaryData;
  onClose: () => void;
  onRestart: () => void;
  theme: Theme;
}

const SummaryModal: React.FC<SummaryModalProps> = ({ summary, onClose, onRestart, theme }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40 p-4">
      <div className={`bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md text-center border-t-4 ${theme.border}`}>
        <h2 className={`text-3xl font-bold ${theme.text} mb-4`}>Esercizio Completato!</h2>
        
        <div className="space-y-4 my-8">
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-400 uppercase">Punteggio</p>
            <p className="text-4xl font-extrabold text-white">{summary.score}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-400 uppercase">Tempo Impiegato</p>
            <p className="text-4xl font-extrabold text-white">{summary.time}</p>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={onRestart}
            className={`px-6 py-3 font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${theme.button} ${theme.ring}`}
          >
            Rigioca
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummaryModal;
