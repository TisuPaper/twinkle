import React, { useEffect, useState } from 'react';
import styles from './Loader.module.css';

interface LoaderProps {
    onFinished: () => void;
}

const Loader: React.FC<LoaderProps> = ({ onFinished }) => {
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        let animationFrameId: number;
        
        const simulateLoad = () => {
            setProgress((prev) => {
                // Random increment for organic, "editorial" look
                const next = prev + Math.random() * 1.5;
                if (next >= 100) {
                    return 100;
                }
                return next;
            });
            
            if (progress < 100) {
                animationFrameId = requestAnimationFrame(simulateLoad);
            }
        };

        animationFrameId = requestAnimationFrame(simulateLoad);

        return () => cancelAnimationFrame(animationFrameId);
    }, [progress]);

    // Triggers the curtain to slide up
    useEffect(() => {
        if (progress >= 100 && !isComplete) {
            setIsComplete(true);
            // Wait 800ms for the typography animations to finish before lifting the curtain
            setTimeout(() => {
                onFinished();
            }, 800);
        }
    }, [progress, isComplete, onFinished]);

    return (
        <div className={`${styles.container} ${isComplete ? styles.slideUp : ''}`}>
            <div className={styles.inner}>
                <div className={`${styles.bigText} ${styles.line1}`}>
                    <span>NATURE</span>
                </div>
                
                <div className={styles.scriptText}>
                    is loading...
                </div>
                
                <div className={`${styles.bigText} ${styles.line2}`}>
                    <span>WORLD</span>
                </div>
                
                <div className={styles.loaderProgress}>
                    <div 
                        className={styles.loaderBar} 
                        style={{ width: `${progress}%` }} 
                    />
                </div>
            </div>
        </div>
    );
};

export default Loader;