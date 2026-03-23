import React from 'react';
import Image from 'next/image';
import { Phone, Mail, Instagram, MapPin, ArrowUpRight, Building2 } from 'lucide-react';
import SartajSingh from "../../public/team/Sartaj_Convener.jpg";
import AniketSinghIndora from "../../public/team/Aniket_CoConvener.jpeg";
import ShubhamSoni from "../../public/team/Shubham_Reg.jpg";
import SakshamPrashar from "../../public/team/Saksham_PublicityMedia.jpeg";

// Import your logos
import APCLogo from '@/assets/images/APCLogoColor.jpg'; // Adjust path if needed
import SPECTRUMLogo from '@/assets/images/SPECTRUMLogoBgLess.png'; // Adjust path if needed

export default function ContactPage() {
    // Primary organizational contacts
    const orgContacts = [
        {
            id: 'spectrum',
            role: "Official Event Page",
            email: "spectrum.apcpec@gmail.com",
            instagram: "spectrum_apc",
            gradient: "from-rose-500/10 to-transparent",
            logo: SPECTRUMLogo,
            logoAlt: "Spectrum '26"
        },
        {
            id: 'apc',
            role: "Art & Photography Club",
            email: "apc@pec.edu.in",
            instagram: "artandphotographyclub",
            gradient: "from-blue-500/10 to-transparent",
            logo: APCLogo,
            logoAlt: "APC"
        }
    ];

    // Team member contacts
    const teamContacts = [
        {
            id: 1,
            name: "Sartaj Singh",
            role: "Convener",
            phone: "+91 86995 58869",
            color: "from-orange-100 to-rose-100",
            avatar: SartajSingh.src
        },
        {
            id: 2,
            name: "Aniket Singh Indora",
            role: "Co-Convener & Marketing Head",
            phone: "+91 62838 15847",
            color: "from-emerald-100 to-teal-100",
            avatar: AniketSinghIndora.src
        },
        {
            id: 3,
            name: "Shubham Soni",
            role: "Registration Head",
            phone: "+91 63757 63778",
            color: "from-blue-100 to-indigo-100",
            avatar: ShubhamSoni.src
        },
        {
            id: 4,
            name: "Saksham Prashar",
            role: "Publicity & Media Relations Head",
            phone: "+91 98178 54151",
            color: "from-purple-100 to-pink-100",
            avatar: SakshamPrashar.src
        },
    ];

    const ContactLink = ({ href, icon: Icon, text, type }) => (
        <a
            href={href}
            target={type === 'instagram' ? '_blank' : '_self'}
            rel="noopener noreferrer"
            // UPDATED: Added solid border, background, and an interactive hard shadow press effect
            className="group/link flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
        >
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors border-2 border-black ${type === 'instagram' ? 'bg-white group-hover/link:bg-pink-100 text-gray-900' :
                    'bg-white group-hover/link:bg-gray-200 text-gray-900'
                    }`}>
                    <Icon size={16} strokeWidth={2.5} />
                </div>
                <span className="text-[14px] font-bold text-gray-800 group-hover/link:text-black transition-colors">
                    {text}
                </span>
            </div>
            <ArrowUpRight size={16} className="text-black transition-colors opacity-0 group-hover/link:opacity-100 -translate-x-2 translate-y-2 group-hover/link:translate-x-0 group-hover/link:translate-y-0" />
        </a>
    );

    return (
        <div className="min-h-screen relative overflow-hidden pt-24 pb-20 selection:bg-black/10">

            {/* Ambient Gradient Orbs (Background) */}
            <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] rounded-full bg-rose-200/30 mix-blend-multiply blur-[120px] pointer-events-none z-0" />
            <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/30 mix-blend-multiply blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-purple-200/20 mix-blend-multiply blur-[120px] pointer-events-none z-0" />

            <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10">

                {/* Team Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mt-8">
                    {teamContacts.map((member) => (
                        <div
                            key={member.id}
                            // UPDATED: Border and shadow
                            className="bg-white border-2 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:translate-x-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 flex flex-col justify-between group"
                        >
                            <div className="mb-6 flex items-center gap-4">
                                {/* UPDATED: Avatar gets a border and shadow too */}
                                <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0 group-hover:scale-105 transition-transform duration-300 bg-white z-10">
                                    <Image
                                        src={member.avatar}
                                        alt={member.name}
                                        width={100}
                                        height={100}
                                        className="w-full h-full rounded-full object-cover overflow-hidden"
                                    />
                                </div>
                                <div>
                                    <h4 className="text-[17px] font-black text-gray-900 leading-tight mb-1">{member.name}</h4>
                                    <p className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">
                                        {member.role}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 mt-auto">
                                <ContactLink href={`tel:${member.phone.replace(/\s+/g, '')}`} icon={Phone} text={member.phone} type="phone" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid mt-10 grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

                    {/* Featured Contacts (Spectrum & APC) */}
                    {orgContacts.map((org) => (
                        <div
                            key={org.id}
                            // UPDATED: Solid backgrounds, borders, and hard shadows
                            className="relative overflow-hidden bg-white border-2 border-black rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:translate-x-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 group"
                        >
                            {/* Internal decorative gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${org.gradient} opacity-50 pointer-events-none`} />

                            <div className="absolute -right-4 -top-4 p-6 opacity-[0.05] scale-150 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                                {org.id === 'spectrum' ? <MapPin size={160} color="black" /> : <Building2 size={160} color="black" />}
                            </div>

                            <div className="relative z-10 mb-8">
                                <div className="h-10 md:h-12 mb-3 flex items-center justify-start">
                                    <Image
                                        src={org.logo}
                                        alt={org.logoAlt}
                                        className="h-full rounded w-auto object-contain drop-shadow-sm mix-blend-multiply"
                                    />
                                </div>
                                <p className="text-[13px] font-black text-gray-500 uppercase tracking-widest mt-1">
                                    {org.role}
                                </p>
                            </div>

                            <div className="relative z-10 flex flex-col gap-3">
                                <ContactLink href={`mailto:${org.email}`} icon={Mail} text={org.email} type="email" />
                                <ContactLink href={`https://instagram.com/${org.instagram}`} icon={Instagram} text={`@${org.instagram}`} type="instagram" />
                            </div>
                        </div>
                    ))}

                    {/* Map Section */}
                    {/* UPDATED: Solid bg, border-2 border-black, and shadow */}
                    <div className="md:col-span-2 relative w-full h-[300px] md:h-[380px] rounded-3xl p-2 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group">
                        <div className="w-full h-full rounded-[1.25rem] overflow-hidden relative border-2 border-black bg-gray-100">
                            <iframe
                                src="https://maps.google.com/maps?q=Punjab%20Engineering%20College&t=&z=15&ie=UTF8&iwloc=&output=embed"
                                className="w-full h-full grayscale-[0.5] opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 ease-in-out border-0"
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                            {/* Map Overlay Badge - UPDATED matching styles */}
                            <div className="absolute top-4 left-4 md:top-6 md:left-6 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-2.5 rounded-full flex items-center gap-2.5 transition-transform group-hover:scale-[1.02]">
                                <Building2 size={16} className="text-gray-900" />
                                <span className="text-[13px] font-bold text-gray-900 tracking-wide">
                                    APC Room, SAC, Punjab Engineering College
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}