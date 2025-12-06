'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
    const pathname = usePathname();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 px-6 py-3 flex items-center justify-between">
                    {/* Logo / Title */}
                    <Link href="/" className="group">
                        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 group-hover:scale-105 transition-transform duration-300">
                            Cure My Baby
                        </h1>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex items-center space-x-6">
                        <Link
                            href="/"
                            className={`text-sm font-bold transition-colors duration-300 ${pathname === '/' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-500'}`}
                        >
                            Home
                        </Link>
                        <Link
                            href="/game"
                            className={`text-sm font-bold transition-colors duration-300 ${pathname === '/game' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-500'}`}
                        >
                            Game
                        </Link>
                        <Link
                            href="/learnword"
                            className={`text-sm font-bold transition-colors duration-300 ${pathname === '/learnword' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-500'}`}
                        >
                            Learn
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}
