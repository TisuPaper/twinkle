'use client';

import { useRef, useState, useEffect } from 'react';

interface WordTracingProps {
    word: string;
    onComplete: () => void;
}

import { PencilIcon } from './Icons';

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
                canvas.width = 400;
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
        <div className="flex flex-col items-center justify-center p-0 space-y-4">
            <div className="flex justify-center mb-2">
                <PencilIcon className="w-24 h-24" />
            </div>
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
                    className="border-4 border-white rounded-3xl bg-white/50 cursor-crosshair shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]"
                />
            </div>

            <div className="w-full max-w-md">
                <div className="flex justify-between text-sm text-gray-500 font-bold mb-2">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-white/50 rounded-full h-6 overflow-hidden border-2 border-white shadow-inner">
                    <div
                        className="bg-purple-400 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={clearCanvas}
                    className="px-8 py-4 bg-gray-200 text-gray-600 rounded-2xl font-black shadow-[0_4px_0_0_rgba(156,163,175,1)] hover:shadow-[0_2px_0_0_rgba(156,163,175,1)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all"
                >
                    Clear
                </button>
                <button
                    onClick={onComplete}
                    disabled={progress < 100}
                    className="px-8 py-4 bg-purple-500 text-white rounded-2xl font-black shadow-[0_4px_0_0_rgba(168,85,247,1)] hover:shadow-[0_2px_0_0_rgba(168,85,247,1)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                    Complete
                </button>
            </div>
        </div>
    );
}
