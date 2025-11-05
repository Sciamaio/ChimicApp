import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChemicalElement, CrosswordGrid, CrosswordClue, QuizComponentProps, UserGrid } from '../types';
import { generateCrosswordData } from '../utils/crosswordGenerator';
import { QuizContainer } from './QuizContainer';
import { ClickableTruncatedText } from './Tooltip';

const CrosswordQuiz: React.FC<QuizComponentProps> = ({ elements, theme, onShowSummary, onShowTooltip }) => {
  const [crossword, setCrossword] = useState<{ grid: CrosswordGrid; clues: CrosswordClue[] } | null>(null);
  const [userGrid, setUserGrid] = useState<UserGrid | null>(null);
  const [time, setTime] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  const setupGame = useCallback(() => {
    const data = generateCrosswordData(elements);
    setCrossword(data);
    const newUserGrid = data.grid.map(row => row.map(() => null));
    setUserGrid(newUserGrid);
    inputRefs.current = data.grid.map(() => []);
    setTime(0);
    setTimerActive(true);
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

  const handleFinish = () => {
    setTimerActive(false);
    if (!crossword || !userGrid) return;
    
    let correctLetters = 0;
    let totalLetters = 0;
    crossword.grid.forEach((row, r) => {
        row.forEach((cell, c) => {
            if(cell !== null) {
                totalLetters++;
                if (userGrid[r][c] === cell) {
                    correctLetters++;
                }
            }
        });
    });

    const timeString = `${Math.floor(time / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`;
    onShowSummary({ score: `${correctLetters} / ${totalLetters} lettere`, time: timeString }, setupGame);
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
    const value = e.target.value.toUpperCase().slice(-1);
    const newUserGrid = userGrid!.map(r => [...r]);
    newUserGrid[row][col] = value || null;
    setUserGrid(newUserGrid);
    
    if (value) {
        if (col + 1 < crossword!.grid[0].length && crossword!.grid[row][col+1] !== null) {
            inputRefs.current?.[row]?.[col+1]?.focus();
        } else if (row + 1 < crossword!.grid.length && crossword!.grid[row+1][col] !== null) {
            inputRefs.current?.[row+1]?.[col]?.focus();
        }
    }
  };

  if (!crossword || !userGrid) {
    return <div className="text-center p-8">Generazione cruciverba in corso...</div>;
  }

  const { grid, clues } = crossword;
  const acrossClues = clues.filter(c => c.direction === 'across').sort((a,b) => a.number - b.number);
  const downClues = clues.filter(c => c.direction === 'down').sort((a,b) => a.number - b.number);

  const renderGrid = () => (
    <div className="grid bg-gray-600 gap-px border border-gray-600 p-1 rounded-md" style={{ gridTemplateColumns: `repeat(${grid[0].length}, minmax(0, 1fr))` }}>
      {grid.map((row, r) =>
        row.map((cell, c) => {
          if (cell === null) {
            return <div key={`${r}-${c}`} className="aspect-square bg-gray-800" />;
          }
          const clueStart = clues.find(clue => clue.row === r && clue.col === c);

          return (
            <div key={`${r}-${c}`} className="relative aspect-square bg-gray-200 text-black">
              {clueStart && <span className="absolute top-0 left-0.5 text-[10px] sm:text-xs font-bold text-gray-600 select-none">{clueStart.number}</span>}
              <input
                ref={el => {
                    if (!inputRefs.current[r]) inputRefs.current[r] = [];
                    inputRefs.current[r][c] = el;
                }}
                type="text"
                maxLength={1}
                value={userGrid[r][c] || ''}
                onChange={(e) => handleInputChange(e, r, c)}
                className="w-full h-full text-center text-base sm:text-xl font-bold uppercase bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 z-10 text-black"
              />
            </div>
          );
        })
      )}
    </div>
  );
  
  const ClueList = ({ title, cluesList }: { title: string, cluesList: CrosswordClue[] }) => (
      <div>
          <h3 className={`font-bold text-lg mb-2 ${theme.text}`}>{title}</h3>
          <ul className="space-y-2 text-gray-300 h-64 overflow-y-auto pr-2">
              {cluesList.map(clue => (
                <li key={`${clue.direction}-${clue.number}`} className="text-sm flex items-start gap-2">
                    <span className="font-bold">{clue.number}.</span>
                    <ClickableTruncatedText 
                        text={clue.text} 
                        maxLength={50} 
                        onShowTooltip={onShowTooltip}
                        context={`Definizione: ${clue.number}. ${title.slice(0,-1)}`}
                    />
                </li>
              ))}
          </ul>
      </div>
  );

  return (
    <QuizContainer 
        title="Cruciverba Chimico" 
        description="Riempi la griglia con i nomi degli elementi." 
        theme={theme}
        time={time}
        onFinish={handleFinish}
        onNewGame={setupGame}
        newGameButtonText='Nuovo Cruciverba'
    >
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-2/3 xl:w-1/2 flex justify-center items-start">
            {renderGrid()}
        </div>
        <div className="w-full lg:w-1/3 xl:w-1/2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            <ClueList title="Orizzontali" cluesList={acrossClues} />
            <ClueList title="Verticali" cluesList={downClues} />
        </div>
      </div>
    </QuizContainer>
  );
};

export default CrosswordQuiz;
