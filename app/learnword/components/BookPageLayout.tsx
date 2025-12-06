import React from 'react';

interface BookPageLayoutProps {
    children?: React.ReactNode;
    pageNumber?: number;
    title?: string;
    className?: string;
    side?: 'left' | 'right';
}

export const BookPageLayout: React.FC<BookPageLayoutProps> = ({
    children,
    pageNumber,
    title,
    className = "",
    side = 'right'
}) => {
    const borderClass = side === 'left' ? 'border-l-4 border-b-4' : 'border-r-4 border-b-4';

    return (
        <div className={`w-full h-full flex flex-col relative overflow-hidden bg-[#fffdf5] rounded-[2rem] ${borderClass} border-[#e6e2d6] ${className}`}
            style={{
                // Notebook Paper Texture
                backgroundImage: `
                    linear-gradient(90deg, transparent 39px, #ffcccc 40px, transparent 41px),
                    linear-gradient(#e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: '100% 100%, 100% 2rem',
                backgroundColor: '#fffdf5',
                boxShadow: 'inset 10px 0 20px rgba(0,0,0,0.05), 5px 5px 15px rgba(0,0,0,0.1)'
            }}
        >
            {/* Header / Title */}
            {
                title && (
                    <div className="pt-8 px-8 text-center">
                        <h3 className="font-serif text-xl text-gray-600 tracking-wide uppercase border-b-2 border-gray-200 pb-2 inline-block">
                            {title}
                        </h3>
                    </div>
                )
            }

            {/* Main Content Area */}
            <div className="flex-1 px-8 py-6 font-serif text-gray-800 flex flex-col">
                {children}
            </div>

            {/* Footer / Page Number */}
            {
                pageNumber !== undefined && (
                    <div className="absolute bottom-4 w-full text-center">
                        <span className="font-serif text-gray-400 text-sm italic">
                            - {pageNumber} -
                        </span>
                    </div>
                )
            }
        </div >
    );
};
