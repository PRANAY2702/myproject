"use client";

import React, { useState, useEffect } from 'react';
import {
    User, GraduationCap, Briefcase, Calendar,
    Ticket, Sparkles, Loader2, AlertCircle, Phone
} from 'lucide-react';
import { toast } from 'sonner';

const APCLogo = 'https://spectrum.gumlet.io/APCLogoColor_r6iixw';
const SPECTRUMLogo = 'https://spectrum.gumlet.io/SPECTRUMLogoBgLess_l37nhk';
import { useLogin } from '@/app/context/AuthContext'; // Ensure this path is correct
import { auth } from '@/lib/firebase';

const CompleteProfileModal = ({
    isOpen, onClose, onComplete, initialName = ''
}) => {
    const [loading, setLoading] = useState(false);
    const { refreshData } = useLogin();

    // Mapped exactly to match your new Mongoose Schema structure
    const [formData, setFormData] = useState({
        fullName: initialName,
        profession: '', // Note: Add this to your Mongoose schema!
        institutionName: '', // Maps to collegeDetails.institutionName
        dob: '', // Note: Add this to your Mongoose schema!
        phone: '',
        spectrumAlum: false, // Replaces 'participated_before'
        referralCode: '' // Optional
    });

    useEffect(() => {
        if (initialName) setFormData(prev => ({ ...prev, fullName: initialName }));
    }, [initialName]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type } = e.target;

        if (type === 'radio') {
            setFormData(prev => ({ ...prev, [name]: value === 'true' }));
        } else {
            if (name === 'phone' && value.length > 10) return;
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const validateForm = () => {
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(formData.phone)) {
            toast.error("Please enter a valid 10-digit Indian mobile number.");
            return false;
        }

        const birthDate = new Date(formData.dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

        if (age < 12) {
            toast.error("You must be at least 12 years old to participate.");
            return false;
        }
        if (age > 100) {
            toast.error("Please enter a valid date of birth.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);

        try {
            // 1. Get secure token
            const user = auth.currentUser;
            if (!user) throw new Error("No authenticated user found");
            const token = await user.getIdToken();

            // 2. Format payload to match Mongoose exactly
            const payload = {
                fullName: formData.fullName,
                phone: `+91${formData.phone}`, // Appending +91 to pass your Mongoose regex
                spectrumAlum: formData.spectrumAlum,
                collegeDetails: {
                    institutionName: formData.institutionName
                },
                // Assuming you add these to your Mongoose schema:
                profession: formData.profession,
                dob: formData.dob
            };

            // 3. Send to Next.js API
            const response = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update profile");
            }

            toast.success("Profile setup complete!");
            await refreshData();
            onComplete(); // Triggers the dashboard refresh
            onClose();
        } catch (error) {
            toast.error(error.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm"></div>

            <div className="relative w-full max-w-lg mt-20 bg-stone-50 border border-gray-100 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-sky-400 via-pink-400 to-teal-400"></div>

                <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

                    <div className="mb-6 text-center">
                        <div className="flex items-center justify-center gap-4 mb-4 opacity-90">
                            <img src={APCLogo} alt="APC Logo" className="h-6 rounded w-auto object-contain" />
                            <div className="w-px h-6 bg-gray-200"></div>
                            <img src={SPECTRUMLogo} alt="SPECTRUM Logo" className="h-8 w-auto object-contain" />
                        </div>

                        <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-black uppercase tracking-widest">
                            <AlertCircle className="w-3 h-3" />
                            Complete steps to unlock tickets
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Full Name */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Full Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-sky-600">
                                    <User className="w-4 h-4 transition-colors" />
                                </div>
                                <input
                                    type="text" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="Full Name"
                                    className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-gray-900 focus:border-sky-300 transition-all"
                                />
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">
                                Mobile Number (WhatsApp preferred)
                            </label>

                            <div className="relative group">
                                <div className="flex items-center bg-white border border-gray-200 rounded-2xl focus-within:border-sky-300 transition-all">
                                    <div className="pl-4 pr-2 text-gray-500 group-focus-within:text-sky-600">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-600 pr-2">+91</span>
                                    <input
                                        type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="00000 00000"
                                        className="w-full bg-transparent py-3.5 pr-4 text-sm text-gray-900 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Profession */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Profession</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-sky-600">
                                        <Briefcase className="w-4 h-4 transition-colors" />
                                    </div>
                                    <div className="relative">
                                        <select
                                            name="profession" value={formData.profession} onChange={handleChange} required
                                            className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-11 pr-10 text-sm text-gray-900 focus:border-sky-300 appearance-none"
                                        >
                                            <option value="" disabled>Select...</option>
                                            <option value="Student">Student</option>
                                            <option value="Working Professional">Professional</option>
                                            <option value="Freelancer">Freelancer</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
                                    </div>
                                </div>
                            </div>

                            {/* Date of Birth */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Date of Birth</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-sky-600">
                                        <Calendar className="w-4 h-4 transition-colors" />
                                    </div>
                                    <input
                                        type="date" name="dob" value={formData.dob} onChange={handleChange} required
                                        className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-gray-900 focus:border-sky-300 transition-all [color-scheme:light]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* College Name */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">College / University</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-sky-600">
                                    <GraduationCap className="w-4 h-4 transition-colors" />
                                </div>
                                <input
                                    type="text" name="institutionName" list="college-options" value={formData.institutionName} onChange={handleChange}
                                    placeholder="e.g. Punjab Engineering College"
                                    className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-gray-900 focus:border-sky-300 transition-all"
                                />

                                <datalist id="college-options">
                                    <option value="Punjab Engineering College (PEC), Chandigarh" />
                                    <option value="Panjab University, Chandigarh" />
                                    <option value="Government College of Art (GCA), Chandigarh" />
                                    <option value="Chandigarh College of Architecture (CCA)" />
                                    <option value="Chandigarh College of Engineering and Technology (CCET)" />
                                    <option value="Chitkara University" />
                                    <option value="Chandigarh University (CU)" />
                                    <option value="MCM DAV College, Chandigarh" />
                                    <option value="SD College, Chandigarh" />
                                    <option value="Thapar Institute of Engineering and Technology (TIET), Patiala" />
                                </datalist>
                            </div>
                        </div>

                        {/* Participation Radio */}
                        <div className="space-y-1.5 pt-1">
                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Have you participated in SPECTRUM before?</label>
                            <div className="flex gap-3">
                                <label className="flex-1 relative cursor-pointer group">
                                    <input type="radio" name="spectrumAlum" value="true" checked={formData.spectrumAlum === true} onChange={handleChange} className="peer sr-only" />
                                    <div className="w-full p-3 rounded-2xl border border-gray-200 bg-gray-100 text-center peer-checked:bg-pink-50 peer-checked:border-pink-300 peer-checked:text-pink-700 transition-all">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Yes</span>
                                    </div>
                                </label>
                                <label className="flex-1 relative cursor-pointer group">
                                    <input type="radio" name="spectrumAlum" value="false" checked={formData.spectrumAlum === false} onChange={handleChange} className="peer sr-only" />
                                    <div className="w-full p-3 rounded-2xl border border-gray-200 bg-gray-100 text-center peer-checked:bg-pink-50 peer-checked:border-pink-300 peer-checked:text-pink-700 transition-all">
                                        <span className="text-[10px] font-black uppercase tracking-widest">No</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Referral Code (Optional, ignored by Mongoose unless added) */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1 flex items-center justify-between">
                                Referral Code <span className="text-[8px] opacity-50 italic">Optional</span>
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-pink-600">
                                    <Ticket className="w-4 h-4 transition-colors" />
                                </div>
                                <input
                                    type="text" name="referralCode" value={formData.referralCode} onChange={handleChange} placeholder="SPEC-XXXX"
                                    className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-gray-900 focus:border-pink-300 transition-all uppercase"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-3">
                            <button
                                type="submit" disabled={loading}
                                className="w-full py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-sky-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" /> Complete Setup
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default CompleteProfileModal;