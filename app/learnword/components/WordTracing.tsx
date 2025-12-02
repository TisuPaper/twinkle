'use client';

import { useRef, useState, useEffect } from 'react';

interface WordTracingProps {
    word: string;
    onComplete: () => void;
}

export default function WordTracing({ word, onComplete }: WordTracingProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [strokes, setStrokes] = useState(0);
    const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                setContext(ctx);
                // Set canvas size
                canvas.width = 600;
                canvas.height = 200;

                // Draw word outline
                ctx.font = 'bold 80px Arial';
                ctx.strokeStyle = '#e0e0e0';
                ctx.lineWidth = 3;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.strokeText(word, canvas.width / 2, canvas.height / 2);
            }
        }
    }, [word]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas || !context) return;

        const rect = canvas.getBoundingClientRect();
        let x, y;

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        context.beginPath();
        context.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !context) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        let x, y;

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        context.lineTo(x, y);
        context.strokeStyle = '#8b5cf6';
        context.lineWidth = 8;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            setStrokes(prev => prev + 1);
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas || !context) return;

        context.clearRect(0, 0, canvas.width, canvas.height);

        // Redraw word outline
        context.font = 'bold 80px Arial';
        context.strokeStyle = '#e0e0e0';
        context.lineWidth = 3;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.strokeText(word, canvas.width / 2, canvas.height / 2);

        setStrokes(0);
    };

    // Simple completion detection: require minimum strokes based on word length
    const requiredStrokes = Math.max(word.length * 2, 5);
    const progress = Math.min((strokes / requiredStrokes) * 100, 100);

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Trace the word: "{word}"</h2>

            <div className="relative">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="border-4 border-purple-300 rounded-lg bg-white cursor-crosshair shadow-lg"
                />
            </div>

            <div className="w-full max-w-md">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={clearCanvas}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                    Clear
                </button>
                <button
                    onClick={onComplete}
                    disabled={progress < 100}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    Complete
                </button>
            </div>
        </div>
    );
}
