export const SpeakerIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
    <div className={`flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-blue-500">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="currentColor" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" className="animate-wave-1" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" className="animate-wave-2" />
        </svg>
    </div>
);

export const MicrophoneIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
    <div className={`flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-red-500">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
    </div>
);

export const PencilIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
    <div className={`flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-green-500">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
    </div>
);

export const EraserIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <div className={`flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-gray-700">
            <path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L18 15" />
            <path d="M11 11L20 20" />
        </svg>
    </div>
);

export const CheckIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <div className={`flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    </div>
);
