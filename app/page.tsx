"use client";

import React, { useState } from "react";
import Head from "next/head";
import ThreeScene from "../components/ThreeScene";
import Loader from "../components/Loader";

const Home: React.FC = () => {
  // State to track if the preloader is finished and 3D animations should start
  const [appStarted, setAppStarted] = useState(false);

  return (
    <>
      <Head>
        <title>Cursor - Interactive Learning</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Pinyon+Script&family=Inter:wght@300;400;500;600&family=Space+Mono&display=swap" rel="stylesheet" />
      </Head>

      <div className="relative w-full h-screen overflow-hidden">

        {/* RENDER THE 3D SCENE, PASSING THE START SIGNAL */}
        <ThreeScene start={appStarted} />

        {/* --- LOADER --- */}
        <Loader onFinished={() => setAppStarted(true)} />

        {/* Corner Elements (Fade in when app starts) */}
        <div
          className="absolute top-8 left-8 text-sm font-bold tracking-widest text-black transition-opacity duration-1000"
          style={{ opacity: appStarted ? 0.8 : 0 }} // Fade in based on state
        >
          Cursor
        </div>
        <div
          className="absolute top-8 right-8 transition-opacity duration-1000"
          style={{ opacity: appStarted ? 1 : 0 }}
        >
          <div className="w-10 h-10 rounded-full border border-black/20 flex items-center justify-center cursor-pointer hover:bg-black/5 transition pointer-events-auto">
            <span className="text-xs text-black">Menu</span>
          </div>
        </div>
        <div
          className="absolute bottom-8 left-8 text-[10px] uppercase tracking-widest text-black transition-opacity duration-1000"
          style={{ opacity: appStarted ? 0.4 : 0 }}
        >
          © 2025 /
        </div>

      </div>
    </>
  );
};

export default Home;