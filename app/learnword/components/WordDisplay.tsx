import { motion } from 'framer-motion';

interface WordDisplayProps {
    word: string;
    onReplay: () => void;
    canReplay: boolean;
    isPlaying?: boolean;
}

export default function WordDisplay({ word, onReplay, canReplay, isPlaying = false }: WordDisplayProps) {
    const letters = word.split('');

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <button
                onClick={onReplay}
                disabled={!canReplay}
                className="group relative flex gap-1"
            >
                {letters.map((letter, index) => (
                    <motion.div
                        key={index}
                        className="text-[8rem] font-black drop-shadow-md cursor-pointer relative z-10"
                        style={{
                            WebkitTextStroke: '3px white',
                            color: ['a', 'e', 'i', 'o', 'u'].includes(letter.toLowerCase()) ? '#FF6B6B' : '#4ECDC4', // Vowels red/pink, Consonants teal
                            textShadow: '3px 3px 0px rgba(0,0,0,0.1)'
                        }}
                        animate={isPlaying ? {
                            y: [0, -20, 0],
                            scale: [1, 1.1, 1],
                            rotate: [0, -5, 5, 0]
                        } : {
                            y: 0,
                            scale: 1,
                            rotate: 0
                        }}
                        transition={{
                            duration: 0.6,
                            repeat: isPlaying ? Infinity : 0,
                            repeatDelay: 0.1,
                            delay: index * 0.1,
                            ease: "easeInOut"
                        }}
                        whileHover={{ scale: 1.1, rotate: Math.random() * 10 - 5 }}
                    >
                        {letter}
                    </motion.div>
                ))}

                {canReplay && (
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-full text-center text-sm text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-serif italic">
                        Click to replay audio
                    </div>
                )}
            </button>
        </div>
    );
}
