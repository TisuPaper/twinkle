import React from 'react';

interface HoverButtonProps {
    onClick?: () => void;
    children: React.ReactNode;
    className?: string;
}

const HoverButton: React.FC<HoverButtonProps> = ({ onClick, children, className = '' }) => {
    return (
        <button
            onClick={onClick}
            className={`
                group relative overflow-hidden rounded-full 
                bg-white text-black 
                px-2 py-0.5 text-[6px] font-medium tracking-widest uppercase
                transition-all duration-1000 ease-out
                hover:scale-105 hover:text-white hover:shadow-[4px_5px_17px_-4px_rgba(255,255,255,0.5)]
                cursor-pointer
                ${className}
            `}
            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
        >
            {/* Content Layer */}
            <span className="relative z-10 flex items-center gap-1">
                {children}
            </span>

            {/* Skewed Overlay Layer */}
            <span
                className="
                    absolute left-[-50px] top-0 -z-0 h-full w-0 
                    bg-black 
                    skew-x-[45deg] 
                    transition-[width] duration-1000 ease-out
                    group-hover:w-[250%]
                "
            />
        </button>
    );
};

export default HoverButton;
