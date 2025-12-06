import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
    isPlaying?: boolean;
}

export default function Button({ children, className = '', variant = 'primary', style, isPlaying = false, ...props }: ButtonProps) {
    const baseStyle: React.CSSProperties = {
        font: 'inherit',
        backgroundColor: variant === 'primary' ? '#fff' : '#f0f0f0',
        border: '3px solid #fff',
        color: '#5D4037', // Dark brown text
        borderRadius: '1em', // Rounder for sticker look
        fontSize: '1.2rem',
        padding: '0.5em 1.2em',
        fontWeight: '700',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)', // Drop shadow
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy transition
        cursor: 'pointer',
        transform: 'rotate(-1deg)', // Slight rotation for organic feel
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        ...style // Merge passed style
    };

    return (
        <button
            style={baseStyle}
            className={`hover:rotate-1 hover:scale-105 active:scale-95 active:rotate-0 ${className}`}
            {...props}
        >
            {isPlaying && (
                <div className="flex items-end gap-[2px] h-4 mr-1">
                    <div className="w-1 bg-purple-500 rounded-full animate-[bounce_0.5s_infinite]" style={{ height: '60%' }}></div>
                    <div className="w-1 bg-purple-500 rounded-full animate-[bounce_0.5s_infinite_0.1s]" style={{ height: '100%' }}></div>
                    <div className="w-1 bg-purple-500 rounded-full animate-[bounce_0.5s_infinite_0.2s]" style={{ height: '40%' }}></div>
                </div>
            )}
            {children}
        </button>
    );
}
