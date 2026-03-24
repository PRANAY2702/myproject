"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { useLogin } from '@/app/context/AuthContext';

const SPECTRUMLogo = 'https://spectrum.gumlet.io/SPECTRUMLogoBgLess_l37nhk';

const Navbar = () => {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const [showSplash, setShowSplash] = useState(() => pathname === '/');
    const [hasAnimated, setHasAnimated] = useState(false);

    // Destructuring your updated AuthContext
    const { user, profile, logout, loading } = useLogin();
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (pathname === '/' && !hasAnimated) {
            const timer = setTimeout(() => {
                setShowSplash(false);
                setHasAnimated(true);
            }, 1500);
            return () => clearTimeout(timer);
        } else {
            setShowSplash(false);
        }
    }, [pathname, hasAnimated]);

    useEffect(() => {
        setIsOpen(false);
        setIsDropdownOpen(false);
    }, [pathname]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (pathname?.startsWith('/admin-apc')) return null;

    const isReady = !loading || !!user;

    const navLinks = [
        { name: 'About', href: '/about' },
        { name: 'Events & Timeline', href: '/events' },
        { name: 'Sponsors', href: '/sponsors' },
        { name: 'Team', href: '/team' },
        { name: 'Gallery', href: '/gallery' },
        { name: 'Contact', href: '/contact' },
    ];

    const leftLinks = navLinks.slice(0, 3).map((link) => ({ ...link, name: link.name.toUpperCase() }));
    const rightLinks = navLinks.slice(3, 6).map((link) => ({ ...link, name: link.name.toUpperCase() }));

    // Helper to safely get the user's name from either Mongo (profile) or Firebase (user)
    const getDisplayName = () => {
        return profile?.fullName || user?.displayName || 'User';
    };

    // if (pathname === '/') return null;

    return (
        <>
            {/* 1. SPLASH SCREEN OVERLAY */}
            {pathname === '/' && !hasAnimated && (
                <div
                    className={`fixed inset-0 bg-white z-[90] transition-opacity duration-1000 ease-[cubic-bezier(0.65,0,0.35,1)] ${showSplash ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                />
            )}

            {/* 2. THE ANIMATED LOGO */}
            <Link
                href="/"
                className={`fixed z-[100] left-1/2 transition-all duration-[1200ms] ease-[cubic-bezier(0.65,0,0.35,1)] flex justify-center items-center ${showSplash
                        ? 'top-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[550px] h-[150px] md:h-[250px]' // Splash Size
                        : 'top-[18px] md:top-[22px] -translate-x-1/2 -translate-y-0 w-[120px] md:w-[150px] h-[32px] md:h-[40px] pointer-events-auto hover:scale-105' // Thinner Navbar Size & Position
                    }`}
            >
                <img
                    src={SPECTRUMLogo}
                    alt="Spectrum"
                    className="object-contain drop-shadow-sm w-full h-full"
                />
            </Link>

            {/* 3. MAIN NAVBAR */}
            <header className="fixed top-0 w-full z-50 px-4 py-2 md:py-3 flex justify-center">
                <nav
                    className={`w-full max-w-5xl rounded-2xl md:rounded-full bg-white transition-all duration-700 delay-300 border-2 border-black  ${showSplash ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                        } ${isScrolled
                            ? 'shadow-md py-0.5'
                            : 'shadow-sm py-1'
                        }`}
                >
                    <div className="relative px-3 md:px-5 flex justify-between items-center min-h-[50px] md:min-h-[56px]">

                        {/* --- LEFT SIDE: 4 Links --- */}
                        <div className="hidden lg:flex items-center justify-end gap-1 flex-1 pr-4 lg:pr-6">
                            {leftLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`px-3 py-1.5 text-[13px] xl:text-[14px] font-semibold transition-all rounded-full ${pathname === link.href
                                            ? 'text-black bg-rose-100/50'
                                            : 'text-gray-600 hover:text-black hover:bg-black/5'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        {/* --- CENTER: Empty space for smaller logo --- */}
                        <div className="w-[120px] md:w-[150px] shrink-0" />

                        {/* --- RIGHT SIDE: 3 Links + 1 Auth Section --- */}
                        <div className="hidden lg:flex items-center justify-start gap-1 flex-1 pl-4 lg:pl-6">
                            {rightLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`px-3 py-1.5 text-[13px] xl:text-[14px] font-semibold transition-all rounded-full ${pathname === link.href
                                            ? 'text-black bg-rose-100/50'
                                            : 'text-gray-600 hover:text-black hover:bg-black/5'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}

                            {/* Auth Login / Profile */}
                            <div className="ml-2 flex items-center">
                                {!isReady ? (
                                    <div className="w-7 h-7 bg-black/10 animate-pulse rounded-full"></div>
                                ) : user ? (
                                    <div className="relative" ref={dropdownRef}>
                                        <button
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="flex items-center gap-2 group transition-all ml-1"
                                        >
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm group-hover:scale-105 transition-transform">
                                                {getDisplayName().charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-[13px] font-semibold text-gray-700 group-hover:text-black transition-colors">
                                                {getDisplayName().split(' ')[0]}
                                            </span>
                                            <ChevronDown size={14} className={`text-gray-400 group-hover:text-gray-700 transition-all ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isDropdownOpen && (
                                            <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-gray-700 hover:bg-gray-50 hover:text-black transition-all">
                                                    <UserIcon size={16} /> Profile
                                                </Link>
                                                <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-red-600 hover:bg-red-50 transition-all border-t border-gray-100">
                                                    <LogOut size={16} /> Logout
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Link href="/login" className="px-5 py-2 ml-1 bg-black text-white text-[13px] xl:text-[14px] font-semibold rounded-full hover:bg-gray-800 transition-all shadow-md">
                                        REGISTER NOW
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* --- MOBILE: Hamburger Menu --- */}
                        <div className="lg:hidden flex-1 flex justify-end">
                            <button
                                onClick={() => setIsOpen(true)}
                                className={`p-2 text-gray-800 hover:bg-black/5 rounded-xl transition-all ${showSplash ? 'opacity-0' : 'opacity-100'}`}
                            >
                                <Menu size={24} />
                            </button>
                        </div>

                    </div>
                </nav>
            </header>

            {/* --- MOBILE DRAWER --- */}
            <div
                className={`fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                onClick={() => setIsOpen(false)}
            >
                <div
                    className={`absolute right-0 top-0 h-full w-72 bg-white border-l border-gray-200 flex flex-col shadow-2xl transition-transform duration-400 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-5 flex justify-between items-center border-b border-gray-100">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Spectrum '26</span>
                        <button onClick={() => setIsOpen(false)} className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Nav Links */}
                    <div className="p-4 flex flex-col overflow-y-auto flex-1 gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`text-[18px] font-semibold py-3 px-4 rounded-xl transition-colors ${pathname === link.href ? 'text-black bg-gray-100' : 'text-gray-600 hover:text-black hover:bg-gray-50'}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-5 border-t border-gray-100 space-y-3 bg-gray-50/50">
                        {user ? (
                            <>
                                <Link href="/profile" className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 transition-colors">
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center font-bold text-[14px] text-white">
                                        {getDisplayName().charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-[14px] font-semibold text-gray-900 truncate">{getDisplayName()}</span>
                                        <span className="text-[11px] text-gray-500 truncate">{user.email}</span>
                                    </div>
                                </Link>
                                <div className="grid grid-cols-2 gap-2">
                                    <Link href="/profile" className="flex items-center justify-center py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-[13px] font-semibold text-gray-800 transition-colors">
                                        Profile
                                    </Link>
                                    <button onClick={logout} className="flex items-center justify-center py-2.5 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg text-[13px] font-semibold text-red-600 transition-colors">
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <Link href="/login" className="w-full flex items-center justify-center gap-2 py-3 bg-black text-white hover:bg-gray-800 rounded-xl font-semibold text-[15px] shadow-md transition-all">
                                Get Started <ArrowRight size={16} />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;
