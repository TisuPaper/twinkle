'use client';

import { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { motion } from 'framer-motion';
import { validateLearnWordData, processToChapters } from './processor';
import { mockAIResult } from './data';
import { LearningStep, LearningState } from './types';
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
            // Wait 1 second before attempting to play audio
            const timer = setTimeout(() => {
                // Try to play audio, if blocked due to autoplay policy, mark as blocked
                playAudio(getCurrentWord(), true).catch((err) => {
                    console.log('Auto-play blocked, waiting for user interaction', err);
                    // The audioBlocked state is already set in playAudio's catch block
                });
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [currentStep, state]);

    const getCurrentLevel = () => state?.levels[state.currentLevelIndex];
    const getCurrentWord = () => {
        const level = getCurrentLevel();
        return level?.words[level.currentWordIndex]?.word || '';
    };

    const playAudio = async (word: string, isFirstPlay: boolean = false) => {
        setAudioPlaying(true);
        setAudioBlocked(false);
        try {
            // Use different audio files based on whether this is first play or replay
            const audioPath = isFirstPlay
                ? '/audios/voice_preview_jump.mp3'
                : '/audios/jump.MP3';

            const audio = new Audio(audioPath);

            audio.onended = () => {
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
        playAudio(getCurrentWord(), false); // Replay uses regular audio
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

    // Calculate flipped index based on current word and step
    let stepOffset = 0;
    if (currentStep === 'SPEAK') stepOffset = 1;
    if (currentStep === 'TRACE') stepOffset = 2;

    const currentWordIndex = state.levels[state.currentLevelIndex].currentWordIndex;
    const flippedIndex = (currentWordIndex * 3) + stepOffset;

    // --- Page Generation ---
    const pages = state.levels[state.currentLevelIndex].words.flatMap((wordData, wordIndex) => {
        const isCurrentWord = wordIndex === state.levels[state.currentLevelIndex].currentWordIndex;

        // Helper to render common right-side layout
        const renderRightPage = (content: React.ReactNode, step: LearningStep) => (
            <div className="w-full h-full p-8 flex flex-col justify-center bg-white/50 rounded-l-lg relative group">
                <div className="flex-1 flex flex-col justify-center">
                    {content}
                </div>

                {/* Manual Navigation Arrow */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleStepComplete();
                    }}
                    className="absolute bottom-4 right-4 p-3 text-gray-400 hover:text-purple-600 hover:bg-purple-100 rounded-full transition-all opacity-0 group-hover:opacity-100"
                    title="Next Page"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>
        );

        // Page 1: Listen (SHOW/REPLAY)
        const listenContent = (
            <div className="text-center">
                <div className="flex justify-center mb-6">
                    <SpeakerIcon className="w-24 h-24" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Listen to the word</h2>
                <WordDisplay
                    word={wordData.word}
                    onReplay={handleReplay}
                    canReplay={isCurrentWord ? (currentStep === 'REPLAY' ? !audioPlaying : audioBlocked) : false}
                />

                {isCurrentWord && currentStep === 'SHOW' && audioPlaying && (
                    <div className="mt-8 flex justify-center">
                        <div className="flex items-center gap-3 text-purple-600">
                            <div className="w-4 h-4 bg-purple-600 rounded-full animate-pulse"></div>
                            <span className="text-xl font-semibold">Playing audio...</span>
                        </div>
                    </div>
                )}

                {isCurrentWord && currentStep === 'SHOW' && audioBlocked && !audioPlaying && (
                    <div className="mt-8 flex justify-center">
                        <div className="flex items-center gap-3 text-orange-600 animate-bounce">
                            <span className="text-lg font-semibold">👆 Click the word to play audio</span>
                        </div>
                    </div>
                )}

                {isCurrentWord && currentStep === 'REPLAY' && (
                    <>
                    </>
                )}
            </div>
        );

        // Page 2: Speak
        const speakContent = (
            <div className="text-center">
                <SpeechRecognition
                    targetWord={wordData.word}
                    onSuccess={isCurrentWord ? handleStepComplete : () => { }}
                    onRetry={() => { }}
                />
            </div>
        );

        // Page 3: Trace
        const traceContent = (
            <div className="text-center">
                <WordTracing
                    word={wordData.word}
                    onComplete={isCurrentWord ? handleStepComplete : () => { }}
                />
            </div>
        );

        // Calculate the global index for these pages
        const baseIndex = wordIndex * 4; // Now 4 pages per word

        return [
            {
                left: (
                    <group position={[0, 0, 1.2]} rotation={[0, 0, 0]} scale={1}>
                        {baseIndex === flippedIndex && <EggyModel autoJump={wordIndex === 0 && currentStep === 'SHOW'} />}
                    </group>
                ),
                right: renderRightPage(listenContent, currentStep === 'REPLAY' ? 'REPLAY' : 'SHOW')
            },
            {
                left: (
                    <group position={[0, 0, 1.2]} rotation={[0, 0, 0]} scale={1}>
                        {(baseIndex + 1) === flippedIndex && <EggyModel />}
                    </group>
                ),
                right: renderRightPage(speakContent, 'SPEAK')
            },
            {
                left: (
                    <group position={[0, 0, 1.2]} rotation={[0, 0, 0]} scale={1}>
                        {(baseIndex + 2) === flippedIndex && <EggyModel />}
                    </group>
                ),
                right: renderRightPage(traceContent, 'TRACE')
            },
            // Blank Page
            {
                left: (
                    <group position={[0, 0, 1.2]} rotation={[0, 0, 0]} scale={1}>
                        {(baseIndex + 3) === flippedIndex && <EggyModel />}
                    </group>
                ),
                right: (
                    <div className="w-full h-full p-8 flex flex-col justify-center bg-white/50 rounded-l-lg relative group">
                        {/* Manual Navigation Arrow for the blank page */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleStepComplete();
                            }}
                            className="absolute bottom-4 right-4 p-3 text-gray-400 hover:text-purple-600 hover:bg-purple-100 rounded-full transition-all opacity-0 group-hover:opacity-100"
                            title="Next Page"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    </div>
                )
            }
        ];
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
                                flippedIndex={flippedIndex}
                            />
                        </Suspense>
                    </group>
                </Canvas>
                <Loader />
            </div>
        </div>
    );
}
