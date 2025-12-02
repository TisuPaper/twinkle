'use client';

import { useState, useEffect } from 'react';
import { validateLearnWordData, processToChapters } from './processor';
import { mockAIResult } from './data';
import { LearningStep, LearningState } from './types';
import ProgressBar from './components/ProgressBar';
import WordDisplay from './components/WordDisplay';
import SpeechRecognition from './components/SpeechRecognition';
import WordTracing from './components/WordTracing';

export default function LearnWordPage() {
    const [state, setState] = useState<LearningState | null>(null);
    const [currentStep, setCurrentStep] = useState<LearningStep>('SHOW');
    const [error, setError] = useState<string | null>(null);
    const [audioPlaying, setAudioPlaying] = useState(false);

    // Initialize state from mock data
    useEffect(() => {
        try {
            const validated = validateLearnWordData(mockAIResult);
            const chapters = processToChapters(validated);

            const initialState: LearningState = {
                levels: chapters.map(chapter => ({
                    level: chapter.level,
                    words: chapter.words.map(word => ({
                        word,
                        currentStep: 'SHOW',
                        completed: false
                    })),
                    currentWordIndex: 0,
                    completed: false
                })),
                currentLevelIndex: 0,
                allCompleted: false
            };

            setState(initialState);
        } catch (err) {
            setError('Failed to load learning data');
            console.error(err);
        }
    }, []);

    // Auto-play audio when entering SHOW step
    useEffect(() => {
        if (currentStep === 'SHOW' && state && !audioPlaying) {
            playAudio(getCurrentWord());
        }
    }, [currentStep, state]);

    const getCurrentLevel = () => state?.levels[state.currentLevelIndex];
    const getCurrentWord = () => {
        const level = getCurrentLevel();
        return level?.words[level.currentWordIndex]?.word || '';
    };

    const playAudio = async (word: string) => {
        setAudioPlaying(true);
        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: word }),
            });

            if (!response.ok) throw new Error('Failed to generate audio');

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                setAudioPlaying(false);
                // Auto-advance to REPLAY step after audio finishes
                if (currentStep === 'SHOW') {
                    setCurrentStep('REPLAY');
                }
            };

            await audio.play();
        } catch (err) {
            console.error('Error playing audio:', err);
            setAudioPlaying(false);
            setError('Failed to play audio');
        }
    };

    const handleReplay = () => {
        playAudio(getCurrentWord());
    };

    const handleStepComplete = () => {
        if (currentStep === 'REPLAY') {
            setCurrentStep('SPEAK');
        } else if (currentStep === 'SPEAK') {
            setCurrentStep('TRACE');
        } else if (currentStep === 'TRACE') {
            advanceToNextWord();
        }
    };

    const advanceToNextWord = () => {
        if (!state) return;

        const newState = { ...state };
        const currentLevel = newState.levels[newState.currentLevelIndex];

        // Mark current word as completed
        currentLevel.words[currentLevel.currentWordIndex].completed = true;

        // Move to next word
        if (currentLevel.currentWordIndex < currentLevel.words.length - 1) {
            currentLevel.currentWordIndex++;
            setCurrentStep('SHOW');
        } else {
            // Level completed
            currentLevel.completed = true;

            // Move to next level
            if (newState.currentLevelIndex < newState.levels.length - 1) {
                newState.currentLevelIndex++;
                setCurrentStep('SHOW');
            } else {
                // All levels completed
                newState.allCompleted = true;
            }
        }

        setState(newState);
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="p-8 bg-white rounded-2xl shadow-lg">
                    <p className="text-red-600 text-xl font-semibold">{error}</p>
                </div>
            </div>
        );
    }

    if (!state) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-red-500">
                <div className="text-white text-2xl font-bold">Loading...</div>
            </div>
        );
    }

    if (state.allCompleted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600">
                <div className="text-center p-12 bg-white rounded-3xl shadow-2xl">
                    <div className="text-8xl mb-6">🎉</div>
                    <h1 className="text-5xl font-bold text-gray-800 mb-4">Congratulations!</h1>
                    <p className="text-2xl text-gray-600 mb-8">You completed all levels!</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full text-xl font-bold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                    >
                        Start Again
                    </button>
                </div>
            </div>
        );
    }

    const currentLevel = getCurrentLevel();
    if (!currentLevel) return null;

    const currentWord = getCurrentWord();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500">
            <ProgressBar
                level={currentLevel.level}
                wordIndex={currentLevel.currentWordIndex}
                totalWords={currentLevel.words.length}
                currentStep={currentStep}
                currentWord={currentWord}
            />

            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
                    {currentStep === 'SHOW' && (
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-gray-800 mb-8">Listen to the word</h2>
                            <WordDisplay word={currentWord} onReplay={handleReplay} canReplay={false} />
                            {audioPlaying && (
                                <div className="mt-8 flex justify-center">
                                    <div className="flex items-center gap-3 text-purple-600">
                                        <div className="w-4 h-4 bg-purple-600 rounded-full animate-pulse"></div>
                                        <span className="text-xl font-semibold">Playing audio...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {currentStep === 'REPLAY' && (
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-gray-800 mb-8">Click the word to hear it again</h2>
                            <WordDisplay word={currentWord} onReplay={handleReplay} canReplay={!audioPlaying} />
                            <button
                                onClick={handleStepComplete}
                                className="mt-8 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-xl font-bold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                            >
                                Continue to Speaking
                            </button>
                        </div>
                    )}

                    {currentStep === 'SPEAK' && (
                        <SpeechRecognition
                            targetWord={currentWord}
                            onSuccess={handleStepComplete}
                            onRetry={() => { }}
                        />
                    )}

                    {currentStep === 'TRACE' && (
                        <WordTracing word={currentWord} onComplete={handleStepComplete} />
                    )}
                </div>
            </div>
        </div>
    );
}
