import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import Book from './Book';
import Shelf from './Shelf';

interface BookshelfSceneProps {
    onBookOpen: () => void;
}

export default function BookshelfScene({ onBookOpen }: BookshelfSceneProps) {
    const [openedBookId, setOpenedBookId] = useState<number | null>(null);

    const handleBookClick = (id: number) => {
        if (openedBookId === null) {
            setOpenedBookId(id);
            // Trigger the callback after animation starts/completes
            setTimeout(() => {
                onBookOpen();
            }, 1500); // Wait for animation
        }
    };

    // Books arrangement matching the reference image
    const books = [
        // Small blue book lying flat on the left
        { id: 1, color: '#3498DB', position: [-3.2, 0.3, 0], rotation: [0, 0, Math.PI / 2], title: " " },
        // Pink book leaning right
        { id: 2, color: '#E056FD', position: [-2.2, 1.0, 0], rotation: [0, 0, -0.25], title: " " },
        // Vertical books group
        { id: 3, color: '#2ECC71', position: [-1.5, 1.1, 0], rotation: [0, 0, 0], title: " " },
        { id: 4, color: '#3498DB', position: [-1.0, 1.1, 0], rotation: [0, 0, 0], title: " " },
        { id: 5, color: '#E056FD', position: [-0.5, 1.1, 0], rotation: [0, 0, 0], title: " " },
        { id: 6, color: '#3498DB', position: [0.0, 1.1, 0], rotation: [0, 0, 0], title: " " },
        { id: 7, color: '#2ECC71', position: [0.5, 1.1, 0], rotation: [0, 0, 0], title: " " },
        // Yellow/Orange books leaning left
        { id: 8, color: '#F1C40F', position: [1.3, 1.05, 0], rotation: [0, 0, 0.25], title: " " },
        { id: 9, color: '#F39C12', position: [1.8, 1.0, 0], rotation: [0, 0, 0.25], title: " " },
    ];

    return (
        <div className="w-full h-screen bg-[#A8D0E6]"> {/* Light blue background like reference */}
            <Canvas shadows camera={{ position: [0, 2, 8], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[5, 10, 5]}
                    intensity={1}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />
                <Environment preset="city" />

                <group position={[0, -1, 0]}>
                    <Shelf />
                    {books.map((book) => (
                        <Book
                            key={book.id}
                            position={book.position as [number, number, number]}
                            rotation={book.rotation as [number, number, number]}
                            color={book.color}
                            onClick={() => handleBookClick(book.id)}
                            isOpen={openedBookId === book.id}
                            delay={book.id * 0.05} // Stagger entrance if we wanted, but here just for fun
                            title={book.title}
                        />
                    ))}
                </group>

                <OrbitControls
                    enableZoom={false}
                    minPolarAngle={Math.PI / 4}
                    maxPolarAngle={Math.PI / 2}
                />
            </Canvas>
        </div>
    );
}
