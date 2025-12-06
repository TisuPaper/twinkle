import React, { useMemo } from 'react';
import * as THREE from 'three';

export function Tree({ position }: { position: [number, number, number] }) {
    const scale = useMemo(() => 0.8 + Math.random() * 0.4, []);
    const rotation = useMemo(() => Math.random() * Math.PI * 2, []);

    return (
        <group position={position} scale={scale} rotation={[0, rotation, 0]}>
            {/* Trunk */}
            <mesh position={[0, 1, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
                <meshStandardMaterial color="#5D4037" />
            </mesh>

            {/* Foliage - Bottom Layer */}
            <mesh position={[0, 2, 0]} castShadow receiveShadow>
                <icosahedronGeometry args={[1, 1]} />
                <meshStandardMaterial color="#4CAF50" />
            </mesh>

            {/* Foliage - Middle Layer */}
            <mesh position={[0, 2.8, 0]} scale={0.8} castShadow receiveShadow>
                <icosahedronGeometry args={[1, 1]} />
                <meshStandardMaterial color="#66BB6A" />
            </mesh>

            {/* Foliage - Top Layer */}
            <mesh position={[0, 3.4, 0]} scale={0.6} castShadow receiveShadow>
                <icosahedronGeometry args={[1, 1]} />
                <meshStandardMaterial color="#81C784" />
            </mesh>
        </group>
    );
}
