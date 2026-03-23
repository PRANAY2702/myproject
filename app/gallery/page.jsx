"use client";

import React, { useEffect, useState } from "react";
import {
    Heart,
    Loader2,
    Search,
    Image as ImageIcon,
    Camera,
    Calendar,
    Palette,
    X
} from "lucide-react";

import { useLogin } from "@/app/context/AuthContext";
import { toast } from "sonner";
import { pvsImages } from "./helper";

export default function GalleryPage() {
    const { user, profile } = useLogin();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("pvs_year");
    const [searchQuery, setSearchQuery] = useState("");
    const [likedPosts, setLikedPosts] = useState(new Set());
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        fetchGallery();
    }, []);

    // ---------------------------
    // FETCH GALLERY
    // ---------------------------
    const fetchGallery = async () => {
        try {
            setLoading(true);

            const res = await fetch("/api/gallery");
            const data = await res.json();

            setSubmissions(data || []);

            if (profile?._id) {
                const likedSet = new Set(
                    data
                        .filter((sub) => sub.likedBy?.includes(profile._id))
                        .map((sub) => sub._id)
                );
                setLikedPosts(likedSet);
            }
        } catch (error) {
            toast.error("Failed to load artworks.");
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------
    // LIKE / UNLIKE
    // ---------------------------
    const handleLike = async (submissionId) => {
        if (!user) {
            toast.error("Please login to like artworks!");
            return;
        }

        try {
            const token = await user.getIdToken();

            const res = await fetch("/api/gallery/like", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ submissionId }),
            });

            const data = await res.json();

            setSubmissions((prev) =>
                prev.map((sub) =>
                    sub._id === submissionId
                        ? { ...sub, likesCount: data.likesCount }
                        : sub
                )
            );

            setLikedPosts((prev) => {
                const newSet = new Set(prev);
                data.liked
                    ? newSet.add(submissionId)
                    : newSet.delete(submissionId);
                return newSet;
            });
        } catch {
            toast.error("Failed to update like.");
        }
    };

    // ---------------------------
    // FILTER + SEARCH
    // ---------------------------
    const filteredSubmissions = submissions.filter((sub) => {
        const matchesFilter =
            activeFilter === "canvas_painting" ||
            sub.category === activeFilter;

        const matchesSearch = sub.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    return (
        <div className="min-h-screen flex flex-col pt-24 md:pt-28 pb-6 px-4 md:px-8 text-[#1D1B1B] font-sans selection:bg-[#F6E245] selection:text-black">

            <div className="max-w-7xl mx-auto w-full flex flex-col relative z-10 gap-6">

                {/* ─── FILTERS & SEARCH BAR ─── */}
                <div className="bg-[#F6E245] border-[3px] border-[#1D1B1B] rounded-[2rem] shadow-[2px_2px_0px_#1D1B1B] px-4 py-3 flex flex-col lg:flex-row items-center justify-between gap-4 shrink-0">

                    {/* Horizontal Scrollable Filters for Mobile */}
                    <div style={{ scrollbarWidth: "none" }} className="flex gap-3 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-hide snap-x">
                        <FilterButton active={activeFilter === "art"} onClick={() => setActiveFilter("art")} icon={<Palette size={18} />} label="Art Submissions 2026" />
                        <FilterButton active={activeFilter === "photography"} onClick={() => setActiveFilter("photography")} icon={<Camera size={18} />} label="Photography Submissions 2026" />
                        <FilterButton active={activeFilter === "pvs_year"} onClick={() => setActiveFilter("pvs_year")} icon={<Calendar size={18} />} label="SPECTRUM 2023-25" />
                    </div>

                    {/* Search Input
                    <div className="relative w-full lg:w-80 shrink-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1D1B1B] w-5 h-5 stroke-[3]" />
                        <input
                            type="text"
                            placeholder="Search artworks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border-[3px] border-[#1D1B1B] rounded-xl text-sm font-bold text-[#1D1B1B] placeholder-gray-500 focus:outline-none focus:shadow-[4px_4px_0px_#1D1B1B] transition-all"
                        />
                    </div> */}
                </div>

                {/* ─── GALLERY AREA ─── */}
                <div className="w-full border-2 rounded-2xl p-4 bg-white/70">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <Loader2 className="w-12 h-12 animate-spin text-[#1D1B1B] mb-4" />
                            <p className="font-black uppercase tracking-widest text-[#1D1B1B] text-sm">Loading Gallery...</p>
                        </div>
                    ) : filteredSubmissions.length === 0 && activeFilter !== 'pvs_year' ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="bg-white border-[3px] border-black p-6 rounded-3xl shadow-[4px_4px_0px_#1D1B1B] mb-6">
                                <ImageIcon className="w-16 h-16 text-gray-400" />
                            </div>
                            <h3 className="text-2xl font-black uppercase text-[#1D1B1B]">No Artworks Found</h3>
                            <p className="font-bold text-gray-800 mt-2">Try adjusting your filters or search term.</p>
                        </div>
                    ) : filteredSubmissions.length > 0 ? (

                        /* PINTEREST MASONRY LAYOUT */
                        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 md:gap-6 w-full">
                            {filteredSubmissions.map((sub) => {
                                const isLiked = likedPosts.has(sub._id);

                                return (
                                    <div
                                        key={sub._id}
                                        onClick={() => setSelectedImage(sub)}
                                        className="break-inside-avoid mb-4 md:mb-6 group relative rounded-2xl bg-white border-[3px] border-[#1D1B1B] shadow-[4px_4px_0px_#1D1B1B] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#1D1B1B] transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
                                    >
                                        {/* Image Area - Height is auto to allow masonry unevenness */}
                                        <div className="w-full overflow-hidden bg-gray-100 border-b-[3px] border-[#1D1B1B]">
                                            <img
                                                src={sub.imageUrl}
                                                alt={sub.title}
                                                loading="lazy"
                                                className="w-full h-auto object-cover transition duration-500 group-hover:scale-105"
                                            />
                                        </div>

                                        {/* Info Area */}
                                        <div className="p-3 md:p-4 flex flex-col justify-between">
                                            <div className="mb-3">
                                                <h3 className="font-black text-[#1D1B1B] text-sm md:text-base truncate uppercase tracking-tight">
                                                    {sub.title}
                                                </h3>
                                                <p className="text-gray-600 font-bold text-xs truncate mt-0.5">
                                                    By {sub.user?.fullName || "Artist"}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="bg-[#f4f4f4] border-2 border-[#1D1B1B] px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest text-gray-600">
                                                    {sub.category}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleLike(sub._id);
                                                    }}
                                                    className={`border-2 border-[#1D1B1B] rounded-full p-1.5 transition-all ${isLiked ? "bg-[#FF90E8]" : "bg-white hover:bg-gray-100"
                                                        } shadow-[2px_2px_0px_#1D1B1B] active:translate-y-px active:shadow-none`}
                                                >
                                                    <Heart
                                                        size={16}
                                                        className={isLiked ? "fill-[#1D1B1B] text-[#1D1B1B]" : "text-[#1D1B1B]"}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* PINTEREST MASONRY LAYOUT - PVS ARCHIVE */
                        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 md:gap-6 w-full">
                            {pvsImages.map((pvsImg, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedImage({ isPvsImage: true, src: pvsImg })}
                                    className="break-inside-avoid mb-4 md:mb-6 group relative rounded-2xl bg-white border-[3px] border-[#1D1B1B] shadow-[4px_4px_0px_#1D1B1B] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#1D1B1B] transition-all duration-200 cursor-pointer overflow-hidden"
                                >
                                    <img
                                        src={pvsImg}
                                        alt={`SPECTRUM Image ${idx + 1}`}
                                        loading="lazy"
                                        className="w-full h-auto object-cover transition duration-500 group-hover:scale-105"
                                    />
                                    {/* <div className="absolute top-2 left-2 bg-[#F6E245] border-2 border-black px-2 py-1 rounded-md shadow-sm">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-black">Archive</span>
                                    </div> */}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── MODAL ─── */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 pt-32 overflow-y-auto"
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white border-[4px] border-[#1D1B1B] rounded-3xl shadow-[8px_8px_0px_#F6E245] animate-in fade-in zoom-in-95 duration-200 w-full max-w-2xl flex flex-col overflow-hidden mb-12"
                    >
                        {/* Modal Header */}
                        <div className="bg-[#F6E245] border-b-[4px] border-[#1D1B1B] p-3 md:p-4 flex justify-between items-center shrink-0">
                            <h3 className="font-black uppercase tracking-widest text-[#1D1B1B] text-sm md:text-base">
                                {selectedImage.isPvsImage ? "Archive Viewer" : "Artwork Viewer"}
                            </h3>
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="bg-white border-2 border-[#1D1B1B] p-1.5 rounded-full shadow-[2px_2px_0px_#1D1B1B] hover:bg-gray-100 transition-all active:translate-y-px active:shadow-none"
                            >
                                <X size={18} className="text-[#1D1B1B] stroke-[3]" />
                            </button>
                        </div>

                        {/* Modal Image Area */}
                        <div className="p-4 bg-[#f4f4f4] flex items-center justify-center">
                            <img
                                src={selectedImage.isPvsImage ? selectedImage.src : selectedImage.imageUrl}
                                alt={selectedImage.isPvsImage ? "SPECTRUM Image" : selectedImage.title}
                                className="max-h-[50vh] w-auto object-contain rounded-xl border-[3px] border-[#1D1B1B] shadow-[4px_4px_0px_#1D1B1B] bg-white"
                            />
                        </div>

                        {/* Modal Footer Info (Only for User Submissions) */}
                        {!selectedImage.isPvsImage && (
                            <div className="border-t-[4px] border-[#1D1B1B] bg-white p-4 flex items-center justify-between shrink-0 flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full border-[2px] border-[#1D1B1B] shadow-[2px_2px_0px_#1D1B1B] overflow-hidden bg-[#F6E245] flex items-center justify-center shrink-0">
                                        <img
                                            src={selectedImage.user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedImage.user?.fullName}`}
                                            className="w-full h-full object-cover"
                                            alt="Avatar"
                                        />
                                    </div>
                                    <div>
                                        <h2 className="font-black text-[#1D1B1B] text-base uppercase leading-tight">
                                            {selectedImage.title}
                                        </h2>
                                        <p className="font-bold text-gray-500 text-xs">
                                            {selectedImage.user?.fullName || "Anonymous Artist"}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleLike(selectedImage._id)}
                                    className={`flex items-center gap-2 px-4 py-2 border-[2px] border-[#1D1B1B] rounded-xl font-black uppercase text-xs transition-all shadow-[3px_3px_0px_#1D1B1B] active:translate-y-1 active:translate-x-1 active:shadow-none ${likedPosts.has(selectedImage._id)
                                            ? "bg-[#FF90E8] text-[#1D1B1B]"
                                            : "bg-white text-[#1D1B1B] hover:bg-gray-50"
                                        }`}
                                >
                                    <Heart
                                        size={18}
                                        className={likedPosts.has(selectedImage._id) ? "fill-[#1D1B1B] text-[#1D1B1B]" : "text-[#1D1B1B]"}
                                    />
                                    <span>{selectedImage.likesCount}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── CUSTOM COMPONENTS ───

const FilterButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-[3px] border-[#1D1B1B] font-black uppercase tracking-widest text-xs md:text-sm transition-all whitespace-nowrap snap-start shrink-0 
        ${active
                ? "bg-[#A5D6A7] text-[#1D1B1B] shadow-none" // Pressed state
                : "bg-white text-[#1D1B1B] hover:bg-gray-50"
            }`}
    >
        {icon}
        {label}
    </button>
);