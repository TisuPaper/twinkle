'use client';

import { useState, useEffect } from 'react';

interface SpeechRecognitionProps {
    targetWord: string;
    onSuccess: () => void;
    onRetry: () => void;
}

export default function SpeechRecognition({ targetWord, onSuccess, onRetry }: SpeechRecognitionProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (SpeechRecognition) {
                const recognitionInstance = new SpeechRecognition();
                recognitionInstance.continuous = false;
                recognitionInstance.interimResults = false;
                recognitionInstance.lang = 'en-US';

                recognitionInstance.onresult = (event: any) => {
                    const spokenWord = event.results[0][0].transcript.toLowerCase().trim();
                    setTranscript(spokenWord);
                    setIsListening(false);

                    if (spokenWord === targetWord.toLowerCase()) {
                        setTimeout(() => onSuccess(), 1000);
                    } else {
                        setError(`You said "${spokenWord}". Try again!`);
                    }
                };

                recognitionInstance.onerror = (event: any) => {
                    setIsListening(false);
                    setError('Could not hear you. Please try again.');
                };

                recognitionInstance.onend = () => {
                    setIsListening(false);
                };

                setRecognition(recognitionInstance);
            } else {
                setError('Speech recognition not supported in this browser.');
            }
        }
    }, [targetWord, onSuccess]);

    const startListening = () => {
        if (recognition) {
            setError(null);
            setTranscript('');
            setIsListening(true);
            recognition.start();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Say the word: "{targetWord}"</h2>

            <button
                onClick={startListening}
                disabled={isListening}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-xl font-bold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
                {isListening ? (
                    <span className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                        Listening...
                    </span>
                ) : (
                    '🎤 Start Speaking'
                )}
            </button>

            {transcript && !error && (
                <div className="p-4 bg-green-100 border-2 border-green-500 rounded-lg text-green-800 font-semibold">
                    ✓ Perfect! You said "{transcript}"
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-100 border-2 border-red-500 rounded-lg text-red-800">
                    <p className="font-semibold">{error}</p>
                    <button
                        onClick={startListening}
                        className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}
