// Fix: Import ReactNode to resolve 'Cannot find namespace React' error.
import type { ReactNode } from 'react';

export interface ChemicalElement {
  Elemento: string;
  Z: number;
  Simbolo: string;
  'Anno di scoperta': string;
  'Origine del nome': string;
  'Caratteristiche chimiche': string;
  'Dove si trova e diffusione in natura': string;
  'Utilizzo da parte dell\'industria': string;
  'Curiosità legate a come sono stati usati o considerati nel corso della storia': string;
}

export type QuizType = 'multiple-choice' | 'matching' | 'crossword';

export type CrosswordGrid = (string | null)[][];

// A user's grid can store letters that are hints or corrected answers.
export type UserGrid = ({ letter: string; isHint?: boolean; isCorrected?: boolean } | null)[][];


export interface CrosswordClue {
  number: number;
  direction: 'across' | 'down';
  text: string;
  answer: string;
  row: number;
  col: number;
}

export interface Theme {
  main: string;
  bg: string;
  text: string;
  border: string;
  ring: string;
  button: string;
}

export interface SummaryData {
  score: string;
  time: string;
  // Fix: Use the imported `ReactNode` type instead of `React.ReactNode`.
  details?: ReactNode;
  passed?: boolean;
}

export interface QuizComponentProps {
  elements: ChemicalElement[];
  theme: Theme;
  onShowSummary: (data: SummaryData, onRestart: () => void) => void;
  onShowTooltip: (text: string, context?: string) => void;
}