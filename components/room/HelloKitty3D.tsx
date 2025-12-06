import React, { useEffect, useState, useRef } from "react";
import { useFBX, useAnimations, Html } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import gsap from "gsap";
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

    // GSAP Animations
    useEffect(() => {
        if (!group.current) return;

        if (currentVariant === "center") {
            gsap.to(group.current.position, {
                x: 0,
                y: -1.8,
                z: 0,
                duration: 1.5,
                ease: "power2.inOut"
            });
            gsap.to(group.current.rotation, {
                y: 0,
                duration: 1.5,
                ease: "power2.inOut"
            });
            gsap.to(group.current.scale, {
                x: 0.015,
                y: 0.015,
                z: 0.015,
                duration: 1.5,
                ease: "power2.inOut"
            });
        } else if (currentVariant === "corner") {
            gsap.to(group.current.position, {
                x: -viewport.width / 2 + 1.5,
                y: -viewport.height / 2 + 1,
                z: 0,
                duration: 2,
                ease: "power2.inOut"
            });
            gsap.to(group.current.rotation, {
                y: 0.5,
                duration: 2,
                ease: "power2.inOut"
            });
            gsap.to(group.current.scale, {
                x: 0.01,
                y: 0.01,
                z: 0.01,
                duration: 2,
                ease: "power2.inOut"
            });
        }
    }, [currentVariant, viewport]);

    return (
        <group ref={group}>
            <primitive object={waveFbx} />
            {/* Add a light specifically for the model if needed */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1.5} />

            {/* Chat Bubble - Only visible in center */}
            {currentVariant === "center" && (
                <Html position={[0, 180, 0]} center>
                    <div style={{
                        background: 'white',
                        padding: '16px 24px', // Increased padding
                        borderRadius: '20px', // Increased radius
                        borderBottomLeftRadius: '0',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        fontFamily: 'sans-serif',
                        fontSize: '24px', // Increased font size
                        fontWeight: 'bold',
                        color: '#333',
                        whiteSpace: 'nowrap',
                        position: 'relative',
                        marginBottom: '20px'
                    }}>
                        Hello my friend !
                        <div style={{
                            position: 'absolute',
                            left: '0',
                            bottom: '-10px',
                            width: '0',
                            height: '0',
                            borderLeft: '10px solid white',
                            borderBottom: '10px solid transparent',
                            borderTop: '0'
                        }} />
                    </div>
                </Html>
            )}
        </group>
    );
}

// Preload the models
useFBX.preload("/hellokitty/helloModel/chatboxwave.fbx");
useFBX.preload("/hellokitty/helloModel/dwarf Idle.fbx");
