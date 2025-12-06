import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, extend, ThreeElement } from "@react-three/fiber";
import { useTexture, PerspectiveCamera, Text, Html, shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import ParticleText from "./ParticleText";
import { useRouter } from "next/navigation";
import HoverButton from "./HoverButton";

// --- 1. SHADER FOR "LETTER BY LETTER" REVEAL ---
// This creates a mask that wipes from left to right
const RevealMaterial = shaderMaterial(
    {
        uTime: 0,
        uProgress: 0, // 0 = Hidden, 1 = Fully Visible
        uColor: new THREE.Color("black"),
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    // Fragment Shader
    `
    uniform float uProgress;
    uniform vec3 uColor;
    varying vec2 vUv;

    void main() {
        // "Letter by letter" wipe effect
        // vUv.x goes from 0 (left) to 1 (right)
        // We compare it against uProgress to determine visibility
        float alpha = smoothstep(vUv.x, vUv.x + 0.1, uProgress);
        
        gl_FragColor = vec4(uColor, alpha);
    }
    `
);

extend({ RevealMaterial });

declare module "@react-three/fiber" {
    interface ThreeElements {
        revealMaterial: ThreeElement<typeof RevealMaterial>;
    }
}

// --- 2. ANIMATION HELPERS ---

// Helper for Top Text (Letter by Letter Wipe)
const DelayedRevealText = ({ position, children, delay = 0, start = false, exiting = false, ...props }: any) => {
    const materialRef = useRef<any>(null);
    // State to track when the animation should logically start (after 'start' is true)
    const [startTime, setStartTime] = useState<number | null>(null);

    useFrame((state, delta) => {
        if (!start) return; // Stop animation if loader is running
        if (startTime === null) setStartTime(state.clock.elapsedTime); // Set timer offset

        if (materialRef.current && startTime !== null) {
            const elapsed = state.clock.elapsedTime - startTime;

            if (exiting) {
                // Wipe back to hidden
                materialRef.current.uProgress = THREE.MathUtils.lerp(
                    materialRef.current.uProgress,
                    0.0,
                    delta * 1.5
                );
            } else if (elapsed > delay) {
                // Wipe to visible
                materialRef.current.uProgress = THREE.MathUtils.lerp(
                    materialRef.current.uProgress,
                    1.1,
                    delta * 0.8
                );
            }
        }
    });

    return (
        <Text
            position={position}
            {...props}
        >
            {children}
            {/* Use the custom shader instead of standard material */}
            <revealMaterial
                ref={materialRef}
                transparent
                uColor={new THREE.Color("black")}
            />
        </Text>
    );
};

// Helper for HTML Button (Simple Fade In after delay)
const DelayedHtml = ({ position, children, delay = 0, start = false, exiting = false, ...props }: any) => {
    const groupRef = useRef<any>(null);
    const divRef = useRef<HTMLDivElement>(null);
    const [startTime, setStartTime] = useState<number | null>(null);

    useFrame((state) => {
        if (!start) return; // Stop animation if loader is running
        if (startTime === null) setStartTime(state.clock.elapsedTime); // Set timer offset

        if (divRef.current && startTime !== null) {
            const elapsed = state.clock.elapsedTime - startTime;

            if (exiting) {
                // Fade out immediately when exiting
                if (divRef.current.style.opacity !== '0') {
                    divRef.current.style.opacity = '0';
                    divRef.current.style.pointerEvents = 'none';
                    divRef.current.style.transition = 'opacity 1s ease-out';
                }
            } else if (elapsed > delay) {
                const timeSinceStart = elapsed - delay;
                // Fade in over 1 second
                const opacity = Math.min(timeSinceStart * 1.0, 1);

                divRef.current.style.opacity = opacity.toString();
                // Optional: Subtle slide up
                divRef.current.style.transform = `translate3d(0, ${(1 - opacity) * 10}px, 0)`;
            }
        }
    });

    return (
        <group ref={groupRef} position={position}>
            <Html {...props} style={{ transition: 'none' }} zIndexRange={[100, 0]}>
                <div
                    ref={divRef}
                    style={{
                        opacity: 0,
                        transform: 'translate3d(0, 10px, 0)',
                        pointerEvents: 'auto' // Ensure clickable
                    }}
                >
                    {children}
                </div>
            </Html>
        </group>
    );
};


// --- 3. THE RIG ---
const GlobalCameraRig = () => {
    const mouse = useRef({ x: 0, y: 0 });
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);
    useFrame((state) => {
        const targetY = mouse.current.x * -0.2;
        const targetX = mouse.current.y * -0.1;
        state.camera.rotation.y = THREE.MathUtils.lerp(state.camera.rotation.y, targetY, 0.05);
        state.camera.rotation.x = THREE.MathUtils.lerp(state.camera.rotation.x, targetX, 0.05);
    });
    return null;
};

// --- 4. PANO ---
const PanoBackground = ({ url }: { url: string }) => {
    const texture = useTexture(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    return (
        <mesh rotation={[0, 1.6, 0]}>
            <sphereGeometry args={[500, 60, 40]} />
            <meshBasicMaterial map={texture} side={THREE.BackSide} toneMapped={false} />
        </mesh>
    );
};

const ZoomRig = ({ active }: { active: boolean }) => {
    useFrame((state, delta) => {
        if (active) {
            state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, -2, delta * 2);
        }
    });
    return null;
};

// --- 5. THE SCENE ---
interface SceneProps {
    start: boolean; // ADDED: Prop to synchronize R3F animations
    onStartJourney?: () => void; // Callback when Start Journey is clicked
}

const ThreeScene: React.FC<SceneProps> = ({ start, onStartJourney }) => {
    const router = useRouter();
    // Configuration for the sequence
    const SEQUENCE_DELAY = 1; // Time to wait before Top Text & Button appear
    const [isZooming, setIsZooming] = useState(false);
    const [isExiting, setIsExiting] = useState(false); // ADDED: Track fade out state

    const handleStartJourney = () => {
        if (onStartJourney) {
            onStartJourney();
        } else {
            router.push('/experience');
        }
    };

    return (
        <div className="absolute inset-0 bg-black">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 0.1]} fov={50} />

                <Suspense fallback={null}>
                    <PanoBackground url={encodeURI("/World1_pano.png")} />
                    <GlobalCameraRig />
                    {/* Add ZoomRig inside Canvas */}
                    <ZoomRig active={isZooming} />
                </Suspense>

                <Suspense fallback={null}>
                    <group position={[0, 0, -8]}>

                        {/* 1. ANIMATED TOP TEXT (Delayed) */}
                        <DelayedRevealText
                            position={[0, 1.5, 0]}
                            fontSize={0.15}
                            letterSpacing={0.2}
                            anchorX="center"
                            anchorY="middle"
                            delay={SEQUENCE_DELAY}
                            start={start}
                            exiting={isExiting}
                        >
                            A NEW WAY TO LEARN
                        </DelayedRevealText>

                        {/* 2. PARTICLE TEXT (Immediate Slide Up) */}
                        {/* Removed delays so they start immediately at t=0 */}
                        <ParticleText
                            text="Interactive"
                            position={[0, 0.5, 0]}
                            size={0.7}
                            fontUrl="/fonts/PlayfairDisplay-Italic-VariableFont_wght.ttf"
                            start={start}
                            exiting={isExiting}
                        />

                        <ParticleText
                            text="Learning Experience"
                            position={[0, -0.5, 0]}
                            size={0.7}
                            fontUrl="/fonts/PlayfairDisplay-VariableFont_wght.ttf"
                            start={start}
                            exiting={isExiting}
                        />

                        {/* 3. ANIMATED BUTTON (Delayed) */}
                        <DelayedHtml
                            position={[0, -1.2, 0]}
                            center
                            transform
                            delay={SEQUENCE_DELAY}
                            start={start}
                            exiting={isExiting}
                        >
                            <HoverButton onClick={handleStartJourney}>
                                Start Journey
                                <svg width="4" height="4" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 11L11 1M11 1H3M11 1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </HoverButton>
                        </DelayedHtml>

                    </group>
                </Suspense>

            </Canvas>
        </div>
    );
};

export default ThreeScene;