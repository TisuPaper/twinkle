import React from 'react';

const SummaryDashboard = () => {
    return (
        <div className="w-full max-w-6xl mx-auto p-8 bg-[#FFF9E5] rounded-[3rem] font-['Comic_Sans_MS','Chalkboard_SE','sans-serif'] text-[#5D4037]">
            {/* Header */}
            <div className="flex items-center justify-center mb-8 relative">
                {/* Decorative Stars */}
                <StarIcon className="absolute left-10 top-0 w-8 h-8 text-[#FF9B9B] animate-pulse" />
                <StarIcon className="absolute left-24 top-8 w-6 h-6 text-[#FFD93D]" />
                <CloudIcon className="absolute left-32 -top-4 w-16 h-10 text-[#E3F2FD] opacity-80" />

                <h1 className="text-4xl md:text-5xl font-bold text-center tracking-wide text-[#5D4037]">
                    Parent Dashboard - Eevee's Progress
                </h1>

                <CloudIcon className="absolute right-32 -top-4 w-16 h-10 text-[#E3F2FD] opacity-80" />
                <StarIcon className="absolute right-24 top-8 w-6 h-6 text-[#FFD93D]" />
                <StarIcon className="absolute right-10 top-0 w-8 h-8 text-[#FF9B9B] animate-pulse" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Words Learned */}
                <DashboardCard title="Words Learned">
                    <div className="flex flex-col items-center justify-center h-full py-4">
                        <div className="relative">
                            <CloudIcon className="w-48 h-32 text-[#E3F2FD] drop-shadow-md" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                                <span className="text-5xl font-black text-[#5D4037]">125</span>
                                <span className="text-xl font-bold text-[#8D6E63]">Words</span>
                            </div>
                            {/* Book Stack Icon */}
                            <div className="absolute -bottom-2 -right-4">
                                <BookStackIcon className="w-16 h-16" />
                            </div>
                        </div>
                    </div>
                </DashboardCard>

                {/* 2. Play Frequency */}
                <DashboardCard title="Play Frequency" subtitle="Daily Average: 20 mins">
                    <div className="flex items-end justify-between h-40 px-4 pt-8 pb-2">
                        <Bar day="Mon" height="80%" color="#E57373" />
                        <Bar day="Tue" height="40%" color="#FFB74D" />
                        <Bar day="Wed" height="70%" color="#AED581" />
                        <Bar day="Thu" height="50%" color="#4DB6AC" />
                        <Bar day="Fri" height="90%" color="#FFF176" />
                        <Bar day="Sat" height="60%" color="#FF8A65" />
                        <Bar day="Sun" height="45%" color="#F06292" />
                    </div>
                </DashboardCard>

                {/* 3. Performance Overview */}
                <DashboardCard title="Performance Overview">
                    <div className="space-y-6 px-4 py-2">
                        <PerformanceRow label="Audio" stars={4} status="Excellent (5 stars)" color="#E57373" />
                        <PerformanceRow label="Tracing" stars={3} status="Good (4 stars)" color="#AED581" />
                        <PerformanceRow label="Speaking" stars={2} status="Fair (3 stars)" color="#FFD54F" />
                    </div>
                </DashboardCard>

                {/* 4. Insights */}
                <DashboardCard title="Insights">
                    <div className="flex flex-col justify-center h-full space-y-4 px-4 relative">
                        <div className="space-y-2 text-center">
                            <p className="text-xl font-bold text-[#5D4037]">
                                Needs Focus: <span className="text-[#E57373]">Consonant Blends</span>
                            </p>
                            <p className="text-xl font-bold text-[#5D4037]">
                                Next Steps: <span className="text-[#4DB6AC]">Advanced Vocabulary</span>
                            </p>
                        </div>

                        {/* Decorative ABCs */}
                        <div className="absolute bottom-0 right-0 flex flex-col items-end opacity-80 pointer-events-none">
                            <span className="text-4xl font-black text-[#9575CD] transform rotate-12">C</span>
                            <span className="text-4xl font-black text-[#FFD54F] transform -rotate-12 mr-4">B</span>
                            <span className="text-5xl font-black text-[#E57373] transform rotate-6">A</span>
                        </div>
                    </div>
                </DashboardCard>
            </div>
        </div>
    );
};

// --- Subcomponents ---

const DashboardCard = ({ title, subtitle, children }: { title: string, subtitle?: string, children: React.ReactNode }) => (
    <div className="bg-[#FFFDF5] rounded-[2rem] border-4 border-[#E0C097] p-6 shadow-sm relative overflow-hidden">
        {/* Title Area */}
        <div className="text-center mb-4 relative z-10">
            <h2 className="text-2xl font-bold text-[#5D4037]">{title}</h2>
            {subtitle && <p className="text-sm font-medium text-[#8D6E63] mt-1">{subtitle}</p>}
            {/* Underline decoration */}
            <div className="h-1 w-24 bg-[#E0C097]/50 mx-auto mt-2 rounded-full"></div>
        </div>
        <div className="relative z-10 h-full">
            {children}
        </div>
    </div>
);

const Bar = ({ day, height, color }: { day: string, height: string, color: string }) => (
    <div className="flex flex-col items-center gap-2 group">
        <div
            className="w-8 rounded-t-xl rounded-b-md shadow-sm transition-all duration-300 group-hover:scale-105"
            style={{ height, backgroundColor: color }}
        ></div>
        <span className="text-sm font-bold text-[#5D4037]">{day}</span>
    </div>
);

const PerformanceRow = ({ label, stars, status, color }: { label: string, stars: number, status: string, color: string }) => (
    <div className="flex items-center gap-4">
        <span className="w-24 text-lg font-bold text-[#5D4037] text-right">{label}:</span>

        {/* Stars */}
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
                <StarIcon
                    key={i}
                    className={`w-5 h-5 ${i <= stars ? 'text-[#FFD54F]' : 'text-[#E0E0E0]'}`}
                    filled={i <= stars}
                />
            ))}
        </div>

        {/* Progress Bar / Status Pill */}
        <div className="flex-1 h-8 rounded-full border-2 border-[#5D4037]/10 overflow-hidden relative flex items-center px-3">
            <div
                className="absolute left-0 top-0 bottom-0 opacity-40"
                style={{ width: '100%', backgroundColor: color }}
            ></div>
            <span className="relative z-10 text-sm font-bold text-[#5D4037] truncate">{status}</span>
        </div>
    </div>
);

// --- Icons ---

const StarIcon = ({ className, filled = true }: { className?: string, filled?: boolean }) => (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const CloudIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M17.5,19c-3.03,0-5.5-2.47-5.5-5.5c0-0.44,0.05-0.86,0.15-1.27C11.39,12.08,10.72,12,10,12c-2.76,0-5,2.24-5,5s2.24,5,5,5c0.34,0,0.68-0.03,1-0.1c0.64,1.25,1.94,2.1,3.44,2.1c2.21,0,4-1.79,4-4C18.5,19.64,18.15,19.29,17.5,19z M19,6c-3.31,0-6,2.69-6,6c0,0.89,0.19,1.74,0.54,2.51C12.8,14.19,12.41,14,12,14c-3.31,0-6,2.69-6,6c0,1.48,0.54,2.84,1.44,3.9C5.41,23.23,4.23,22.46,3.35,21.44C1.29,19.06,1.08,15.53,2.85,12.92c0.06-0.09,0.13-0.18,0.2-0.26C3.9,11.33,5.1,10.42,6.5,10c0.08-2.67,2.22-4.83,4.89-4.99C12.56,2.83,14.65,1.22,17,1.22c3.31,0,6,2.69,6,6c0,0.59-0.08,1.16-0.24,1.69C22.92,8.96,23,9.02,23,9.09C23.63,9.58,24,10.36,24,11.22C24,12.76,22.76,14,21.22,14C20.78,14,20.36,13.89,20,13.69C19.89,13.9,19.77,14.1,19.64,14.29C19.92,14.81,20.08,15.39,20.08,16C20.08,17.66,18.74,19,17.08,19C17.22,19,17.36,19,17.5,19z" />
    </svg>
);

const BookStackIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" fill="#A5D6A7" stroke="#2E7D32" />
        <path d="M4 14.5v-10A2.5 2.5 0 0 1 6.5 2H20" fill="#FFF59D" stroke="#FBC02D" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
);

export default SummaryDashboard;
