'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

interface EggyModelProps {
    autoJump?: boolean;
    [key: string]: any;
}

export function EggyModel({ autoJump = false, ...props }: EggyModelProps) {
    const group = useRef<THREE.Group>(null);
    const [isJumping, setIsJumping] = useState(false);
    const [jumpProgress, setJumpProgress] = useState(0);

    // Auto-jump when component mounts if autoJump is true
    useEffect(() => {
        if (autoJump && !isJumping) {
            const timer = setTimeout(() => {
                setIsJumping(true);
                setJumpProgress(0);

                // Play audio
                const audio = new Audio('/audios/jump.MP3');
                audio.play().catch((err) => console.error('Error playing audio:', err));
            }, 1000); // Match the 1 second delay from the word audio

            return () => clearTimeout(timer);
        }
    }, [autoJump]);

    // Idle animation
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
                const jumpHeight = 1.5;
                const arc = 4 * jumpProgress * (1 - jumpProgress); // Parabola
                group.current.position.y = arc * jumpHeight;
            } else {
                // Gentle floating when idle
                group.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
            }

            // Gentle rotation
            group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }
    });

    const handleClick = (e: any) => {
        e.stopPropagation();

        // Start jump animation
        setIsJumping(true);
        setJumpProgress(0);

        // Play audio
        const audio = new Audio('/audios/jump.MP3');
        audio.play().catch((err) => console.error('Error playing audio:', err));
    };

    return (
        <group
            ref={group}
            {...props}
            dispose={null}
            onClick={handleClick}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'default'}
        >
            {/* Body - Yellow Sphere */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[1.2, 32, 32]} />
                <meshStandardMaterial color="#FFD700" roughness={0.3} metalness={0.1} />
            </mesh>

            {/* Antenna */}
            <group position={[0, 1.1, 0]}>
                <mesh position={[0, 0.1, 0]}>
                    <cylinderGeometry args={[0.05, 0.05, 0.4]} />
                    <meshStandardMaterial color="#FFD700" />
                </mesh>
                <mesh position={[0, 0.4, 0]}>
                    <sphereGeometry args={[0.15, 16, 16]} />
                    <meshStandardMaterial color="#FFD700" />
                </mesh>
            </group>

            {/* Arms */}
            {/* Left Arm */}
            <mesh position={[-1.1, -0.2, 0]} rotation={[0, 0, 0.5]}>
                <capsuleGeometry args={[0.2, 0.8, 4, 8]} />
                <meshStandardMaterial color="#FFD700" />
            </mesh>
            {/* Right Arm */}
            <mesh position={[1.1, -0.2, 0]} rotation={[0, 0, -0.5]}>
                <capsuleGeometry args={[0.2, 0.8, 4, 8]} />
                <meshStandardMaterial color="#FFD700" />
            </mesh>

            {/* Legs/Shoes */}
            <group position={[0, -1.3, 0]}>
                {/* Left Leg */}
                <group position={[-0.4, 0, 0]}>
                    <mesh position={[0, 0.2, 0]}>
                        <cylinderGeometry args={[0.15, 0.15, 0.4]} />
                        <meshStandardMaterial color="white" />
                    </mesh>
                    {/* Stripes */}
                    <mesh position={[0, 0.3, 0]}>
                        <torusGeometry args={[0.16, 0.02, 16, 32]} />
                        <meshStandardMaterial color="black" />
                    </mesh>
                    <mesh position={[0, 0.2, 0]}>
                        <torusGeometry args={[0.16, 0.02, 16, 32]} />
                        <meshStandardMaterial color="black" />
                    </mesh>
                    {/* Shoe */}
                    <mesh position={[0, -0.1, 0.1]}>
                        <capsuleGeometry args={[0.25, 0.5, 4, 8]} />
                        <meshStandardMaterial color="white" />
                    </mesh>
                </group>

                {/* Right Leg */}
                <group position={[0.4, 0, 0]}>
                    <mesh position={[0, 0.2, 0]}>
                        <cylinderGeometry args={[0.15, 0.15, 0.4]} />
                        <meshStandardMaterial color="white" />
                    </mesh>
                    {/* Stripes */}
                    <mesh position={[0, 0.3, 0]}>
                        <torusGeometry args={[0.16, 0.02, 16, 32]} />
                        <meshStandardMaterial color="black" />
                    </mesh>
                    <mesh position={[0, 0.2, 0]}>
                        <torusGeometry args={[0.16, 0.02, 16, 32]} />
                        <meshStandardMaterial color="black" />
                    </mesh>
                    {/* Shoe */}
                    <mesh position={[0, -0.1, 0.1]}>
                        <capsuleGeometry args={[0.25, 0.5, 4, 8]} />
                        <meshStandardMaterial color="white" />
                    </mesh>
                </group>
            </group>
        </group>
    );
}

export default function Eggy3D() {
    return (
        <div className="w-full h-full min-h-[300px] relative">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 7]} />
                <ambientLight intensity={0.7} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />

                <EggyModel position={[0, -0.5, 0]} />

                <ContactShadows resolution={1024} scale={10} blur={2} opacity={0.25} far={10} color="#000000" />
                <Environment preset="city" />
                <OrbitControls enableZoom={false} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 1.5} />
            </Canvas>
        </div>
    );
}
