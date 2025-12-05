import React, { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, extend, ThreeElement, useLoader } from "@react-three/fiber";
import { FontLoader, TextGeometry, MeshSurfaceSampler, TTFLoader, Font } from "three-stdlib";
import { shaderMaterial } from "@react-three/drei";

// --- 1. SHADER (Slide Up Entrance + Static) ---
const ParticleMaterial = shaderMaterial(
    {
        uTime: 0,
        uProgress: 0, // 0 = Start (Hidden/Low), 1 = End (Visible/Centered)
        uColor: new THREE.Color("#ffffff"),
    },
    // VERTEX SHADER
    `
    uniform float uTime;
    uniform float uProgress;
    varying float vAlpha;

    void main() {
      vec3 pos = position;

      // --- ENTRANCE ANIMATION ---
      // 1. Easing: Cubic ease-out for a smooth finish
      float ease = 1.0 - pow(1.0 - uProgress, 3.0);
      
      // 2. Slide Up: Start 1.5 units lower, move to 0
      float yOffset = (1.0 - ease) * -1.5; 
      pos.y += yOffset;

      // --- WAVE EFFECT REMOVED (Static) ---

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // 2. SIZE (Kept your setting)
      float size = 28.0; 
      gl_PointSize = size * (1.0 / -mvPosition.z);
      
      // 3. ALPHA (Fade In + Stable)
      // Fade in as it slides up
      float entryAlpha = smoothstep(0.0, 1.0, uProgress);
      
      // Subtle twinkle (Stable)
      float twinkle = sin(uTime * 2.5 + position.x * 4.0);
      float stableAlpha = 0.85 + 0.15 * twinkle;
      
      // Combine entry fade with stable alpha
      vAlpha = stableAlpha * entryAlpha; 
    }
  `,
    // FRAGMENT SHADER
    `
    uniform vec3 uColor;
    varying float vAlpha;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float r = length(coord);
      if (r > 0.5) discard;
      
      float glow = 1.0 - (r * 2.0);
      glow = pow(glow, 2.5); 

      // Simple solid color with glow
      gl_FragColor = vec4(uColor, glow * vAlpha); 
    }
  `
);

extend({ ParticleMaterial });

declare module "@react-three/fiber" {
    interface ThreeElements {
        particleMaterial: ThreeElement<typeof ParticleMaterial>;
    }
}

// --- 2. SINGLE GLYPH COMPONENT ---
interface GlyphProps {
    char: string;
    font: Font;
    size: number;
    density: number;
    position: [number, number, number];
    delay: number; // Add delay prop
    start: boolean; // ADDED: Synchronization prop
    exiting: boolean; // ADDED: Fade out
}

const ParticleGlyph: React.FC<GlyphProps> = ({ char, font, size, density, position, delay, start, exiting }) => {
    const { particlesGeo } = useMemo(() => {
        if (char === " ") return { particlesGeo: null };

        const tempGeo = new TextGeometry(char, {
            font: font,
            size: size,
            height: 0.2,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.01,
            bevelSize: 0.01,
        });

        const tempMesh = new THREE.Mesh(tempGeo, new THREE.MeshBasicMaterial());
        const sampler = new MeshSurfaceSampler(tempMesh).build();

        // DENSITY (Kept your setting: 0.5)
        const count = Math.max(100, Math.floor(density * 0.5));

        const positions = new Float32Array(count * 3);
        const tempPosition = new THREE.Vector3();

        for (let i = 0; i < count; i++) {
            sampler.sample(tempPosition);
            positions[i * 3] = tempPosition.x;
            positions[i * 3 + 1] = tempPosition.y;
            positions[i * 3 + 2] = tempPosition.z;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        return { particlesGeo: geo };
    }, [char, font, size, density]);

    const materialRef = useRef<any>(null);
    const [startTime, setStartTime] = useState<number | null>(null);

    useFrame((state, delta) => {
        if (!start) return; // Wait for start signal
        if (startTime === null) setStartTime(state.clock.elapsedTime);

        if (materialRef.current && startTime !== null) {
            materialRef.current.uTime += delta;

            // --- ANIMATION LOGIC ---
            // Only start progress after delay (relative to start time)
            const elapsed = state.clock.elapsedTime - startTime;

            if (exiting) {
                // Fade out logic: lerp BACK to 0
                materialRef.current.uProgress = THREE.MathUtils.lerp(
                    materialRef.current.uProgress,
                    0.0,
                    delta * 1.5
                );
            } else if (elapsed > delay) {
                // Smoothly lerp uProgress from 0 to 1
                // Speed factor: 1.5 (Adjust this number to make it faster/slower)
                materialRef.current.uProgress = THREE.MathUtils.lerp(
                    materialRef.current.uProgress,
                    1.0,
                    delta * 1.5
                );
            }
        }
    });

    if (!particlesGeo) return null;

    return (
        <group position={position}>
            <points geometry={particlesGeo}>
                <particleMaterial
                    ref={materialRef}
                    transparent={true}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </points>
        </group>
    );
};

// --- 3. MAIN COMPONENT ---
interface Props {
    text: string;
    size?: number;
    position: [number, number, number];
    density?: number;
    fontUrl?: string;
    letterSpacing?: number;
    delay?: number; // Add delay prop
    start: boolean; // ADDED: Synchronization prop
    exiting?: boolean; // ADDED: Fade out
}

const ParticleText: React.FC<Props> = ({
    text,
    size = 1,
    position,
    density = 1500,
    fontUrl = "/fonts/helvetiker_regular.typeface.json",
    letterSpacing = 0.05,
    delay = 0,
    start,
    exiting = false
}) => {
    const isTTF = fontUrl.endsWith('.ttf');
    const loader = isTTF ? THREE.FileLoader : FontLoader;
    // ... (rest of imports)

    // @ts-ignore
    const fontData = useLoader(loader, fontUrl, (loader) => {
        if (isTTF) (loader as THREE.FileLoader).setResponseType('arraybuffer');
    });

    const font = useMemo(() => {
        if (isTTF) {
            const ttfLoader = new TTFLoader();
            const fontJson = ttfLoader.parse(fontData as ArrayBuffer);
            return new FontLoader().parse(fontJson as any);
        }
        return fontData;
    }, [fontData, isTTF]) as Font;

    const letters = useMemo(() => {
        if (!font) return [];

        let currentX = 0;
        const spacing = size * letterSpacing;

        return text.split('').map((char, i) => {
            const charShape = font.generateShapes(char, size);
            let charWidth = size * 0.3;

            if (charShape && charShape.length > 0) {
                const geometry = new THREE.ShapeGeometry(charShape);
                geometry.computeBoundingBox();
                const box = geometry.boundingBox!;
                charWidth = box.max.x - box.min.x;
            }

            const posX = currentX;
            currentX += charWidth + spacing;

            return { char, posX, index: i };
        });
    }, [text, font, size, letterSpacing]);

    const totalWidth = letters.length > 0
        ? letters[letters.length - 1].posX + (size * 0.5)
        : 0;

    const offsetX = -totalWidth / 2;

    return (
        <group position={position}>
            <group position={[offsetX, 0, 0]}>
                {letters.map((item) => (
                    <ParticleGlyph
                        key={item.index}
                        char={item.char}
                        font={font}
                        size={size}
                        density={density}
                        position={[item.posX, 0, 0]}
                        delay={delay}
                        start={start}
                        exiting={exiting}
                    />
                ))}
            </group>
        </group>
    );
};

export default ParticleText;