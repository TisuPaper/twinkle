import React from 'react';

export default function Shelf({ width = 9, depth = 2.5, height = 3.2 }) {
    const thickness = 0.2;
    const woodColor = "#8B5A2B"; // SaddleBrown/Wood color
    const materialProps = { roughness: 0.8, metalness: 0.1 };

    return (
        <group>
            {/* Bottom Board */}
            {/* Positioned so top surface is at y=0 to match book bottom */}
            <mesh position={[0, -thickness / 2, 0]} receiveShadow>
                <boxGeometry args={[width, thickness, depth]} />
                <meshStandardMaterial color={woodColor} {...materialProps} />
            </mesh>

            {/* Top Board */}
            <mesh position={[0, height + thickness / 2, 0]} receiveShadow>
                <boxGeometry args={[width, thickness, depth]} />
                <meshStandardMaterial color={woodColor} {...materialProps} />
            </mesh>

            {/* Left Side */}
            <mesh position={[-width / 2 + thickness / 2, height / 2, 0]} receiveShadow>
                <boxGeometry args={[thickness, height + 2 * thickness, depth]} />
                <meshStandardMaterial color={woodColor} {...materialProps} />
            </mesh>

            {/* Right Side */}
            <mesh position={[width / 2 - thickness / 2, height / 2, 0]} receiveShadow>
                <boxGeometry args={[thickness, height + 2 * thickness, depth]} />
                <meshStandardMaterial color={woodColor} {...materialProps} />
            </mesh>

            {/* Back Panel */}
            <mesh position={[0, height / 2, -depth / 2 + 0.05]} receiveShadow>
                <boxGeometry args={[width, height + 2 * thickness, 0.1]} />
                <meshStandardMaterial color={woodColor} {...materialProps} />
            </mesh>
        </group>
    );
}
