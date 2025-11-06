import React, { useState, useCallback } from 'react';
import { useElementData } from './hooks/useElementData';
import MultipleChoiceQuiz from './components/MultipleChoiceQuiz';
import MatchingQuiz from './components/MatchingQuiz';
import CrosswordQuiz from './components/CrosswordQuiz';
import type { QuizType, SummaryData } from './types';
import SummaryModal from './components/SummaryModal';

const quizThemes = {
  'multiple-choice': { main: 'cyan', bg: 'bg-cyan-900', text: 'text-cyan-300', border: 'border-cyan-500', ring: 'ring-cyan-500', button: 'bg-cyan-600 hover:bg-cyan-700' },
  'matching': { main: 'emerald', bg: 'bg-emerald-900', text: 'text-emerald-300', border: 'border-emerald-500', ring: 'ring-emerald-500', button: 'bg-emerald-600 hover:bg-emerald-700' },
  'crossword': { main: 'indigo', bg: 'bg-indigo-900', text: 'text-indigo-300', border: 'border-indigo-500', ring: 'ring-indigo-500', button: 'bg-indigo-600 hover:bg-indigo-700' },
};

// Component definition moved to the top level of the module for stability.
const NavButton: React.FC<{
  quizType: QuizType;
  label: string;
  activeQuiz: QuizType | null;
  setActiveQuiz: (quizType: QuizType) => void;
}> = ({ quizType, label, activeQuiz, setActiveQuiz }) => {
  const theme = quizThemes[quizType];
  const isActive = activeQuiz === quizType;
  return (
    <button
      onClick={() => setActiveQuiz(quizType)}
      className={`px-4 py-2 font-semibold rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${isActive ? `${theme.bg} ${theme.text} shadow-lg scale-105` : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        } ${theme.ring}`}
    >
      {label}
    </button>
  );
};

function App() {
  const { elements, loading, error } = useElementData();
  const [activeQuiz, setActiveQuiz] = useState<QuizType | null>(null);

  // State for summary modal
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const [restartAction, setRestartAction] = useState<(() => void) | null>(null);

  // State for tooltip modal
  const [tooltipContent, setTooltipContent] = useState<{ title: string; text: string } | null>(null);

  const handleShowSummary = useCallback((data: SummaryData, onRestart: () => void) => {
    setSummaryData(data);
    setRestartAction(() => onRestart);
    setIsSummaryVisible(true);
  }, []);

  const handleShowTooltip = useCallback((text: string, context?: string) => {
    setTooltipContent({
      title: context || "Testo Completo",
      text: text,
    });
  }, []);


  const renderQuiz = () => {
    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div></div>;
    if (error) return <p className="text-center text-red-400 text-lg">{error}</p>;
    if (elements.length === 0) return <p className="text-center text-gray-400">Nessun elemento da mostrare.</p>;
    
    const quizProps = {
      elements,
      onShowSummary: handleShowSummary,
      onShowTooltip: handleShowTooltip,
    };

    switch (activeQuiz) {
      case 'multiple-choice':
        return <MultipleChoiceQuiz {...quizProps} theme={quizThemes['multiple-choice']} key="mcq" />;
      case 'matching':
        return <MatchingQuiz {...quizProps} theme={quizThemes['matching']} key="match" />;
      case 'crossword':
        return <CrosswordQuiz {...quizProps} theme={quizThemes['crossword']} key="crossword" />;
      default:
        return (
            <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-100">Seleziona una modalità di verifica</h2>
                <p className="text-gray-400 mt-2">Metti alla prova la tua conoscenza della tavola periodica con tre diverse tipologie di esercizi interattivi.</p>
            </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8 font-sans">
      
      {isSummaryVisible && summaryData && activeQuiz && (
        <SummaryModal 
          summary={summaryData}
          onClose={() => setIsSummaryVisible(false)}
          onRestart={() => {
            setIsSummaryVisible(false);
            restartAction?.();
          }}
          theme={quizThemes[activeQuiz]}
        />
      )}

      {tooltipContent && (
         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={() => setTooltipContent(null)}>
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl border border-gray-700" onClick={e => e.stopPropagation()}>
                <h3 className={`text-xl font-bold mb-4 text-cyan-300`}>{tooltipContent.title}</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{tooltipContent.text}</p>
                <button 
                  onClick={() => setTooltipContent(null)}
                  className="mt-6 px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  Chiudi
                </button>
            </div>
        </div>
      )}


      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-400">
          Alla scoperta degli Elementi
        </h1>
        <p className="mt-2 text-lg text-gray-400">by SciaMaio - Un modo divertente per imparare la chimica!</p>
      </header>

      <nav className="flex justify-center flex-wrap gap-4 mb-8">
        <NavButton quizType="multiple-choice" label="Risposta Multipla" activeQuiz={activeQuiz} setActiveQuiz={setActiveQuiz} />
        <NavButton quizType="matching" label="Associazione" activeQuiz={activeQuiz} setActiveQuiz={setActiveQuiz} />
        <NavButton quizType="crossword" label="Cruciverba" activeQuiz={activeQuiz} setActiveQuiz={setActiveQuiz} />
      </nav>

      <main className="transition-opacity duration-500">
        {renderQuiz()}
      </main>
    </div>
  );
}

export default App;