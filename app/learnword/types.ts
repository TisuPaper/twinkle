export type LearningStep = 'SHOW' | 'REPLAY' | 'SPEAK' | 'TRACE' | 'COMPLETE';

export interface WordProgress {
    word: string;
    currentStep: LearningStep;
    completed: boolean;
}

export interface LevelProgress {
    level: 'easy' | 'medium' | 'hard';
    words: WordProgress[];
    currentWordIndex: number;
    completed: boolean;
}

export interface LearningState {
    levels: LevelProgress[];
    currentLevelIndex: number;
    allCompleted: boolean;
}
