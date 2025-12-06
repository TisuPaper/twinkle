import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { Canvas } from "@react-three/fiber";
import HelloKitty3D from "../../components/room/HelloKitty3D";

export default function Room() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize Pixi Application
        // We use a ref to track the app instance for cleanup
        const app = new PIXI.Application();
        let isMounted = true;
        let resizeListener: (() => void) | null = null;

        const initApp = async () => {
            try {
                // Wait for init
                await app.init({
                    resizeTo: window,
                    backgroundColor: 0xffffff,
                });

                // If unmounted during init, destroy and return
                if (!isMounted) {
                    app.destroy(true, { children: true, texture: true });
                    return;
                }

                // Append canvas
                if (containerRef.current) {
                    containerRef.current.appendChild(app.canvas);
                }

                // Load textures - Use absolute paths for Next.js public folder
                // Use the new background without the blade and curtain
                const bgTexture = await PIXI.Assets.load("/room/tiny_room.png");
                if (!isMounted) return; // Check again after await

                // Log image dimensions for reference
                console.log(`Image dimensions: ${bgTexture.width}x${bgTexture.height}`);

                const bg = new PIXI.Sprite(bgTexture);
                bg.anchor.set(0.5);
                app.stage.addChild(bg);

                // Fan Blade
                let fanBlade: PIXI.Sprite | null = null;
                try {
                    const fanTexture = await PIXI.Assets.load("/room/blade_blade.png?v=" + Date.now());
                    if (isMounted) {
                        fanBlade = new PIXI.Sprite(fanTexture);
                        fanBlade.anchor.set(0.5); // Center anchor for rotation
                        fanBlade.tint = 0xE6D2B5; // Warm beige tint to harmonize with background
                        app.stage.addChild(fanBlade);
                    }
                } catch (e) {
                    console.warn("Could not load blade_blade.png");
                }

                // Bed (SVG) - Commented out as file is missing
                // let bed: PIXI.Sprite | null = null;
                // try {
                //     const bedTexture = await PIXI.Assets.load("/room/bed.svg");
                //     if (isMounted) {
                //         bed = new PIXI.Sprite(bedTexture);
                //         bed.anchor.set(0.5, 1); // Bottom center anchor
                //         app.stage.addChild(bed);
                //     }
                // } catch (e) {
                //     console.warn("Could not load bed.svg");
                // }

                // Plant - Commented out as file is missing
                // let plant: PIXI.Sprite | null = null;
                // try {
                //     const plantTexture = await PIXI.Assets.load("/left_plant.png");
                //     if (isMounted) {
                //         plant = new PIXI.Sprite(plantTexture);
                //         plant.anchor.set(0.5, 1);
                //         app.stage.addChild(plant);
                //     }
                // } catch (e) {
                //     // console.warn("Could not load left_plant.png");
                // }

                // Left Curtain
                let leftCurtain: PIXI.Mesh | null = null;
                try {
                    const curtainTexture = await PIXI.Assets.load("/room/lleft_curtain.png");
                    if (isMounted) {
                        // Create geometry: 10x10 segments
                        // Pixi v8 PlaneGeometry might take options or args. 
                        // Trying options object which is common in v8.
                        const geometry = new PIXI.PlaneGeometry({
                            width: curtainTexture.width,
                            height: curtainTexture.height,
                            verticesX: 10,
                            verticesY: 10
                        });

                        // Create mesh
                        leftCurtain = new PIXI.Mesh({
                            geometry: geometry,
                            texture: curtainTexture
                        });

                        app.stage.addChild(leftCurtain);
                    }
                } catch (e) {
                    console.warn("Could not load left curtain.png", e);
                }

                // Right Curtain
                let rightCurtain: PIXI.Mesh | null = null;
                try {
                    const rightCurtainTexture = await PIXI.Assets.load("/room/rright_curtain.png");
                    if (isMounted) {
                        const geometry = new PIXI.PlaneGeometry({
                            width: rightCurtainTexture.width,
                            height: rightCurtainTexture.height,
                            verticesX: 10,
                            verticesY: 10
                        });

                        rightCurtain = new PIXI.Mesh({
                            geometry: geometry,
                            texture: rightCurtainTexture
                        });

                        app.stage.addChild(rightCurtain);
                    }
                } catch (e) {
                    console.warn("Could not load right_curtain.png", e);
                }

                // Right Curtain - REMOVED
                // let rightCurtain: PIXI.Sprite | null = null;
                // try {
                //     const rightCurtainTexture = await PIXI.Assets.load("/room/right_curtain.png");
                //     if (isMounted) {
                //         rightCurtain = new PIXI.Sprite(rightCurtainTexture);
                //         // Anchor at top center for hanging
                //         rightCurtain.anchor.set(0.5, 0);
                //         app.stage.addChild(rightCurtain);
                //     }
                // } catch (e) {
                //     console.warn("Could not load right_curtain.png");
                // }




                // Resize Logic
                const resize = () => {
                    if (!isMounted) return;
                    const screenWidth = app.screen.width;
                    const screenHeight = app.screen.height;

                    console.log(`Screen dimensions: ${screenWidth}x${screenHeight}`);
                    console.log(`Image dimensions: ${bgTexture.width}x${bgTexture.height}`);



                    // 1. Background Cover (fill entire screen, may crop edges)
                    const bgRatio = bgTexture.width / bgTexture.height;
                    const screenRatio = screenWidth / screenHeight;

                    let bgScale = 1;

                    if (screenRatio > bgRatio) {
                        // Screen is wider than image - fit to width (image will fill width, may crop top/bottom)
                        bg.width = screenWidth;
                        bg.height = screenWidth / bgRatio;
                        bgScale = screenWidth / bgTexture.width;
                    } else {
                        // Screen is taller than image - fit to height (image will fill height, may crop left/right)
                        bg.height = screenHeight;
                        bg.width = screenHeight * bgRatio;
                        bgScale = screenHeight / bgTexture.height;
                    }
                    bg.x = screenWidth / 2;
                    bg.y = screenHeight / 2;

                    const scale = screenHeight / 1000;

                    if (fanBlade) {
                        // Position relative to the background image
                        // These coordinates need to be adjusted based on where the fan is in the original image
                        // Assuming the fan is on the right side.
                        // We need to calculate the position relative to the center of the background
                        // Let's guess: x is roughly 35% to the right of center, y is roughly 10% up from center?
                        // Or we can use pixel coordinates if we knew them.
                        // Let's try a relative position first.

                        // The fan is likely at a fixed position on the background image.
                        // If we knew the pixel coordinates on the 1920x1080 image, we could scale them.
                        // Let's assume the fan center is at (1500, 600) on a 1920x1080 image for now.
                        // We need to adjust this based on visual feedback.

                        // Calculate offset from center of image
                        const originalWidth = bgTexture.width;
                        const originalHeight = bgTexture.height;

                        // Guessing coordinates: Fan is on the right.
                        // Positioned upper and more to the right.
                        const targetX = originalWidth * 0.839; // Moved left slightly (was 0.841)
                        const targetY = originalHeight * 0.440; // Moved up another tiny bit (was 0.445)

                        const offsetX = (targetX - originalWidth / 2) * bgScale;
                        const offsetY = (targetY - originalHeight / 2) * bgScale;

                        fanBlade.x = bg.x + offsetX;
                        fanBlade.y = bg.y + offsetY;

                        // Scale the fan blade with the background
                        fanBlade.scale.set(bgScale * 0.18); // Reverted size to 0.15
                    }

                    // if (bed) {
                    //     // Position bed in the lower left area of the room
                    //     const originalWidth = bgTexture.width;
                    //     const originalHeight = bgTexture.height;

                    //     // Position bed at approximately 25% from left, 85% from top
                    //     const targetX = originalWidth * 0.25;
                    //     const targetY = originalHeight * 0.85;

                    //     const offsetX = (targetX - originalWidth / 2) * bgScale;
                    //     const offsetY = (targetY - originalHeight / 2) * bgScale;

                    //     bed.x = bg.x + offsetX;
                    //     bed.y = bg.y + offsetY;

                    //     // Scale the bed with the background
                    //     bed.scale.set(bgScale * 0.4);
                    // }

                    // if (plant) {
                    //     plant.x = screenWidth * 0.1;
                    //     plant.y = screenHeight;
                    //     (plant as any).baseScale = Math.max(0.5, Math.min(scale, 1.2));
                    //     plant.scale.set((plant as any).baseScale);
                    // }

                    // Left Curtain Positioning
                    if (leftCurtain) {
                        // Position relative to bg - attach to left side of window
                        const originalWidth = bgTexture.width;
                        const originalHeight = bgTexture.height;

                        // Position at left side of window (window is on the left side of room)
                        // Adjust these coordinates based on the new image and room
                        // Moving to approximately 32% width to hit the left side of the window
                        const targetX = originalWidth * 0.40;
                        const targetY = originalHeight * 0.05; // Moved up (was 0.08)

                        const offsetX = (targetX - originalWidth / 2) * bgScale;
                        const offsetY = (targetY - originalHeight / 2) * bgScale;

                        // SimplePlane doesn't have anchor, so x/y is top-left by default.
                        // We want the 'center-top' of the curtain to be at our target point.
                        // So we shift x by half width.

                        // Dimensions of the curtain
                        const curW = leftCurtain.width;
                        // Note: width/height might be influenced by scaling.

                        // Temporarily set scale to 1 to get true dims (though it should be unscaled initially)
                        // Applying desired scale first
                        const curScale = bgScale * 0.35;
                        leftCurtain.scale.set(curScale);
                        (leftCurtain as any).baseScale = curScale;

                        // Because it's top-left origin:
                        // x should be (bg.x + offsetX) - (curtainWidth * scale / 2)
                        // y should be (bg.y + offsetY)

                        // Wait, bg.x/y is center of screen. offsetX/Y is displacement from center.
                        // So (bg.x + offsetX) is the absolute screen coordinate of the target point.
                        // That target point is where the "hook" is.
                        // The curtain should hang FROM there.
                        // So we want the curtain's top-center to be at that point.

                        leftCurtain.x = (bg.x + offsetX) - (leftCurtain.width / 2); // Center horizontally
                        leftCurtain.y = (bg.y + offsetY); // Top aligned

                        // Store original buffer for restoration/calculation
                        if (!(leftCurtain as any).originalBuffer) {
                            // Clone the buffer data
                            // Mesh geometry attribute is 'aPosition' usually
                            const buffer = leftCurtain.geometry.getAttribute('aPosition').buffer;
                            (leftCurtain as any).originalBuffer = Float32Array.from(buffer.data as Float32Array);
                        }
                    }

                    // Right Curtain Positioning
                    if (rightCurtain) {
                        const originalWidth = bgTexture.width;
                        const originalHeight = bgTexture.height;

                        // Position at right side of window
                        // Assuming window width is roughly 0.2 of screen? 
                        // Left is at 0.40. Let's try 0.60 for Right.
                        const targetX = originalWidth * 0.70; // Moved left slightly (was 0.72)
                        const targetY = originalHeight * 0.02; // Moved up more (was 0.05)

                        const offsetX = (targetX - originalWidth / 2) * bgScale;
                        const offsetY = (targetY - originalHeight / 2) * bgScale;

                        const curScale = bgScale * 0.35; // Minimized/Baseline scale (was 0.50)
                        rightCurtain.scale.set(curScale);
                        (rightCurtain as any).baseScale = curScale;

                        // Center horizontally on target point
                        rightCurtain.x = (bg.x + offsetX) - (rightCurtain.width / 2);
                        rightCurtain.y = (bg.y + offsetY);

                        // Store original buffer
                        if (!(rightCurtain as any).originalBuffer) {
                            const buffer = rightCurtain.geometry.getAttribute('aPosition').buffer;
                            (rightCurtain as any).originalBuffer = Float32Array.from(buffer.data as Float32Array);
                        }
                    }

                    // Right Curtain Positioning - REMOVED
                    // if (rightCurtain) {
                    //     // Position relative to bg - attach to right side of window
                    //     const originalWidth = bgTexture.width;
                    //     const originalHeight = bgTexture.height;

                    //     // Position at right side of window
                    //     const targetX = originalWidth * 0.20; // Right edge of window
                    //     const targetY = originalHeight * 0.15; // Same height as left curtain

                    //     const offsetX = (targetX - originalWidth / 2) * bgScale;
                    //     const offsetY = (targetY - originalHeight / 2) * bgScale;

                    //     rightCurtain.x = bg.x + offsetX;
                    //     rightCurtain.y = bg.y + offsetY;

                    //     // Scale to match window proportions and left curtain
                    //     const curScale = bgScale * 0.35;
                    //     rightCurtain.scale.set(curScale);
                    //     (rightCurtain as any).baseScale = curScale;
                    // }




                };

                resize();
                resizeListener = resize;
                window.addEventListener('resize', resize);

                let count = 0;

                app.ticker.add((ticker) => {
                    if (!isMounted) return;
                    const t = ticker.lastTime / 600;

                    if (fanBlade) {
                        fanBlade.rotation += 0.15; // Clockwise rotation (slightly faster)
                    }

                    // if (plant) {
                    //     const baseScale = (plant as any).baseScale || 1;
                    //     plant.skew.x = Math.sin(t) * 0.12;
                    //     plant.scale.x = baseScale * (1 + Math.sin(t) * 0.02);
                    //     plant.scale.y = baseScale;
                    // }

                    // Left Curtain 3D Animation (Vertex Manipulation)
                    if (leftCurtain && (leftCurtain as any).originalBuffer) {
                        const buffer = leftCurtain.geometry.getAttribute('aPosition').buffer;
                        const original = (leftCurtain as any).originalBuffer;
                        const data = buffer.data as Float32Array;

                        // Texture height for normalization
                        const texHeight = leftCurtain.texture.height;

                        for (let i = 0; i < data.length; i += 2) {
                            const x = original[i];
                            const y = original[i + 1];

                            // Normalize Y (0 to height approx) to know how far down we are
                            // We can guess height from the texture or max Y found, but simpler:
                            // The lower the point, the more it moves.
                            // However, we don't have easy normalized UVs here without calculation.
                            // But we can just use y value itself.

                            // Wave effect
                            // x deviation based on time and y-position

                            // Create a "wind" wave moving downwards or sideways
                            // Wind direction: Right to Left.
                            // So we want waves propagating from right to left? 
                            // Or just ripples.

                            // Factor: how far down is this vertex?
                            // Approx height ~ scale * textureHeight (but we are in local space of unscaled plane usually)
                            // SimplePlane local space is 0 to textureWidth/Height.

                            const heightFactor = y / texHeight;
                            // Dampen movement at the top (top is attached)
                            // Power of 2 or 3 makes the top very stiff.
                            const intensity = Math.pow(heightFactor, 2);

                            // Sine wave combination
                            // Main wave + secondary ripples
                            const wave = Math.sin(x * 0.02 + t * 4) * 10 +
                                Math.cos(y * 0.05 + t * 3) * 10;

                            // Apply offset to X
                            data[i] = x + wave * intensity;

                            // Optional: Slight Z-like effect by compressing Y? (Cloth bunching up)
                            // data[i+1] = y + Math.cos(x * 0.1 + t) * 2 * intensity;
                        }

                        buffer.update();
                    }

                    // Right Curtain 3D Animation
                    if (rightCurtain && (rightCurtain as any).originalBuffer) {
                        const buffer = rightCurtain.geometry.getAttribute('aPosition').buffer;
                        const original = (rightCurtain as any).originalBuffer;
                        const data = buffer.data as Float32Array;

                        const texHeight = rightCurtain.texture.height;

                        for (let i = 0; i < data.length; i += 2) {
                            const x = original[i];
                            const y = original[i + 1];

                            const heightFactor = y / texHeight;
                            const intensity = Math.pow(heightFactor, 2);

                            // Add phase offset (+ 2.0) to make it look distinct from left curtain
                            const wave = Math.sin(x * 0.02 + t * 4 + 2.0) * 10 +
                                Math.cos(y * 0.05 + t * 3 + 1.0) * 10;

                            // Left curtain moves significantly, maybe match direction?
                            // This wave logic moves vertices in X.
                            // If wind blows Right to Left, both should ripple similarly.
                            data[i] = x + wave * intensity;
                        }

                        buffer.update();
                    }

                    // Right Curtain Animation - REMOVED
                    // if (rightCurtain) {
                    //     // Wind blowing from right to left (same direction as left curtain)
                    //     // Basic sway with slight phase difference for natural look
                    //     // const sway = Math.sin(t * 1.5 + 0.5) * 0.1;
                    //     // Bias towards left (negative skew) + sway
                    //     // rightCurtain.skew.x = -0.2 + sway;
                    //     // Slight scale pulsation to simulate cloth movement
                    //     // const baseScale = (rightCurtain as any).baseScale || 1;
                    //     // rightCurtain.scale.x = baseScale * (1 + Math.sin(t * 2 + 0.5) * 0.02);
                    // }


                });
            } catch (error) {
                console.error("Error initializing Pixi:", error);
                // Show error message on screen for debugging
                if (containerRef.current && isMounted) {
                    containerRef.current.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; color: red; font-family: Arial;">
                            <div>
                                <h2>Error loading room image</h2>
                                <p>${error instanceof Error ? error.message : String(error)}</p>
                                <p>Please check the console for more details.</p>
                            </div>
                        </div>
                    `;
                }
            }
        };

        initApp();

        return () => {
            isMounted = false;
            if (resizeListener) {
                window.removeEventListener('resize', resizeListener);
            }
            // Only destroy if initialized (or try/catch)
            // Note: If init is still pending, the 'if (!isMounted)' check inside initApp will handle destruction.
            // If init is done, we destroy here.
            // However, we can't easily know if init is done without another flag.
            // But app.destroy() is safe to call if app is valid.
            // The issue is calling destroy() while init() is running.
            // We'll rely on the fact that if init is running, we set isMounted=false, and init will destroy it.
            // But if it finished BEFORE unmount, we destroy here.

            // To do this correctly:
            // We can't easily know the state of the promise.
            // But we can check if app.stage exists or something.

            // Actually, if we just let the async function handle it, we might leak if we don't destroy here when it IS ready.
            // So we need to destroy here IF it's ready.

            try {
                // If app.renderer exists, it's likely initialized or initializing.
                if (app.renderer) {
                    app.destroy(true, { children: true, texture: true });
                }
            } catch (e) {
                // console.warn("Error destroying Pixi app:", e);
            }
        };
    }, []);

    return (
        <div className="relative w-full h-full">
            {/* Pixi Container */}
            <div ref={containerRef} className="fixed inset-0 w-full h-full bg-white" />

            {/* 3D Overlay */}
            <div className="fixed inset-0 pointer-events-none z-10">
                <Canvas camera={{ position: [0, 0, 5], fov: 50 }} gl={{ alpha: true }} style={{ background: 'transparent' }}>
                    <ambientLight intensity={0.5} />
                    <HelloKitty3D />
                </Canvas>
            </div>
        </div>
    );
}


