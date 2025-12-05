'use client';

interface WordDisplayProps {
    word: string;
    onReplay: () => void;
    canReplay: boolean;
}

export default function WordDisplay({ word, onReplay, canReplay }: WordDisplayProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 pt-8">
            <button
                onClick={onReplay}
                disabled={!canReplay}
                className="group relative"
            >
                <div className="text-9xl font-black text-purple-500 hover:text-purple-600 transition-all duration-300 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none drop-shadow-sm">
                    {`\u00A0${word}`}
                </div>
                {canReplay && (
                    <div className="mt-4 text-sm text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to replay audio
                    </div>
                )}
            </button>
        </div>
    );
}
