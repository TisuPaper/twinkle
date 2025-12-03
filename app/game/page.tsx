'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useFBX, useAnimations, Text, Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// --- Constants ---
const LANE_WIDTH = 2; // Width of each lane
const RUN_SPEED = 15; // Units per second
const LANE_SWITCH_SPEED = 20; // Speed of lateral movement

// --- Types ---
type Lane = -1 | 0 | 1; // Left, Middle, Right

// --- Components ---

function Player({
    lane,
    setZPosition
}: {
    lane: Lane,
    setZPosition: (z: number) => void
}) {
    const group = useRef<THREE.Group>(null);
    // Load Model and Animation
    const fbx = useFBX('/hellokitty/helloModel/base_basic_shaded.fbx');
    const { animations: runAnimations } = useFBX('/hellokitty/helloModel/Fast Run.fbx');

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

    useFrame((state, delta) => {
        if (!group.current) return;

        // 1. Forward Movement (Negative Z)
        group.current.position.z -= RUN_SPEED * delta;
        setZPosition(group.current.position.z);

        // 2. Lateral Movement (Lerp to target lane)
        const targetX = lane * LANE_WIDTH;
        group.current.position.x = THREE.MathUtils.lerp(
            group.current.position.x,
            targetX,
            LANE_SWITCH_SPEED * delta
        );

        // 3. Camera Follow
        // Keep camera behind and slightly above player
        state.camera.position.z = group.current.position.z + 8;
        state.camera.position.x = group.current.position.x / 2; // Slight parallax
        state.camera.lookAt(group.current.position.x, group.current.position.y + 1, group.current.position.z - 5);
    });

    return (
        <group ref={group} dispose={null} scale={0.01}>
            <primitive object={fbx} />
        </group>
    );
}

function AnswerGate({
    position,
    text,
    color = "#ff0000"
}: {
    position: [number, number, number],
    text: string,
    color?: string
}) {
    return (
        <group position={position}>
            {/* Gate Frame */}
            <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[1.8, 3, 0.1]} />
                <meshStandardMaterial color="white" transparent opacity={0.1} />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[1.9, 3.1, 0.05]} />
                <meshStandardMaterial color={color} wireframe />
            </mesh>

            {/* Answer Text */}
            <Text
                position={[0, 2, 0]}
                fontSize={1}
                color={color}
                anchorX="center"
                anchorY="middle"
            >
                {text}
            </Text>
        </group>
    );
}

function Ground() {
    // Infinite scrolling ground illusion can be done, but for now a long plane is enough
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -500]}>
            <planeGeometry args={[10, 1000]} />
            <meshStandardMaterial color="#333" />
        </mesh>
    );
}

function LaneMarkers() {
    // Visual guides for lanes
    return (
        <group>
            {/* Left Line */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1, 0.01, -500]}>
                <planeGeometry args={[0.1, 1000]} />
                <meshStandardMaterial color="#666" />
            </mesh>
            {/* Right Line */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1, 0.01, -500]}>
                <planeGeometry args={[0.1, 1000]} />
                <meshStandardMaterial color="#666" />
            </mesh>
        </group>
    );
}

export default function GamePage() {
    const [lane, setLane] = useState<Lane>(0);
    const [playerZ, setPlayerZ] = useState(0);
    const [gameState, setGameState] = useState<'playing' | 'correct' | 'wrong'>('playing');

    // Quiz Configuration
    const quiz = {
        question: "1 + 2",
        answers: [
            { text: "4", lane: -1, isCorrect: false }, // Left
            { text: "3", lane: 1, isCorrect: true },   // Right
        ],
        zDistance: -50 // Distance where the gates are located
    };

    // Handle Input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState !== 'playing') return;

            if (e.key === 'a' || e.key === 'A') {
                setLane(prev => Math.max(prev - 1, -1) as Lane);
            } else if (e.key === 'd' || e.key === 'D') {
                setLane(prev => Math.min(prev + 1, 1) as Lane);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState]);

    // Check Collision / Answer Logic
    useEffect(() => {
        if (gameState !== 'playing') return;

        // Check if player has passed the gate
        // Player moves in negative Z. Gate is at quiz.zDistance (e.g., -50).
        // When playerZ <= -50, they have passed/hit the gate.
        if (playerZ <= quiz.zDistance + 1) { // +1 buffer
            // Determine which answer was chosen
            const chosenAnswer = quiz.answers.find(a => a.lane === lane);

            if (chosenAnswer) {
                if (chosenAnswer.isCorrect) {
                    setGameState('correct');
                } else {
                    setGameState('wrong');
                }
            } else {
                // Middle lane or empty lane - treat as miss or wrong? 
                // Prompt didn't specify middle lane answer, but implies choice between left/right.
                // If they stay in middle, they hit nothing. Let's assume they must pick.
                // For now, if they miss both, maybe just nothing happens or "Wrong" if strict.
                // Let's say "Wrong" if they don't pick the correct one.
                setGameState('wrong');
            }
        }
    }, [playerZ, lane, gameState]);

    return (
        <div className="w-full h-screen bg-black relative overflow-hidden">
            {/* UI Overlay */}
            <div className="absolute top-0 left-0 w-full p-8 z-10 flex flex-col items-center pointer-events-none">
                <div className="bg-white/90 backdrop-blur px-8 py-4 rounded-2xl shadow-xl">
                    <h1 className="text-4xl font-bold text-slate-800">Math Quiz</h1>
                    <p className="text-6xl font-black text-indigo-600 mt-2 text-center">{quiz.question}</p>
                </div>
            </div>

            {/* Feedback Overlay */}
            {gameState !== 'playing' && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className={`transform transition-all scale-110 px-12 py-8 rounded-3xl shadow-2xl text-center ${gameState === 'correct' ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                        <h2 className="text-6xl font-black text-white mb-2">
                            {gameState === 'correct' ? 'CORRECT!' : 'WRONG!'}
                        </h2>
                        <p className="text-white/90 text-xl font-medium">
                            {gameState === 'correct' ? 'Great job!' : 'Try again next time.'}
                        </p>
                        <button
                            className="mt-6 px-6 py-2 bg-white text-black rounded-full font-bold pointer-events-auto hover:scale-105 transition"
                            onClick={() => {
                                // Simple reset logic: reload page or reset state
                                window.location.reload();
                            }}
                        >
                            Play Again
                        </button>
                    </div>
                </div>
            )}

            {/* Controls Hint */}
            <div className="absolute bottom-8 left-0 w-full text-center z-10 pointer-events-none">
                <p className="text-white/50 text-sm font-mono">Press 'A' to move Left • Press 'D' to move Right</p>
            </div>

            {/* 3D Scene */}
            <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[10, 20, 10]}
                    intensity={1}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />
                <Environment preset="city" />

                <Player lane={lane} setZPosition={setPlayerZ} />

                <Ground />
                <LaneMarkers />

                {/* Render Answer Gates */}
                {quiz.answers.map((ans, i) => (
                    <AnswerGate
                        key={i}
                        position={[ans.lane * LANE_WIDTH, 0, quiz.zDistance]}
                        text={ans.text}
                        color={ans.isCorrect ? "#4ade80" : "#f87171"}
                    />
                ))}

                <fog attach="fog" args={['#111', 10, 100]} />
            </Canvas>
        </div>
    );
}
