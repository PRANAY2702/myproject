"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Camera, Palette, MapPin, CheckCircle2, Loader2, 
    IndianRupee, ChevronRight, ArrowLeft, Shirt, User, Users
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
    const { user, loading: authLoading } = useLogin(); 

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingRegistrations, setExistingRegistrations] = useState([]);

    const [selectedContests, setSelectedContests] = useState([]);

    // --- GROUP & DISCOUNT STATE ---
    const [regType, setRegType] = useState('single'); // 'single', 'group5', 'group10'
    const [formData, setFormData] = useState({ city: 'Chandigarh' });
    const [members, setMembers] = useState([{ name: '', phone: '', college: '' }]);

    // FETCH EXISTING REGISTRATIONS
    useEffect(() => {
        const initData = async () => {
            if (authLoading) return;
            if (!user) {
                router.push('/login');
                return;
            }

            try {
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
    }, [user, authLoading, router]);

    // Auto-resize member inputs when group type changes
    useEffect(() => {
        let size = 1;
        if (regType === 'group5') size = 5;
        if (regType === 'group10') size = 10;
        
        setMembers(prev => {
            const newArr = [...prev];
            while (newArr.length < size) newArr.push({ name: '', phone: '', college: '' });
            return newArr.slice(0, size);
        });
    }, [regType]);

    const updateMember = (index, field, value) => {
        const newMembers = [...members];
        newMembers[index][field] = value;
        setMembers(newMembers);
    };

    const handleGroupToggle = (type) => {
        setRegType(type); // The useEffect above handles the rest!
    };

    // --- DYNAMIC PRICING MATH ---
    const { rawBasePrice, comboDiscount, pecDiscountAmount, finalPrice, payMultiplier } = useMemo(() => {
        const singleRaw = selectedContests.reduce((total, id) => {
            const contest = CONTEST_DATA.find(c => c.id === id);
            return total + (contest ? contest.price : 0);
        }, 0);

        let mult = 1;
        if (regType === 'group5') mult = 4;
        if (regType === 'group10') mult = 7;

        let currentTotal = singleRaw * mult;

        const hasCanvas = selectedContests.includes('canvas_painting');
        const hasTote = selectedContests.includes('totebag_painting');
        const comboDiscountAmount = (hasCanvas && hasTote) ? (70 * mult) : 0; 
        currentTotal -= comboDiscountAmount;

        const allPec = members.every(m => {
            const col = m.college.trim().toLowerCase();
            return col.includes('pec') || col.includes('punjab engineering');
        });

        // Apply 28% off if all members are from PEC
        const pecDiscountAmount = allPec ? Math.round(currentTotal * 0.28) : 0;
        currentTotal -= pecDiscountAmount;

        return {
            rawBasePrice: (singleRaw * mult),
            comboDiscount: comboDiscountAmount,
            pecDiscountAmount: pecDiscountAmount,
            finalPrice: currentTotal,
            payMultiplier: mult
        };
    }, [selectedContests, regType, members]);

    const handleContestToggle = (id) => {
        if (existingRegistrations.includes(id)) {
            toast.error("You are already registered for this discipline!");
            return;
        }
        setSelectedContests(prev => prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedContests.length === 0) return toast.error("Please select at least one contest.");

        const isFilled = members.every(m => m.name.trim() !== '' && m.phone.trim() !== '' && m.college.trim() !== '');
        if (!isFilled) return toast.error("Please fill out all participant details.");

        try {
            setIsSubmitting(true);
            toast.loading("Processing registration...", { id: 'reg-submit' });

            const eventsWithPrices = selectedContests.map(id => {
                const contest = CONTEST_DATA.find(c => c.id === id);
                let itemPrice = contest.price;
                if (rawBasePrice > 0 && finalPrice !== rawBasePrice) {
                    itemPrice = Math.round((contest.price / rawBasePrice) * finalPrice);
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
                    city: formData.city,
                    type: regType, 
                    groupMembers: members, 
                    totalPaid: finalPrice
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
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || authLoading) return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>;

    return (
        <div className="min-h-screen w-full pt-28 pb-12 px-4 flex flex-col selection:bg-black selection:text-white text-black bg-transparent">
            <div className="max-w-[1100px] mx-auto w-full flex-1 flex flex-col relative z-10">
                <div className="mb-6 flex justify-between items-end">
                    <button onClick={() => router.back()} className="text-[10px] uppercase tracking-widest px-4 py-2 border-2 bg-white border-black rounded-xl transition-all flex items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] gap-1 mb-1 font-black hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-95 cursor-pointer">
                        <ArrowLeft size={14} strokeWidth={3} /> Back
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
                    {/* ── LEFT COLUMN ── */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                        
                        <section className="bg-white border-[3px] border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <StepHeader num="01" title="Select Disciplines" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
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

                        <section className="bg-white border-[3px] border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col relative overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <StepHeader num="02" title="Special Offers & Registration Type" />
                                {selectedContests.includes('canvas_painting') && selectedContests.includes('totebag_painting') && (
                                    <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded border-2 border-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        Combo Applied! (-₹70/person)
                                    </span>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 relative z-10">
                                <div className="bg-[#5AE0FE] p-5 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center transition-transform hover:-translate-y-1">
                                    <h3 className="text-[10px] font-black uppercase text-black mb-1 flex items-center gap-2 tracking-widest leading-tight">
                                        <Palette size={14} className="shrink-0" /> Canvas Painting + Tote Bag Painting
                                    </h3>
                                    <p className="text-3xl font-black mb-3 tracking-tighter">AT ₹300/-</p>
                                    <div className="mt-auto">
                                        <p className="text-[9px] font-black text-black bg-[#F6E245] border-[3px] border-black px-2 py-1 inline-block uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            PEC Students get additional 28% OFF!
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-[#F6E245] p-5 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
                                    <h3 className="text-[10px] font-black uppercase text-black mb-4 flex items-center gap-2 tracking-widest">
                                        <Users size={14} className="shrink-0" /> Registration Type
                                    </h3>
                                    <div className="flex flex-col gap-3 mt-auto">
                                        <button type="button" onClick={() => handleGroupToggle('single')} className={`flex flex-col min-[400px]:flex-row min-[400px]:justify-between items-start min-[400px]:items-center gap-2 px-3 py-2 bg-white border-[3px] border-black rounded-xl transition-all ${regType === 'single' ? 'shadow-none translate-y-1 bg-gray-100' : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'}`}>
                                            <span className="text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5"><User size={12}/> SINGLE ENTRY</span>
                                            <span className="font-black text-[9px] uppercase bg-gray-200 px-2 py-1 rounded border-2 border-black">1 PERSON</span>
                                        </button>
                                        <button type="button" onClick={() => handleGroupToggle('group5')} className={`flex flex-col min-[400px]:flex-row min-[400px]:justify-between items-start min-[400px]:items-center gap-2 px-3 py-2 bg-white border-[3px] border-black rounded-xl transition-all ${regType === 'group5' ? 'shadow-none translate-y-1 bg-gray-100' : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'}`}>
                                            <span className="text-[10px] uppercase font-black tracking-widest">GROUP OF 5?</span>
                                            <span className="font-black text-[9px] uppercase bg-[#5AE0FE] px-2 py-1 rounded border-2 border-black">PAY ONLY FOR 4</span>
                                        </button>
                                        <button type="button" onClick={() => handleGroupToggle('group10')} className={`flex flex-col min-[400px]:flex-row min-[400px]:justify-between items-start min-[400px]:items-center gap-2 px-3 py-2 bg-white border-[3px] border-black rounded-xl transition-all ${regType === 'group10' ? 'shadow-none translate-y-1 bg-gray-100' : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'}`}>
                                            <span className="text-[10px] uppercase font-black tracking-widest">GROUP OF 10?</span>
                                            <span className="font-black text-[9px] uppercase bg-black text-white px-2 py-1 rounded border-2 border-black">PAY ONLY FOR 7</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white border-[3px] border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[500px] overflow-y-auto">
                            <StepHeader num="03" title="Participant Details" />
                            
                            <div className="mb-6 mt-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-black mb-2 flex items-center gap-1"><MapPin size={12} /> City of Travel</label>
                                <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-[11px] font-bold outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400" />
                            </div>

                            <div className="space-y-5">
                                {members.map((member, i) => (
                                    <div key={i} className="p-4 rounded-2xl border-2 border-black bg-gray-50 relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        <span className="absolute -top-3 -left-2 bg-black text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border-2 border-white shadow-sm">
                                            Participant {i + 1} {i === 0 ? '(Leader)' : ''}
                                        </span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                            <input type="text" placeholder="Full Name" value={member.name} onChange={(e) => updateMember(i, 'name', e.target.value)} className="w-full bg-white border-2 border-gray-300 rounded-xl text-[11px] px-3 py-2.5 font-bold outline-none focus:border-black" />
                                            <input type="text" placeholder="Phone Number" value={member.phone} onChange={(e) => updateMember(i, 'phone', e.target.value)} className="w-full bg-white border-2 border-gray-300 rounded-xl text-[11px] px-3 py-2.5 font-bold outline-none focus:border-black" />
                                            <div className="sm:col-span-2">
                                                <input type="text" placeholder="College (If from 'PEC' write your SID also Example- 'PEC24112002')" value={member.college} onChange={(e) => updateMember(i, 'college', e.target.value)} className="w-full bg-white border-2 border-gray-300 rounded-xl text-[11px] px-3 py-2.5 font-bold outline-none focus:border-black" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* ── RIGHT COLUMN ── */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <section className="bg-white border-[3px] border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full">
                            <StepHeader num="04" title="Summary & Submit" />

                            {selectedContests.length > 0 ? (
                                <div className="flex flex-col gap-4 mt-2">
                                    <div className="bg-gray-50 border-2 border-black rounded-2xl p-5">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                                            Total Fee ({members.length} {members.length > 1 ? 'People' : 'Person'})
                                        </p>
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="text-4xl font-black flex items-center tracking-tighter text-black">
                                                <IndianRupee size={28} strokeWidth={3} />{finalPrice}
                                            </h3>
                                            {rawBasePrice !== finalPrice && (
                                                <span className="text-sm text-gray-400 line-through font-bold">₹{rawBasePrice}</span>
                                            )}
                                        </div>
                                        {(comboDiscount > 0 || pecDiscountAmount > 0) && (
                                            <div className="mt-4 space-y-1.5 border-t-2 border-dashed border-gray-300 pt-4">
                                                {comboDiscount > 0 && <div className="flex justify-between text-[11px] font-black text-[#5AE0FE] drop-shadow-[0.5px_0.5px_0_rgba(0,0,0,1)]"><span>Combo Applied:</span><span>- ₹{comboDiscount}</span></div>}
                                                {pecDiscountAmount > 0 && <div className="flex justify-between text-[11px] font-black text-[#e8cf10] drop-shadow-[0.5px_0.5px_0_rgba(0,0,0,1)]"><span>PEC Discount (28%):</span><span>- ₹{pecDiscountAmount}</span></div>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-gray-400 rounded-2xl p-8 mb-6 mt-4 flex items-center justify-center min-h-[140px]">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center leading-relaxed">
                                        Select at least one discipline <br /> to view payment summary
                                    </p>
                                </div>
                            )}

                            <div className="border-2 border-dashed border-gray-400 rounded-2xl p-5 mb-6 mt-6 text-[11px] font-medium text-gray-600 leading-relaxed bg-white">
                                Our team will reach out to you via email and call/whatsapp within <span className="text-[#5AE0FE] font-bold">24 hours</span> after submission to confirm your registration and provide further payment details. Please ensure you have provided a <span className="text-[#5AE0FE] font-bold">valid email address and phone number</span> and keep an eye on your inbox (and spam folder) for our communication.
                            </div>

                            <div className="mt-auto">
                                <button type="submit" disabled={isSubmitting || selectedContests.length === 0} className={`w-full py-4 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 border-[3px] border-black transition-all ${isSubmitting || selectedContests.length === 0 ? 'bg-white text-gray-300 cursor-not-allowed border-gray-300' : 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:scale-[0.98]'}`}>
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin text-black" /> : <>Finalize Registration <ChevronRight size={16} strokeWidth={3} /></>}
                                </button>
                            </div>
                        </section>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StepHeader = ({ num, title }) => (
    <div className="flex items-center gap-3 mb-0">
        <div className="bg-black text-white rounded-full w-7 h-7 flex items-center justify-center text-[11px] font-black">
            {num}
        </div>
        <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-black">{title}</h2>
    </div>
);

const ContestBtn = ({ label, desc, icon, active, disabled, onClick }) => (
    <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`p-5 sm:p-6 rounded-[2rem] border-[3px] border-black text-left flex flex-col gap-4 transition-all relative overflow-hidden ${
            disabled
                ? 'opacity-60 cursor-not-allowed bg-gray-100'
                : active
                    ? 'bg-[#FFF29F] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] -translate-y-1 -translate-x-1'
                    : 'bg-white hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
        }`}
    >
        <div className={`w-12 h-12 rounded-xl border-[3px] border-black flex items-center justify-center transition-all ${
            active ? 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black' : 'bg-gray-50 text-gray-500'
        }`}>
            {React.cloneElement(icon, { size: 24, strokeWidth: 2.5 })}
        </div>
        <div className="mt-1">
            <h3 className="text-[13px] sm:text-[15px] font-black uppercase leading-tight text-black pr-8">{label}</h3>
            <p className="text-[11px] font-bold text-gray-600 uppercase mt-2 tracking-widest">{desc}</p>
        </div>
        {active && (
            <div className="absolute top-5 right-5 w-7 h-7 rounded-full bg-black flex items-center justify-center border-[3px] border-white shadow-sm">
                <CheckCircle2 size={16} className="text-[#FFF29F]" strokeWidth={4} />
            </div>
        )}
    </button>
);

export default ContestRegistration;