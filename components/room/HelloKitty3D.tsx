import React, { useEffect, useState, useRef } from "react";
import { useFBX, useAnimations } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { motion } from "framer-motion-3d";
import * as THREE from "three";

export default function HelloKitty3D() {
    const group = useRef<any>(null);
    const waveFbx = useFBX("/hellokitty/helloModel/chatboxwave.fbx");
    const idleFbx = useFBX("/hellokitty/helloModel/dwarf Idle.fbx");
    const { viewport } = useThree();

    // Prepare animations
    if (waveFbx.animations.length > 0) waveFbx.animations[0].name = "Wave";
    if (idleFbx.animations.length > 0) idleFbx.animations[0].name = "Idle";

    const { actions, mixer } = useAnimations(
        [waveFbx.animations[0], idleFbx.animations[0]],
        group
    );

    const [currentVariant, setCurrentVariant] = useState("center");

    useEffect(() => {
        if (!actions || !actions["Wave"] || !actions["Idle"]) return;

        const waveAction = actions["Wave"];
        const idleAction = actions["Idle"];

        // Setup Wave: Play once, clamp at end
        waveAction.reset().setLoop(THREE.LoopOnce, 1).play();
        waveAction.clampWhenFinished = true;

        // Setup Idle: Loop forever
        idleAction.setLoop(THREE.LoopRepeat, Infinity);

        // Listener for when Wave finishes
        const onFinished = (e: any) => {
            if (e.action === waveAction) {
                // Crossfade to Idle
                waveAction.fadeOut(0.5);
                idleAction.reset().fadeIn(0.5).play();

                // Trigger move to corner
                setCurrentVariant("corner");
            }
        };

        mixer.addEventListener("finished", onFinished);

        return () => {
            mixer.removeEventListener("finished", onFinished);
        };
    }, [actions, mixer]);

    // Animation variants
    const variants = {
        center: {
            scale: 0.015, // Adjust based on model size
            x: 0,
            y: -1, // Slightly down to look grounded in center
            z: 0,
            rotateY: 0,
            transition: { duration: 1.5, ease: "easeInOut" }
        },
        corner: {
            scale: 0.01, // Smaller
            x: -viewport.width / 2 + 1.5, // Left corner + padding
            y: -viewport.height / 2 + 1, // Bottom corner + padding
            z: 0,
            rotateY: 0.5, // Slight turn
            transition: { duration: 2, ease: "easeInOut" }
        }
    };

    return (
        <motion.group
            ref={group}
            animate={currentVariant}
            variants={variants}
            initial="center"
        >
            <primitive object={waveFbx} />
            {/* Add a light specifically for the model if needed */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1.5} />
        </motion.group>
    );
}

// Preload the models
useFBX.preload("/hellokitty/helloModel/chatboxwave.fbx");
useFBX.preload("/hellokitty/helloModel/dwarf Idle.fbx");
