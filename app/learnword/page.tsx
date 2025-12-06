'use client';

import { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader, Html } from '@react-three/drei';
import { motion } from 'framer-motion';
import { validateLearnWordData, processToChapters } from './processor';
import { mockAIResult } from './data';
import { LearningStep, LearningState } from './types';
import WordDisplay from './components/WordDisplay';
import SpeechRecognition from './components/SpeechRecognition';
import WordTracing from './components/WordTracing';
import { SpeakerIcon } from './components/Icons';
import { HelloKittyModel } from './components/HelloKitty3D';
import { BookScene } from './components/BookScene';
import { BookPageLayout } from './components/BookPageLayout';
import confetti from 'canvas-confetti';


export default function LearnWordPage() {
    const [state, setState] = useState<LearningState | null>(null);
    console.log('LearnWordPage rendered');
    const [currentStep, setCurrentStep] = useState<LearningStep>('SHOW');
    const [error, setError] = useState<string | null>(null);
    const [audioPlaying, setAudioPlaying] = useState(false);
    const [showUI, setShowUI] = useState(false);
    const [audioBlocked, setAudioBlocked] = useState(false);
    const [audioPlayCount, setAudioPlayCount] = useState(0);
    const [isSpeakingFeedback, setIsSpeakingFeedback] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const [isLevelComplete, setIsLevelComplete] = useState(false);


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
            // Reset play count when entering SHOW step
            setAudioPlayCount(0);

            // Wait 1 second before attempting to play audio
            const timer = setTimeout(() => {
                // Try to play audio, if blocked due to autoplay policy, mark as blocked
                playAudio(getCurrentWord(), true).catch((err) => {
                    console.log('Auto-play blocked, waiting for user interaction', err);
                    // The audioBlocked state is already set in playAudio's catch block
                });
            }, 4000);

            return () => clearTimeout(timer);
        }
    }, [currentStep, state]);

    // Trigger confetti on level complete
    useEffect(() => {
        if (isLevelComplete) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                // since particles fall down, start a bit higher than random
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            return () => clearInterval(interval);
        }
    }, [isLevelComplete]);

    const getCurrentLevel = () => state?.levels[state.currentLevelIndex];
    const getCurrentWord = () => {
        const level = getCurrentLevel();
        return level?.words[level.currentWordIndex]?.word || '';
    };

    const playFeedback = async (text: string) => {
        try {
            setIsSpeakingFeedback(true);
            setFeedbackText(text);

            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) throw new Error('Failed to generate audio');

            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);

            audio.onended = () => {
                setIsSpeakingFeedback(false);
                URL.revokeObjectURL(audioUrl);
            };

            audio.onerror = () => {
                console.error('Error playing feedback audio');
                setIsSpeakingFeedback(false);
                URL.revokeObjectURL(audioUrl);
            };

            await audio.play();
        } catch (error) {
            console.error('Error playing feedback:', error);
            setIsSpeakingFeedback(false);
        }
    };

    const [jumpTrigger, setJumpTrigger] = useState(0);

    const playAudio = async (word: string, isFirstPlay: boolean = false) => {
        setAudioPlaying(true);
        setAudioBlocked(false);
        try {
            let audio: HTMLAudioElement;

            if (word.toLowerCase() === 'jump') {
                // Use local file for "jump"
                audio = new Audio('/audios/jump.MP3');
                // Trigger jump animation
                setJumpTrigger(Date.now());
            } else {
                // Use API for other words
                const response = await fetch('/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: word }),
                });

                if (!response.ok) throw new Error('Failed to generate audio');

                const blob = await response.blob();
                const audioUrl = URL.createObjectURL(blob);
                audio = new Audio(audioUrl);

                // Cleanup blob url after playing
                const originalOnEnded = audio.onended;
                audio.onended = (ev) => {
                    URL.revokeObjectURL(audioUrl);
                    if (originalOnEnded) originalOnEnded.call(audio, ev);
                };
            }

            audio.onended = () => {
                setAudioPlaying(false);
                // If it was a blob URL, it's revoked in the specific handler above or we can do it here if we saved the url

                // Increment play count
                const newCount = audioPlayCount + 1;
                setAudioPlayCount(newCount);

                // Auto-advance logic
                if (currentStep === 'SHOW') {
                    setCurrentStep('REPLAY');
                } else if (currentStep === 'REPLAY') {
                    // If we've played 2 times (1 initial + 1 replay), auto-advance
                    if (newCount >= 2) {
                        handleStepComplete();
                    }
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

    const [isSuccess, setIsSuccess] = useState(false);

    const handleStepComplete = () => {
        // Trigger success state for camera zoom
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 2000); // Zoom out after 2 seconds

        if (currentStep === 'REPLAY') {
            playFeedback("Wow you did it well! Now let’s try to speak");
            setCurrentStep('SPEAK');
        } else if (currentStep === 'SPEAK') {
            playFeedback("Perfect! Now let’s try write it out");
            setCurrentStep('TRACE');
        } else if (currentStep === 'TRACE') {
            // Always trigger Level Complete when tracing is done for this demo
            setIsLevelComplete(true);
            playFeedback("Congratulations! You completed the first level!");
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
        const renderRightPage = (content: React.ReactNode, step: LearningStep, pageNum: number) => (
            <BookPageLayout pageNumber={pageNum}>
                <div className="w-full h-full flex flex-col justify-center">
                    {content}
                </div>
            </BookPageLayout>
        );

        // Page 1: Listen (SHOW/REPLAY)
        const listenContent = (
            <div className="text-center relative">
                {/* Washi Tape Header */}
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 -rotate-1 bg-[#fde047] px-8 py-2 shadow-sm z-20"
                    style={{
                        clipPath: 'polygon(2% 0%, 100% 0%, 98% 100%, 0% 100%)',
                        maskImage: 'linear-gradient(90deg, transparent 0%, black 2%, black 98%, transparent 100%)'
                    }}>
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-white/20 border-r border-white/40 border-dashed"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/20 border-l border-white/40 border-dashed"></div>
                    <h2 className="text-2xl font-bold text-[#5D4037] font-['Comic_Sans_MS','Chalkboard_SE','sans-serif'] tracking-wide">Listen to the word</h2>
                </div>

                <div className="flex justify-center mb-2 mt-6 transform rotate-2">
                    <div className="bg-white p-4 rounded-full shadow-lg border-4 border-[#FF6B6B]">
                        <SpeakerIcon className="w-20 h-20 text-[#FF6B6B]" />
                    </div>
                </div>

                <div className="transform -rotate-1">
                    <WordDisplay
                        word={wordData.word}
                        onReplay={handleReplay}
                        canReplay={isCurrentWord ? (currentStep === 'REPLAY' ? !audioPlaying : audioBlocked) : false}
                        isPlaying={isCurrentWord && audioPlaying}
                    />
                </div>

                {isCurrentWord && currentStep === 'SHOW' && audioPlaying && (
                    <div className="mt-4 flex justify-center">
                        <div className="flex items-center gap-3 text-[#FF6B6B] bg-white px-4 py-2 rounded-xl shadow-sm transform rotate-1 border-2 border-[#FF6B6B] border-dashed">
                            <div className="w-3 h-3 bg-[#FF6B6B] rounded-full animate-pulse"></div>
                            <span className="text-lg font-bold font-['Comic_Sans_MS','Chalkboard_SE','sans-serif']">Playing...</span>
                        </div>
                    </div>
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

        // Determine speech bubble props
        const isTalking = (isCurrentWord && audioPlaying) || isSpeakingFeedback;
        const speechText = isSpeakingFeedback ? feedbackText : wordData.word;

        return [
            {
                left: (
                    <group>
                        {baseIndex === flippedIndex && (
                            <>

                                <group position={[0, -2, 1.2]} rotation={[0, 0.3, 0]} scale={2.5}>
                                    <HelloKittyModel
                                        autoJump={wordIndex === 0 && currentStep === 'SHOW'}
                                        isTalking={isTalking}
                                        speechText={speechText}
                                        jumpTrigger={jumpTrigger}
                                    />
                                </group>
                            </>
                        )}
                    </group>
                ),
                right: renderRightPage(listenContent, currentStep === 'REPLAY' ? 'REPLAY' : 'SHOW', baseIndex + 1)
            },
            {
                left: (
                    <group>
                        {(baseIndex + 1) === flippedIndex && (
                            <>

                                <group position={[0, -2, 1.2]} rotation={[0, 0.3, 0]} scale={2.5}>
                                    <HelloKittyModel
                                        isTalking={isTalking}
                                        speechText={speechText}
                                    />
                                </group>
                            </>
                        )}
                    </group>
                ),
                right: renderRightPage(speakContent, 'SPEAK', baseIndex + 2)
            },
            {
                left: (
                    <group>
                        {(baseIndex + 2) === flippedIndex && (
                            <>

                                <group position={[0, -2, 1.2]} rotation={[0, 0.3, 0]} scale={2.5}>
                                    <HelloKittyModel
                                        isTalking={isTalking}
                                        speechText={speechText}
                                    />
                                </group>
                            </>
                        )}
                    </group>
                ),
                right: renderRightPage(traceContent, 'TRACE', baseIndex + 3)
            },
            // Blank Page
            {
                left: (
                    <group>
                        {(baseIndex + 3) === flippedIndex && (
                            <>

                                <group position={[0, -2, 1.2]} rotation={[0, 0.3, 0]} scale={2.5}>
                                    <HelloKittyModel
                                        isTalking={isTalking}
                                        speechText={speechText}
                                    />
                                </group>
                            </>
                        )}
                    </group>
                ),
                right: (
                    <BookPageLayout pageNumber={baseIndex + 4}>
                        <div className="w-full h-full flex flex-col justify-center relative group">
                            {/* Manual Navigation Arrow for the blank page */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStepComplete();
                                }}
                                className="absolute bottom-4 right-4 p-3 text-purple-600 bg-purple-100 rounded-full transition-all hover:bg-purple-200"
                                title="Next Page"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        </div>
                    </BookPageLayout>
                )
            }
        ];
    });



    return (
        <div className="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden" style={{
            backgroundImage: 'url(/bg_book_room.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
        }}>
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
                                flippedIndex={isLevelComplete ? -1 : flippedIndex}
                                isLevelComplete={isLevelComplete}
                                isSuccess={isSuccess}
                                currentStep={currentStep}
                            />
                        </Suspense>
                    </group>
                </Canvas>
                <Loader />
            </div>
        </div>
    );
}
