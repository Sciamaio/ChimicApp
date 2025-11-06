import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { CrosswordGrid, CrosswordClue, QuizComponentProps, UserGrid, Theme, ChemicalElement } from '../types';
import { generateCrosswordData } from '../utils/crosswordGenerator';
import { QuizContainer } from './QuizContainer';
import { shuffleArray, getRandomClueForElement } from '../utils/quizUtils';

type ModalData = {
    element: ChemicalElement;
    clue: CrosswordClue;
};

// Modal component to display clues when a number is clicked
const ClueModal: React.FC<{ 
    data: ModalData[];
    theme: Theme; 
    onClose: () => void;
    onGetAnotherClue: (element: ChemicalElement, existingClues: string[]) => string | null;
}> = ({ data, theme, onClose, onGetAnotherClue }) => {
    const [extraClues, setExtraClues] = useState<Record<string, string[]>>({});

    const handleGetClueClick = (item: ModalData) => {
        const direction = item.clue.direction;
        const initialClueText = item.clue.text;
        const existingExtraClues = extraClues[direction] || [];
        const allExistingClues = [initialClueText, ...existingExtraClues];

        const newClue = onGetAnotherClue(item.element, allExistingClues);
        if (newClue) {
            setExtraClues(prev => ({
                ...prev,
                [direction]: [...(prev[direction] || []), newClue],
            }));
        }
    };
    
    if (data.length === 0) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" 
            onClick={onClose}
        >
            <div 
                className={`bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg border border-gray-700 relative border-t-4 ${theme.border}`}
                onClick={e => e.stopPropagation()}
            >
                <h3 className={`text-xl font-bold mb-4 ${theme.text}`}>Definizioni per il N° {data[0].clue.number}</h3>
                 <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                    {data.map(item => {
                        const direction = item.clue.direction;
                        return (
                            <div key={direction} className="border-b border-gray-700 pb-3 last:border-b-0">
                                <p className="font-semibold text-gray-300">
                                    {direction === 'across' ? 'Orizzontale' : 'Verticale'}: <span className="font-normal text-gray-400">{item.clue.text}</span>
                                </p>

                                {(extraClues[direction] || []).map((clue, index) => (
                                    <p key={index} className="text-sm text-gray-400 pl-4 mt-1">
                                        <span className="font-semibold text-gray-300">Indizio extra {index + 1}:</span> {clue}
                                    </p>
                                ))}

                                <button 
                                  onClick={() => handleGetClueClick(item)}
                                  className={`mt-2 px-3 py-1 text-sm text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${theme.button} ${theme.ring}`}
                                >
                                  Chiedi indizio (-5 punti)
                                </button>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-6 flex justify-end">
                    <button 
                      onClick={onClose}
                      className={`px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400`}
                    >
                      Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
};

// Grid component extracted from CrosswordQuiz to ensure stable component identity
const Grid = React.memo(({ grid, clues, userGrid, handleInputChange, onNumberClick, inputRefs, isFinished, handleKeyDown }: {
    grid: CrosswordGrid;
    clues: CrosswordClue[];
    userGrid: UserGrid;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => void;
    onNumberClick: (clueNumber: number) => void;
    inputRefs: React.MutableRefObject<(HTMLInputElement | null)[][]>;
    isFinished: boolean;
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => void;
}) => {
    return (
        <div className="grid bg-gray-600 gap-px border border-gray-600 p-1 rounded-md shadow-lg" style={{ gridTemplateColumns: `repeat(${grid[0].length}, minmax(0, 1fr))` }}>
            {grid.map((row, r) =>
                row.map((cell, c) => {
                    if (cell === null) {
                        return <div key={`${r}-${c}`} className="aspect-square bg-gray-800" />;
                    }
                    const clueStart = clues.find(clue => clue.row === r && clue.col === c);
                    const cellData = userGrid[r]?.[c];
                    
                    let textColor = 'text-black';
                    if (cellData?.isHint || cellData?.isCorrected) {
                        textColor = 'text-red-600';
                    }

                    return (
                        <div key={`${r}-${c}`} className="relative aspect-square bg-gray-200 text-black">
                            {clueStart && (
                                <span 
                                    className={`absolute top-0 left-0.5 text-[10px] sm:text-xs font-bold text-gray-600 select-none z-20 ${isFinished ? 'cursor-default' : 'cursor-pointer hover:text-blue-600'}`}
                                    onClick={() => !isFinished && onNumberClick(clueStart.number)}
                                >
                                    {clueStart.number}
                                </span>
                            )}
                            <input
                                ref={el => {
                                    if (!inputRefs.current[r]) inputRefs.current[r] = [];
                                    inputRefs.current[r][c] = el;
                                }}
                                type="text"
                                maxLength={1}
                                value={cellData?.letter || ''}
                                readOnly={cellData?.isHint || isFinished}
                                onKeyDown={(e) => handleKeyDown(e, r, c)}
                                onChange={(e) => handleInputChange(e, r, c)}
                                className={`w-full h-full text-center text-base sm:text-xl font-bold uppercase bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 z-10 ${textColor}`}
                            />
                        </div>
                    );
                })
            )}
        </div>
    );
});
Grid.displayName = 'Grid';


const CrosswordQuiz: React.FC<QuizComponentProps> = ({ elements, theme, onShowSummary }) => {
  const [crossword, setCrossword] = useState<{ grid: CrosswordGrid; clues: CrosswordClue[] } | null>(null);
  const [userGrid, setUserGrid] = useState<UserGrid | null>(null);
  const [time, setTime] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const [activeModalData, setActiveModalData] = useState<ModalData[] | null>(null);
  const [initialLetterHints, setInitialLetterHints] = useState(10);
  const [randomLetterHints, setRandomLetterHints] = useState(10);
  const [moreInfoHintsUsed, setMoreInfoHintsUsed] = useState(0);
  const [hintPenalty, setHintPenalty] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  const setupGame = useCallback(() => {
    const data = generateCrosswordData(elements);
    setCrossword(data);
    const newUserGrid = data.grid.map(row => row.map(() => null));
    setUserGrid(newUserGrid);
    inputRefs.current = data.grid.map(() => []);
    setTime(0);
    setTimerActive(true);
    setActiveModalData(null);
    setInitialLetterHints(10);
    setRandomLetterHints(10);
    setMoreInfoHintsUsed(0);
    setHintPenalty(0);
    setIsFinished(false);
  }, [elements]);

  useEffect(() => {
    setupGame();
  }, [setupGame]);
  
  useEffect(() => {
    let interval: number;
    if (timerActive) {
      interval = window.setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => window.clearInterval(interval);
  }, [timerActive]);

  const applyHint = (row: number, col: number, letter: string, penalty: number, isCorrection: boolean = false) => {
    setUserGrid(prevGrid => {
        if (!prevGrid) return null;
        const newGrid = prevGrid.map(r => [...r]);
        const existingCell = newGrid[row][col];
        // Don't overwrite an already correct letter from the user unless it's a forced correction
        if (existingCell && !isCorrection) return newGrid;

        newGrid[row][col] = { letter, isHint: !isCorrection, isCorrected: isCorrection };
        return newGrid;
    });
    if (!isCorrection) {
      setHintPenalty(p => p + penalty);
    }
  };

  const handleInitialLetterHint = () => {
      if (initialLetterHints <= 0 || !crossword || !userGrid || isFinished) return;
      
      const unsolvedClues = crossword.clues.filter(clue => {
          const cell = userGrid[clue.row]?.[clue.col];
          return !cell || !cell.isHint;
      });

      if (unsolvedClues.length > 0) {
          const randomClue = shuffleArray(unsolvedClues)[0];
          applyHint(randomClue.row, randomClue.col, randomClue.answer[0], 5);
          setInitialLetterHints(h => h - 1);
      }
  };

  const handleRandomLetterHint = () => {
      if (randomLetterHints <= 0 || !crossword || !userGrid || isFinished) return;

      const emptyOrWrongCells: { r: number, c: number, letter: string }[] = [];
      crossword.grid.forEach((row, r) => {
          row.forEach((cell, c) => {
              if (cell !== null) {
                  const userCell = userGrid[r]?.[c];
                  if (!userCell || (!userCell.isHint && userCell.letter !== cell)) {
                      emptyOrWrongCells.push({ r, c, letter: cell });
                  }
              }
          });
      });

      if (emptyOrWrongCells.length > 0) {
          const randomCell = shuffleArray(emptyOrWrongCells)[0];
          applyHint(randomCell.r, randomCell.c, randomCell.letter, 2);
          setRandomLetterHints(h => h - 1);
      }
  };
  
  const handleGetAnotherClue = (element: ChemicalElement, existingClues: string[]): string | null => {
      setMoreInfoHintsUsed(c => c + 1);
      setHintPenalty(p => p + 5);
      return getRandomClueForElement(element, existingClues);
  };

  const handleFinish = () => {
    setTimerActive(false);
    setIsFinished(true);
    if (!crossword || !userGrid) return;

    const correctedGrid = userGrid.map(r => [...r]);
    let correctLetters = 0;
    let totalLetters = 0;

    crossword.grid.forEach((row, r) => {
        row.forEach((cell, c) => {
            if(cell !== null) {
                totalLetters++;
                const userCell = userGrid[r]?.[c];
                if (userCell?.letter === cell) {
                    correctLetters++;
                    // Keep user's correct letter
                    correctedGrid[r][c] = { letter: cell, isHint: userCell.isHint };
                } else {
                    // Correct the wrong/empty cell
                    correctedGrid[r][c] = { letter: cell, isCorrected: true };
                }
            }
        });
    });
    
    setUserGrid(correctedGrid);

    setTimeout(() => {
        const finalScore = correctLetters - hintPenalty;
        const timeString = `${Math.floor(time / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`;
        const details = (
          <div className="text-left text-sm mt-4 space-y-1 text-gray-300">
            <p><strong>Lettere corrette:</strong> {correctLetters} / {totalLetters}</p>
            <p><strong>Aiuti usati (iniziale/casuale):</strong> {10-initialLetterHints} / {10-randomLetterHints}</p>
            <p><strong>Indizi extra richiesti:</strong> {moreInfoHintsUsed}</p>
            <p><strong>Penalità totali:</strong> -{hintPenalty} punti</p>
          </div>
        );
        
        onShowSummary({ score: `${finalScore} Punti`, time: timeString, details }, setupGame);
    }, 3000); // Show summary after 3 seconds
  };

  const handleNumberClick = useCallback((clueNumber: number) => {
    if (!crossword || isFinished) return;
    const relevantClues = crossword.clues.filter(clue => clue.number === clueNumber);
    if (relevantClues.length > 0) {
        const modalData: ModalData[] = [];
        for (const clue of relevantClues) {
           const element = elements.find(el => el.Elemento.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z]/g, '') === clue.answer);
           if (element) {
                modalData.push({ element, clue });
            }
        }
        if (modalData.length > 0) {
            setActiveModalData(modalData);
        }
    }
  }, [crossword, elements, isFinished]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
    if (!userGrid || !crossword || isFinished) return;
    if (userGrid[row]?.[col]?.isHint) return;
    
    const value = e.target.value.toUpperCase().slice(-1);
    const newUserGrid = userGrid.map(r => [...r]);
    newUserGrid[row][col] = value ? { letter: value } : null;
    setUserGrid(newUserGrid);
    
    if (value) {
        // Try to move right
        if (col + 1 < crossword.grid[0].length && crossword.grid[row][col+1] !== null && !userGrid[row][col+1]) {
            inputRefs.current?.[row]?.[col+1]?.focus();
        } 
        // Try to move down if can't move right
        else if (row + 1 < crossword.grid.length && crossword.grid[row+1][col] !== null && !userGrid[row+1][col]) {
            inputRefs.current?.[row+1]?.[col]?.focus();
        }
    }
  }, [crossword, userGrid, isFinished]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    if (!crossword) return;
    const { grid } = crossword;
    const numRows = grid.length;
    const numCols = grid[0].length;

    switch (e.key) {
        case 'ArrowUp':
            e.preventDefault();
            for (let r = row - 1; r >= 0; r--) {
                if (grid[r][col]) {
                    inputRefs.current[r]?.[col]?.focus();
                    return;
                }
            }
            break;
        case 'ArrowDown':
            e.preventDefault();
            for (let r = row + 1; r < numRows; r++) {
                if (grid[r][col]) {
                    inputRefs.current[r]?.[col]?.focus();
                    return;
                }
            }
            break;
        case 'ArrowLeft':
            e.preventDefault();
            for (let c = col - 1; c >= 0; c--) {
                if (grid[row][c]) {
                    inputRefs.current[row]?.[c]?.focus();
                    return;
                }
            }
            break;
        case 'ArrowRight':
            e.preventDefault();
            for (let c = col + 1; c < numCols; c++) {
                if (grid[row][c]) {
                    inputRefs.current[row]?.[c]?.focus();
                    return;
                }
            }
            break;
    }
  }, [crossword]);

  if (!crossword || !userGrid) {
    return <div className="text-center p-8">Generazione cruciverba in corso...</div>;
  }

  return (
    <QuizContainer 
        title="Cruciverba Chimico" 
        description="Clicca su un numero per vedere la definizione e riempi la griglia. Usa gli aiuti se sei in difficoltà!" 
        theme={theme}
        time={time}
        onFinish={handleFinish}
        onNewGame={setupGame}
        newGameButtonText='Nuovo Cruciverba'
    >
      {activeModalData && <ClueModal 
        data={activeModalData} 
        theme={theme} 
        onClose={() => setActiveModalData(null)}
        onGetAnotherClue={handleGetAnotherClue}
       />}
      
      {/* Hint Controls */}
      <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mb-4 p-3 bg-gray-900/50 rounded-lg">
        <h3 className="font-semibold text-gray-300 mr-2">Aiuti:</h3>
        <div className="flex items-center gap-2" title="Mostra la lettera iniziale di una parola a caso (-5 punti)">
            <button
              onClick={handleInitialLetterHint}
              disabled={initialLetterHints <= 0 || isFinished}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-sky-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sky-700 transition-colors"
            >
              <span>Iniziale</span>
              <span className="bg-sky-800 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{initialLetterHints}</span>
            </button>
        </div>
         <div className="flex items-center gap-2" title="Mostra una lettera a caso in una casella vuota o errata (-2 punti)">
            <button
              onClick={handleRandomLetterHint}
              disabled={randomLetterHints <= 0 || isFinished}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-teal-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-700 transition-colors"
            >
              <span>Casuale</span>
              <span className="bg-teal-800 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{randomLetterHints}</span>
            </button>
        </div>
         <div className="flex items-center gap-2 text-sm text-gray-300" title="Numero di indizi extra richiesti nelle definizioni (-5 punti l'uno)">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
            <span>Indizi Extra:</span>
            <span className="font-bold">{moreInfoHintsUsed}</span>
        </div>
      </div>

      <div className="flex justify-center items-start">
        <div className="w-full max-w-2xl">
            <Grid 
                grid={crossword.grid}
                clues={crossword.clues}
                userGrid={userGrid}
                handleInputChange={handleInputChange}
                onNumberClick={handleNumberClick}
                inputRefs={inputRefs}
                isFinished={isFinished}
                handleKeyDown={handleKeyDown}
            />
        </div>
      </div>
    </QuizContainer>
  );
};

export default CrosswordQuiz;