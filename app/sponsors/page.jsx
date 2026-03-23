"use client";

import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

// STEP 1: IMPORT YOUR IMAGES
// const sponsor1 = 'https://spectrum.gumlet.io/kotakbanklogo_g4xtgu';
import sponsor1 from '@/public/sponsors/kotakbanklogo.png';
import sponsor3 from '@/public/sponsors/jallogo.jpg';
const sponsor2 = 'https://spectrum.gumlet.io/harleydavidsonlogo_d1esll';
// const sponsor3 = 'https://spectrum.gumlet.io/jallogo_siukkd';
const sponsor4 = 'https://spectrum.gumlet.io/centralbanklogo_cplepu';
const sponsor5 = 'https://spectrum.gumlet.io/bonnlogo_ghmd49';
const sponsor6 = 'https://spectrum.gumlet.io/noscarslogo_siukkd';
const sponsor7 = 'https://spectrum.gumlet.io/torquelogo_g4xtgu';

const PECLogo = 'https://spectrum.gumlet.io/PECLogo_qw2lkc';

const OldSponsors = [
    { id: 1, image: sponsor1.src, name: "Kotak Mahindra Bank" },
    { id: 2, image: sponsor2, name: "Harley Davidson" },
    { id: 3, image: sponsor3.src, name: "JAL - Natural Mineral Water" },
    { id: 4, image: sponsor4, name: "Central Bank of India" },
    { id: 5, image: sponsor5, name: "Bonn Group" },
    { id: 6, image: sponsor6, name: "NO SCARS" },
    { id: 7, image: sponsor7, name: "Torque" },
];

const NewSponsors = [
    { id: 1, image: PECLogo, name: "Coming Soon" },
    { id: 2, image: PECLogo, name: "Coming Soon" },
    { id: 3, image: PECLogo, name: "Coming Soon" },
    { id: 4, image: PECLogo, name: "Coming Soon" },
    { id: 5, image: PECLogo, name: "Coming Soon" },
];

export default function SponsorsPage() {

    return (
        <div className="min-h-screen w-full text-black selection:bg-black/20 pb-20 font-sans relative overflow-x-hidden">
            
            {/* Decorative Background Elements */}
            <div className="absolute top-20 -left-20 w-64 h-64 bg-[#F6E245] rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0"></div>
            <div className="absolute top-40 -right-20 w-72 h-72 bg-[#5AE0FE] rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0"></div>

            {/* Hero Header */}
            <div className="w-full text-white pt-28 mb-16 relative z-10 flex flex-col items-center justify-center overflow-hidden">
                {/* Marquee Background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none whitespace-nowrap overflow-hidden">
                    <h1 className="text-[150px] text-[#004360] font-black uppercase tracking-tighter">OUR PARTNERS</h1>
                </div>
                
                <div className="relative z-20 text-center px-4">
                    <div className="inline-flex items-center border gap-2 bg-[#F6E245] text-black px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-black mb-6">
                        <Sparkles size={14} className="shrink-0" />
                        <span>Powering the Vision</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4">Previous Sponsors</h1>
                    <p className="text-gray-100 text-lg md:text-xl font-semibold italic max-w-3xl mx-auto">
                        Discover the incredible brands and organizations helping us bring SPECTRUM 2026 to life.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 z-10 relative">

                {/* ================= SECTION 1: PREVIOUS PARTNERS ================= */}

                {/* Previous Sponsors Grid */}
                <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    {OldSponsors.map((sponsor) => (
                        <div
                            key={sponsor.id}
                            className="group relative bg-white border-[3px] border-black rounded-3xl p-6 flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-2 hover:scale-105 cursor-pointer"
                            style={{ boxShadow: "8px 8px 0px 0px #000" }} 
                        >
                            {/* Sponsor Logo Container */}
                            <div className="w-full aspect-square relative rounded-2xl overflow-hidden bg-white border-2 border-gray-100 flex items-center justify-center p-4">
                                <img
                                    src={sponsor.image}
                                    alt={`Sponsor ${sponsor.name}`}
                                    className="w-full h-full object-contain filter group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                                    style={{ mixBlendMode: "multiply" }} 
                                />
                            </div>
                            <p className="mt-5 text-center text-black font-black uppercase text-sm leading-tight tracking-wide">{sponsor.name}</p>
                        </div>
                    ))}
                </section>


                {/* ================= SECTION 2: SPECTRUM 2026 ================= */}
                <section className="text-center space-y-6 mt-40 mb-16">
                    <div
                        className="inline-block px-6 py-2 rounded-full border-[3px] border-black bg-[#FFDE59]" 
                        style={{ boxShadow: "4px 4px 0px 0px #000" }} 
                    >
                        <span className="text-black text-sm font-black tracking-widest uppercase">The Present</span>
                    </div>

                    <h1 className="font-kanit uppercase tracking-tight"
                        style={{
                            fontSize: "clamp(2.5rem, 5vw, 4rem)",
                            fontWeight: 900,
                            color: "#fff",
                            textShadow: "4px 4px 0px #000",
                        }}>
                        Spectrum 2026 Sponsors
                    </h1>
                </section>

                {/* Current Sponsors Grid */}
                <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    {NewSponsors.map((sponsor) => (
                        <div
                            key={sponsor.id}
                            className="group relative bg-white border-[3px] border-black rounded-3xl p-6 flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-2 hover:scale-105 cursor-pointer"
                            style={{ boxShadow: "8px 8px 0px 0px #000" }} 
                        >
                            <div className="w-full aspect-square relative rounded-2xl overflow-hidden bg-white border-2 border-dashed border-gray-300 flex items-center justify-center p-4">
                                <img
                                    src={sponsor.image}
                                    alt={`Sponsor ${sponsor.name}`}
                                    className="w-full h-full object-contain filter grayscale opacity-40 group-hover:opacity-80 transition-all duration-500"
                                    style={{ mixBlendMode: "multiply" }}
                                />
                            </div>
                            <p className="mt-5 text-center text-gray-500 font-black uppercase text-sm leading-tight tracking-wide">{sponsor.name}</p>
                        </div>
                    ))}
                </section>

                {/* ================= CALL TO ACTION ================= */}
                <section className="mt-32 flex justify-center text-center">
                    <div
                        className="bg-white border-[3px] border-black rounded-full py-6 px-8 md:px-12 inline-flex flex-col sm:flex-row items-center gap-8"
                        style={{ boxShadow: "10px 10px 0px 0px #000" }}
                    >
                        <span className="text-xl text-black font-black uppercase tracking-tight">Want to partner with us?</span>

                        <Link
                            href="/contact"
                            className="px-10 py-4 rounded-full bg-[#FFDE59] text-black font-black uppercase tracking-widest border-[3px] border-black hover:bg-black hover:text-[#FFDE59] transition-colors whitespace-nowrap"
                        >
                            Contact Us
                        </Link>
                    </div>
                </section>

            </div>
        </div>
    );
}