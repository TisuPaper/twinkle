'use client';

import { LearningStep } from '../types';

interface ProgressBarProps {
    level: 'easy' | 'medium' | 'hard';
    wordIndex: number;
    totalWords: number;
    currentStep: LearningStep;
    currentWord: string;
}

const stepLabels: Record<LearningStep, string> = {
    SHOW: '1. See & Hear',
    REPLAY: '2. Replay',
    SPEAK: '3. Speak',
    TRACE: '4. Trace',
    COMPLETE: 'Complete!'
};

const levelColors = {
    easy: 'from-green-500 to-emerald-600',
    medium: 'from-yellow-500 to-orange-600',
    hard: 'from-red-500 to-pink-600'
};

export default function ProgressBar({ level, wordIndex, totalWords, currentStep, currentWord }: ProgressBarProps) {
    const progress = ((wordIndex) / totalWords) * 100;

    return (
        <div className="w-full bg-white shadow-lg rounded-b-2xl p-6">
            <div className="max-w-4xl mx-auto space-y-4">
                {/* Level and Word Info */}
                <div className="flex justify-between items-center">
                    <div>
                        <span className={`inline-block px-4 py-2 rounded-full text-white font-bold bg-gradient-to-r ${levelColors[level]}`}>
                            {level.toUpperCase()} Level
                        </span>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Word {wordIndex + 1} of {totalWords}</p>
                        <p className="text-xl font-bold text-gray-800">{currentWord}</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Level Progress</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                            className={`bg-gradient-to-r ${levelColors[level]} h-full transition-all duration-500`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Step Indicator */}
                <div className="flex justify-center gap-2">
                    {(['SHOW', 'REPLAY', 'SPEAK', 'TRACE'] as LearningStep[]).map((step, index) => (
                        <div
                            key={step}
                            className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${currentStep === step
                                ? 'bg-purple-600 text-white scale-110'
                                : 'bg-gray-200 text-gray-600'
                                }`}
                        >
                            {stepLabels[step]}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
