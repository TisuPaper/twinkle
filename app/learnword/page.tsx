'use client';

import { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { motion } from 'framer-motion';
import { validateLearnWordData, processToChapters } from './processor';
import { mockAIResult } from './data';
import { LearningStep, LearningState } from './types';
import ProgressBar from './components/ProgressBar';
import WordDisplay from './components/WordDisplay';
import SpeechRecognition from './components/SpeechRecognition';
import WordTracing from './components/WordTracing';
import { SpeakerIcon } from './components/Icons';
import { EggyModel } from './components/Eggy3D';
import { BookScene } from './components/BookScene';


export default function LearnWordPage() {
    const [state, setState] = useState<LearningState | null>(null);
    console.log('LearnWordPage rendered');
    const [currentStep, setCurrentStep] = useState<LearningStep>('SHOW');
    const [error, setError] = useState<string | null>(null);
    const [audioPlaying, setAudioPlaying] = useState(false);
    const [showUI, setShowUI] = useState(false);
    const [audioBlocked, setAudioBlocked] = useState(false);


    // Initialize state from mock data
    useEffect(() => {
        try {
            const validated = validateLearnWordData(mockAIResult);
            const chapters = processToChapters(validated);

            const initialState: LearningState = {
                levels: chapters
                    .filter(chapter => chapter.words.length > 0)
                    .map(chapter => ({
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

    // Show UI after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowUI(true);
        }, 4500);
        return () => clearTimeout(timer);
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
        setAudioBlocked(false);
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
        } catch (err: any) {
            console.error('Error playing audio:', err);
            setAudioPlaying(false);

            if (err.name === 'NotAllowedError') {
                // Browser blocked autoplay
                setAudioBlocked(true);
            } else {
                setError('Failed to play audio');
            }
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
            <div className="min-h-screen flex items-center justify-center bg-purple-500">
                <div className="text-white text-2xl font-bold">Loading...</div>
            </div>
        );
    }



    if (state.allCompleted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-green-500">
                <div className="text-center p-12 bg-white rounded-3xl shadow-2xl">
                    <div className="text-8xl mb-6">🎉</div>
                    <h1 className="text-5xl font-bold text-gray-800 mb-4">Congratulations!</h1>
                    <p className="text-2xl text-gray-600 mb-8">You completed all levels!</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-4 bg-purple-500 text-white rounded-full text-xl font-bold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
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

    // --- Page Generation ---
    const pages = state.levels[state.currentLevelIndex].words.map((wordData, index) => {
        const isCurrentWord = index === state.levels[state.currentLevelIndex].currentWordIndex;

        // We only render the interactive content if it's the current word.
        // For other words, we could render a static snapshot or just the word text.
        // For simplicity, we'll render the full component but it might only be interactive when active.
        // Actually, since we are flipping, the "active" page is the one visible.

        return {
            left: (
                <group position={[0, 0, 1.0]} rotation={[0, 0, 0]} scale={0.8}>
                    <EggyModel />
                </group>
            ),
            right: (
                <div className="w-full h-full p-8 flex flex-col justify-center">
                    <ProgressBar
                        level={state.levels[state.currentLevelIndex].level}
                        chapterNumber={state.currentLevelIndex + 1}
                        wordIndex={index}
                        totalWords={state.levels[state.currentLevelIndex].words.length}
                        currentStep={isCurrentWord ? currentStep : 'SHOW'}
                        currentWord={wordData.word}
                    />

                    <div className="mt-6 flex-1 flex flex-col justify-center">
                        {isCurrentWord ? (
                            <>
                                {currentStep === 'SHOW' && (
                                    <div className="text-center">
                                        <div className="flex justify-center mb-6">
                                            <SpeakerIcon className="w-24 h-24" />
                                        </div>
                                        <h2 className="text-3xl font-bold text-gray-800 mb-4">Listen to the word</h2>
                                        <WordDisplay word={wordData.word} onReplay={handleReplay} canReplay={audioBlocked} />
                                        {audioPlaying && (
                                            <div className="mt-8 flex justify-center">
                                                <div className="flex items-center gap-3 text-purple-600">
                                                    <div className="w-4 h-4 bg-purple-600 rounded-full animate-pulse"></div>
                                                    <span className="text-xl font-semibold">Playing audio...</span>
                                                </div>
                                            </div>
                                        )}
                                        {audioBlocked && !audioPlaying && (
                                            <div className="mt-8 flex justify-center">
                                                <div className="flex items-center gap-3 text-orange-600 animate-bounce">
                                                    <span className="text-lg font-semibold">👆 Click the word to play audio</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {currentStep === 'REPLAY' && (
                                    <div className="text-center">
                                        <div className="flex justify-center mb-6">
                                            <SpeakerIcon className="w-24 h-24" />
                                        </div>
                                        <h2 className="text-3xl font-bold text-gray-800 mb-4">Click the word to hear it again</h2>
                                        <WordDisplay word={wordData.word} onReplay={handleReplay} canReplay={!audioPlaying} />
                                        <button
                                            onClick={handleStepComplete}
                                            className="mt-8 px-10 py-4 bg-blue-500 text-white rounded-2xl text-xl font-black shadow-[0_6px_0_0_rgba(59,130,246,1)] hover:shadow-[0_3px_0_0_rgba(59,130,246,1)] hover:translate-y-[3px] active:shadow-none active:translate-y-[6px] transition-all"
                                        >
                                            Continue to Speaking
                                        </button>
                                    </div>
                                )}

                                {currentStep === 'SPEAK' && (
                                    <SpeechRecognition
                                        targetWord={wordData.word}
                                        onSuccess={handleStepComplete}
                                        onRetry={() => { }}
                                    />
                                )}

                                {currentStep === 'TRACE' && (
                                    <WordTracing word={wordData.word} onComplete={handleStepComplete} />
                                )}
                            </>
                        ) : (
                            // Placeholder for non-active words (or completed words)
                            <div className="text-center opacity-50">
                                <h2 className="text-3xl font-bold text-gray-800 mb-4">{wordData.word}</h2>
                            </div>
                        )}
                    </div>
                </div>
            )
        };
    });

    return (
        <div className="min-h-screen bg-[#F5F5DC] flex items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* 3D Book Background */}
            <div className="fixed inset-0 z-0">
                <Canvas shadows camera={{
                    position: [-0.5, 1, 4],
                    fov: 45,
                }}>
                    <group position-y={0}>
                        <Suspense fallback={null}>
                            <BookScene
                                pages={pages}
                                flippedIndex={state.levels[state.currentLevelIndex].currentWordIndex}
                            />
                        </Suspense>
                    </group>
                </Canvas>
                <Loader />
            </div>
        </div>
    );
}
