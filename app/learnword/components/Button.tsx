'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
}

export default function Button({ children, className = '', variant = 'primary', ...props }: ButtonProps) {
    const baseStyle = {
        font: 'inherit',
        backgroundColor: variant === 'primary' ? '#f0f0f0' : '#e0e0e0',
        border: '0',
        color: '#242424',
        borderRadius: '0.5em',
        fontSize: '1.35rem',
        padding: '0.375em 1em',
        fontWeight: '600',
        textShadow: '0 0.0625em 0 #fff',
        boxShadow: 'inset 0 0.0625em 0 0 #f4f4f4, 0 0.0625em 0 0 #efefef, 0 0.125em 0 0 #ececec, 0 0.25em 0 0 #e0e0e0, 0 0.3125em 0 0 #dedede, 0 0.375em 0 0 #dcdcdc, 0 0.425em 0 0 #cacaca, 0 0.425em 0.5em 0 #cecece',
        transition: '0.15s ease',
        cursor: 'pointer'
    };

    const activeStyle = {
        translate: '0 0.225em',
        boxShadow: 'inset 0 0.03em 0 0 #f4f4f4, 0 0.03em 0 0 #efefef, 0 0.0625em 0 0 #ececec, 0 0.125em 0 0 #e0e0e0, 0 0.125em 0 0 #dedede, 0 0.2em 0 0 #dcdcdc, 0 0.225em 0 0 #cacaca, 0 0.225em 0.375em 0 #cecece'
    };

    return (
        <button
            style={baseStyle}
            className={className}
            onMouseDown={(e) => {
                const target = e.currentTarget as HTMLButtonElement;
                Object.assign(target.style, activeStyle);
            }}
            onMouseUp={(e) => {
                const target = e.currentTarget as HTMLButtonElement;
                Object.assign(target.style, baseStyle);
            }}
            onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLButtonElement;
                Object.assign(target.style, baseStyle);
            }}
            {...props}
        >
            {children}
        </button>
    );
}
