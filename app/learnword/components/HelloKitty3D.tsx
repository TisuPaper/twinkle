'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFBX, useAnimations, Html } from '@react-three/drei';
import * as THREE from 'three';

interface SpeechBubbleProps {
    text: string;
    visible: boolean;
}

const SpeechBubble = ({ text, visible }: SpeechBubbleProps) => {
    if (!visible) return null;

    return (
        <Html position={[50, 180, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="relative bg-white px-4 py-3 rounded-2xl shadow-lg border-2 border-gray-100"
                style={{
                    minWidth: '120px',
                    maxWidth: '200px',
                    transform: 'scale(1)',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
            >
                <div className="text-gray-800 text-sm font-bold text-center leading-tight">
                    {text}
                </div>
                {/* Bubble Tail */}
                <div className="absolute -bottom-2 left-4 w-4 h-4 bg-white border-b-2 border-r-2 border-gray-100 transform rotate-45"></div>

                <style>{`
                    @keyframes popIn {
                        from { transform: scale(0); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                `}</style>
            </div>
        </Html>
    );
};

interface HelloKittyModelProps {
    autoJump?: boolean;
    isTalking?: boolean;
    speechText?: string;
    jumpTrigger?: number;
    [key: string]: any;
}

export function HelloKittyModel({ autoJump = false, isTalking = false, speechText = "Hello!", jumpTrigger = 0, ...props }: HelloKittyModelProps) {
    const group = useRef<THREE.Group>(null);
    const [isJumping, setIsJumping] = useState(false);
    const [jumpProgress, setJumpProgress] = useState(0);

    // ... (load model code) ...
    const fbx = useFBX('/hellokitty/helloModel/base_basic_shaded.fbx');
    const { animations: runAnimations } = useFBX('/hellokitty/helloModel/FastRun-2.fbx');

    // Setup Animation
    if (runAnimations.length > 0) {
        runAnimations[0].name = 'Run';
    }
    const { actions } = useAnimations(runAnimations, group);

    useEffect(() => {
        const action = actions['Run'];
        if (action) action.reset().fadeIn(0.5).play();
        return () => {
            action?.fadeOut(0.5);
        };
    }, [actions]);

    // Auto-jump when component mounts if autoJump is true
    useEffect(() => {
        if (autoJump && !isJumping) {
            const timer = setTimeout(() => {
                setIsJumping(true);
                setJumpProgress(0);
                // Audio is handled by parent component (page.tsx)
            }, 4000); // Match the 4 second delay from the word audio

            return () => clearTimeout(timer);
        }
    }, [autoJump]);

    // Trigger jump from parent prop
    useEffect(() => {
        if (jumpTrigger > 0) {
            setIsJumping(true);
            setJumpProgress(0);
        }
    }, [jumpTrigger]);

    // Animation
    useFrame((state, delta) => {
        if (group.current) {
            if (isJumping) {
                // Jump animation
                setJumpProgress((prev) => {
                    const newProgress = prev + delta * 3; // Jump speed
                    if (newProgress >= 1) {
                        setIsJumping(false);
                        return 0;
                    }
                    return newProgress;
                });

                // Parabolic jump (arc motion)
                const jumpHeight = 0.8;
                const arc = 4 * jumpProgress * (1 - jumpProgress); // Parabola
                group.current.position.y = arc * jumpHeight;
            } else {
                // Gentle floating when idle
                group.current.position.y = Math.sin(state.clock.elapsedTime * 1.0) * 0.05;
            }

            // Gentle rotation
            group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }
    });

    const [isClickTalking, setIsClickTalking] = useState(false);

    // ... existing code ...

    const handleClick = (e: any) => {
        e.stopPropagation();

        // Start jump animation
        setIsJumping(true);
        setJumpProgress(0);

        // Show bubble
        setIsClickTalking(true);

        if (speechText.toLowerCase() === 'jump') {
            // Use local file for "jump"
            const audio = new Audio('/audios/jump.MP3');
            audio.onended = () => setIsClickTalking(false);
            audio.play().catch((err) => {
                console.error('Error playing audio:', err);
                setIsClickTalking(false);
            });
        } else {
            // Play audio via API for consistency
            fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: speechText }),
            })
                .then(res => res.blob())
                .then(blob => {
                    const audioUrl = URL.createObjectURL(blob);
                    const audio = new Audio(audioUrl);
                    audio.onended = () => {
                        setIsClickTalking(false);
                        URL.revokeObjectURL(audioUrl);
                    };
                    audio.play();
                })
                .catch(err => {
                    console.error('Error playing click audio:', err);
                    setIsClickTalking(false);
                });
        }
    };

    return (
        <group
            ref={group}
            {...props}
            dispose={null}
            onClick={handleClick}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'default'}
            scale={0.01}
        >
            <primitive object={fbx} />
            <SpeechBubble text={speechText} visible={isTalking || isClickTalking} />
        </group>
    );
}
