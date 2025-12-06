// components/Book3D.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Text, Html, RoundedBox, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// --- Constants ---
const COVER_WIDTH = 6.2;
const COVER_HEIGHT = 8.2;
const PAGE_WIDTH = 5.8;
const PAGE_HEIGHT = 7.8;
const PAGE_THICKNESS = 0.05; // Thinner pages for better stacking
const Z_GAP = 0.06; // Gap between pages to prevent z-fighting
const COVER_THICKNESS = 0.15;

// --- Materials ---
// Helper to create notebook texture
function createNotebookTexture(side: 'left' | 'right') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Background
    ctx.fillStyle = '#fffdf5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Blue horizontal lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    const lineHeight = 40;
    for (let y = lineHeight; y < canvas.height; y += lineHeight) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Red vertical line
    ctx.strokeStyle = '#ffcccc';
    ctx.lineWidth = 2;
    const marginX = side === 'left' ? canvas.width - 60 : 60; // Right side for left page, Left side for right page
    ctx.beginPath();
    ctx.moveTo(marginX, 0);
    ctx.lineTo(marginX, canvas.height);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

const CoverMaterial = new THREE.MeshStandardMaterial({
    color: '#f3dd9cff', // Beige to match inner pages
    roughness: 0.8,
});

const PageMaterial = new THREE.MeshStandardMaterial({
    color: '#fff9df',
    roughness: 0.5,
    metalness: 0.0,
});

const SpineMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#2d2d2d'),
    roughness: 0.8,
    metalness: 0.5,
    clearcoat: 0.0,
    transparent: false,
});

// --- Content Components ---
// These are simplified for the demo. In a real app, you'd pass these as props.

interface PageContentProps {
    text?: string;
    title?: string;
    color?: string;
    align?: "left" | "center" | "right" | "justify";
}

const PageContent = ({ text, title, color = "#333", align = "left" }: PageContentProps) => (
    <group position={[0, 0, PAGE_THICKNESS / 2 + 0.01]}>
        {title && (
            <Text
                position={[0, 1.2, 0]}
                fontSize={0.25}
                color={color}
                anchorX="center"
                anchorY="middle"
                maxWidth={2.5}
                textAlign="center"
            >
                {title}
            </Text>
        )}
        <Text
            position={[0, 0, 0]}
            fontSize={0.12}
            color={color}
            anchorX="center"
            anchorY="middle"
            maxWidth={2.4}
            textAlign={align}
            lineHeight={1.5}
        >
            {text}
        </Text>
    </group>
);

const CoverFront = () => (
    <group position={[0, 0, COVER_THICKNESS / 2 + 0.01]}>
        <Text position={[0, 0.8, 0]} fontSize={0.3} color="#d4af37" anchorX="center" anchorY="middle" maxWidth={2.5} textAlign="center">
            Chapter 1
        </Text>
    </group>
);

// --- BookPage Component (Represents one leaf) ---
interface BookPageProps {
    index: number;
    isFlipped: boolean;
    flippedIndex: number; // Added prop
    onFlip: () => void;
    frontContent: React.ReactNode;
    backContent: React.ReactNode;
    totalLeaves: number;
    frontTexture?: THREE.Texture;
    backTexture?: THREE.Texture;
}

const BookPage = ({ index, isFlipped, flippedIndex, onFlip, frontContent, backContent, totalLeaves, frontTexture, backTexture }: BookPageProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const [isFrontFacing, setIsFrontFacing] = useState(!isFlipped);

    // Target rotation: 0 (right/closed) or -PI (left/open)
    const targetRotation = isFlipped ? -Math.PI : 0;

    useFrame((state, delta) => {
        if (groupRef.current) {
            // Smooth rotation
            const step = 5.0 * delta;
            const currentY = groupRef.current.rotation.y;
            let newY = THREE.MathUtils.lerp(currentY, targetRotation, 0.1);

            if (Math.abs(newY - targetRotation) < 0.001) newY = targetRotation;
            groupRef.current.rotation.y = newY;

            // Determine facing direction (cull back-facing content)
            // Switch visibility at -PI/2 (90 degrees)
            const frontFacing = newY > -Math.PI / 2;
            if (frontFacing !== isFrontFacing) {
                setIsFrontFacing(frontFacing);
            }

            // Dynamic Z-indexing to avoid clipping
            // When closed (0), higher index = lower z (bottom of stack)
            // When open (-PI), higher index = higher z (top of stack)
            // We interpolate Z based on rotation progress

            const progress = Math.abs(newY) / Math.PI; // 0 to 1

            // Z position when on the right (closed)
            // Leaf 0 is top (highest Z), Leaf N is bottom
            const zRight = (totalLeaves - index) * Z_GAP;

            // Z position when on the left (open)
            // Leaf 0 is bottom (lowest Z), Leaf N is top
            const zLeft = index * Z_GAP;

            // Peak Z during flip to clear other pages
            const zPeak = Math.max(zRight, zLeft) + 1.0;

            // Simple parabolic arc for Z height during flip
            // 4 * p * (1-p) gives a curve that is 0 at p=0 and p=1, and 1 at p=0.5
            const arc = 4 * progress * (1 - progress);

            // Interpolate base Z
            const currentBaseZ = (1 - progress) * zRight + progress * zLeft;

            // Add arc offset
            groupRef.current.position.z = currentBaseZ + (arc * 0.5);
        }
    });

    const isCover = index === 0;
    const thickness = isCover ? COVER_THICKNESS : PAGE_THICKNESS;

    // Determine materials for front and back faces
    const material = isCover ? CoverMaterial : PageMaterial;

    // Radius must be smaller than half the thickness to avoid artifacts
    const radius = isCover ? 0.02 : 0.005;

    const width = isCover ? COVER_WIDTH : PAGE_WIDTH;
    const height = isCover ? COVER_HEIGHT : PAGE_HEIGHT;

    // Only render content if this page is active or immediately adjacent (to handle flips)
    // This prevents "bleed through" of HTML content from pages deep in the stack
    const shouldRenderContent = Math.abs(index - flippedIndex) <= 1;

    return (
        <group
            ref={groupRef}
            position={[0, 0, 0]} // Pivot point at the spine (0,0,0)
        >
            {/* FRONT OF PAGE (Visible when on Right) */}
            <group position={[width / 2, 0, 0]}>
                <RoundedBox args={[width, height, thickness]} radius={radius} smoothness={4} material={material}>
                    {/* Front Content */}
                </RoundedBox>
                {/* Overlay content - Only render if front facing */}
                <group position={[0, 0, 0]}>
                    {shouldRenderContent && isFrontFacing && frontContent}
                    {/* Render texture if provided, otherwise use material */}
                    {frontTexture && (
                        <mesh position={[0, 0, thickness / 2 + 0.001]}>
                            <planeGeometry args={[width, height]} />
                            <meshBasicMaterial map={frontTexture} toneMapped={false} transparent={true} />
                        </mesh>
                    )}
                </group>
            </group>

            {/* BACK OF PAGE (Visible when on Left) */}
            <group position={[width / 2, 0, 0]} rotation={[0, Math.PI, 0]}>
                <RoundedBox args={[width, height, thickness]} radius={radius} smoothness={4} material={material}>
                    {/* Back Content */}
                </RoundedBox>
                {/* Overlay content - Only render if NOT front facing (back facing) */}
                <group position={[0, 0, 0]}>
                    {shouldRenderContent && !isFrontFacing && backContent}
                    {backTexture && (
                        <mesh position={[0, 0, thickness / 2 + 0.001]}>
                            <planeGeometry args={[width, height]} />
                            <meshBasicMaterial map={backTexture} toneMapped={false} transparent={true} />
                        </mesh>
                    )}
                </group>
            </group>
        </group>
    );
};

// --- Main Book Component ---
interface Book3DProps {
    pages: {
        left: React.ReactNode;
        right: React.ReactNode;
    }[];
    flippedIndex: number;
}

export default function Book3D({ pages, flippedIndex }: Book3DProps) {
    // Load textures for cover
    const [coverTexture] = useTexture(['/image.png']);
    const backCoverTexture = coverTexture; // Use same texture for back

    // Fix color space for textures
    coverTexture.colorSpace = THREE.SRGBColorSpace;
    coverTexture.needsUpdate = true;

    // Generate Notebook Textures
    const leftPageTexture = React.useMemo(() => createNotebookTexture('left'), []);
    const rightPageTexture = React.useMemo(() => createNotebookTexture('right'), []);

    // We construct leaves from the pages prop.
    // Leaf 0: Front=Cover, Back=Page 0 Left
    // Leaf i (i>0): Front=Page (i-1) Right, Back=Page i Left
    // Last Leaf: Front=Page (N-1) Right, Back=Back Cover

    const leaves = React.useMemo(() => {
        const generatedLeaves = [];

        // Leaf 0: Cover / First Left
        generatedLeaves.push({
            front: <group />, // No text on front cover
            back: <group position={[0, 0, 0.06]}>{pages[0]?.left}</group>,
            frontTexture: coverTexture,
            // backTexture: leftPageTexture, // REMOVED: User wants plain beige inner cover
        });

        // Middle Leaves
        for (let i = 1; i < pages.length; i++) {
            generatedLeaves.push({
                front: (
                    <group position={[0, 0, 0.06]}>
                        {pages[i - 1]?.right && (
                            <Html
                                transform
                                occlude
                                position={[0, 0, 0]}
                                style={{
                                    width: '480px',
                                    height: '640px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    userSelect: 'none',
                                    pointerEvents: 'none'
                                }}
                                scale={0.5}
                            >
                                <div style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}>
                                    {pages[i - 1]?.right}
                                </div>
                            </Html>
                        )}
                    </group>
                ),
                back: <group position={[0, 0, 0.06]}>{pages[i]?.left}</group>,
                frontTexture: rightPageTexture, // Notebook texture for right pages
                backTexture: leftPageTexture, // Notebook texture for left pages
            });
        }


        // Last Leaf: Last Right / Back Cover
        generatedLeaves.push({
            front: (
                <group position={[0, 0, 0.06]}>
                    {pages[pages.length - 1]?.right && (
                        <Html
                            transform
                            occlude
                            position={[0, 0, 0]}
                            style={{
                                width: '480px',
                                height: '640px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                userSelect: 'none',
                                pointerEvents: 'none'
                            }}
                            scale={0.5}
                        >
                            <div style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}>
                                {pages[pages.length - 1]?.right}
                            </div>
                        </Html>
                    )}
                </group>
            ),
            back: <group />, // Back cover
            frontTexture: rightPageTexture, // Notebook texture for last right page
            backTexture: backCoverTexture,
        });

        return generatedLeaves;
    }, [pages, coverTexture, backCoverTexture, leftPageTexture, rightPageTexture]);

    return (
        <group position={[0, 0, 0]}>
            {/* Spine centered at 0,0,0 */}
            <RoundedBox
                args={[0.6, COVER_HEIGHT + 0.1, 0.2]}
                radius={0.1}
                smoothness={4}
                position={[0, 0, -0.05]} // Moved up from -0.1
                material={SpineMaterial}
            />

            {/* Back Cover (Static Base) */}
            <group position={[COVER_WIDTH / 2, 0, -0.02]}>
                <RoundedBox
                    args={[COVER_WIDTH, COVER_HEIGHT, COVER_THICKNESS]}
                    radius={0.05}
                    smoothness={4}
                    material={CoverMaterial}
                />
                {/* Static Back Cover Image Plane */}
                <mesh position={[0, 0, -COVER_THICKNESS / 2 - 0.001]} rotation={[0, Math.PI, 0]}>
                    <planeGeometry args={[COVER_WIDTH, COVER_HEIGHT]} />
                    <meshBasicMaterial map={backCoverTexture} toneMapped={false} />
                </mesh>
            </group>

            {leaves.map((leaf, i) => (
                <BookPage
                    key={i}
                    index={i}
                    isFlipped={i <= flippedIndex}
                    flippedIndex={flippedIndex} // Pass global flipped index
                    onFlip={() => { }} // Controlled by parent
                    frontContent={leaf.front}
                    backContent={leaf.back}
                    totalLeaves={leaves.length}
                    frontTexture={leaf.frontTexture}
                    backTexture={leaf.backTexture}
                />
            ))}
        </group>
    );
}
