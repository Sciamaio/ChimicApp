import React, { useState, useEffect, useCallback } from 'react';
// Fix: Import ChemicalElement to resolve type errors.
import type { QuizComponentProps, ChemicalElement } from '../types';
import { QuizContainer } from './QuizContainer';
import { shuffleArray } from '../utils/quizUtils';
import { ClickableTruncatedText } from './Tooltip';

const NUM_QUESTIONS = 10;

// Definizione del tipo per una singola domanda del quiz
interface McqQuestion {
  clue: string;
  clueContext: string;
  options: string[];
  correctAnswer: string;
}
// Mappa per associare le chiavi delle proprietà a etichette leggibili
// Fix: Remove broad type annotation to allow for more specific keyof type inference, preventing index type errors.
const propertyLabels = {
  'Z': 'Numero Atomico',
  'Simbolo': 'Simbolo',
  'Anno di scoperta': 'Anno di scoperta',
  'Origine del nome': 'Origine del nome',
  'Caratteristiche chimiche': 'Caratteristiche chimiche',
  'Dove si trova e diffusione in natura': 'Diffusione in natura',
  'Utilizzo da parte dell\'industria': 'Utilizzo industriale',
  'Curiosità legate a come sono stati usati o considerati nel corso della storia': 'Curiosità'
};

const MultipleChoiceQuiz: React.FC<QuizComponentProps> = ({ elements, theme, onShowSummary, onShowTooltip }) => {
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [time, setTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const setupGame = useCallback(() => {
    const shuffledElements = shuffleArray([...elements]);
    const quizElements = shuffledElements.slice(0, NUM_QUESTIONS);

    const newQuestions = quizElements.map((correctElement) => {
      const otherElements = shuffledElements.filter(el => el.Z !== correctElement.Z);
      const incorrectAnswers = shuffleArray(otherElements)
        .slice(0, 3)
        .map(el => el.Elemento);
      
      const options = shuffleArray([correctElement.Elemento, ...incorrectAnswers]);

      // Genera un indizio dinamico basato su una proprietà casuale
      const properties = Object.keys(propertyLabels).filter(p => p !== 'Elemento') as (keyof typeof propertyLabels)[];
      const randomPropertyKey = shuffleArray(properties)[0] as keyof Omit<ChemicalElement, 'Elemento'>;
      const clueValue = correctElement[randomPropertyKey];
      const clueText = `Quale elemento ha come "${propertyLabels[randomPropertyKey]}" il seguente valore: ${clueValue}?`;

      return {
        clue: clueText,
        clueContext: `Definizione per ${correctElement.Elemento}`,
        options: options,
        correctAnswer: correctElement.Elemento,
      };
    });
    
    setQuestions(newQuestions);
    setCurrentQuestionIndex(0);
    setUserAnswers(Array(newQuestions.length).fill(null));
    setSelectedAnswer(null);
    setFeedback(null);
    setTime(0);
    setTimerActive(true);
  }, [elements]);

  useEffect(() => {
    if (elements.length > 0) {
      setupGame();
    }
  }, [elements, setupGame]);

  useEffect(() => {
    let interval: number;
    if (timerActive) {
      interval = window.setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => window.clearInterval(interval);
  }, [timerActive]);

  const handleAnswerSelect = (answer: string) => {
    if (feedback) return; 
    setSelectedAnswer(answer);
    
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);

    if (answer === questions[currentQuestionIndex].correctAnswer) {
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setFeedback(null);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    setTimerActive(false);

    let correct = 0;
    let incorrect = 0;
    const incorrectDetails: { question: string; yourAnswer: string; correctAnswer: string }[] = [];

    questions.forEach((q, i) => {
      const userAnswer = userAnswers[i];
      if (userAnswer === q.correctAnswer) {
        correct++;
      } else if (userAnswer !== null) {
        incorrect++;
        incorrectDetails.push({
          question: q.clue,
          yourAnswer: userAnswer,
          correctAnswer: q.correctAnswer,
        });
      }
    });

    const unanswered = NUM_QUESTIONS - correct - incorrect;
    const finalScore = correct * 3 - incorrect;
    const timeString = `${Math.floor(time / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`;

    const details = (
      <div className="text-left text-sm mt-4 space-y-2 text-gray-300">
        <p><strong>Corrette:</strong> {correct} (+{correct * 3} punti)</p>
        <p><strong>Errate:</strong> {incorrect} (-{incorrect} punti)</p>
        <p><strong>Non date:</strong> {unanswered} (0 punti)</p>
        
        {incorrectDetails.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-600">
            <h4 className="font-bold mb-2 text-white">Dettaglio errori:</h4>
            <ul className="space-y-3 max-h-40 overflow-y-auto pr-2">
              {incorrectDetails.map((detail, i) => (
                <li key={i}>
                  <p className="font-semibold text-gray-400">
                     <ClickableTruncatedText text={detail.question} maxLength={100} onShowTooltip={onShowTooltip} />
                  </p>
                  <p className="pl-4">La tua risposta: <span className="text-red-400 font-bold">{detail.yourAnswer}</span></p>
                  <p className="pl-4">Risposta corretta: <span className="text-green-400 font-bold">{detail.correctAnswer}</span></p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );

    onShowSummary({
      score: `${finalScore} / 30`,
      time: timeString,
      details: details,
      passed: finalScore >= 18,
    }, setupGame);
  };
  
  if (questions.length === 0) {
    return <div className="text-center p-8">Caricamento del quiz...</div>;
  }
  
  const currentQuestion = questions[currentQuestionIndex];

  const getButtonClass = (option: string) => {
    if (!feedback) {
      return `bg-gray-700 hover:bg-gray-600`;
    }
    if (option === currentQuestion.correctAnswer) {
      return `bg-green-600`;
    }
    if (option === selectedAnswer && option !== currentQuestion.correctAnswer) {
      return `bg-red-600`;
    }
    return `bg-gray-700 opacity-50`;
  };
  
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <QuizContainer
      title="Quiz a Risposta Multipla"
      description="Leggi la domanda e seleziona l'elemento corretto. Puoi passare alla domanda successiva in ogni momento."
      theme={theme}
      time={time}
      onFinish={handleFinish}
      onNewGame={setupGame}
    >
      <div className="flex flex-col items-center">
        <div className="w-full max-w-3xl text-center">
          <p className="text-gray-400 mb-2">Domanda {currentQuestionIndex + 1} di {NUM_QUESTIONS}</p>
          <div className="bg-gray-900 bg-opacity-50 p-6 rounded-lg border border-gray-700 min-h-[100px] flex items-center justify-center">
             <p className="text-lg sm:text-xl text-white">
                <ClickableTruncatedText 
                    text={currentQuestion.clue}
                    maxLength={150}
                    onShowTooltip={onShowTooltip}
                    context={currentQuestion.clueContext}
                />
             </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            {currentQuestion.options.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswerSelect(option)}
                disabled={!!feedback}
                className={`p-4 w-full rounded-lg text-white font-semibold text-lg transition-all duration-300 transform-gpu focus:outline-none focus:ring-2 ${theme.ring} focus:ring-offset-2 focus:ring-offset-gray-800 ${getButtonClass(option)} ${!feedback ? 'hover:scale-105' : 'cursor-not-allowed'}`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <button 
              onClick={handleNextQuestion} 
              className={`px-6 py-3 font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${theme.button} ${theme.ring}`}
            >
              {isLastQuestion ? 'Vedi Risultati' : 'Prossima Domanda'}
            </button>
          </div>
        </div>
      </div>
    </QuizContainer>
  );
};

export default MultipleChoiceQuiz;