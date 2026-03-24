"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Camera, Palette, MapPin, User, Shirt,
    CheckCircle2, Loader2, IndianRupee, ChevronRight, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

import { useLogin } from '@/app/context/AuthContext';

export const CONTEST_DATA = [
    { id: 'photography', label: 'Narrative Lens - The Photo Story Contest (Rs. 200/-)', desc: 'Photography', price: 200, icon: <Camera /> },
    { id: 'canvas_painting', label: 'Painted Arena (Rs. 250/-)', desc: 'Fine Arts', price: 250, icon: <Palette /> },
    { id: 'totebag_painting', label: 'Fabric Fusion (Rs. 120/-)', desc: 'Tote Bag Painting', price: 120, icon: <Shirt /> },
    { id: 'modelling', label: 'Painted Personas (Rs. 250/-)', desc: 'Art & Modelling', price: 250, icon: <User /> }
];

const ContestRegistration = () => {
    const router = useRouter();

    const { user, profile, loading: authLoading } = useLogin();

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingRegistrations, setExistingRegistrations] = useState([]);

    const [selectedContests, setSelectedContests] = useState([]);
    const [cityOfTravel, setCityOfTravel] = useState('Chandigarh');
    const [regType, setRegType] = useState('single'); // 'single', 'group5', 'group10'

    // Dynamic Participants Array
    const [participants, setParticipants] = useState([
        { fullName: '', phone: '', college: '' }
    ]);

    useEffect(() => {
        const initData = async () => {
            if (authLoading) return;
            if (!user) {
                router.push('/login');
                return;
            }

            try {
                // Pre-fill leader details from profile if available
                setParticipants(prev => {
                    const newArr = [...prev];
                    newArr[0] = {
                        fullName: profile?.fullName || '',
                        phone: profile?.phone || '',
                        college: profile?.collegeDetails?.institutionName || ''
                    };
                    return newArr;
                });

                const token = await user.getIdToken();
                const res = await fetch('/api/user/registrations', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setExistingRegistrations(data.map(reg => reg.eventId));
                }
            } catch (error) {
                console.error("Failed to fetch registrations", error);
            } finally {
                setLoading(false);
            }
        };

        initData();
    }, [user, profile, authLoading, router]);

    // Handle Registration Type Change (Single / Groups)
    useEffect(() => {
        let count = 1;
        if (regType === 'group5') count = 5;
        if (regType === 'group10') count = 10;
        
        setParticipants(prev => {
            const newArr = [...prev];
            while (newArr.length < count) {
                newArr.push({ fullName: '', phone: '', college: '' });
            }
            return newArr.slice(0, count);
        });
    }, [regType]);

    const handleParticipantChange = (index, field, value) => {
        setParticipants(prev => {
            const newArr = [...prev];
            newArr[index][field] = value;
            return newArr;
        });
    };

    const handleContestToggle = (id) => {
        if (existingRegistrations.includes(id)) {
            toast.error("You are already registered for this discipline!");
            return;
        }

        setSelectedContests(prev => {
            if (prev.includes(id)) {
                return prev.filter(contestId => contestId !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleComboSelect = () => {
        if (existingRegistrations.includes('canvas_painting') || existingRegistrations.includes('totebag_painting')) {
            toast.error("You are already registered for one or both of these disciplines!");
            return;
        }
        
        setSelectedContests(prev => {
            const newSet = new Set(prev);
            newSet.add('canvas_painting');
            newSet.add('totebag_painting');
            return Array.from(newSet);
        });
        toast.success("Combo selected: Canvas + Tote Bag added!");
    };

    // --- PRICING LOGIC ---
    const hasCanvas = selectedContests.includes('canvas_painting');
    const hasTote = selectedContests.includes('totebag_painting');

    let basePerPerson = 0; 
    let standardBasePerPerson = 0;

    selectedContests.forEach(id => {
        const contest = CONTEST_DATA.find(c => c.id === id);
        if (contest) standardBasePerPerson += contest.price;

        if ((id === 'canvas_painting' || id === 'totebag_painting') && hasCanvas && hasTote) {
            // Handled below
        } else {
            if (contest) basePerPerson += contest.price;
        }
    });

    if (hasCanvas && hasTote) {
        basePerPerson += 300;
    }

    let multiplier = 1;
    if (regType === 'group5') multiplier = 4;
    if (regType === 'group10') multiplier = 7;

    const subtotal = basePerPerson * multiplier;
    const standardTotal = standardBasePerPerson * (regType === 'single' ? 1 : (regType === 'group5' ? 5 : 10));

    // Check if Participant 1 is from PEC
    const pecPattern = /^(pec|punjab engineering college)[\s-]*\d+/i;
    const leaderCollege = participants[0]?.college || '';
    const isPecDiscountApplied = pecPattern.test(leaderCollege.trim());

    // Applying 28% off if eligible
    const finalPrice = isPecDiscountApplied 
        ? Math.round(subtotal * 0.72) 
        : subtotal;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedContests.length === 0) return toast.error("Please select at least one discipline.");

        // Check if all participants have basic info
        for (let i = 0; i < participants.length; i++) {
            if (!participants[i].fullName || !participants[i].phone || !participants[i].college) {
                return toast.error(`Please complete all fields for Participant ${i + 1}.`);
            }
        }

        try {
            setIsSubmitting(true);
            toast.loading("Processing registration...", { id: 'reg-submit' });

            const eventsWithPrices = selectedContests.map(id => {
                const contest = CONTEST_DATA.find(c => c.id === id);
                let itemPrice = contest.price;
                if (basePerPerson > 0) {
                    itemPrice = (contest.price / standardBasePerPerson) * (finalPrice / multiplier);
                }
                return { eventId: id, amountPaid: itemPrice };
            });

            const token = await user.getIdToken();
            const saveRes = await fetch('/api/user/registrations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    eventsData: eventsWithPrices,
                    city: cityOfTravel,
                    registrationType: regType,
                    participants: participants, // Pass along the group details
                    appliedCoupon: isPecDiscountApplied ? `PEC_STUDENT` : null,
                })
            });

            if (!saveRes.ok) {
                const errData = await saveRes.json();
                throw new Error(errData.error || "Failed to save registration");
            }

            toast.success("Registration Submitted Successfully!", { id: 'reg-submit' });
            router.push('/profile');

        } catch (error) {
            toast.error(error.message || "Registration failed.", { id: 'reg-submit' });
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || authLoading) return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>;

    return (
        <div className="min-h-screen w-full pt-28 pb-12 px-4 flex flex-col selection:bg-black selection:text-white text-black">
            <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col relative z-10">
                <div className="mb-6 flex justify-between items-end">
                    <button onClick={() => router.back()} className="text-[10px] uppercase tracking-widest px-3 py-1.5 border-2 bg-white border-black rounded-lg transition-all flex items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] gap-1 mb-1 font-black hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-95 cursor-pointer">
                        <ArrowLeft size={14} strokeWidth={3} /> Back
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        
                        {/* 1. SELECT DISCIPLINES */}
                        <section className="bg-white border-2 border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <StepHeader num="01" title="Select Disciplines" />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                                {CONTEST_DATA.map((contest) => (
                                    <ContestBtn
                                        key={contest.id}
                                        label={contest.label}
                                        desc={contest.desc}
                                        icon={contest.icon}
                                        active={selectedContests.includes(contest.id)}
                                        disabled={existingRegistrations.includes(contest.id)}
                                        onClick={() => handleContestToggle(contest.id)}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* 2. SPECIAL OFFERS & REGISTRATION TYPE */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            {/* Offer 1: Canvas + Tote */}
                            <div 
                                onClick={handleComboSelect}
                                className="bg-[#5AE0FE] p-5 sm:p-6 rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform cursor-pointer flex flex-col justify-center"
                            >
                                <h3 className="text-[12px] sm:text-[14px] font-black uppercase text-black mb-2 flex items-center gap-2 tracking-widest leading-tight">
                                    <Palette size={18} className="shrink-0" /> CANVAS PAINTING + TOTE BAG PAINTING
                                </h3>
                                <p className="text-3xl sm:text-4xl font-black mb-3 tracking-tighter">AT ₹300/-</p>
                                <div className="mt-auto">
                                    <p className="text-[10px] sm:text-[11px] font-black text-black bg-[#F6E245] border-2 border-black px-2.5 py-1.5 inline-block uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -rotate-1">
                                        PEC STUDENTS GET ADDITIONAL 28% OFF!
                                    </p>
                                </div>
                            </div>

                            {/* Offer 2: Registration Type (Interactive) */}
                            <div className="bg-[#F6E245] p-5 sm:p-6 rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
                                <h3 className="text-[12px] sm:text-[14px] font-black uppercase text-black mb-4 flex items-center gap-2 tracking-widest">
                                    <User size={18} className="shrink-0" /> REGISTRATION TYPE
                                </h3>
                                <div className="flex flex-col gap-3">
                                    <button type="button" onClick={() => setRegType('single')} className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 border-black font-black text-xs uppercase tracking-widest transition-all ${regType === 'single' ? 'bg-black text-white shadow-none' : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'}`}>
                                        1. Single Entry <CheckCircle2 size={16} className={regType === 'single' ? 'opacity-100 text-[#F6E245]' : 'opacity-0'} />
                                    </button>
                                    <button type="button" onClick={() => setRegType('group5')} className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 border-black font-black text-xs uppercase tracking-widest transition-all ${regType === 'group5' ? 'bg-[#5AE0FE] text-black shadow-none' : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'}`}>
                                        2. GROUP OF 5! <span className="bg-black text-white px-2 py-0.5 rounded text-[9px] shadow-sm ml-2">PAY ONLY FOR 4</span>
                                    </button>
                                    <button type="button" onClick={() => setRegType('group10')} className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 border-black font-black text-xs uppercase tracking-widest transition-all ${regType === 'group10' ? 'bg-black text-white shadow-none' : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'}`}>
                                        3. GROUP OF 10! <span className="bg-[#5AE0FE] text-black px-2 py-0.5 rounded text-[9px] shadow-sm ml-2">PAY ONLY FOR 7</span>
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* 3. PARTICIPANT DETAILS */}
                        <section className="bg-white border-2 border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <StepHeader num="03" title="Participant Details" />
                            
                            <div className="mb-6 bg-gray-50 border-2 border-black rounded-xl p-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2 flex items-center gap-1.5"><MapPin size={14}/> CITY OF TRAVEL</label>
                                <input 
                                    type="text" 
                                    value={cityOfTravel}
                                    onChange={(e) => setCityOfTravel(e.target.value)}
                                    className="w-full sm:w-1/2 bg-white border-2 border-black rounded-lg px-4 py-2.5 text-sm font-bold outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                                    required
                                />
                            </div>

                            <div className="space-y-6">
                                {participants.map((participant, index) => (
                                    <div key={index} className="border-2 border-black rounded-xl p-4 sm:p-5 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        <h4 className="text-[12px] font-black uppercase tracking-widest mb-4 bg-black text-white inline-block px-3 py-1 rounded-md">
                                            PARTICIPANT {index + 1} {index === 0 && '(LEADER)'}
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Full Name</label>
                                                <input 
                                                    type="text" 
                                                    value={participant.fullName}
                                                    onChange={(e) => handleParticipantChange(index, 'fullName', e.target.value)}
                                                    className="w-full bg-gray-50 border-2 border-gray-300 focus:border-black rounded-lg px-3 py-2 text-sm font-bold outline-none transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Phone Number</label>
                                                <input 
                                                    type="tel" 
                                                    value={participant.phone}
                                                    onChange={(e) => handleParticipantChange(index, 'phone', e.target.value)}
                                                    className="w-full bg-gray-50 border-2 border-gray-300 focus:border-black rounded-lg px-3 py-2 text-sm font-bold outline-none transition-colors"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">College</label>
                                            <input 
                                                type="text" 
                                                value={participant.college}
                                                onChange={(e) => handleParticipantChange(index, 'college', e.target.value)}
                                                placeholder="If from 'PEC' write your SID also. Example: 'PEC24103022'"
                                                className="w-full bg-gray-50 border-2 border-gray-300 focus:border-black rounded-lg px-3 py-2 text-sm font-bold outline-none transition-colors placeholder:font-medium placeholder:text-gray-400"
                                                required
                                            />
                                            {index === 0 && isPecDiscountApplied && (
                                                <p className="text-green-600 text-[10px] font-black mt-1.5 uppercase tracking-wide">✓ PEC Discount Activated</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="lg:col-span-4 flex flex-col">
                        <section className="bg-white border-2 border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full sticky top-28">
                            <StepHeader num="04" title="Payment Details" />

                            {/* 1. DISCLAIMER SECTION */}
                            <div className="mb-5 mt-2 rounded-2xl border-2 border-dashed border-gray-400 bg-blue-50/50 flex flex-col items-center justify-center overflow-hidden">
                                <p className='text-[13px] p-4 text-center text-gray-700 leading-relaxed font-medium'>
                                    Our team will contact you shortly within <span className='font-black text-blue-600'>24 hours</span> after submission to confirm your registration and provide payment details. Please keep an eye on your inbox (and spam folder) for our communication.
                                </p>
                            </div>

                            {/* 2. TOTAL PRICE SECTION */}
                            {selectedContests.length > 0 ? (
                                <div className="flex flex-col gap-2 mb-6 bg-[#F6E245] p-5 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <p className="text-[10px] font-black text-black uppercase tracking-widest">Total Estimated Fee</p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <h3 className="text-4xl font-black flex items-center tracking-tighter text-black">
                                            <IndianRupee size={28} strokeWidth={3} />{finalPrice}
                                        </h3>
                                        {(isPecDiscountApplied || (hasCanvas && hasTote) || regType !== 'single') && (
                                            <span className="text-sm text-gray-500 line-through font-bold">₹{standardTotal}</span>
                                        )}
                                    </div>
                                    <p className="text-[9px] font-bold text-black/60 uppercase mt-1">Based on {regType === 'single' ? '1 person' : (regType === 'group5' ? 'Group of 5' : 'Group of 10')}</p>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center bg-gray-50 mb-6 p-4 rounded-2xl border-2 border-dashed border-gray-400 min-h-[100px]">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center leading-relaxed">
                                        Select at least one discipline <br /> to view payment details
                                    </p>
                                </div>
                            )}

                            {/* FINALIZE REGISTRATION BUTTON */}
                            <button
                                type="submit"
                                disabled={isSubmitting || selectedContests.length === 0}
                                className={`w-full py-4 mt-auto rounded-xl font-black text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 border-2 border-black transition-all ${isSubmitting || selectedContests.length === 0
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:scale-[0.98]'
                                    }`}
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin text-white" /> : <>Finalize Registration <ChevronRight size={16} strokeWidth={3} /></>}
                            </button>
                        </section>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StepHeader = ({ num, title }) => (
    <h2 className="text-[12px] font-black mb-4 flex items-center gap-3 uppercase tracking-[0.2em] text-black">
        <span className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-[11px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">{num}</span>
        {title}
    </h2>
);

const ContestBtn = ({ label, desc, icon, active, disabled, onClick }) => (
    <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden flex flex-col items-start ${disabled
            ? 'opacity-60 cursor-not-allowed bg-gray-100 border-gray-300'
            : active
                ? 'bg-[#FFF29F] text-black border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-[2px] -translate-x-[2px] scale-[1.02]'
                : 'bg-white border-black hover:bg-gray-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
            }`}
    >
        <div className={`mb-3 p-2 rounded-xl border-2 ${active ? 'bg-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black' : 'bg-gray-100 border-transparent text-gray-600'}`}>
            {React.cloneElement(icon, { size: 20, strokeWidth: active ? 2.5 : 2 })}
        </div>
        <h3 className="text-[10px] md:text-[11px] font-black uppercase tracking-tight text-black leading-tight mb-1">{label}</h3>
        <p className={`text-[9px] font-bold uppercase tracking-tight mt-auto ${active ? 'text-black/70' : 'text-gray-500'}`}>{desc}</p>

        {active && (
            <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                <CheckCircle2 size={12} className="text-[#FFF29F]" strokeWidth={4} />
            </div>
        )}
    </button>
);

export default ContestRegistration;