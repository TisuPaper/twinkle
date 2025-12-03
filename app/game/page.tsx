'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useFBX, useAnimations, OrbitControls, Plane, Environment } from '@react-three/drei';
import * as THREE from 'three';

function HelloKitty() {
    const group = useRef<THREE.Group>(null);
    const fbx = useFBX('/hellokitty/helloModel/base_basic_shaded.fbx');
    const { animations: runAnimations } = useFBX('/hellokitty/helloModel/Fast Run.fbx');

    // Rename the animation to something predictable
    if (runAnimations.length > 0) {
        runAnimations[0].name = 'Run';
    }

    const { actions } = useAnimations(runAnimations, group);

    // Movement state
    const [targetPosition, setTargetPosition] = useState(new THREE.Vector3(0, 0, 0));
    const speed = 0.05;

    useEffect(() => {
        // Play the 'Run' animation
        const action = actions['Run'];
        if (action) {
            action.reset().fadeIn(0.5).play();
        }

        // Pick a random spot to start
        pickNewTarget();
    }, [actions]);

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
