import type { ChemicalElement } from '../types';

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * @param array The array to shuffle.
 * @returns The shuffled array.
 */
export const shuffleArray = <T,>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};


interface ClueTemplate {
    key: keyof ChemicalElement;
    template: (value: string) => string;
}

const clueTemplates: ClueTemplate[] = [
    { key: 'Z', template: (value) => `Elemento con numero atomico ${value}` },
    { key: 'Simbolo', template: (value) => `Il suo simbolo è ${value}` },
    { key: 'Anno di scoperta', template: (value) => `Scoperto nel ${value}` },
    { key: 'Origine del nome', template: (value) => `Il suo nome deriva da: ${value}` },
    { key: 'Caratteristiche chimiche', template: (value) => `Caratteristica: ${value}` },
    { key: 'Utilizzo da parte dell\'industria', template: (value) => `Utilizzato per: ${value}` },
    { key: 'Curiosità legate a come sono stati usati o considerati nel corso della storia', template: (value) => `Curiosità: ${value}` }
];

/**
 * Generates a random clue for a given chemical element.
 * @param element The chemical element to generate a clue for.
 * @returns A string containing the clue.
 */
export const getRandomClueForElement = (element: ChemicalElement): string => {
    const availableTemplates = clueTemplates.filter(t => element[t.key] && String(element[t.key]).trim() !== '');
    if (availableTemplates.length === 0) {
        return `Elemento con simbolo ${element.Simbolo}`; // Fallback clue
    }

    const randomTemplate = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
    const value = String(element[randomTemplate.key]);
    
    return randomTemplate.template(value);
};
