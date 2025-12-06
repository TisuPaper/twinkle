"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Canvas, useFrame } from "@react-three/fiber";
import { useFBX, useAnimations, Environment } from "@react-three/drei";
import * as THREE from "three";

function ChatBoxModel() {
    const group = useRef<THREE.Group>(null);
    const fbx = useFBX('/hellokitty/helloModel/chatboxwave.fbx');
    const { actions } = useAnimations(fbx.animations, group);

    useEffect(() => {
        if (actions) {
            const actionName = Object.keys(actions)[0];
            const action = actions[actionName];
            if (action) {
                action.reset().fadeIn(0.5).play();
            }
        }
    }, [actions]);

    return (
        <group ref={group} dispose={null} scale={0.02} position={[0, -2, 0]}>
            <primitive object={fbx} />
        </group>
    );
}

interface ChatBoxProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: (prompt: string) => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ isOpen, onClose, onSubmit }) => {
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const [rotationX, setRotationX] = useState(0);
    const [rotationY, setRotationY] = useState(0);
    const chatBoxRef = useRef<HTMLDivElement>(null);
    const targetRotationX = useRef(0);
    const targetRotationY = useRef(0);
    const lastMouseX = useRef(0);
    const lastMouseY = useRef(0);
    const isMouseDown = useRef(false);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Smooth rotation interpolation (lerp)
    const lerp = (start: number, end: number, factor: number): number => {
        return start + (end - start) * factor;
    };

    // Animation loop for smooth rotation
    useEffect(() => {
        if (!isOpen) return;

        const animate = () => {
            setRotationX((prev) => {
                const newX = lerp(prev, targetRotationX.current, 0.1);
                return newX;
            });
            setRotationY((prev) => {
                const newY = lerp(prev, targetRotationY.current, 0.1);
                return newY;
            });
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isOpen]);

    // Mouse-controlled rotation
    useEffect(() => {
        if (!isOpen) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!isMouseDown.current) return;

            const deltaX = e.clientX - lastMouseX.current;
            const deltaY = e.clientY - lastMouseY.current;

            // Map horizontal movement to Y-axis rotation (right = rotate right, left = rotate left)
            // Map vertical movement to X-axis rotation (down = rotate down, up = rotate up)
            const rotationSpeed = 0.5; // Adjust sensitivity
            targetRotationY.current += deltaX * rotationSpeed;
            targetRotationX.current -= deltaY * rotationSpeed; // Negative for natural up/down

            // Normalize to keep values manageable (but allow full 360°)
            targetRotationX.current = targetRotationX.current % 360;
            targetRotationY.current = targetRotationY.current % 360;

            lastMouseX.current = e.clientX;
            lastMouseY.current = e.clientY;
        };

        const handleMouseDown = (e: MouseEvent) => {
            isMouseDown.current = true;
            lastMouseX.current = e.clientX;
            lastMouseY.current = e.clientY;
        };

        const handleMouseUp = () => {
            isMouseDown.current = false;
        };

        const handleMouseLeave = () => {
            isMouseDown.current = false;
        };

        const chatBox = chatBoxRef.current;
        if (chatBox) {
            chatBox.addEventListener('mousemove', handleMouseMove);
            chatBox.addEventListener('mousedown', handleMouseDown);
            window.addEventListener('mouseup', handleMouseUp);
            chatBox.addEventListener('mouseleave', handleMouseLeave);
        }

        return () => {
            if (chatBox) {
                chatBox.removeEventListener('mousemove', handleMouseMove);
                chatBox.removeEventListener('mousedown', handleMouseDown);
                chatBox.removeEventListener('mouseleave', handleMouseLeave);
            }
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isOpen]);

    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        setInputValue("");

        // Add user message immediately
        const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            // Prepare messages array for the backend
            // Note: In a real app, you might want to filter or format these strictly
            const messagesPayload = [...newMessages, { role: 'user', content: userMessage }];

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: messagesPayload }),
            });

            if (!response.ok) throw new Error('Failed to fetch response');

            const data = await response.json();
            // The backend returns the message object directly: { role: 'assistant', content: '...' }
            const replyContent = data.content || data.reply || "I didn't catch that.";

            setMessages([...newMessages, { role: 'assistant', content: replyContent }]);
        } catch (error) {
            console.error(error);
            setMessages([...newMessages, { role: 'assistant', content: "Sorry, something went wrong." }]);
        } finally {
            setIsLoading(false);
        }

        if (onSubmit) {
            onSubmit(userMessage);
        }
    };

    return (
        <>
            {/* Backdrop Overlay */}
            <div
                className={`
          fixed inset-0 z-[90] 
          bg-[#5D4037]/10 backdrop-blur-sm
          transition-all duration-500 ease-in-out
          ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
                onClick={onClose}
            />

            {/* Main Container */}
            <div
                className={`
          fixed top-[58%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] ml-4
          transition-all duration-200 ease-out
          ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"}
        `}
            >
                {/*  Kitty Image - High Above ChatBox */}
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 z-50 animate-float">
                    <div className="relative group cursor-pointer">
                        {/* Bottom Spotlight Effect - Illuminating from below */}
                        <div
                            className="absolute left-1/2 -translate-x-1/2 top-full -translate-y-1/3 w-80 h-64 rounded-full opacity-75 blur-2xl pointer-events-none"
                            style={{
                                background: 'radial-gradient(ellipse at center top, rgba(255, 255, 255, 0.9) 0%, rgba(255, 245, 230, 0.7) 25%, rgba(255, 230, 200, 0.5) 45%, transparent 70%)',
                                transform: 'translate(-50%, -33%)',
                            }}
                        />

                        {/* Spotlight Effect - Subtle */}
                        <div
                            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-1/2 w-80 h-80 rounded-full opacity-40 blur-3xl pointer-events-none animate-glow"
                            style={{
                                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, rgba(255, 230, 200, 0.4) 30%, rgba(255, 200, 150, 0.3) 50%, transparent 70%)',
                                transform: 'translate(-50%, -50%)',
                            }}
                        />

                        {/* Animated Shadow */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-24 h-8 bg-black/30 rounded-full blur-xl animate-shadow-bounce"></div>

                        <div className="w-[200px] h-[200px] relative z-10">
                            <Canvas camera={{ position: [0, 2, 5], fov: 45 }}>
                                <ambientLight intensity={1.5} />
                                <directionalLight position={[5, 5, 5]} intensity={1} />
                                <Environment preset="city" />
                                <ChatBoxModel />
                            </Canvas>
                        </div>
                    </div>
                </div>

                {/* Enhanced 3D Low Poly Card */}
                <div
                    ref={chatBoxRef}
                    className={`
            w-[600px] max-w-[calc(100vw-2rem)]
            rounded-[2.5rem]
            flex flex-col overflow-hidden
            relative
            transition-all duration-500 ease-out
            checkerboard-pattern
            ${isOpen ? "h-[500px] opacity-100 translate-y-0" : "h-0 opacity-0 translate-y-10"}
          `}
                    style={{
                        fontFamily: 'var(--font-nunito)',
                        boxShadow: `
              0 1px 2px rgba(121, 85, 72, 0.1),
              0 4px 8px rgba(121, 85, 72, 0.12),
              0 8px 16px rgba(121, 85, 72, 0.14),
              
              /* Enhanced Upper Depth (Inner Highlights/Shadows) */
              inset 0 4px 2px rgba(255, 255, 255, 0.9), /* Strong top highlight */
              inset 0 -2px 4px rgba(121, 85, 72, 0.15), /* Lighter woody bottom inner shadow */
              inset 3px 0 4px rgba(255, 255, 255, 0.6), /* Left inner highlight */
              inset -3px 0 4px rgba(121, 85, 72, 0.1), /* Lighter woody right inner shadow */
              
              /* Side and Bottom Thickness (Diagonal Stack) - LIGHTER WOODY COLORS */
              1px 2px 0 0px rgba(161, 136, 127, 1),
              2px 4px 0 0px rgba(155, 130, 120, 1),
              3px 6px 0 0px rgba(150, 125, 115, 1),
              4px 8px 0 0px rgba(145, 120, 110, 1),
              5px 10px 0 0px rgba(140, 115, 105, 1),
              6px 12px 0 0px rgba(135, 110, 100, 1),
              7px 14px 0 0px rgba(130, 105, 95, 1),
              8px 16px 0 0px rgba(125, 100, 90, 1),
              9px 18px 0 0px rgba(120, 95, 85, 1),
              10px 20px 0 0px rgba(115, 90, 80, 1),
              11px 22px 0 0px rgba(110, 85, 75, 1),
              12px 24px 0 0px rgba(105, 80, 70, 1),
              
              /* Deep Drop Shadow */
              20px 50px 70px -10px rgba(93, 64, 55, 0.5)
            `,
                        border: '3px solid rgba(62, 39, 35, 0.8)',
                        transform: isOpen
                            ? `perspective(1800px) rotateX(${rotationX}deg) rotateY(${rotationY}deg) translateZ(30px)`
                            : 'perspective(1800px) rotateX(25deg) translateZ(0px)',
                        cursor: isOpen ? 'grab' : 'default',
                        transformStyle: 'preserve-3d',
                        position: 'relative',
                    }}
                >
                    {/* Faceted shine overlay - Reduced intensity for even tone */}
                    <div
                        className="absolute inset-0 pointer-events-none z-[1]"
                        style={{
                            background: `
                linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.1) 30%, transparent 35%, transparent 65%, rgba(255,255,255,0.1) 70%, transparent 75%),
                linear-gradient(60deg, transparent 0%, rgba(255,255,255,0.05) 45%, transparent 50%, transparent 85%, rgba(255,255,255,0.1) 90%, transparent 95%)
              `,
                            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                            mixBlendMode: 'overlay'
                        }}
                    />

                    {/* Geometric facet patterns - Subtle Square Checkerboard */}
                    <div
                        className="absolute inset-0 pointer-events-none z-[1] opacity-15"
                        style={{
                            background: `
                repeating-conic-gradient(#F2E6DC 0% 25%, #F9F2ED 0% 50%) 50% / 60px 60px,
                repeating-conic-gradient(#EBE0D5 0% 25%, #F5EDE5 0% 50%) 50% / 60px 60px
              `,
                            backgroundPosition: '0px 0px, 30px 30px',
                            filter: 'blur(0.5px)'
                        }}
                    />

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 z-20 p-2 rounded-full 
              text-[#8D6E63]/60 hover:text-[#5D4037] hover:bg-[#8D6E63]/10 
              transition-all duration-300 group"
                    >
                        <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Content */}
                    <div className="flex-1 pt-16 pb-4 px-8 flex flex-col relative z-10 overflow-hidden">

                        {/* Chat History Area */}
                        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 scrollbar-hide">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-60">
                                    <h3 className="text-3xl text-[#4E342E]" style={{ fontFamily: 'var(--font-bungee)' }}>
                                        Chat with me!
                                    </h3>
                                    <p className="text-[#8D6E63]">I'm ready to learn with you.</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`
                                                max-w-[80%] p-3 rounded-2xl text-sm
                                                ${msg.role === 'user'
                                                    ? 'bg-[#8D6E63] text-white rounded-tr-none'
                                                    : 'bg-white/80 text-[#4E342E] rounded-tl-none border border-[#EFEBE9]'}
                                            `}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            )}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/50 p-3 rounded-2xl rounded-tl-none text-sm text-[#8D6E63] animate-pulse">
                                        Thinking...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Form */}
                        <form
                            onSubmit={handleSubmit}
                            className="w-full relative group mt-auto"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#D7CCC8] to-[#EFEBE9] rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition-opacity duration-300" />

                            <div className="relative flex items-center bg-white rounded-[2rem] shadow-sm border border-[#EFEBE9]/50 p-1.5 transition-all duration-300 focus-within:shadow-[0_8px_30px_rgba(93,64,55,0.08)] focus-within:border-[#D7CCC8]/50 focus-within:scale-[1.02]">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Type your question..."
                                    className="
                    flex-1 px-5 py-3
                    bg-transparent
                    text-[#4E342E] placeholder-[#BCAAA4]
                    focus:outline-none text-[15px] font-medium
                    placeholder:font-normal
                  "
                                />
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim()}
                                    className="
                    flex items-center justify-center
                    rounded-full overflow-hidden w-12 h-12 flex-shrink-0
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:scale-105 active:scale-95
                    transition-all duration-300 ease-out
                  "
                                >
                                    <Image
                                        src="/chatbox/button.png"
                                        alt="Send"
                                        width={48}
                                        height={48}
                                        className="drop-shadow-lg rounded-full brightness-75 contrast-150 saturate-125"
                                        style={{
                                            objectFit: "contain",
                                        }}
                                    />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div >
        </>
    );
};

export default ChatBox;