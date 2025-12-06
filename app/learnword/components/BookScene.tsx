import { Environment, OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { useEffect, useRef, useState } from "react";
import Book3D from "./Book3D";
import { HelloKittyModel } from "./HelloKitty3D";

import { LearningStep } from "../types";

interface BookSceneProps {
    pages?: {
        left: React.ReactNode;
        right: React.ReactNode;
    }[];
    flippedIndex?: number;
    isLevelComplete?: boolean;
    isSuccess?: boolean;
    currentStep?: LearningStep;
}

export const BookScene = ({ pages = [], flippedIndex = 0, isLevelComplete = false, isSuccess = false, currentStep = 'SHOW' }: BookSceneProps) => {
    const group = useRef<any>(null);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setStarted(true);
        }, 500);
        return () => clearTimeout(timeout);
    }, []);

    useFrame((state, delta) => {
        if (group.current && started) {
            // If level complete, move book to right, otherwise center
            const targetPos: [number, number, number] = isLevelComplete ? [0, 0, 0] : [0, 0, 0];
            easing.damp3(group.current.position, targetPos, 1.5, delta);
            easing.dampE(group.current.rotation, [-Math.PI / 10, -0.1, 0], 0.2, delta);
        }
    });

    return (
        <>
            <group ref={group} position-z={0} rotation-x={-Math.PI / 4} scale={[0.3, 0.3, 0.3]}>
                <Book3D pages={pages} flippedIndex={flippedIndex} />
            </group>

            {/* Level Complete Character */}
            {isLevelComplete && (
                <group position={[-1, -1, 0]} rotation={[0, 0.5, 0]} scale={1}>
                    <HelloKittyModel
                        isTalking={true} // Talk during the congrats message
                        speechText="Congratulations! You completed the first level!"
                    />
                </group>
            )}

            <OrbitControls enablePan={false} enableZoom={false} />
            <Environment preset="studio"></Environment>
            <directionalLight
                position={[2, 5, 2]}
                intensity={isLevelComplete ? 4.0 : 2.5} // Brighten lights on level complete
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-bias={-0.0001}
            />
            <mesh position-y={-1.5} rotation-x={-Math.PI / 2} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <shadowMaterial transparent opacity={0.2} />
            </mesh>
        </>
    );
};
