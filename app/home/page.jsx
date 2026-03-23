"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Calendar, ChevronDown, Sparkles } from "lucide-react";
import APCLogo from "@/assets/images/APCLogoColor.jpg";
import CloudImg from "@/assets/images/Cloud.png";
import { pvsImages } from "@/app/gallery/helper";
import { faq_questions } from "./faqs";

// ─── Time-of-day sky themes ────────────────────────────────────────────────
const THEMES = [
  { s: 0, e: 4, g: ["#010612", "#030e28", "#061840"], stars: 1.0, label: "midnight" },
  { s: 4, e: 6, g: ["#0d0520", "#1e0d42", "#3a1860"], stars: 0.8, label: "predawn" },
  { s: 6, e: 8, g: ["#c44010", "#e8782a", "#f5b860"], stars: 0.1, label: "sunrise" },
  { s: 8, e: 10, g: ["#2060a8", "#5090cc", "#88c0e8"], stars: 0.0, label: "morning" },
  { s: 10, e: 13, g: ["#0e5fa0", "#2e8ec0", "#72c0e0"], stars: 0.0, label: "midday" },
  { s: 13, e: 16, g: ["#1060a8", "#3890c0", "#70bce0"], stars: 0.0, label: "afternoon" },
  { s: 16, e: 18, g: ["#c05818", "#d88030", "#f0b850"], stars: 0.2, label: "golden" },
  { s: 18, e: 20, g: ["#380828", "#803060", "#c85030"], stars: 0.5, label: "sunset" },
  { s: 20, e: 22, g: ["#080518", "#140e38", "#201060"], stars: 0.85, label: "dusk" },
  { s: 22, e: 24, g: ["#010612", "#030e28", "#061838"], stars: 1.0, label: "night" },
];

const getTheme = (h) =>  THEMES.find((t) => h >= t.s && h < t.e) ?? THEMES[9];
const isDark = (lbl) =>
  ["midnight", "predawn", "dusk", "night", "sunset", "golden"].includes(lbl);

// Stable seeded pseudo-random
const mkRand = (seed) => {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
};

const PHOTOS = [
  { src: pvsImages[0], caption: "Canvas Art", rot: "-4deg", bg: "#fffbea", pin: "#e8c840" },
  { src: pvsImages[1], caption: "T-Shirt Prints", rot: "3.5deg", bg: "#fff0f5", pin: "#e84060" },
  { src: pvsImages[2], caption: "Photography", rot: "-2deg", bg: "#eef5ff", pin: "#4080e8" },
  { src: pvsImages[3], caption: "Runway Looks", rot: "4.5deg", bg: "#efffee", pin: "#30b840" },
  { src: pvsImages[4], caption: "Mixed Media", rot: "-3.5deg", bg: "#fff5ee", pin: "#e87030" },
  { src: pvsImages[5], caption: "Portraits", rot: "2deg", bg: "#f2eeff", pin: "#8040e0" },
];

const FAQ_ITEMS = faq_questions;

const rng = mkRand(42);
const LEAVES_DATA = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: `${rng() * 100}%`,
  fallDur: `${rng() * 14 + 12}s`,
  fallDelay: `${-(rng() * 24)}s`,
  swayDur: `${rng() * 3 + 2.5}s`,
  swayDelay: `${rng() * 2}s`,
  size: rng() * 16 + 9,
  isPetal: i < 5,
  gradient: i < 5
    ? `linear-gradient(135deg,hsl(${340 + rng() * 20}deg 70% ${38 + rng() * 12}%),hsl(${350 + rng() * 10}deg 60% 68%))`
    : `linear-gradient(135deg,hsl(${118 + rng() * 25}deg 55% ${28 + rng() * 16}%),hsl(${95 + rng() * 20}deg 40% 52%))`,
}));

const STARS_DATA = Array.from({ length: 75 }, () => ({
  left: `${rng() * 100}%`,
  top: `${rng() * 62}%`,
  w: rng() * 2.2 + 0.7,
  dur: `${rng() * 3.5 + 2}s`,
  delay: `${rng() * 7}s`,
  opacity: rng() * 0.75 + 0.2,
}));

export default function HomePage() {
  const [theme, setTheme] = useState(THEMES[4]);
  const [timeLeft, setTimeLeft] = useState({ Days: 0, Hrs: 0, Min: 0, Sec: 0 });
  const [openFaq, setOpenFaq] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -9999, y: -9999 });
  const [hovering, setHovering] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const target = new Date("April 4, 2026 00:00:00").getTime();
    const tick = () => {
      const now = new Date();
      setTheme(getTheme(now.getHours()));
      const diff = target - now.getTime();
      if (diff > 0) {
        setTimeLeft({
          Days: Math.floor(diff / 86400000),
          Hrs: Math.floor((diff % 86400000) / 3600000),
          Min: Math.floor((diff % 3600000) / 60000),
          Sec: Math.floor((diff % 60000) / 1000),
        });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!heroRef.current) return;
    const r = heroRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - r.left, y: e.clientY - r.top });
  }, []);

  const dark = isDark(theme.label);
  const textPrimary = dark ? "#ffffff" : "#08081a";
  const textSub = dark ? "rgba(255,255,255,.72)" : "rgba(8,8,26,.60)";
  const glassCard = dark ? "rgba(255,255,255,.10)" : "rgba(255,255,255,.60)";
  const glassBorder = dark ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.75)";

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes cloudDrift { from { transform: translateX(-155%) } to { transform: translateX(115vw) } }
        @keyframes leafFall   { 0% { transform: translateY(-60px) rotate(0deg); opacity: 0 } 5% { opacity: 1 } 92% { opacity: .75 } 100% { transform: translateY(108vh) rotate(420deg); opacity: 0 } }
        @keyframes leafSway   { 0% { transform: translateX(-28px) rotate(-16deg) scale(.88) } 100% { transform: translateX(28px) rotate(38deg) scale(1.12) } }
        @keyframes fadeUp     { from { opacity: 0; transform: translateY(26px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes gradShift  { 0%,100% { background-position: 0% 50% } 50% { background-position: 100% 50% } }
        @keyframes shimmer    { 0% { transform: translateX(-220%) skewX(-14deg) } 100% { transform: translateX(260%) skewX(-14deg) } }
        @keyframes starBlink  { 0%,100% { transform: scale(.4) } 50% { transform: scale(1.8) } }
        @keyframes ringOut    { 0% { transform: scale(.82); opacity: .55 } 100% { transform: scale(2.3); opacity: 0 } }
        @keyframes cardFloat  { 0%,100% { transform: rotate(var(--rot)) translateY(0) } 50% { transform: rotate(var(--rot)) translateY(-7px) } }

        .fu1 { animation: fadeUp .85s cubic-bezier(.16,1,.3,1) .20s both }
        .fu2 { animation: fadeUp .85s cubic-bezier(.16,1,.3,1) .38s both }
        .fu3 { animation: fadeUp .85s cubic-bezier(.16,1,.3,1) .54s both }
        .fu4 { animation: fadeUp .85s cubic-bezier(.16,1,.3,1) .70s both }
        .fu5 { animation: fadeUp .85s cubic-bezier(.16,1,.3,1) .86s both }
        .fu6 { animation: fadeUp .85s cubic-bezier(.16,1,.3,1) 1.0s  both }

        .spectrum-rainbow {
          background-image: linear-gradient(90deg,#ff1155,#ff9900,#ffe600,#00ff88,#00aaff,#cc44ff,#ff1155);
          background-size: 220% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: gradShift 4.5s linear infinite;
        }

        /* ── CTA button ── */
        .btn-cta {
          position: relative; overflow: hidden;
          display: inline-flex; align-items: center; gap: 12px;
          padding: 18px 56px; border-radius: 999px;
          background: linear-gradient(160deg, #ffe136 0%, #ffc600 100%);
          color: #1a1000;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800; font-size: 1.15rem; letter-spacing: .08em; text-transform: uppercase;
          text-decoration: none;
          box-shadow: 0 6px 0 #b88a00, 0 9px 22px rgba(255,200,0,.38), inset 0 2px 0 rgba(255,255,255,.5);
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .btn-cta:hover  { transform: translateY(-3px); box-shadow: 0 9px 0 #b88a00, 0 14px 30px rgba(255,200,0,.45), inset 0 2px 0 rgba(255,255,255,.5); }
        .btn-cta:active { transform: translateY(3px);  box-shadow: 0 3px 0 #b88a00, 0 4px 10px rgba(255,200,0,.3),  inset 0 2px 0 rgba(255,255,255,.5); }
        .btn-cta::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,.42), transparent); transform: translateX(-220%) skewX(-14deg); animation: shimmer 2.8s ease-in-out 1s infinite; pointer-events: none; }

        /* ── Countdown tiles ── */
        .tile { transition: transform .28s ease; }
        .tile:hover { transform: translateY(-5px); }
        .tile-dark  { box-shadow: 0 7px 0 rgba(0,0,0,.32), 0 12px 30px rgba(0,0,0,.24), inset 0 2px 0 rgba(255,255,255,.18), inset 0 -1px 0 rgba(0,0,0,.2); }
        .tile-light { box-shadow: 0 5px 0 rgba(0,0,0,.12), 0 10px 24px rgba(0,0,0,.10), inset 0 2px 0 rgba(255,255,255,.9), inset 0 -1px 0 rgba(0,0,0,.06); }

        /* ── Pills ── */
        .pill-dark  { box-shadow: 0 3px 0 rgba(0,0,0,.22), 0 6px 18px rgba(0,0,0,.16), inset 0 1px 0 rgba(255,255,255,.2); }
        .pill-light { box-shadow: 0 3px 0 rgba(0,0,0,.09), 0 6px 16px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.9); }

        /* ── Post-it gallery cards ── */
        .postit {
          transition: transform .32s cubic-bezier(.34,1.56,.64,1), box-shadow .28s ease;
          animation: cardFloat 5s ease-in-out var(--fd, 0s) infinite;
        }
        .postit:hover {
          transform: rotate(0deg) scale(1.05) translateY(-10px) !important;
          box-shadow: 0 32px 64px rgba(0,0,0,.36), 0 12px 24px rgba(0,0,0,.18) !important;
          z-index: 20;
          animation-play-state: paused;
        }

        /* ── FAQ 3D Cards ── */
        .faq-card {
          background-color: #ffffff;
          border: 2px solid #08081a;
          box-shadow: 6px 6px 0px #08081a;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .faq-card:hover {
          transform: translate(-2px, -2px);
          box-shadow: 8px 8px 0px #08081a;
        }
        .faq-card:active {
          transform: translate(4px, 4px);
          box-shadow: 2px 2px 0px #08081a;
        }
      `}</style>

      {/* ══════════════════ SKY BACKGROUND (fixed) ══════════════════ */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: `linear-gradient(175deg, ${theme.g[0]} 0%, ${theme.g[1]} 48%, ${theme.g[2]} 100%)`,
          transition: "background 9s ease",
        }}
      >
        {/* Stars */}
        {theme.stars > 0 &&
          STARS_DATA.map((s, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: s.left, top: s.top,
                width: s.w, height: s.w,
                opacity: s.opacity * theme.stars,
                transition: "opacity 5s ease",
                animation: `starBlink ${s.dur} ease-in-out ${s.delay} infinite`,
              }}
            />
          ))}

        {/* Clouds */}
        <div className="absolute inset-0 overflow-hidden">
          {[
            { top: "7%", dur: "88s", delay: "0s", scale: 1.0, op: .18 },
            { top: "22%", dur: "122s", delay: "-40s", scale: 1.5, op: .13 },
            { top: "13%", dur: "68s", delay: "-20s", scale: .75, op: .22 },
            { top: "33%", dur: "104s", delay: "-56s", scale: 1.2, op: .11 },
          ].map((c, i) => (
            <div
              key={i}
              className="absolute mix-blend-screen"
              style={{
                top: c.top, left: "-30%", opacity: c.op,
                animation: `cloudDrift ${c.dur} linear ${c.delay} infinite`,
              }}
            >
              <div style={{ position: "relative", width: `${440 * c.scale}px`, height: `${200 * c.scale}px` }}>
                <Image src={CloudImg} alt="" fill className="object-contain" />
              </div>
            </div>
          ))}
        </div>

        {/* Leaves & petals */}
        <div className="absolute inset-0 overflow-hidden">
          {LEAVES_DATA.map((leaf) => (
            <div
              key={leaf.id}
              className="absolute"
              style={{
                left: leaf.left, top: "-60px",
                animation: `leafFall ${leaf.fallDur} linear ${leaf.fallDelay} infinite`,
              }}
            >
              <div
                style={{
                  width: leaf.size, height: leaf.size,
                  background: leaf.gradient,
                  borderRadius: leaf.isPetal ? "50% 0 50% 0" : "42% 8% 42% 8%",
                  opacity: .65, mixBlendMode: "overlay",
                  boxShadow: "0 2px 6px rgba(0,0,0,.12)",
                  animation: `leafSway ${leaf.swayDur} ease-in-out ${leaf.swayDelay} infinite alternate`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Ambient blobs */}
        <div className="absolute pointer-events-none" style={{ width: 600, height: 600, top: "-15%", right: "-12%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.05) 0%, transparent 68%)" }} />
        <div className="absolute pointer-events-none" style={{ width: 450, height: 450, bottom: "0%", left: "-8%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.04) 0%, transparent 68%)" }} />

        {/* Film grain */}
        <div
          className="absolute inset-0 opacity-[.07] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "170px",
          }}
        />
      </div>

      {/* ══════════════════ PAGE CONTENT ══════════════════ */}
      <main
        className="relative z-10 min-h-screen overflow-x-hidden"
        style={{ fontFamily: "'DM Sans', sans-serif", color: textPrimary }}
      >
        {/* ── HERO ── */}
        <section className="relative flex flex-col items-center justify-center min-h-[100svh] px-4 md:px-8 pt-24 pb-20">
          <div className="flex flex-col items-center w-full max-w-5xl mx-auto text-center">

            {/* APC Logo */}
            <div className="fu1 relative mb-8 self-center mt-8">
              {[0, 1.7].map((d, i) => (
                <div
                  key={i}
                  className="absolute rounded-2xl pointer-events-none"
                  style={{
                    inset: `${-8 - i * 8}px`,
                    border: `1px solid rgba(255,255,255,${dark ? .25 : .18})`,
                    animation: `ringOut 3.6s ease-out ${d}s infinite`,
                  }}
                />
              ))}
              <div className="rounded-2xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.3)]  bg-white">
                <Image src={APCLogo} alt="APC" height={76} className="block md:h-[100px] w-auto" />
              </div>
            </div>

            {/* Subtitle & Description */}
            <div className="fu3 max-w-2xl mx-auto">
              <h2
                className="text-[clamp(1.1rem,2.5vw,1.6rem)] font-light italic tracking-wider mb-4"
                style={{ color: textSub }}
              >
                Nationwide Art &amp; Photography Contest
              </h2>
            </div>

            {/* SPECTRUM wordmark */}
            <div
              ref={heroRef}
              className="fu2 relative select-none w-full flex justify-center mb-2 cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => { setHovering(false); setMousePos({ x: -9999, y: -9999 }); }}
            >
              {/* Base text */}
              <h1
                className="font-['Bricolage_Grotesque',sans-serif] text-[clamp(3.5rem,11vw,10rem)] font-black tracking-tighter leading-none whitespace-nowrap"
                style={{
                  color: dark ? "#ffffff" : "#08081a",
                  textShadow: dark ? "0 12px 48px rgba(0,0,0,.6)" : "0 8px 30px rgba(0,0,0,.12)",
                }}
              >
                SPECTRUM
              </h1>

              {/* Rainbow overlay — desktop (mouse-masked) */}
              <h1
                className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 spectrum-rainbow pointer-events-none z-10 font-['Bricolage_Grotesque',sans-serif] text-[clamp(3.5rem,11vw,10rem)] font-black tracking-tighter leading-none whitespace-nowrap"
                style={{
                  opacity: hovering ? 1 : 0,
                  transition: "opacity .3s ease",
                  maskImage: `radial-gradient(circle 350px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 80%)`,
                  WebkitMaskImage: `radial-gradient(circle 350px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 80%)`,
                  filter: "drop-shadow(0 0 30px rgba(255,255,255,.6))",
                }}
              >
                SPECTRUM
              </h1>

              {/* Rainbow overlay — mobile (always-on subtle tint) */}
              <h1
                className="md:hidden absolute top-0 left-1/2 -translate-x-1/2 spectrum-rainbow pointer-events-none z-10 font-['Bricolage_Grotesque',sans-serif] text-[clamp(3.5rem,11vw,10rem)] font-black tracking-tighter leading-none whitespace-nowrap opacity-60 mix-blend-overlay"
              >
                SPECTRUM
              </h1>
            </div>

            {/* 1L+ Cash Prize Highlight Banner */}
            <div className="fu4 mb-10">
              <div
                className="inline-flex items-center justify-center gap-3 px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl cursor-default transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "linear-gradient(135deg, #FFDE59 0%, #FF9900 100%)",
                  boxShadow: "0 8px 32px rgba(255, 153, 0, 0.4), inset 0 2px 0 rgba(255,255,255,0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.5)",
                }}
              >
                <Sparkles className="text-white fill-white animate-pulse" size={24} />
                <span className="text-[#1a1000] font-['Bricolage_Grotesque',sans-serif] font-extrabold text-[1.1rem] sm:text-[1.3rem] tracking-wide uppercase">
                  Cash Prizes Worth ₹1,00,000+
                </span>
                <Sparkles className="text-white fill-white animate-pulse" size={24} />
              </div>
            </div>

            {/* Countdown */}
            <div className="fu5 flex gap-4 sm:gap-6 justify-center mb-12">
              {Object.entries(timeLeft).map(([lbl, val]) => (
                <div key={lbl} className="flex flex-col items-center gap-3">
                  <div
                    className={`tile ${dark ? "tile-dark" : "tile-light"} w-[68px] h-[82px] sm:w-[86px] sm:h-[104px] md:w-[108px] md:h-[128px] rounded-[20px] flex items-center justify-center relative overflow-hidden`}
                    style={{
                      background: dark
                        ? "linear-gradient(165deg, rgba(255,255,255,.12) 0%, rgba(0,0,0,.35) 100%)"
                        : "linear-gradient(165deg, rgba(255,255,255,.95) 0%, rgba(218,228,248,.75) 100%)",
                      border: `1px solid ${glassBorder}`,
                      backdropFilter: "blur(16px)",
                    }}
                  >
                    {/* Flip-clock mid-line */}
                    <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: "1px", background: dark ? "rgba(255,255,255,.10)" : "rgba(0,0,0,.05)" }} />
                    <span
                      className="font-['Bricolage_Grotesque',sans-serif] text-[clamp(2.2rem,5vw,3.8rem)] font-black tabular-nums"
                      style={{
                        color: dark ? "#fff" : "#080820",
                        textShadow: dark ? "0 4px 16px rgba(0,0,0,.5)" : "0 2px 6px rgba(0,0,0,.08)",
                      }}
                    >
                      {val.toString().padStart(2, "0")}
                    </span>
                  </div>
                  <span
                    className="text-[0.65rem] sm:text-[0.7rem] font-bold tracking-[0.3em] uppercase"
                    style={{ color: dark ? "rgba(255,255,255,.7)" : "rgba(8,8,32,.55)" }}
                  >
                    {lbl}
                  </span>
                </div>
              ))}
            </div>

            {/* Date + Location pills */}
            <div className="fu6 flex flex-col sm:flex-row items-center gap-4 mb-12 flex-wrap justify-center">
              {[
                { icon: <Calendar size={18} style={{ color: "#FFDE59", flexShrink: 0 }} />, text: "4–5 April 2026" },
                { icon: <MapPin size={18} style={{ color: "#FFDE59", flexShrink: 0 }} />, text: "Punjab Engineering College, Chandigarh" },
              ].map((pill, i) => (
                <div
                  key={i}
                  className={`${dark ? "pill-dark" : "pill-light"} inline-flex items-center gap-3 px-7 py-3.5 rounded-full text-[0.98rem] font-semibold transition-transform hover:-translate-y-1`}
                  style={{
                    background: glassCard,
                    border: `1px solid ${glassBorder}`,
                    backdropFilter: "blur(14px)",
                    color: dark ? "rgba(255,255,255,.95)" : "rgba(8,8,26,.85)",
                  }}
                >
                  {pill.icon}
                  {pill.text}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="fu6">
              <Link href="/registration" className="btn-cta">
                Register Now
                <ArrowRight size={22} strokeWidth={3} />
              </Link>
            </div>

          </div>
        </section>

        {/* ── Divider ── */}
        <Divider dark={dark} />

        {/* ── GALLERY ── */}
        <section className="relative px-4 md:px-8 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">

            <SectionHeader
              dark={dark} textSub={textSub}
              title="Past Highlights"
              sub="Moments from Spectrum's creative universe"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-20 gap-x-10 pb-12 px-4">
              {PHOTOS.map((p, i) => (
                <div
                  key={i}
                  className="postit flex flex-col items-center"
                  style={{
                    "--rot": p.rot,
                    "--fd": `${i * 0.55}s`,
                    transform: `rotate(${p.rot})`,
                    background: p.bg,
                    borderRadius: "6px",
                    padding: "18px 18px 56px 18px",
                    boxShadow: "0 12px 36px rgba(0,0,0,.2), 0 4px 12px rgba(0,0,0,.1)",
                    position: "relative",
                  }}
                >
                  {/* Pin */}
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full z-10"
                    style={{
                      background: `radial-gradient(circle at 35% 30%, ${p.pin}ee, ${p.pin}88)`,
                      boxShadow: `0 4px 10px ${p.pin}66, 0 0 0 2px rgba(255,255,255,.6), 0 6px 16px rgba(0,0,0,.3)`,
                    }}
                  />

                  {/* Photo */}
                  <div
                    className="w-full aspect-[4/3] rounded-[3px] mb-4 overflow-hidden relative"
                    style={{ boxShadow: "inset 0 4px 12px rgba(0,0,0,.15)" }}
                  >
                    {p.src ? (
                      <Image src={p.src} alt={p.caption} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#d4d4d8,#9ca3af)" }}>
                        <span className="text-[#606068] text-[0.9rem] font-bold tracking-[0.1em]">PHOTO</span>
                      </div>
                    )}
                  </div>

                  {/* Caption */}
                  <p
                    className="text-[1rem] font-bold italic text-center tracking-wide"
                    style={{ fontFamily: "'DM Sans', sans-serif", color: "#3f3f46" }}
                  >
                    {p.caption}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Divider ── */}
        <Divider dark={dark} />

        {/* /* ── FAQ ── */}
        <section className="px-4 md:px-8 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">

            <SectionHeader
              dark={dark} textSub={textSub}
              title="Got Questions?"
              sub="Everything you need to know about Spectrum '26"
            />

            {/* Two separate 2-column grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="flex flex-col gap-6">
                {FAQ_ITEMS.slice(0, 4).map((item, i) => {
                  const open = openFaq === i;
                  return (
                    <div
                      key={i}
                      className="faq-card cursor-pointer rounded-2xl overflow-hidden"
                      onClick={() => setOpenFaq(open ? null : i)}
                    >
                      {/* Header row */}
                      <div className="p-5 md:p-6 flex items-center gap-4">
                        {/* Number badge */}
                        <span
                          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-black text-[0.95rem] text-[#1a1000]"
                          style={{
                            background: "linear-gradient(140deg, #ffe136 0%, #ffc000 100%)",
                            boxShadow: "0 2px 0 #a87800, 0 4px 12px rgba(255,190,0,.35)",
                          }}
                        >
                          {i + 1}
                        </span>

                        {/* Question */}
                        <span className="flex-1 font-bold text-[1rem] md:text-[1.05rem] leading-snug text-[#08081a]">
                          {item.q}
                        </span>

                        {/* Chevron */}
                        <ChevronDown
                          size={22}
                          className="shrink-0 transition-transform duration-300 text-[#08081a]"
                          style={{
                            transform: open ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                        />
                      </div>

                      {/* Answer — grid expand trick */}
                      <div
                        className="grid transition-all duration-300 ease-in-out"
                        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                      >
                        <div className="overflow-hidden">
                          <div className="pl-18 pr-6 pb-6 pt-0 text-[0.95rem] leading-relaxed text-[#3f3f46] font-medium">
                            {item.a}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right column */}
              <div className="flex flex-col gap-6">
                {FAQ_ITEMS.slice(4, 8).map((item, i) => {
                  const open = openFaq === i + 4;
                  return (
                    <div
                      key={i + 4}
                      className="faq-card cursor-pointer rounded-2xl overflow-hidden"
                      onClick={() => setOpenFaq(open ? null : i + 4)}
                    >
                      {/* Header row */}
                      <div className="p-5 md:p-6 flex items-center gap-4">
                        {/* Number badge */}
                        <span
                          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-black text-[0.95rem] text-[#1a1000]"
                          style={{
                            background: "linear-gradient(140deg, #ffe136 0%, #ffc000 100%)",
                            boxShadow: "0 2px 0 #a87800, 0 4px 12px rgba(255,190,0,.35)",
                          }}
                        >
                          {i + 5}
                        </span>

                        {/* Question */}
                        <span className="flex-1 font-bold text-[1rem] md:text-[1.05rem] leading-snug text-[#08081a]">
                          {item.q}
                        </span>

                        {/* Chevron */}
                        <ChevronDown
                          size={22}
                          className="shrink-0 transition-transform duration-300 text-[#08081a]"
                          style={{
                            transform: open ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                        />
                      </div>

                      {/* Answer — grid expand trick */}
                      <div
                        className="grid transition-all duration-300 ease-in-out"
                        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                      >
                        <div className="overflow-hidden">
                          <div className="pl-18 pr-6 pb-6 pt-0 text-[0.95rem] leading-relaxed text-[#3f3f46] font-medium">
                            {item.a}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p
              className="text-center mt-16 text-[1.05rem]"
              style={{ color: dark ? "rgba(255,255,255,.6)" : "rgba(8,8,32,.6)" }}
            >
              More questions?{" "}
              <a
                href="/contact"
                className="font-bold underline underline-offset-4 transition-opacity hover:opacity-75"
                style={{ color: "#FFDE59" }}
              >
                Contact us
              </a>
            </p>

          </div>
        </section>

        {/* ── Footer breathing room ── */}
        <div className="h-16" />

      </main>
    </>
  );
}

/* ─── Small shared sub-components ───────────────────────────────────────── */

function Divider({ dark }) {
  return (
    <div
      className="max-w-5xl mx-auto my-16 md:my-20 h-px"
      style={{
        background: `linear-gradient(90deg, transparent, ${dark ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.65)"}, transparent)`,
      }}
    />
  );
}

function SectionHeader({ dark, textSub, title, sub }) {
  return (
    <div className="text-center mb-16">
      <h2
        className="font-['Bricolage_Grotesque',sans-serif] text-[clamp(2.2rem,5.5vw,4rem)] font-black tracking-tight"
        style={{
          color: dark ? "#fff" : "#08081a",
          textShadow: dark ? "0 6px 24px rgba(0,0,0,.4)" : "none",
        }}
      >
        {title}
      </h2>
      <p className="mt-4 text-[1.1rem]" style={{ color: textSub }}>
        {sub}
      </p>
    </div>
  );
}