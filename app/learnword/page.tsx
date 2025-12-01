'use client';

import { useState } from 'react';
import { predefinedWords } from './data';

export default function LearnWordPage() {
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const playAudio = async (word: string) => {
        setLoading(word);
        setError(null);

        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: word }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate audio');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
            };

            await audio.play();
        } catch (err) {
            console.error('Error playing audio:', err);
            setError('Failed to play audio');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-red-500">
            <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full">
                <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
                    Learn Words
                </h1>
                <p className="text-center text-gray-600 mb-12">
                    Click on a word to hear how it sounds!
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {predefinedWords.map((word) => (
                        <button
                            key={word}
                            onClick={() => playAudio(word)}
                            disabled={loading === word}
                            className="group relative bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl p-8 text-2xl font-bold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            <span className="relative z-10">{word}</span>
                            {loading === word && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
