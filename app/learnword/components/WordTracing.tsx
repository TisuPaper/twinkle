'use client';

import { useRef, useState, useEffect } from 'react';
import Button from './Button';
import { PencilIcon, EraserIcon, CheckIcon } from './Icons';

interface WordTracingProps {
    word: string;
    onComplete: () => void;
}

export default function WordTracing({ word, onComplete }: WordTracingProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [visitedCount, setVisitedCount] = useState(0);
    const [strokes, setStrokes] = useState(0);
    const visitedCells = useRef<Set<string>>(new Set());
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
        // Reset visited cells when word changes
        visitedCells.current.clear();
        setVisitedCount(0);
        setStrokes(0);
    }, [word]);

    const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        e.stopPropagation();
        // Also stop native propagation just in case
        e.nativeEvent.stopImmediatePropagation();

        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas || !context) return;

        // Capture pointer to track it even if it leaves canvas bounds
        canvas.setPointerCapture(e.pointerId);

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        context.beginPath();
        context.moveTo(x, y);

        // Track initial point
        const cellX = Math.floor(x / 20);
        const cellY = Math.floor(y / 20);
        const cellKey = `${cellX},${cellY}`;
        if (!visitedCells.current.has(cellKey)) {
            visitedCells.current.add(cellKey);
            setVisitedCount(prev => prev + 1);
        }
    };

    const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();

        if (!isDrawing || !context) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        context.lineTo(x, y);
        context.strokeStyle = '#8b5cf6';
        context.lineWidth = 8;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.stroke();

        // Track visited cells (20x20 grid)
        const cellX = Math.floor(x / 20);
        const cellY = Math.floor(y / 20);
        const cellKey = `${cellX},${cellY}`;
        if (!visitedCells.current.has(cellKey)) {
            visitedCells.current.add(cellKey);
            setVisitedCount(prev => prev + 1);
        }
    };

    const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (isDrawing) {
            setIsDrawing(false);
            setStrokes(prev => prev + 1);

            const canvas = canvasRef.current;
            if (canvas) {
                canvas.releasePointerCapture(e.pointerId);
            }
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

        visitedCells.current.clear();
        setVisitedCount(0);
        setStrokes(0);
    };

    // Completion detection: require covering a certain number of grid cells
    // Heuristic: ~5 cells per character (easier)
    const requiredCells = Math.max(word.length * 5, 10);
    const progress = Math.min((visitedCount / requiredCells) * 100, 100);

    return (
        <div className="flex flex-col items-center justify-center p-0 space-y-4">
            <div className="flex justify-center mb-2">
                <PencilIcon className="w-24 h-24" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Trace the word: "{word}"</h2>

            <div className="relative">
                <canvas
                    ref={canvasRef}
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerLeave={stopDrawing}
                    style={{ touchAction: 'none' }} // Critical for preventing scrolling on touch
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
                <Button onClick={clearCanvas} variant="secondary">
                    <div className="flex items-center gap-2">
                        <EraserIcon className="w-5 h-5" />
                        <span>Clear</span>
                    </div>
                </Button>
                <Button
                    onClick={onComplete}
                    disabled={progress < 100}
                    style={{ opacity: 1, cursor: progress < 100 ? 'not-allowed' : 'pointer' }}
                >
                    <div className="flex items-center gap-2">
                        <CheckIcon className="w-5 h-5" />
                        <span>Complete</span>
                    </div>
                </Button>
            </div>
        </div>
    );
}
