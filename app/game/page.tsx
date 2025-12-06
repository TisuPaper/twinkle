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
    // Load Model and Animation from the same file
    const fbx = useFBX('/hellokitty/helloModel/FastRun-2.fbx');

    // Extract animations from the loaded FBX
    const { actions } = useAnimations(fbx.animations, group);

    useEffect(() => {
        // Play the first animation available
        if (actions) {
            const actionName = Object.keys(actions)[0];
            const action = actions[actionName];

            if (action) {
                // Fix: Remove position tracks to prevent root motion (snapping back)
                const clip = action.getClip();
                clip.tracks = clip.tracks.filter(track => !track.name.includes('.position'));

                action.reset().fadeIn(0.5).play();
            }
            return () => {
                action?.fadeOut(0.5);
            };
        }
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
            <primitive object={fbx} rotation={[0, Math.PI, 0]} />
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
            {/* Gate Frame Removed */}

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

function GameTree({ position }: { position: [number, number, number] }) {
    const fbx = useFBX('/gardenAssets/tree3d.fbx');
    const clone = useMemo(() => fbx.clone(), [fbx]);
    return <primitive object={clone} position={position} scale={0.05} />;
}

function Mushroom({ position }: { position: [number, number, number] }) {
    const fbx = useFBX('/gardenAssets/mushroom.fbx');
    const clone = useMemo(() => fbx.clone(), [fbx]);
    return <primitive object={clone} position={position} scale={0.05} />;
}

function Grass3D({ position }: { position: [number, number, number] }) {
    const fbx = useFBX('/gardenAssets/grass3d.fbx');
    const clone = useMemo(() => fbx.clone(), [fbx]);
    return <primitive object={clone} position={position} scale={0.02} />;
}

function Rock({ position, scale = 1, rotation = [0, 0, 0] }: { position: [number, number, number], scale?: number, rotation?: [number, number, number] }) {
    return (
        <mesh position={position} scale={scale} rotation={rotation} castShadow receiveShadow>
            <dodecahedronGeometry args={[0.5, 0]} />
            <meshStandardMaterial color="#888888" roughness={0.8} />
        </mesh>
    );
}

function BeachEnvironment() {
    const sandTexture = useTexture('/hellokitty/sand.png');
    const grassTexture = useTexture('/gardenAssets/grasstexture.png');

    // Configure texture repeating
    sandTexture.wrapS = THREE.RepeatWrapping;
    sandTexture.wrapT = THREE.RepeatWrapping;
    sandTexture.repeat.set(1, 100); // Adjust repeat based on length

    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(20, 100); // Tile the grass

    // Generate some random decorations along the track
    const decorations = useMemo(() => {
        const items = [];
        for (let z = 0; z > -800; z -= 30) { // Reduced density (was 10) and distance (was -1000)
            // Left side decorations (Trees, Mushrooms, Grass)
            if (Math.random() > 0.3) {
                const rand = Math.random();
                let Component;
                if (rand < 0.33) Component = GameTree;
                else if (rand < 0.66) Component = Mushroom;
                else Component = Grass3D;

                items.push(<Component key={`l-${z}`} position={[-8 - Math.random() * 10, 0, z]} />);
            }

            // Right side decorations (Trees, Mushrooms, Grass)
            if (Math.random() > 0.3) {
                const rand = Math.random();
                let Component;
                if (rand < 0.33) Component = GameTree;
                else if (rand < 0.66) Component = Mushroom;
                else Component = Grass3D;

                items.push(<Component key={`r-${z}`} position={[8 + Math.random() * 10, 0, z]} />);
            }

            // Rocks along the runway border
            // Left border (approx x = -4.5)
            if (Math.random() > 0.4) {
                items.push(
                    <Rock
                        key={`rock-l-${z}`}
                        position={[-4.5 - Math.random() * 0.5, -0.2, z + Math.random() * 5]}
                        scale={3 + Math.random() * 2} // Increased scale (was 0.5 + ...)
                        rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
                    />
                );
            }
            // Right border (approx x = 4.5)
            if (Math.random() > 0.4) {
                items.push(
                    <Rock
                        key={`rock-r-${z}`}
                        position={[4.5 + Math.random() * 0.5, -0.2, z + Math.random() * 5]}
                        scale={3 + Math.random() * 2} // Increased scale (was 0.5 + ...)
                        rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
                    />
                );
            }
        }
        return items;
    }, []);

    return (
        <group>
            {/* Grass Ground (Base) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, -500]} receiveShadow>
                <planeGeometry args={[200, 1000]} />
                <meshStandardMaterial map={grassTexture} />
            </mesh>

            {/* Runway with Sand Texture */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, -500]} receiveShadow>
                <planeGeometry args={[8, 1000]} />
                <meshStandardMaterial map={sandTexture} />
            </mesh>

            {decorations}

            {/* Floating Clouds Background */}
            <Cloud opacity={0.5} scale={4} position={[0, -20, -100]} speed={0.2} segments={40} />
            <Cloud opacity={0.5} scale={4} position={[-50, 10, -80]} speed={0.2} segments={40} />
            <Cloud opacity={0.5} scale={4} position={[50, 10, -80]} speed={0.2} segments={40} />
            <Cloud opacity={0.3} scale={5} position={[0, 30, -150]} speed={0.1} segments={40} />
            <Cloud opacity={0.4} scale={3} position={[-30, -10, -60]} speed={0.3} segments={30} />
            <Cloud opacity={0.4} scale={3} position={[30, -10, -60]} speed={0.3} segments={30} />
        </group>
    );
}


function StartScreen({ onStart }: { onStart: () => void }) {
    return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 mb-6">
                    Math Runner
                </h1>
                <p className="text-slate-600 mb-8 text-lg font-medium">Solve the math, choose the lane!</p>
                <button
                    onClick={onStart}
                    className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xl font-bold rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-all active:scale-95"
                >
                    Start Game
                </button>
            </div>
        </div>
    );
}

function GameOverScreen({ result, onRestart }: { result: 'correct' | 'wrong', onRestart: () => void }) {
    const isWin = result === 'correct';
    return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
            <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-300 text-center">
                <div className="text-6xl mb-4">
                    {isWin ? '🎉' : '💥'}
                </div>
                <h2 className={`text-4xl font-black mb-2 ${isWin ? 'text-green-500' : 'text-red-500'}`}>
                    {isWin ? 'Correct!' : 'Wrong Answer!'}
                </h2>
                <p className="text-slate-500 mb-8 text-lg">
                    {isWin ? 'Great job! Keep running!' : 'Oops! Better luck next time.'}
                </p>
                <button
                    onClick={onRestart}
                    className={`px-8 py-4 text-white text-xl font-bold rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-all active:scale-95 ${isWin ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                        }`}
                >
                    Play Again
                </button>
            </div>
        </div>
    );
}

export default function GamePage() {
    const [lane, setLane] = useState<Lane>(0);
    const [playerZ, setPlayerZ] = useState(0);
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'correct' | 'wrong'>('menu');
    const [gameId, setGameId] = useState(0); // Used to reset the scene

    // Quiz Configuration
    const quiz = {
        question: "Which is the correct spelling of jump?",
        answers: [
            { text: "gump", lane: -1, isCorrect: false }, // Left
            { text: "jump", lane: 1, isCorrect: true },   // Right
        ],
        zDistance: -50 // Distance where the gates are located
    };

    const startGame = () => {
        setGameState('playing');
    };

    const resetGame = () => {
        setGameId(prev => prev + 1);
        setLane(0);
        setPlayerZ(0);
        setGameState('playing'); // Restart immediately
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
            <div className="absolute top-0 left-0 w-full h-full z-10 flex flex-col items-center justify-center pointer-events-none">

                {/* Quiz Header - Always Visible */}
                <div className="absolute top-8 bg-white/90 backdrop-blur px-8 py-4 rounded-2xl shadow-xl transform transition-transform duration-500 hover:scale-105">
                    <h1 className="text-4xl font-bold text-slate-800 text-center">H Quiz</h1>
                    <p className="text-6xl font-black text-indigo-600 mt-2 text-center">{quiz.question}</p>
                </div>

                {/* Menu / Start Screen */}
                {gameState === 'menu' && (
                    <div className="pointer-events-auto bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl flex flex-col items-center space-y-6 animate-bounce-slight">
                        <h2 className="text-2xl font-bold text-slate-700">Ready to Race?</h2>
                        <button
                            onClick={() => setGameState('playing')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-bold py-4 px-12 rounded-full shadow-lg transition-all transform hover:scale-110 active:scale-95"
                        >
                            Start Game
                        </button>
                    </div>
                )}

                {/* Game Over / Result Screen */}
                {(gameState === 'correct' || gameState === 'wrong') && (
                    <div className="pointer-events-auto bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl flex flex-col items-center space-y-6">
                        <h2 className={`text-4xl font-black ${gameState === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                            {gameState === 'correct' ? 'Correct!' : 'Try Again!'}
                        </h2>
                        <p className="text-slate-600 text-lg">
                            {gameState === 'correct' ? 'Great job!' : 'Oops, that was the wrong answer.'}
                        </p>
                        <button
                            onClick={() => {
                                setPlayerZ(0);
                                setLane(0);
                                setGameState('playing');
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg transition-all hover:scale-105"
                        >
                            Play Again
                        </button>
                    </div>
                )}
            </div>

            {/* Screens */}
            {gameState === 'menu' && <StartScreen onStart={startGame} />}
            {(gameState === 'correct' || gameState === 'wrong') && (
                <GameOverScreen result={gameState} onRestart={resetGame} />
            )}

            {/* Controls Hint */}
            <div className="absolute bottom-8 left-0 w-full text-center z-10 pointer-events-none transition-opacity duration-300" style={{ opacity: gameState === 'playing' ? 1 : 0 }}>
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

                {/* Game Content - Reset on gameId change */}
                <group key={gameId}>
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
                </group>

                <fog attach="fog" args={['#87CEEB', 20, 100]} />
            </Canvas>
        </div>
    );
}

