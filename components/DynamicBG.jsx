"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import LandBg2 from "@/assets/images/LandBg2.png";
import LandBg from "@/assets/images/LandBg.png";
const CloudImg = "https://spectrum.gumlet.io/Cloud_mvgy5a";

const generateLeaves = (count) => {
  return Array.from({ length: count }).map((_, i) => {
    const isGreen = Math.random() > 0.5;
    const bg = isGreen
      ? "linear-gradient(135deg, #25782F, #8FBE71)" // Green Gradient
      : "linear-gradient(135deg, #be185d, #831843)"; // Rose Gradient

    return {
      id: i,
      left: `${Math.random() * 100}%`,

      // Fall: Very slow (15s to 30s)
      fallDuration: `${Math.random() * 15 + 15}s`,
      fallDelay: `${Math.random() * 15}s`,

      // Sway: Faster than the fall (3s to 6s), creates the drifting effect
      swayDuration: `${Math.random() * 3 + 3}s`,
      swayDelay: `${Math.random() * 2}s`, // Random offset so they don't sway in sync

      background: bg,
      size: Math.random() * 10 + 10,
    };
  });
};

/* ================= COMPONENTS ================= */

export const CloudLayer = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-1/2 overflow-hidden pointer-events-none z-0">
      <div className="absolute top-[5%] opacity-40 animate-cloud-slow" style={{ left: '-20%', animationDuration: '65s' }}>
        <div className="relative w-[300px] h-[150px] md:w-[500px] md:h-[250px]">
          <img src={CloudImg} alt="cloud" className="object-contain w-full h-full" />
        </div>
      </div>
      <div className="absolute top-[20%] opacity-30 animate-cloud-slower" style={{ left: '-10%', animationDelay: '-20s', animationDuration: '90s' }}>
        <div className="relative w-[400px] h-[200px] md:w-[600px] md:h-[300px]">
          <img src={CloudImg} alt="cloud" className="object-contain w-full h-full" />
        </div>
      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */

const DynamicBG = ({ children }) => {
  const [leaves, setLeaves] = useState([]);
  // const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  // do not show land for "/" route

  useEffect(() => {
    setLeaves(generateLeaves(15));
  }, []);

  // if (pathname === "/") return <>{children}</>;

  return (
    <div className="relative min-h-screen w-full bg-linear-to-b from-[#2F97D9] via-[#8CC8EC] to-[#cbe7f8] overflow-hidden">

      {/* 1. GLOBAL KEYFRAMES */}
      <style jsx global>{`
        @keyframes cloudMove {
          from { transform: translateX(-100%); }
          to { transform: translateX(100vw); }
        }

        /* Vertical Gravity */
        @keyframes drop {
          0% { transform: translateY(-20px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(110vh); opacity: 0; }
        }

        /* Horizontal Wind (Sway) */
        @keyframes sway {
          0% { transform: translateX(-30px) rotate(-15deg); }
          100% { transform: translateX(30px) rotate(45deg); }
        }

        .animate-cloud-slow { animation: cloudMove linear infinite; }
        .animate-cloud-slower { animation: cloudMove linear infinite; }
        
        /* Classes for JS mapping */
        .animate-drop { animation-name: drop; animation-timing-function: linear; animation-iteration-count: infinite; }
        .animate-sway { animation-name: sway; animation-timing-function: ease-in-out; animation-iteration-count: infinite; animation-direction: alternate; }
      `}</style>

      {/* 2. CLOUDS */}
      <CloudLayer />

      {/* 3. REALISTIC FALLING LEAVES */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {leaves.map((leaf) => (
          // OUTER DIV: Handles vertical falling (Gravity)
          <div
            key={leaf.id}
            className="absolute animate-drop"
            style={{
              left: leaf.left,
              top: '-50px', // Start slightly above viewport
              animationDuration: leaf.fallDuration,
              animationDelay: leaf.fallDelay,
            }}
          >
            {/* INNER DIV: Handles horizontal swaying (Wind) */}
            <div
              className="animate-sway rounded-tr-[100%] z-10 rounded-bl-[100%] opacity-80 shadow-sm"
              style={{
                width: `${leaf.size}px`,
                height: `${leaf.size}px`,
                background: leaf.background,
                // Sway duration is faster than fall duration
                animationDuration: leaf.swayDuration,
                animationDelay: leaf.swayDelay,
              }}
            />
          </div>
        ))}
      </div>

      {/* 4. LANDSCAPE */}
      <div className="absolute sm:-bottom-20 bottom-0 left-0 w-full z-0 pointer-events-none">
        <Image
          src={LandBg}
          alt="Landscape"
          width={1920}
          height={400}
          className="w-full h-auto object-cover"
          priority
        />
      </div>
      <div className="absolute sm:-bottom-20 bottom-0 left-0 w-full z-1 pointer-events-none">
        <Image
          src={LandBg2}
          alt="Landscape"
          width={1199}
          height={654}
          className="w-full h-auto object-contain opacity-90"
          priority
        />
      </div>

      {/* 5. CONTENT */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default DynamicBG;