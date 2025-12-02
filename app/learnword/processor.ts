export interface LearnWordData {
    ageLevel: string;
    difficulty: {
        easy: string[];
        medium: string[];
        hard: string[];
    };
}

export interface Chapter {
    title: string;
    level: 'easy' | 'medium' | 'hard';
    words: string[];
}

export function validateLearnWordData(input: unknown): LearnWordData {
    if (typeof input !== 'object' || input === null) {
        throw new Error('Input must be an object');
    }

    const data = input as Record<string, unknown>;

    if (typeof data.ageLevel !== 'string') {
        throw new Error('Missing or invalid "ageLevel"');
    }

    if (typeof data.difficulty !== 'object' || data.difficulty === null) {
        throw new Error('Missing or invalid "difficulty" object');
    }

    const difficulty = data.difficulty as Record<string, unknown>;
    const levels = ['easy', 'medium', 'hard'];

    for (const level of levels) {
        if (!Array.isArray(difficulty[level])) {
            throw new Error(`Missing or invalid "difficulty.${level}" array`);
        }
        const words = difficulty[level] as unknown[];
        if (!words.every((w) => typeof w === 'string')) {
            throw new Error(`"difficulty.${level}" must contain only strings`);
        }
    }

    return input as LearnWordData;
}

export function processToChapters(data: LearnWordData): Chapter[] {
    return [
        {
            title: 'Easy',
            level: 'easy',
            words: data.difficulty.easy,
        },
        {
            title: 'Medium',
            level: 'medium',
            words: data.difficulty.medium,
        },
        {
            title: 'Hard',
            level: 'hard',
            words: data.difficulty.hard,
        },
    ];
}
