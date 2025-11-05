import type { CrosswordClue, CrosswordGrid, ChemicalElement } from '../types';
import { shuffleArray, getRandomClueForElement } from './quizUtils';

interface WordPlacement {
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
}

const MAX_GRID_SIZE = 25;
const MIN_WORDS = 10;
const MAX_ATTEMPTS = 50;


const canPlaceWord = (
  grid: CrosswordGrid,
  word: string,
  row: number,
  col: number,
  direction: 'across' | 'down'
): boolean => {
  // CRITICAL FIX: Add boundary checks to prevent out-of-bounds access
  if (row < 0 || col < 0) return false;

  if (direction === 'across') {
    if (col + word.length > grid[0].length) return false;
    // Check for collisions and neighbors
    for (let i = 0; i < word.length; i++) {
        // If cell is occupied, it must match the letter
        if (grid[row][col + i] && grid[row][col + i] !== word[i]) return false;
        // Check for adjacent letters if we're placing on a null spot
        if (grid[row][col + i] === null) {
            if ((row > 0 && grid[row - 1][col + i] !== null) || (row < grid.length - 1 && grid[row + 1][col + i] !== null)) return false;
        }
    }
    // Check start and end boundaries
    if ((col > 0 && grid[row][col - 1] !== null) || (col + word.length < grid[0].length && grid[row][col + word.length] !== null)) return false;
  
  } else { // down
    if (row + word.length > grid.length) return false;
    for (let i = 0; i < word.length; i++) {
      if (grid[row + i][col] && grid[row + i][col] !== word[i]) return false;
       if (grid[row + i][col] === null) {
            if ((col > 0 && grid[row + i][col-1] !== null) || (col < grid[0].length - 1 && grid[row + i][col + 1] !== null)) return false;
        }
    }
     if ((row > 0 && grid[row - 1][col] !== null) || (row + word.length < grid.length && grid[row + word.length][col] !== null)) return false;
  }
  return true;
};

const placeWordOnGrid = (
  grid: CrosswordGrid,
  placement: WordPlacement
): void => {
  if (placement.direction === 'across') {
    for (let i = 0; i < placement.word.length; i++) {
      grid[placement.row][placement.col + i] = placement.word[i];
    }
  } else {
    for (let i = 0; i < placement.word.length; i++) {
      grid[placement.row + i][placement.col] = placement.word[i];
    }
  }
};

const normalizeWord = (word: string) => {
    return word.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z]/g, '');
}

export const generateCrosswordData = (elements: ChemicalElement[]) => {
    let attempts = 0;
    while(attempts < MAX_ATTEMPTS) {
        try {
            const result = tryGenerateCrossword(elements);
            if (result.placements.length >= MIN_WORDS) {
                return result;
            }
        } catch (e) {
            // Try again
        }
        attempts++;
    }
    // Fallback if generation fails
    return tryGenerateCrossword(elements.slice(0, 15));
};


const tryGenerateCrossword = (elements: ChemicalElement[]) => {
  const shuffledElements = shuffleArray([...elements]);
  const wordsWithClues = shuffledElements
    .map(el => ({
      word: normalizeWord(el.Elemento),
      clue: getRandomClueForElement(el),
    }))
    .filter(item => item.word.length > 3 && item.word.length < 15)
    .sort((a, b) => b.word.length - a.word.length);

  if (wordsWithClues.length < MIN_WORDS) {
      throw new Error("Not enough words to generate a crossword");
  }

  const grid: CrosswordGrid = Array(MAX_GRID_SIZE).fill(null).map(() => Array(MAX_GRID_SIZE).fill(null));
  const placements: WordPlacement[] = [];

  // Place the first word
  const firstWord = wordsWithClues.shift()!;
  const firstRow = Math.floor(MAX_GRID_SIZE / 2);
  const firstCol = Math.floor((MAX_GRID_SIZE - firstWord.word.length) / 2);
  const firstPlacement: WordPlacement = { ...firstWord, row: firstRow, col: firstCol, direction: 'across' };
  placeWordOnGrid(grid, firstPlacement);
  placements.push(firstPlacement);

  // Place subsequent words
  for (const { word, clue } of wordsWithClues) {
    let placed = false;
    for (const existingPlacement of shuffleArray([...placements])) {
      for (let i = 0; i < existingPlacement.word.length; i++) {
        for (let j = 0; j < word.length; j++) {
          if (existingPlacement.word[i] === word[j]) {
            const direction: 'across' | 'down' = existingPlacement.direction === 'across' ? 'down' : 'across';
            const row = direction === 'down' ? existingPlacement.row - j : existingPlacement.row + i;
            const col = direction === 'down' ? existingPlacement.col + i : existingPlacement.col - j;
            
            if (canPlaceWord(grid, word, row, col, direction)) {
              const newPlacement = { word, clue, row, col, direction };
              placeWordOnGrid(grid, newPlacement);
              placements.push(newPlacement);
              placed = true;
              break;
            }
          }
        }
        if (placed) break;
      }
      if (placed) break;
    }
  }

  // Crop the grid
  let minRow = MAX_GRID_SIZE, maxRow = -1, minCol = MAX_GRID_SIZE, maxCol = -1;
  for (let r = 0; r < MAX_GRID_SIZE; r++) {
    for (let c = 0; c < MAX_GRID_SIZE; c++) {
      if (grid[r][c] !== null) {
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
      }
    }
  }

  const croppedGrid = grid.slice(minRow, maxRow + 1).map(row => row.slice(minCol, maxCol + 1));
  
  const finalPlacements = placements.map(p => ({
    ...p,
    row: p.row - minRow,
    col: p.col - minCol
  }));

  // Assign numbers to clues
  const numberedClues: CrosswordClue[] = [];
  let clueNumber = 1;
  const numberGrid: (number | null)[][] = Array(croppedGrid.length).fill(null).map(() => Array(croppedGrid[0].length).fill(null));

  finalPlacements.sort((a,b) => a.row === b.row ? a.col - b.col : a.row - b.row);

  for (const p of finalPlacements) {
      if (numberGrid[p.row][p.col] === null) {
          numberGrid[p.row][p.col] = clueNumber;
          clueNumber++;
      }
      numberedClues.push({
          number: numberGrid[p.row][p.col]!,
          direction: p.direction,
          text: p.clue,
          answer: p.word,
          row: p.row,
          col: p.col
      });
  }

  return { grid: croppedGrid, clues: numberedClues, placements: finalPlacements };
};