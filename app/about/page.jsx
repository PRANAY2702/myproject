"use client";

import React from 'react';
import { Sparkles, Palette, Camera } from 'lucide-react';

// Replace these with your actual exact file names
const art1 = 'https://spectrum.gumlet.io/art1_qa8xwo';
const art2 = 'https://spectrum.gumlet.io/art2_n5g7n8';
const art3 = 'https://spectrum.gumlet.io/art3_y9hbpo';
const photo1 = 'https://spectrum.gumlet.io/photo1_kzf6m0';
const photo2 = 'https://spectrum.gumlet.io/photo2_h2lja7';
const photo3 = 'https://spectrum.gumlet.io/photo3_bn7m2y';
const PaintingImg = 'https://spectrum.gumlet.io/YogitaKanwaria_CreativeDecor_dgdpex';
const eventImg = 'https://spectrum.gumlet.io/eventImg_p1hucm';
import APCGroup from "@/assets/images/APCGroup.jpeg"
import { pvsImages } from '../gallery/helper';

export default function AboutPage() {
    return (
        <div className="min-h-screen w-full text-black selection:bg-black/20 pb-24 font-sans relative overflow-x-hidden">

            {/* Decorative Background Elements */}
            <div className="absolute top-20 -left-20 w-64 h-64 bg-[#F6E245] rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0 pointer-events-none"></div>
            <div className="absolute top-40 -right-20 w-72 h-72 bg-[#5AE0FE] rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0 pointer-events-none"></div>

            {/* ================= HERO HEADER ================= */}
            <div className="w-full text-white pt-28 mb-16 relative z-10 flex flex-col items-center justify-center overflow-hidden">
                {/* Marquee Background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none whitespace-nowrap overflow-hidden">
                    <h1 className="text-[130px] md:text-[150px] text-[#004360] font-black uppercase tracking-tighter">ABOUT SPECTRUM</h1>
                </div>

                <div className="relative z-20 text-center px-4 mt-8">
                    <div className="inline-flex items-center gap-2 bg-[#F6E245] text-black px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-2 border-transparent mb-6 shadow-sm">
                        <Sparkles size={14} className="shrink-0" />
                        <span>The Core of Creativity</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 text-[#FFF]">Who We Are</h1>
                    <p className="text-gray-800 text-base md:text-lg font-bold max-w-4xl mx-auto bg-white/50 backdrop-blur-sm border-[3px] border-black p-6 rounded-2xl">
                        SPECTRUM is the flagship event of the Art and Photography Club (APC) at Punjab Engineering College (PEC), Chandigarh. It is a celebration of creativity, skill, and artistic expression, providing a platform for students to showcase their talents in both art and photography. Through a series of competitions and exhibitions, SPECTRUM fosters a vibrant community of artists and photographers, encouraging them to push the boundaries of their craft and share their unique perspectives with the world.
                    </p>
                </div>
            </div>

            {/* ================= MAIN CONTENT ================= */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 space-y-20">

                {/* --- SECTION: APC --- */}
                <section className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 bg-white border-[4px] border-black rounded-[2.5rem] p-6 md:p-10 shadow-[8px_8px_0px_#1D1B1B]">
                    <div className="flex-1 space-y-6">
                        <div className="inline-block bg-black text-white px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest border-2 border-black">
                            Our Origins
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-black leading-none">
                            Art & Photography Club
                        </h2>
                        <p className="text-gray-700 font-bold leading-relaxed border-l-[4px] border-[#F6E245] pl-4">
                            Our Art and Photography Club (APC) is a space where creativity meets perspective. We encourage students to explore visual expression through thoughtful composition, technique, and storytelling. Whether through paint or lens, members develop their artistic voice, collaborate with peers, and transform ideas into impactful visual narratives. Having emerged as national winners at the prestigious events like IIT Bombay's Mood Indigo, IIT Jodhpur's IGNUS, IIT Mandi's Exodia, IIT Ropar's Zeitgeist, and many more, our club has established itself as a powerhouse of talent and innovation in the world of art and photography.
                        </p>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="w-full relative rounded-3xl border-[4px] border-black overflow-hidden shadow-[6px_6px_0px_#1D1B1B] bg-gray-100 group">
                            <img
                                src={APCGroup.src}
                                alt="APC Group Photo"
                                className="w-full h-auto max-h-[450px] object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        </div>
                    </div>
                </section>

                {/* --- SECTION: EVENTS --- */}
                <section className="flex flex-col lg:flex-row-reverse items-center gap-8 lg:gap-12 bg-[#5AE0FE] border-[4px] border-black rounded-[2.5rem] p-6 md:p-10 shadow-[8px_8px_0px_#1D1B1B]">
                    <div className="flex-1 space-y-6">
                        <div className="inline-block bg-white text-black px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_#1D1B1B]">
                            The Flagship Event
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-black leading-none">
                            SPECTRUM
                        </h2>
                        <p className="text-black font-bold leading-relaxed border-l-[4px] border-white pl-4">
                            SPECTRUM is the flagship event of our club, a vibrant celebration of creativity and talent in both art and photography. It serves as a platform for students to showcase their skills, express their unique perspectives, and engage with a community of like-minded individuals. Through a series of competitions, SPECTRUM fosters an environment where creativity thrives, encouraging participants to push the boundaries of their craft and share their artistic vision with the world. The main aim of SPECTRUM remains just that - to connect fellow creatives, inspire innovation, and celebrate the diverse spectrum of artistic expression within our community.
                        </p>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="w-full relative rounded-3xl border-[4px] border-black overflow-hidden shadow-[6px_6px_0px_#1D1B1B] bg-gray-100 group">
                            <img
                                src={pvsImages[7]}
                                alt="Event"
                                className="w-full h-auto max-h-[450px] object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        </div>
                    </div>
                </section>

                {/* --- SECTION: ART CATEGORY --- */}
                <section className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 bg-white border-[4px] border-black rounded-[2.5rem] p-6 md:p-10 shadow-[8px_8px_0px_#1D1B1B]">
                    <div className="flex-1 space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-[#F6E245] p-3 rounded-xl border-[3px] border-black shadow-[2px_2px_0px_#1D1B1B]">
                                    <Palette size={28} className="text-black" />
                                </div>
                                <h2 className="text-4xl font-black uppercase tracking-tight text-black">Art Competitions</h2>
                            </div>

                            <div className="bg-[#f4f4f4] border-[3px] border-black rounded-2xl p-5 shadow-[4px_4px_0px_#1D1B1B]">
                                <p className="font-bold text-gray-700 text-lg italic">
                                    "Art is the silent language of the soul, painting emotions where words fall short."
                                    <br />We believe that art is a powerful medium of expression, allowing individuals to communicate their innermost thoughts and feelings without uttering a single word. Through our art competitions, we provide a platform for artists to share their unique perspectives and connect with others who appreciate the beauty and depth of visual storytelling.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {["Canvas Painting", "Tote Bag Painting", "Body Paint and Modelling"].map((tag, i) => (
                                <span key={i} className="px-5 py-2 rounded-xl bg-[#F6E245] border-[3px] border-black text-black font-black uppercase tracking-widest text-xs shadow-[3px_3px_0px_#1D1B1B] hover:-translate-y-1 transition-transform">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Rectangular Image Collage for Art */}
                    <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                        <img src={art1} alt="Art 1" className="w-full h-48 md:h-56 object-cover rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_#1D1B1B] hover:-translate-y-1 transition-transform bg-gray-100" />
                        <img src={art3} alt="Art 2" className="w-full h-48 md:h-56 object-cover rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_#1D1B1B] hover:-translate-y-1 transition-transform translate-y-6 bg-gray-100" />
                        <img src={pvsImages[15]} alt="Art 3" className="w-full h-48 md:h-56 object-cover rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_#1D1B1B] col-span-2 mt-4 hover:-translate-y-1 transition-transform bg-gray-100" />
                    </div>
                </section>

                {/* --- SECTION: PHOTOGRAPHY CATEGORY --- */}
                <section className="flex flex-col lg:flex-row-reverse items-center gap-8 lg:gap-12 bg-white border-[4px] border-black rounded-[2.5rem] p-6 md:p-10 shadow-[8px_8px_0px_#1D1B1B]">
                    <div className="flex-1 space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-[#FF90E8] p-3 rounded-xl border-[3px] border-black shadow-[2px_2px_0px_#1D1B1B]">
                                    <Camera size={28} className="text-black" />
                                </div>
                                <h2 className="text-4xl font-black uppercase tracking-tight text-black">Photography</h2>
                            </div>

                            <div className="bg-[#f4f4f4] border-[3px] border-black rounded-2xl p-5 shadow-[4px_4px_0px_#1D1B1B]">
                                <p className="font-bold text-gray-700 text-lg italic">
                                    "Photography is the art of stealing a heartbeat from time and letting it live forever."
                                    <br/>
                                    Through our photography competitions, we celebrate the power of the lens to capture fleeting moments, emotions, and stories. We believe that photography is not just about taking pictures; it's about seeing the world through a unique perspective and sharing that vision with others. Our competitions encourage photographers to explore their creativity, experiment with different styles, and tell compelling stories through their images.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {["Product Photography", "Photo Story"].map((tag, i) => (
                                <span key={i} className="px-5 py-2 rounded-xl bg-[#FF90E8] border-[3px] border-black text-black font-black uppercase tracking-widest text-xs shadow-[3px_3px_0px_#1D1B1B] hover:-translate-y-1 transition-transform">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Rectangular Image Collage for Photography */}
                    <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                        <img src={pvsImages[22]} alt="Photo 1" className="w-full h-48 md:h-56 object-cover rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_#1D1B1B] hover:-translate-y-1 transition-transform bg-gray-100" />
                        <img src={photo2} alt="Photo 2" className="w-full h-48 md:h-56 object-cover rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_#1D1B1B] hover:-translate-y-1 transition-transform translate-y-6 bg-gray-100" />
                        <img src={pvsImages[8]} alt="Photo 3" className="w-full h-48 md:h-56 object-cover rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_#1D1B1B] col-span-2 mt-4 hover:-translate-y-1 transition-transform bg-gray-100" />
                    </div>
                </section>

            </div>
        </div>
    );
}