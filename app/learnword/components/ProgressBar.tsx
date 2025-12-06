'use client';

import { LearningStep } from '../types';

interface ProgressBarProps {
    level: 'easy' | 'medium' | 'hard';
    chapterNumber: number;
    wordIndex: number;
    totalWords: number;
    currentStep: LearningStep;
    currentWord: string;
}



const levelColors = {
    easy: 'text-green-600',
    medium: 'text-yellow-600',
    hard: 'text-red-600'
};

export default function ProgressBar({ level, chapterNumber, wordIndex, totalWords, currentStep, currentWord }: ProgressBarProps) {
    const progress = ((wordIndex) / totalWords) * 100;

    return (
        <div className="w-full">
            <div className="max-w-4xl mx-auto space-y-4">
                {/* Level and Word Info */}
                <div className="flex justify-between items-center">
                    <div>
                        <span className={`inline-block text-2xl font-black ${levelColors[level]}`}>
                            1
                        </span>
                    </div>
                    <div className="text-right">
                    </div>
                </div>
            </div>
        </div>

    );
}
