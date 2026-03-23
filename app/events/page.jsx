"use client";

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Ticket, BookOpen, Star, Sparkles, MapPin, CalendarDays, ArrowRight, Trophy, Banknote } from 'lucide-react';
import { EVENTS_DATA } from '@/data/events';

export default function EventsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full text-black selection:bg-black/20 pb-20 font-sans relative overflow-x-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-20 -left-20 w-64 h-64 bg-[#F6E245] rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0"></div>
      <div className="absolute top-40 -right-20 w-72 h-72 bg-[#5AE0FE] rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0"></div>

      {/* Hero Header */}
      <div className="w-full text-white pt-28 relative z-10 flex flex-col items-center justify-center overflow-hidden">
        {/* Marquee Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none whitespace-nowrap overflow-hidden">
          <h1 className="text-[150px] text-[#004360] font-black uppercase tracking-tighter">APC SPECTRUM 2026</h1>
        </div>
        
        <div className="relative z-20 text-center px-4">
          <div className="inline-flex items-center gap-2 bg-[#F6E245] text-black px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-2 border-transparent mb-6">
            <Sparkles size={14} className="shrink-0" />
            <span>The Ultimate Showdown</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4">Official Events</h1>
          <p className="text-gray-100 text-lg md:text-xl font-semibold italic max-w-3xl mx-auto">
            Review the rulebooks, check the rounds, and secure your spot in the ultimate art and photography contests.
          </p>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 relative z-20 space-y-16">
        {EVENTS_DATA.map((event, index) => (
          <EventCard key={event.id} event={event} index={index} router={router} />
        ))}
      </div>

    </div>
  );
}

// --- Sub-components ---

const EventCard = ({ event, index, router }) => {
  const isEven = index % 2 === 0;

  return (
    <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} bg-white border-[4px] border-black rounded-[2.5rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden hover:-translate-y-1 transition-transform duration-300 group`}>
      
      {/* LEFT SIDE: POSTERS & PRIZES SECTION */}
      <div className={`w-full lg:w-1/2 p-4 sm:p-6 bg-gray-50 flex flex-col gap-6 ${isEven ? 'border-b-[4px] lg:border-b-0 lg:border-r-[4px]' : 'border-b-[4px] lg:border-b-0 lg:border-l-[4px]'} border-black`}>
        
        {/* Posters Container */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-1">
          {event.posters.map((posterStr, i) => (
            <div key={i} className="relative w-full max-w-[280px] sm:max-w-none sm:w-full aspect-[4/5] rounded-2xl border-[3px] border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-gray-200">
               <div 
                 className="w-full h-full bg-cover bg-center flex items-center justify-center text-black/20 font-black uppercase text-2xl"
                 style={{ backgroundColor: event.accentColor }}
               >
                 <Image src={posterStr} alt={`${event.title} Poster`} fill style={{ objectFit: "cover" }} />
               </div>
               
               {event.rounds > 1 && (
                  <div className="absolute top-3 left-3 bg-black text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-white shadow-sm z-10">
                    Round {i + 1}
                  </div>
               )}
            </div>
          ))}
        </div>

        {/* Prize Pool & Registration Fees Container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
          
          {/* Prize Pool Block */}
          <div 
            className="border-[3px] border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center transition-transform hover:-translate-y-1"
            style={{ backgroundColor: event.accentColor }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={16} className="text-black" />
              <span className="text-[10px] font-black uppercase tracking-widest text-black/70">Prize Pool</span>
            </div>
            <p className="text-2xl font-black text-black tracking-tight">{event.prizePool}</p>
          </div>

          {/* Registration Fee Block */}
          <div className="bg-white border-[3px] border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center transition-transform hover:-translate-y-1">
            <div className="flex items-center gap-2 mb-1">
              <Banknote size={16} className="text-black" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Reg. Fee</span>
            </div>
            <p className="text-sm font-bold text-black leading-tight">{event.registrationFees}</p>
          </div>

        </div>
      </div>

      {/* RIGHT SIDE: DETAILS SECTION */}
      <div className="w-full lg:w-1/2 p-6 md:p-10 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border-2 border-black">
              {event.category}
            </span>
            <span 
              className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border-2 border-black text-black flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              style={{ backgroundColor: event.accentColor }}
            >
              <Star size={12} fill="currentColor" /> {event.rounds} {event.rounds === 1 ? 'Round' : 'Rounds'}
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-black mb-4 leading-none">
            {event.title}
          </h2>

          <div className="flex flex-col gap-2 mb-6 text-sm font-bold text-gray-700">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-black shrink-0" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-black shrink-0" />
              <span>{event.location}</span>
            </div>
          </div>

          <p className="text-gray-600 font-medium leading-relaxed mb-8 text-sm md:text-base border-l-[4px] border-black pl-4">
            {event.description}
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col xl:flex-row gap-4 mt-auto">
          <a 
            href={event.rulebookUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-[3px] border-black bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
          >
            <BookOpen size={16} className="shrink-0" /> 
            <span className="whitespace-nowrap">Read Rulebook</span>
          </a>
          
          <button 
            onClick={() => router.push('/registration')}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-[3px] border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:brightness-95 active:translate-y-[2px] active:translate-x-[2px] active:shadow-none group/btn"
            style={{ backgroundColor: event.accentColor }}
          >
            <Ticket size={16} className="shrink-0" /> 
            <span className="whitespace-nowrap">Register Now</span>
            <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform shrink-0" />
          </button>
        </div>
      </div>

    </div>
  );
};