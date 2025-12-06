import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { EffectComposer, N8AO, Bloom } from '@react-three/postprocessing';
import { RoundedBox, OrbitControls, Environment, Float, Center, ContactShadows, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// --- Constants & Data ---
const SHELF_COLOR = '#8B5A2B'; // Darker wood
const BG_COLOR = '#202020';

const BOOK_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
    '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
];

// --- Interfaces ---

interface BookProps {
    position: [number, number, number];
    rotation?: [number, number, number];
    color: string;
    args?: [number, number, number];
}

interface TextureMaterialProps {
    texture: THREE.Texture;
    color?: string;
    repeat?: [number, number];
    [key: string]: any;
}

interface ShelfSegmentProps {
    position: [number, number, number];
    args: [number, number, number];
    texture: THREE.Texture;
    textureRepeat?: [number, number];
}

interface DecorationProps {
    position: [number, number, number];
    color: string;
    type?: 'sphere' | 'cube' | 'blob';
}

interface CartoonHandProps {
    position: [number, number, number];
    rotation: [number, number, number];
    side?: 'left' | 'right';
}

interface CartoonArmProps {
    position: [number, number, number];
    side?: 'left' | 'right';
}

interface CartoonShoeProps {
    position: [number, number, number];
    rotation: [number, number, number];
    side?: 'left' | 'right';
}

interface CartoonLegProps {
    position: [number, number, number];
    side?: 'left' | 'right';
}

interface CartoonEyeProps {
    position: [number, number, number];
    rotation: [number, number, number];
    side?: 'left' | 'right';
}

interface ShelfItem {
    type: 'book' | 'decoration';
    position: [number, number, number];
    rotation?: [number, number, number]; // Optional because decorations don't use it in the loop
    args?: [number, number, number];      // Only for books
    color: string;
    decorationType?: 'sphere' | 'cube' | 'blob'; // Only for decorations
}

// --- Components ---

const Book: React.FC<BookProps> = ({ position, rotation = [0, 0, 0], color, args = [0.2, 1, 0.8] }) => {
    const group = useRef<THREE.Group>(null);
    const [hovered, setHover] = useState(false);
    const [active, setActive] = useState(false);

    const width = args[0];
    const height = args[1];
    const depth = args[2];

    useFrame((state) => {
        if (group.current) {
            // Hover effect: pull out slightly and tilt
            const targetZ = hovered ? 0.3 : 0;
            const targetRotX = hovered ? 0.2 : 0;

            group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, position[2] + targetZ, 0.1);
            group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetRotX, 0.1);

            // Active/Click effect: bounce
            if (active) {
                group.current.scale.y = THREE.MathUtils.lerp(group.current.scale.y, 1.1, 0.2);
            } else {
                group.current.scale.y = THREE.MathUtils.lerp(group.current.scale.y, 1, 0.2);
            }
        }
    });

    return (
        <group
            ref={group}
            position={position}
            rotation={rotation as any} // Cast to any or THREE.Euler compatible
            onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
            onPointerOut={(e) => { e.stopPropagation(); setHover(false); }}
            onClick={(e) => { e.stopPropagation(); setActive(!active); }}
        >
            {/* Pages (White block inside) */}
            <mesh position={[0, 0, -0.02]} castShadow receiveShadow>
                <boxGeometry args={[width - 0.02, height - 0.04, depth - 0.04]} />
                <meshStandardMaterial color="#E0D6C2" roughness={0.9} />
            </mesh>

            {/* Spine (Front) */}
            <RoundedBox
                args={[width, height, 0.04]}
                position={[0, 0, depth / 2 - 0.02]}
                radius={0.01}
                smoothness={4}
                castShadow
                receiveShadow
            >
                <meshStandardMaterial color={color} roughness={0.4} />
            </RoundedBox>

            {/* Left Cover */}
            <RoundedBox
                args={[0.04, height, depth]}
                position={[-width / 2 + 0.02, 0, 0]}
                radius={0.01}
                smoothness={4}
                castShadow
                receiveShadow
            >
                <meshStandardMaterial color={color} roughness={0.4} />
            </RoundedBox>

            {/* Right Cover */}
            <RoundedBox
                args={[0.04, height, depth]}
                position={[width / 2 - 0.02, 0, 0]}
                radius={0.01}
                smoothness={4}
                castShadow
                receiveShadow
            >
                <meshStandardMaterial color={color} roughness={0.4} />
            </RoundedBox>
        </group>
    );
};

const TextureMaterial: React.FC<TextureMaterialProps> = ({ texture, color, repeat = [1, 1], ...props }) => {
    const map = useMemo(() => {
        if (!texture) return null;
        const cloned = texture.clone();
        cloned.wrapS = cloned.wrapT = THREE.RepeatWrapping;
        cloned.repeat.set(repeat[0], repeat[1]);
        // Update the texture to ensure changes take effect
        cloned.needsUpdate = true;
        return cloned;
    }, [texture, repeat[0], repeat[1]]);

    return <meshStandardMaterial map={map} color={map ? 'white' : color} {...props} />;
};

const ShelfSegment: React.FC<ShelfSegmentProps> = ({ position, args, texture, textureRepeat = [1, 1] }) => (
    <RoundedBox args={args} radius={0.05} smoothness={4} position={position} castShadow receiveShadow>
        <TextureMaterial texture={texture} color={SHELF_COLOR} repeat={textureRepeat} roughness={0.8} metalness={0.1} />
    </RoundedBox>
);

const Decoration: React.FC<DecorationProps> = ({ position, color, type = 'sphere' }) => {
    const ref = useRef<THREE.Mesh>(null); // Main ref for single meshes
    // Note: If type='cube', it's a RoundedBox (which forwards ref to a mesh usually, or group).
    // The original code rotates the ref.

    useFrame((state) => {
        // We cast ref.current to THREE.Mesh because we know we want to rotate it
        if (ref.current && type === 'blob') {
            ref.current.rotation.y += 0.01;
            ref.current.rotation.z += 0.005;
        }
    })

    return (
        <group position={position}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.2}>
                {type === 'sphere' && (
                    <mesh ref={ref} castShadow receiveShadow>
                        <sphereGeometry args={[0.3, 32, 32]} />
                        <meshStandardMaterial color={color} roughness={0.2} metalness={0.1} />
                    </mesh>
                )}
                {type === 'cube' && (
                    <RoundedBox ref={ref as any} args={[0.5, 0.5, 0.5]} radius={0.1} smoothness={4} castShadow receiveShadow>
                        <meshStandardMaterial color={color} />
                    </RoundedBox>
                )}
                {type === 'blob' && (
                    <mesh ref={ref} castShadow receiveShadow>
                        <torusKnotGeometry args={[0.25, 0.1, 64, 8]} />
                        <meshStandardMaterial color={color} roughness={0.3} />
                    </mesh>
                )}
            </Float>
        </group>
    )
}


const CartoonHand: React.FC<CartoonHandProps> = ({ position, rotation, side = 'left' }) => {
    const handScale = 0.9;
    const isLeft = side === 'left';

    // Finger common geometry (thicker)
    const fingerGeo: [number, number, number, number] = [0.16, 0.5, 4, 16];
    const thumbGeo: [number, number, number, number] = [0.15, 0.45, 4, 16];

    return (
        <group position={position} rotation={rotation as any} scale={handScale}>
            {/* Glove Cuff Removed */}

            {/* Palm - Chubby */}
            <mesh position={[0, 0.25, 0]} scale={[1.1, 1, 0.8]}>
                <sphereGeometry args={[0.45, 32, 32]} />
                <meshStandardMaterial color="white" roughness={0.5} />
            </mesh>

            {/* Fingers - Fanned and slightly curled */}
            <group position={[0, 0.75, 0.1]} rotation={[0.2, 0, 0]}>
                {/* Finger 1 (Index-ish) */}
                <mesh position={[-0.3, -0.1, 0]} rotation={[0.1, 0, 0.35]}>
                    <capsuleGeometry args={fingerGeo} />
                    <meshStandardMaterial color="white" roughness={0.5} />
                </mesh>
                {/* Finger 2 (Middle) */}
                <mesh position={[0, 0.05, -0.05]} rotation={[0.05, 0, 0]}>
                    <capsuleGeometry args={[0.17, 0.55, 4, 16]} />
                    <meshStandardMaterial color="white" roughness={0.5} />
                </mesh>
                {/* Finger 3 (Ring/Pinky) */}
                <mesh position={[0.3, -0.1, 0]} rotation={[0.1, 0, -0.35]}>
                    <capsuleGeometry args={fingerGeo} />
                    <meshStandardMaterial color="white" roughness={0.5} />
                </mesh>
            </group>

            {/* Thumb - sticking out more naturally */}
            <mesh
                position={[isLeft ? 0.45 : -0.45, 0.1, 0.2]}
                rotation={[0.2, isLeft ? -0.5 : 0.5, isLeft ? -0.8 : 0.8]}
            >
                <capsuleGeometry args={thumbGeo} />
                <meshStandardMaterial color="white" roughness={0.5} />
            </mesh>

            {/* Glove details (black lines on back) */}
            <group position={[0, 0.35, -0.35]} rotation={[0.1, 0, 0]}>
                <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
                    <capsuleGeometry args={[0.025, 0.4, 4, 8]} />
                    <meshStandardMaterial color="black" />
                </mesh>
                <mesh position={[-0.18, -0.02, 0]} rotation={[0, 0, 0.2]}>
                    <capsuleGeometry args={[0.025, 0.35, 4, 8]} />
                    <meshStandardMaterial color="black" />
                </mesh>
                <mesh position={[0.18, -0.02, 0]} rotation={[0, 0, -0.2]}>
                    <capsuleGeometry args={[0.025, 0.35, 4, 8]} />
                    <meshStandardMaterial color="black" />
                </mesh>
            </group>
        </group>
    );
};

const CartoonArm: React.FC<CartoonArmProps> = ({ position, side = 'left' }) => {
    const curve = useMemo(() => {
        const isLeft = side === 'left';
        const startX = 0;

        const cp1X = isLeft ? -0.8 : 0.8;
        const cp2X = isLeft ? -1.0 : 1.0;
        const endX = isLeft ? -1.2 : 1.2;

        return new THREE.CatmullRomCurve3([
            new THREE.Vector3(startX, 0, 0),        // Shoulder (attached to shelf)
            new THREE.Vector3(cp1X, -0.8, 0.3),     // Elbow (Down and slightly out)
            new THREE.Vector3(cp2X, -1.6, 0.3),     // Forearm
            new THREE.Vector3(endX, -2.2, 0.5)      // Hand (Hanging lower but closer)
        ]);
    }, [side]);

    const tubeArgs: [THREE.CatmullRomCurve3, number, number, number, boolean] = [curve, 64, 0.14, 16, false];

    const handPos = curve.getPoint(1);
    const isLeft = side === 'left';

    const handRot: [number, number, number] = [
        0.2,                   // Tilt forward slightly
        isLeft ? -0.2 : 0.2,   // Turn slightly inward
        isLeft ? 0.2 : -0.2    // Dangle rotation
    ];

    return (
        <group position={position}>
            <mesh>
                <tubeGeometry args={tubeArgs} />
                <meshStandardMaterial color="black" roughness={0.3} />
            </mesh>
            <CartoonHand
                position={[handPos.x, handPos.y, handPos.z]}
                rotation={handRot}
                side={side}
            />
        </group>
    );
};

const CartoonShoe: React.FC<CartoonShoeProps> = ({ position, rotation, side = 'left' }) => {
    const shoeColor = '#FF4500'; // Orange-Red
    const scale = 0.9;

    return (
        <group position={position} rotation={rotation as any} scale={scale}>
            {/* Sole and Body Rotated Group */}
            <group rotation={[0.2, 0, 0]}> {/* Slight unified tilt */}

                {/* Sole - Flatter version of the body */}
                <mesh position={[0, -0.12, 0.1]} rotation={[1.57, 0, 0]} scale={[1.05, 1.05, 0.3]} castShadow receiveShadow>
                    <capsuleGeometry args={[0.32, 0.55, 4, 16]} />
                    <meshStandardMaterial color="white" roughness={0.5} />
                </mesh>

                {/* Main Body - Horizontal Capsule for smooth look */}
                <group position={[0, 0.2, 0]}>
                    <mesh position={[0, -0.1, 0.1]} rotation={[1.57, 0, 0]} castShadow receiveShadow>
                        <capsuleGeometry args={[0.32, 0.55, 4, 16]} />
                        <meshStandardMaterial color={shoeColor} roughness={0.3} />
                    </mesh>

                    {/* Ankle Rise */}
                    <mesh position={[0, 0.2, -0.1]} rotation={[-0.2, 0, 0]}>
                        <cylinderGeometry args={[0.2, 0.25, 0.4, 16]} />
                        <meshStandardMaterial color={shoeColor} roughness={0.3} />
                    </mesh>
                </group>
            </group>

            {/* Ankle Cuff Removed */}

            {/* Leg connector */}
            <mesh position={[0, 0.5, -0.1]}>
                <cylinderGeometry args={[0.13, 0.13, 0.3, 16]} />
                <meshStandardMaterial color="black" roughness={0.9} />
            </mesh>
        </group>
    );
};

const CartoonLeg: React.FC<CartoonLegProps> = ({ position, side = 'left' }) => {
    const isLeft = side === 'left';

    const curve = useMemo(() => {
        // Leg shape: Curve out slightly then go straight down into the boot
        const startX = 0;
        const bendX = isLeft ? -0.2 : 0.2; // Slight outward splay
        const endX = isLeft ? -0.25 : 0.25; // Ankle position (closer to vertical line from bend)

        return new THREE.CatmullRomCurve3([
            new THREE.Vector3(startX, 0, 0),        // Hip
            new THREE.Vector3(bendX, -0.5, 0),      // Knee
            new THREE.Vector3(endX, -1.0, 0.1)      // Ankle (Straight down relative to knee, slightly forward)
        ]);
    }, [side]);

    const tubeArgs: [THREE.CatmullRomCurve3, number, number, number, boolean] = [curve, 64, 0.13, 16, false];
    const anklePos = curve.getPoint(1);

    return (
        <group position={position}>
            <mesh>
                <tubeGeometry args={tubeArgs} />
                <meshStandardMaterial color="black" roughness={0.3} />
            </mesh>
            <CartoonShoe
                position={[anklePos.x, anklePos.y, anklePos.z]}
                rotation={[0, isLeft ? 0.2 : -0.2, isLeft ? -0.15 : 0.15]} // Slight tilt to match leg entry
                side={side}
            />
        </group>
    );
};

const CartoonEye: React.FC<CartoonEyeProps> = ({ position, rotation, side = 'left' }) => {
    const isLeft = side === 'left';
    const group = useRef<THREE.Group>(null);
    const pupilRef = useRef<THREE.Group>(null);

    // Tall oval shape
    const eyeScale: [number, number, number] = [0.8, 1.2, 0.5];

    useFrame((state) => {
        if (!pupilRef.current) return;

        const t = state.clock.getElapsedTime();
        // Change gaze every 2 seconds
        const phase = Math.floor(t / 2);
        // Deterministic pseudo-random value for synchronization
        const rand = Math.sin(phase * 43758.5453);

        let targetX = 0;
        let targetY = -0.05;

        // Base offsets
        const baseX = isLeft ? 0.08 : -0.08;

        if (rand > 0.3) {
            targetX = 0.05; // Right (Constrained)
        } else if (rand < -0.3) {
            targetX = -0.05; // Left (Constrained)
        } else {
            targetX = 0; // Center
        }

        // Blink logic
        const blinkPhase = Math.sin(t * 3 + Math.cos(t * 8));
        let scaleY = 0.45;
        if (blinkPhase > 0.96) {
            scaleY = 0.05; // Blink!
        }

        // Smoothly interpolate pupil position
        pupilRef.current.position.x = THREE.MathUtils.lerp(pupilRef.current.position.x, baseX + targetX, 0.15);
        pupilRef.current.position.y = THREE.MathUtils.lerp(pupilRef.current.position.y, targetY, 0.15);

        // Apply blink scale
        pupilRef.current.scale.y = THREE.MathUtils.lerp(pupilRef.current.scale.y, scaleY, 0.4);
    });

    return (
        <group ref={group} position={position} rotation={rotation as any}>
            {/* Black Outline/Backing */}
            <mesh position={[0, 0, -0.02]} scale={[eyeScale[0] * 1.1, eyeScale[1] * 1.1, eyeScale[2]]}>
                <sphereGeometry args={[0.3, 32, 32]} />
                <meshStandardMaterial color="black" roughness={0.8} />
            </mesh>

            {/* White Sclera */}
            <mesh position={[0, 0, 0]} scale={eyeScale}>
                <sphereGeometry args={[0.3, 32, 32]} />
                <meshStandardMaterial color="white" roughness={0.2} />
            </mesh>

            {/* Pupil Group */}
            <group ref={pupilRef} position={[isLeft ? 0.08 : -0.08, -0.05, 0.12]} scale={[0.35, 0.4, 0.2]}>
                <mesh>
                    <sphereGeometry args={[0.3, 32, 32]} />
                    <meshStandardMaterial color="black" roughness={0.1} />
                </mesh>
                {/* Highlight */}
                <mesh position={[0.1, 0.1, 0.25]} scale={[0.3, 0.3, 0.3]}>
                    <sphereGeometry args={[0.3, 16, 16]} />
                    <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
                </mesh>
            </group>
        </group>
    );
};

const Bookshelf: React.FC = () => {
    // Shelf dimensions
    const width = 4;
    const height = 6;
    const depth = 1.5;
    const thickness = 0.2;
    const shelfCount = 3; // Number of spaces (books sit in these spaces)

    const woodTexture = useTexture('/wood_color.png');

    // Calculate spacing
    const totalShelfThickness = (shelfCount + 1) * thickness;
    const availableSpace = height - totalShelfThickness;
    const gapHeight = availableSpace / shelfCount;

    // Generate books for each shelf
    const shelvesData: ShelfItem[][] = useMemo(() => {
        const data: ShelfItem[][] = [];
        for (let i = 0; i < shelfCount; i++) {
            const surfaceY = -height / 2 + thickness / 2 + i * (gapHeight + thickness);
            const items: ShelfItem[] = [];
            let currentX = -width / 2 + 0.5;

            while (currentX < width / 2 - 0.5) {
                const isBook = Math.random() > 0.2;

                if (isBook) {
                    // 20% chance of horizontal stack
                    const isHorizontal = Math.random() > 0.8;

                    if (isHorizontal) {
                        const bookHeight = 0.8 + Math.random() * 0.4; // This becomes the width on shelf
                        const bookWidth = 0.15 + Math.random() * 0.1; // Thickness (height in stack)

                        // Ensure stack fits in gap
                        const maxStackHeight = gapHeight - 0.1;
                        const numBooks = Math.floor(Math.random() * 3) + 2; // 2 to 4 books

                        // Check if we have space horizontally
                        if (currentX + bookHeight > width / 2 - 0.5) break;

                        // Check if stack height fits vertically
                        // We'll limit numBooks if it exceeds
                        let actualNumBooks = numBooks;
                        while (actualNumBooks * bookWidth > maxStackHeight && actualNumBooks > 1) {
                            actualNumBooks--;
                        }

                        for (let k = 0; k < actualNumBooks; k++) {
                            const color = BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)];
                            items.push({
                                type: 'book',
                                position: [currentX + bookHeight / 2, surfaceY + bookWidth / 2 + k * bookWidth, 0],
                                rotation: [0, 0, -Math.PI / 2],
                                args: [bookWidth, bookHeight, 0.8], // width is thickness, height is length
                                color
                            });
                        }
                        currentX += bookHeight + 0.05;

                    } else {
                        // Vertical book (existing logic)
                        const bookWidth = 0.15 + Math.random() * 0.2;
                        const bookHeight = 0.8 + Math.random() * 0.4;
                        const actualBookHeight = Math.min(bookHeight, gapHeight - 0.1);
                        const color = BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)];

                        if (currentX + bookWidth > width / 2 - 0.5) break;

                        items.push({
                            type: 'book',
                            position: [currentX + bookWidth / 2, surfaceY + actualBookHeight / 2, 0],
                            rotation: [0, 0, 0],
                            args: [bookWidth, actualBookHeight, 0.8],
                            color
                        });
                        currentX += bookWidth + 0.05;
                    }

                } else {
                    // Decoration or gap
                    const gap = 0.5 + Math.random() * 0.5;
                    if (currentX + gap > width / 2 - 0.5) break;

                    if (Math.random() > 0.5) {
                        items.push({
                            type: 'decoration',
                            position: [currentX + gap / 2, surfaceY + 0.3, 0],
                            color: BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)],
                            decorationType: (Math.random() > 0.6 ? 'blob' : (Math.random() > 0.5 ? 'cube' : 'sphere')) as 'blob' | 'cube' | 'sphere'
                        })
                    }
                    currentX += gap;
                }
            }
            data.push(items);
        }
        return data;
    }, []);

    // Texture Repeats
    // Adjust these values to change the density of the wood grain
    const sideWallRepeat: [number, number] = [1, 1]; // [x, y] - relatively tall
    const shelfRepeat: [number, number] = [1, 1]; // [x, y] - wider than deep
    const backboardRepeat: [number, number] = [1, 1]; // Big surface

    return (
        <group>
            {/* Eyes - Top of the shelf */}
            <CartoonEye side="left" position={[-0.4, height / 2 + 0.4, depth / 2]} rotation={[0, 0, -0.1]} />
            <CartoonEye side="right" position={[0.4, height / 2 + 0.4, depth / 2]} rotation={[0, 0, 0.1]} />

            {/* Arms */}
            <CartoonArm side="left" position={[-width / 2, 1, 0]} />
            <CartoonArm side="right" position={[width / 2, 1, 0]} />

            {/* Legs */}
            <CartoonLeg side="left" position={[-1, -height / 2, 0]} />
            <CartoonLeg side="right" position={[1, -height / 2, 0]} />

            {/* Frame */}
            {/* Left Wall */}
            <ShelfSegment
                position={[-width / 2, 0, 0]}
                args={[thickness, height, depth]}
                texture={woodTexture}
                textureRepeat={sideWallRepeat}
            />
            {/* Right Wall */}
            <ShelfSegment
                position={[width / 2, 0, 0]}
                args={[thickness, height, depth]}
                texture={woodTexture}
                textureRepeat={sideWallRepeat}
            />
            {/* Top */}
            <ShelfSegment
                position={[0, height / 2, 0]}
                args={[width + thickness, thickness, depth]}
                texture={woodTexture}
                textureRepeat={shelfRepeat}
            />
            {/* Bottom */}
            <ShelfSegment
                position={[0, -height / 2, 0]}
                args={[width + thickness, thickness, depth]}
                texture={woodTexture}
                textureRepeat={shelfRepeat}
            />

            {/* Backboard */}
            <RoundedBox position={[0, 0, -depth / 2 + 0.05]} args={[width, height, 0.1]} radius={0.05} smoothness={4}>
                <TextureMaterial texture={woodTexture} repeat={backboardRepeat} roughness={0.8} />
            </RoundedBox>

            {/* Shelves */}
            {Array.from({ length: shelfCount - 1 }).map((_, i) => {
                const shelfCenterY = -height / 2 + thickness / 2 + (i + 1) * gapHeight + i * thickness + thickness / 2;

                return (
                    <ShelfSegment
                        key={i}
                        position={[0, shelfCenterY, 0]}
                        args={[width, thickness, depth]}
                        texture={woodTexture}
                        textureRepeat={shelfRepeat}
                    />
                );
            })}

            {/* Items */}
            {shelvesData.map((shelfItems, i) => (
                <group key={i}>
                    {shelfItems.map((item, j) => (
                        item.type === 'book' ? (
                            <Book key={j} position={item.position} rotation={item.rotation} args={item.args} color={item.color} />
                        ) : (
                            <Decoration key={j} position={item.position} color={item.color} type={item.decorationType} />
                        )
                    ))}
                </group>
            ))}
        </group>
    );
};

// Scene content component - can be used inside another Canvas
interface BookshelfSceneContentProps {
    showControls?: boolean;
    showShadows?: boolean;
}

export const BookshelfModel = Bookshelf;

export const BookshelfEnvironment: React.FC<{ showShadows?: boolean }> = ({ showShadows = true }) => (
    <>
        <ambientLight intensity={0.15} />
        <directionalLight
            position={[5, 10, 5]}
            intensity={0.5}
            castShadow={showShadows}
            shadow-mapSize={[1024, 1024] as any}
        />
        <Environment preset="city" />
        <EffectComposer>
            <N8AO aoRadius={1} intensity={1} />
            <Bloom luminanceThreshold={1.5} mipmapBlur intensity={0.05} />
        </EffectComposer>
    </>
);

export const BookshelfSceneContent: React.FC<BookshelfSceneContentProps> = ({
    showControls = false,
    showShadows = true
}) => {
    return (
        <>
            <BookshelfEnvironment showShadows={showShadows} />

            <Center>
                <group position={[4.0, 0, 0]} rotation={[0, -0.3, 0]}>
                    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
                        <Bookshelf />
                    </Float>
                </group>
            </Center>

            {showControls && (
                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
            )}
        </>
    );
};

// Standalone component with Canvas wrapper - for backward compatibility
const BookshelfScene: React.FC = () => {
    return (
        <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
            <Canvas shadows camera={{ position: [0, 2, 8], fov: 45 }}>
                <BookshelfSceneContent showControls={true} showShadows={true} />
            </Canvas>
        </div>
    );
};

export default BookshelfScene;