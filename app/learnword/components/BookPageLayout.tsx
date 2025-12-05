import React from 'react';

interface BookPageLayoutProps {
    children: React.ReactNode;
    pageNumber?: number;
    title?: string;
    className?: string;
}

export const BookPageLayout: React.FC<BookPageLayoutProps> = ({
    children,
    pageNumber,
    title,
    className = ""
}) => {
    return (
        <div className={`w-full h-full flex flex-col relative overflow-hidden bg-[#fdfbf7] ${className}`}
            style={{
                // Subtle paper texture effect using CSS gradients
                backgroundImage: `
                    linear-gradient(to right, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 5%, rgba(0,0,0,0) 95%, rgba(0,0,0,0.05) 100%),
                    url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")
                `,
                boxShadow: 'inset 3px 0 10px rgba(0,0,0,0.03)'
            }}
        >
            {/* Header / Title */}
            {title && (
                <div className="pt-8 px-8 text-center">
                    <h3 className="font-serif text-xl text-gray-600 tracking-wide uppercase border-b-2 border-gray-200 pb-2 inline-block">
                        {title}
                    </h3>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 px-8 py-6 font-serif text-gray-800 flex flex-col">
                {children}
            </div>

            {/* Footer / Page Number */}
            {pageNumber !== undefined && (
                <div className="absolute bottom-4 w-full text-center">
                    <span className="font-serif text-gray-400 text-sm italic">
                        - {pageNumber} -
                    </span>
                </div>
            )}
        </div>
    );
};
