'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useFBX, useAnimations, Text, Environment, OrbitControls, Cloud, useTexture } from '@react-three/drei';
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
    setZPosition,
    active
}: {
    lane: Lane,
    setZPosition: (z: number) => void,
    active: boolean
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

        if (active) {
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
        }

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
                <meshStandardMaterial color="white" transparent opacity={0.5} />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[1.9, 3.1, 0.05]} />
                <meshStandardMaterial color={color} />
            </mesh>

            {/* Answer Text */}
            <Text
                position={[0, 2, 0]}
                fontSize={1}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.05}
                outlineColor={color}
            >
                {text}
            </Text>
        </group>
    );
}

function SimpleUmbrella({ position }: { position: [number, number, number] }) {
    return (
        <group position={position} rotation={[0, Math.random() * Math.PI, 0]}>
            {/* Pole */}
            <mesh position={[0, 1.5, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 3]} />
                <meshStandardMaterial color="#8B4513" />
            </mesh>
            {/* Top */}
            <mesh position={[0, 2.8, 0]} castShadow>
                <coneGeometry args={[1.5, 1, 8]} />
                <meshStandardMaterial color="#FFD700" />
            </mesh>
        </group>
    );
}

function PalmTree({ position }: { position: [number, number, number] }) {
    return (
        <group position={position} rotation={[0, Math.random() * Math.PI, 0]}>
            {/* Trunk */}
            <mesh position={[0, 2, 0]} castShadow>
                <cylinderGeometry args={[0.3, 0.5, 4]} />
                <meshStandardMaterial color="#8B4513" />
            </mesh>
            {/* Leaves */}
            <mesh position={[0, 4, 0]} castShadow>
                <dodecahedronGeometry args={[1.5]} />
                <meshStandardMaterial color="#228B22" />
            </mesh>
        </group>
    );
}

function Rock({ position }: { position: [number, number, number] }) {
    const scale = 1 + Math.random();
    return (
        <mesh
            position={position}
            rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}
            scale={[scale, scale * 0.6, scale]}
            castShadow
        >
            <dodecahedronGeometry args={[0.8, 0]} />
            <meshStandardMaterial color="#808080" roughness={0.9} />
        </mesh>
    );
}

function BeachEnvironment() {
    const sandTexture = useTexture('/hellokitty/sand.png');

    // Configure texture repeating
    sandTexture.wrapS = THREE.RepeatWrapping;
    sandTexture.wrapT = THREE.RepeatWrapping;
    sandTexture.repeat.set(1, 100); // Adjust repeat based on length

    // Generate some random decorations along the track
    const decorations = useMemo(() => {
        const items = [];
        for (let z = 0; z > -1000; z -= 15) {
            // Rock Border (Left)
            items.push(<Rock key={`rock-l-${z}`} position={[-5, 0, z + Math.random() * 5]} />);
            // Rock Border (Right)
            items.push(<Rock key={`rock-r-${z}`} position={[5, 0, z + Math.random() * 5]} />);

            // Left side decorations (further out)
            if (Math.random() > 0.3) {
                const Type = Math.random() > 0.5 ? SimpleUmbrella : PalmTree;
                items.push(<Type key={`l-${z}`} position={[-8 - Math.random() * 10, 0, z]} />);
            }

            // Right side decorations (further out)
            if (Math.random() > 0.3) {
                const Type = Math.random() > 0.5 ? SimpleUmbrella : PalmTree;
                items.push(<Type key={`r-${z}`} position={[8 + Math.random() * 10, 0, z]} />);
            }
        }
        return items;
    }, []);

    return (
        <group>
            {/* Sand Ground (Base) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, -500]} receiveShadow>
                <planeGeometry args={[200, 1000]} />
                <meshStandardMaterial color="#f2d2a9" />
            </mesh>

            {/* Runway with Sand Texture */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, -500]} receiveShadow>
                <planeGeometry args={[8, 1000]} />
                <meshStandardMaterial map={sandTexture} />
            </mesh>

            {decorations}

            {/* Clouds */}
            <Cloud opacity={0.6} scale={2} position={[0, 15, -50]} speed={0.2} segments={20} />
            <Cloud opacity={0.5} scale={3} position={[-20, 20, -100]} speed={0.1} segments={20} />
            <Cloud opacity={0.5} scale={3} position={[20, 18, -80]} speed={0.15} segments={20} />
        </group>
    );
}

export default function GamePage() {
    const [lane, setLane] = useState<Lane>(0);
    const [playerZ, setPlayerZ] = useState(0);
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'correct' | 'wrong'>('menu');

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
                // Middle lane or empty lane
                setGameState('wrong');
            }
        }
    }, [playerZ, lane, gameState]);

    return (
        <div className="w-full h-screen bg-gradient-to-b from-sky-400 to-blue-200 relative overflow-hidden">
            {/* UI Overlay */}
            <div className="absolute top-0 left-0 w-full p-8 z-10 flex flex-col items-center pointer-events-none">
                <div className="bg-white/90 backdrop-blur px-8 py-4 rounded-2xl shadow-xl">
                    <h1 className="text-4xl font-bold text-slate-800">Math Quiz</h1>
                    <p className="text-6xl font-black text-indigo-600 mt-2 text-center">{quiz.question}</p>
                </div>
            </div>

            {/* Controls Hint */}
            <div className="absolute bottom-8 left-0 w-full text-center z-10 pointer-events-none">
                <p className="text-white/80 text-sm font-mono font-bold drop-shadow-md">Press 'A' to move Left • Press 'D' to move Right</p>
            </div>

            {/* 3D Scene */}
            <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
                <ambientLight intensity={0.8} />
                <directionalLight
                    position={[50, 50, 25]}
                    intensity={1.5}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                />
                <Environment preset="sunset" />

                <Player lane={lane} setZPosition={setPlayerZ} active={gameState === 'playing'} />

                <BeachEnvironment />

                {/* Render Answer Gates */}
                {quiz.answers.map((ans, i) => (
                    <AnswerGate
                        key={i}
                        position={[ans.lane * LANE_WIDTH, 0, quiz.zDistance]}
                        text={ans.text}
                        color={ans.isCorrect ? "#4ade80" : "#f87171"}
                    />
                ))}

                <fog attach="fog" args={['#87CEEB', 20, 100]} />
            </Canvas>
        </div>
    );
}
