"use client";
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { CloudLayer } from "@/components/DynamicBG";
import { teamData } from "@/data/team.js";
import { Sparkles } from "lucide-react"; // <-- Added for the hero badge

/* ================= 3D CARD COMPONENT ================= */

const Stack3DCard = ({ member, id, hoveredId, setHoveredId }) => {
    const [isLifted, setIsLifted] = useState(false);

    // If there is a hovered card, and it's NOT this one, dim it.
    const isDimmed = hoveredId !== null && hoveredId !== id;

    return (
        <div
            className="card-container"
            style={{
                position: "relative",
                width: "100%",
                maxWidth: "280px",
                height: "380px",
                perspective: "1000px",
                cursor: "pointer",
                // ADDED: Smooth transition for dimming effect
                opacity: isDimmed ? 0.4 : 1,
                filter: isDimmed ? "brightness(0.6) blur(2px)" : "brightness(1) blur(0px)",
                transition: "opacity 0.4s ease, filter 0.4s ease",
            }}
            onMouseEnter={() => {
                setIsLifted(true);
                setHoveredId(id); // Tell parent this card is hovered
            }}
            onMouseLeave={() => {
                setIsLifted(false);
                setHoveredId(null); // Clear parent hover state
            }}
            onClick={() => setIsLifted(!isLifted)}
        >
            {/* BOTTOM LAYER: Socials Only */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#ffffff",
                    borderRadius: "20px",
                    boxShadow: "8px 8px 0px 0px rgba(0,0,0,0.9)",
                    border: "2px solid #000000",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    padding: "20px",
                }}
            >
                <div style={{ paddingBottom: "0px", textAlign: "center", width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
                        {member.socials?.linkedin && (
                            <a
                                href={`https://www.linkedin.com/in/${member.socials.linkedin}`} target="_blank" rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    display: "flex", alignItems: "center", justifyContent: "center", width: "40px",
                                    height: "40px", borderRadius: "50%", backgroundColor: "#f1f5f9", transition: "0.2s"
                                }}
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0077b5" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                            </a>
                        )}
                        {member.socials?.instagram && (
                            <a
                                href={`https://www.instagram.com/${member.socials.instagram}`} target="_blank" rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    display: "flex", alignItems: "center", justifyContent: "center", width: "40px",
                                    height: "40px", borderRadius: "50%", backgroundColor: "#f1f5f9", transition: "0.2s"
                                }}
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* TOP LAYER: The Image + Name Overlay */}
            <div
                className="image-layer"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    borderRadius: "20px",
                    overflow: "hidden",
                    zIndex: 2,
                    transform: isLifted ? "translateY(-80px) translateX(-5px) scale(1.05)" : "translateY(0) scale(1)",
                    boxShadow: isLifted ? "0 25px 50px rgba(0,0,0,0.3)" : "none",
                    transition: "transform 0.5s cubic-bezier(0.19, 1, 0.22, 1), box-shadow 0.5s ease",
                    backgroundColor: "#eee",
                    border: "6px solid black",
                }}
            >
                <img
                    src={member.coverImage}
                    alt={member.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />

                <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    display: "flex", flexDirection: "column", justifyContent: "flex-end",
                    padding: "6px 12px",
                    pointerEvents: "none",
                    background: "black",
                    border: "2px solid white", borderRadius: "16px",
                    margin: "4px"
                }}>
                    <h3 className="text-center font-bold text-xl text-white">
                        {member.name}
                    </h3>
                    <span className="text-[#FFF29F] text-base text-center uppercase">
                        {member.section}
                    </span>
                </div>
            </div>
        </div>
    );
};

/* ================= PAGE LAYOUT ================= */

export default function TeamPage() {
    // ADDED: State to track which card is currently being hovered globally
    const [hoveredId, setHoveredId] = useState(null);

    return (
        // Changed to min-h-screen and removed hardcoded bg to respect global bg
        <main className="min-h-screen w-full text-black selection:bg-black/20 pb-20 font-sans relative overflow-x-hidden">
            <Navbar />
            <CloudLayer />

            {/* Decorative Background Elements */}
            <div className="absolute top-20 -left-20 w-64 h-64 bg-[#F6E245] rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0 pointer-events-none"></div>
            <div className="absolute top-40 -right-20 w-72 h-72 bg-[#5AE0FE] rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0 pointer-events-none"></div>

            {/* Hero Header */}
            <div className="w-full text-white pt-28 mb-12 relative z-10 flex flex-col items-center justify-center overflow-hidden">
                {/* Marquee Background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none whitespace-nowrap overflow-hidden">
                    <h1 className="text-[150px] text-[#004360] font-black uppercase tracking-tighter">APC TEAM 2026</h1>
                </div>
                
                <div className="relative z-20 text-center px-4 mt-8">
                    <div className="inline-flex items-center gap-2 bg-[#F6E245] text-black px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-black mb-6 shadow-sm">
                        <Sparkles size={14} className="shrink-0" />
                        <span>The Minds Behind It All</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 text-[#FFF]">Meet The Team</h1>
                    <p className="text-gray-100 text-lg md:text-xl font-semibold italic max-w-3xl mx-auto">
                        The passionate team working tirelessly to bring SPECTRUM 2026 to life.
                    </p>
                </div>
            </div>

            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0px 20px 100px", position: "relative", zIndex: 10 }}>

                {/* MAP OVER YEAR GROUPS */}
                {teamData.map((group, groupIndex) => (
                    <div key={groupIndex} style={{ marginBottom: "100px" }}>

                        {/* Year Section Header */}
                        <div style={{ textAlign: "center", marginBottom: "50px" }}>
                            <h2
                                className="font-kanit"
                                style={{
                                    fontSize: "3rem",
                                    fontWeight: 600,
                                    color: "#fff",
                                    userSelect: "none", // Prevents text selection for a cleaner look
                                    textTransform: "uppercase"
                                }}
                            >
                                {group.year}
                            </h2>
                        </div>

                        {/* GRID OF CARDS */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                                gap: "60px 30px",
                                justifyItems: "center",
                            }}
                        >
                            {group.members.map((member, memberIndex) => {
                                // Create a unique ID for each card based on its group and index
                                const uniqueCardId = `${groupIndex}-${memberIndex}`;

                                return (
                                    <Stack3DCard
                                        key={memberIndex}
                                        member={member}
                                        id={uniqueCardId}
                                        hoveredId={hoveredId}
                                        setHoveredId={setHoveredId}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}

            </div>
        </main>
    );
}