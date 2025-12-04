import { Environment, OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { useEffect, useRef, useState } from "react";
import Book3D from "./Book3D";

interface BookSceneProps {
    pages?: {
        left: React.ReactNode;
        right: React.ReactNode;
    }[];
    flippedIndex?: number;
}

export const BookScene = ({ pages = [], flippedIndex = 0 }: BookSceneProps) => {
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
            easing.damp3(group.current.position, [0, 0, 0], 1.5, delta);
            easing.dampE(group.current.rotation, [-Math.PI / 6, 0, 0], 1.5, delta);
        }
    });

    return (
        <>
            <group ref={group} position-z={0} rotation-x={-Math.PI / 4} scale={[0.3, 0.3, 0.3]}>
                <Book3D pages={pages} flippedIndex={flippedIndex} />
            </group>

            <OrbitControls />
            <Environment preset="studio"></Environment>
            <directionalLight
                position={[2, 5, 2]}
                intensity={2.5}
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
