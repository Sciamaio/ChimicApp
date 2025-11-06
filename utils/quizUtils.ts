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
 * Generates a random clue for a given chemical element, avoiding existing clues.
 * @param element The chemical element to generate a clue for.
 * @param existingCluesToAvoid An array of clue strings that should not be generated.
 * @returns A string containing the new clue, or null if no unique clues are left.
 */
export const getRandomClueForElement = (element: ChemicalElement, existingCluesToAvoid: string[] = []): string | null => {
    const availableTemplates = clueTemplates.filter(t => {
        const value = String(element[t.key]);
        if (!value || value.trim() === '') return false;
        
        const potentialClue = t.template(value);
        return !existingCluesToAvoid.includes(potentialClue);
    });

    if (availableTemplates.length === 0) {
        return null; // No new unique clues available
    }

    const randomTemplate = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
    const value = String(element[randomTemplate.key]);
    
    return randomTemplate.template(value);
};