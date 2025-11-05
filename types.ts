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

// Fix: Add missing UserGrid type export.
export type UserGrid = (string | null)[][];

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
}

export interface QuizComponentProps {
  elements: ChemicalElement[];
  theme: Theme;
  onShowSummary: (data: SummaryData, onRestart: () => void) => void;
  onShowTooltip: (text: string, context?: string) => void;
}
