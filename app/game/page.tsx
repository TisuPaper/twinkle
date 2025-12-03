'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useFBX, useAnimations, OrbitControls, Plane, Environment } from '@react-three/drei';
import * as THREE from 'three';

function HelloKitty() {
    const group = useRef<THREE.Group>(null);
    const fbx = useFBX('/hellokitty/base-3.fbx');
    const { actions, names } = useAnimations(fbx.animations, group);

    // Movement state
    const [targetPosition, setTargetPosition] = useState(new THREE.Vector3(0, 0, 0));
    const speed = 0.05;

    useEffect(() => {
        // Play the first animation found, assuming it might be a run or idle
        if (names.length > 0) {
            // Try to find a 'run' or 'walk' animation, otherwise pick the first one
            const runAnim = names.find(n => n.toLowerCase().includes('run')) || names[0];
            actions[runAnim]?.reset().fadeIn(0.5).play();
        }

        // Pick a random spot to start
        pickNewTarget();
    }, [actions, names]);

    const pickNewTarget = () => {
        const x = (Math.random() - 0.5) * 20; // Random x between -10 and 10
        const z = (Math.random() - 0.5) * 20; // Random z between -10 and 10
        setTargetPosition(new THREE.Vector3(x, 0, z));
    };

    useFrame((state, delta) => {
        if (!group.current) return;

        const currentPos = group.current.position;
        const direction = new THREE.Vector3().subVectors(targetPosition, currentPos);
        const distance = direction.length();

        if (distance < 0.1) {
            pickNewTarget();
        } else {
            direction.normalize();
            // Move towards target
            currentPos.add(direction.multiplyScalar(speed));

            // Rotate to face target
            const lookTarget = new THREE.Vector3(targetPosition.x, currentPos.y, targetPosition.z);
            group.current.lookAt(lookTarget);
        }
    });

    return (
        <group ref={group} dispose={null} scale={0.01}>
            {/* Scale might need adjustment depending on the FBX unit */}
            <primitive object={fbx} />
        </group>
    );
}

function Map() {
    return (
        <Plane args={[50, 50]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <meshStandardMaterial color="#f0f0f0" />
        </Plane>
    );
}

export default function GamePage() {
    return (
        <div className="w-full h-screen bg-black">
            <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[10, 10, 5]}
                    intensity={1}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />
                <Environment preset="city" />

                <HelloKitty />
                <Map />

                <OrbitControls />
                <gridHelper args={[50, 50]} />
            </Canvas>
        </div>
    );
}
