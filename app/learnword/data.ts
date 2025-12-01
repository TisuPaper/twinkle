export const predefinedWords = ['jump', 'happy', 'cook'] as const;

export type PredefinedWord = typeof predefinedWords[number];
