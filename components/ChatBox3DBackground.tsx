"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, Environment, OrbitControls, ContactShadows } from "@react-three/drei";
import Image from "next/image";

function Model() {
    const { scene } = useGLTF("/chatbox");
    return <primitive object={scene} scale={2.5} position={[0, -1.5, 0]} />;
}

const ChatBox3DBackground = () => {
    return (
        <div className="absolute inset-0 z-0 rounded-[2.5rem]">
            {/* Hello Kitty Image at Top - Outside overflow container */}
            <div className="absolute left-1/2 -translate-x-1/2 z-10" style={{ top: '-400vh' }}>
                <Image
                    src="/chatbox/hello_kitty_no_background.png"
                    alt="Hello Kitty"
                    width={120}
                    height={120}
                    className="drop-shadow-lg"
                    style={{
                        objectFit: "contain",
                    }}
                />
            </div>
            <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden">
            <Canvas
                camera={{ position: [0, 0, 5], fov: 50 }}
                gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
                className="w-full h-full"
            >
                <ambientLight intensity={1.2} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <directionalLight position={[-5, -5, -5]} intensity={0.5} />
                <pointLight position={[0, 0, 5]} intensity={0.8} />
                <Suspense fallback={null}>
                    <Model />
                    <Environment preset="sunset" />
                    <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
                </Suspense>
                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>
            </div>
        </div>
    );
};

useGLTF.preload("/chatbox");

export default ChatBox3DBackground;
