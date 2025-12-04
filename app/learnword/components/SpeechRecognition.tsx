'use client';

import { useState, useEffect } from 'react';
import Button from './Button';

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

    // Removed fake recognition logic
    useEffect(() => {
        // Cleanup if needed
        return () => { };
    }, []);

    const startListening = () => {
        setIsListening(true);
        setError(null);
        setTranscript('');

        // Simulate listening delay
        setTimeout(() => {
            setIsListening(false);
            setTranscript(targetWord);
            // We do NOT call onSuccess() here to avoid auto-flip.
            // The user sees the success message and manually navigates.
        }, 2000);
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-6">
            <div className="flex justify-center mb-4">
                <MicrophoneIcon className="w-24 h-24" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Say the word: "{targetWord}"</h2>

            <Button
                onClick={startListening}
                disabled={isListening}
                style={{ opacity: isListening ? 0.5 : 1 }}
            >
                {isListening ? (
                    <span className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gray-600 rounded-full animate-bounce"></div>
                        Listening...
                    </span>
                ) : (
                    '🎤 Start Speaking'
                )}
            </Button>

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
                    <Button onClick={startListening} variant="secondary" style={{ marginTop: '0.5rem', fontSize: '1rem' }}>
                        Try Again
                    </Button>
                </div>
            )}
        </div>
    );
}
