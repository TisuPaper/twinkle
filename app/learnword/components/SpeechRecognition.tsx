'use client';

import { useState, useEffect } from 'react';

interface SpeechRecognitionProps {
    targetWord: string;
    onSuccess: () => void;
    onRetry: () => void;
}

import { MicrophoneIcon } from './Icons';

export default function SpeechRecognition({ targetWord, onSuccess, onRetry }: SpeechRecognitionProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        // Fake speech recognition for testing
        let timer: NodeJS.Timeout;
        let successTimer: NodeJS.Timeout;

        const startFakeRecognition = () => {
            setIsListening(true);
            setError(null);
            setTranscript('');

            // Wait 5 seconds then "recognize" the word
            timer = setTimeout(() => {
                setIsListening(false);
                setTranscript(targetWord);

                // Wait 1 second to show success message then move on
                successTimer = setTimeout(() => {
                    onSuccess();
                }, 1000);
            }, 5000);
        };

        startFakeRecognition();

        return () => {
            clearTimeout(timer);
            clearTimeout(successTimer);
        };
    }, [targetWord, onSuccess]);

    const startListening = () => {
        // No-op or reset timer if we wanted to support manual retry, 
        // but for now we just auto-start on mount.
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-6">
            <div className="flex justify-center mb-4">
                <MicrophoneIcon className="w-24 h-24" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Say the word: "{targetWord}"</h2>

            <button
                onClick={startListening}
                disabled={isListening}
                className="px-10 py-5 bg-green-500 text-white rounded-2xl text-xl font-black shadow-[0_6px_0_0_rgba(34,197,94,1)] hover:shadow-[0_3px_0_0_rgba(34,197,94,1)] hover:translate-y-[3px] active:shadow-none active:translate-y-[6px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
                {isListening ? (
                    <span className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-white rounded-full animate-bounce"></div>
                        Listening...
                    </span>
                ) : (
                    '🎤 Start Speaking'
                )}
            </button>

            {isListening && (
                <div className="text-gray-500 animate-pulse">
                </div>
            )}

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
