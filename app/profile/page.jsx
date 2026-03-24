"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Calendar, Grid, Heart, Camera, GraduationCap, Briefcase, QrCode,
    Loader2, Mail, Lock, Ticket, Palette, Clock, CheckCircle2, XCircle, Plus, Download, Upload, X, Edit2,
    Phone
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import { useLogin } from '@/app/context/AuthContext';
import { toPng } from 'html-to-image';

// Components
import CompleteProfileModal from '@/components/CompleteProfileModal';

// Assets
const APCLogo = 'https://spectrum.gumlet.io/APCLogoColor_r6iixw';
const SPECTRUMLogo = 'https://spectrum.gumlet.io/SPECTRUMLogoBgLess_l37nhk';
import { CONTEST_DATA } from '../registration/page.jsx';

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase.js";

export const contestMap = {};
CONTEST_DATA.forEach(contest => {
    contestMap[contest.id] = contest.label;
});

const UserProfile = () => {
    const router = useRouter();

    // Pull Firebase user, Mongoose profile, and Firebase token generator from your new context
    const { user, profile, loading: authLoading, refreshData, isProfileComplete } = useLogin();

    // State
    const [activeTab, setActiveTab] = useState('registrations');
    const [profileLoading, setProfileLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Dashboard Data
    const [registrations, setRegistrations] = useState([]);
    const [submissions, setSubmissions] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(isProfileComplete ? false : true);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fileInputRef = useRef(null);
    const idCardRef = useRef(null);

    // Check if user has at least one verified registration
    const isVerified = registrations.some(reg => reg.paymentStatus === 'verified');

    // --- DOWNLOAD LOGIC ---
    const handleDownloadCard = async () => {
        if (!idCardRef.current) return;

        if (!isVerified) {
            toast.error("Your registration must be verified to download your E-ID card.");
            return;
        }

        const toastId = toast.loading("Generating your Premium E-ID Card...");
        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            const dataUrl = await toPng(idCardRef.current, {
                cacheBust: true,
                pixelRatio: 3,
                useCORS: true, 
                allowTaint: true, 
                style: { fontFamily: 'sans-serif' }
            });

            const link = document.createElement('a');
            link.download = `Spectrum_Pass_${profile?.registrationCode || profile?._id?.slice(-6).toUpperCase() || 'User'}.png`;
            link.href = dataUrl;
            link.click();
            toast.success("Downloaded successfully!", { id: toastId });
        } catch (err) {
            console.error("ID Generation Error:", err);
            toast.error("Failed to generate ID card", { id: toastId });
        }
    };

    const isContestOpen = false;

    const calculateAge = (dobString) => {
        if (!dobString || dobString === 'Update DOB') return 'N/A';
        const dob = new Date(dobString);
        const diff = Date.now() - dob.getTime();
        return Math.abs(new Date(diff).getUTCFullYear() - 1970);
    };

    // --- FETCH DASHBOARD DATA ---
    const fetchDashboardData = async () => {
        if (!user) return;
        try {
            setProfileLoading(true);
            const token = await user.getIdToken();

            const [regRes, subRes] = await Promise.all([
                fetch('/api/user/registrations', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/user/submissions', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (regRes.ok) {
                const regData = await regRes.json();
                setRegistrations(regData);
            }
            if (subRes.ok) {
                const subData = await subRes.json();
                setSubmissions(subData);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setProfileLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && profile) {
            setIsModalOpen(!isProfileComplete);
        }
    }, [isProfileComplete, profile, authLoading]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchDashboardData();
        } else if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading]);

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        try {
            setUploading(true);
            toast.loading("Uploading new avatar...", { id: "avatar-upload" });

            const fileRef = ref(
                storage,
                `avatars/${user.uid}/${Date.now()}-${file.name}`
            );

            await uploadBytes(fileRef, file);
            const downloadURL = await getDownloadURL(fileRef);

            const token = await user.getIdToken();
            const updateRes = await fetch("/api/user/profile", {
                method: "PUT", // Using your PUT endpoint
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ avatarUrl: downloadURL }),
            });

            if (!updateRes.ok) throw new Error("Failed to update profile");

            await refreshData();
            toast.success("Profile image updated!", { id: "avatar-upload" });
        } catch (error) {
            toast.error(error.message || "Upload failed", {
                id: "avatar-upload",
            });
        } finally {
            setUploading(false);
        }
    };

    if (authLoading || (user && profileLoading)) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-black" />
            </div>
        );
    }

    if (!user) return null;

    const displayName = profile?.fullName || user?.displayName || 'Participant';
    const displayRegId = profile?.registrationCode || profile?._id?.slice(-6).toUpperCase() || '000000';

    return (
        <div className="min-h-screen w-full text-black selection:bg-black/20 pb-12 font-sans relative">

            {/* --- HIDDEN ID CARD TEMPLATE --- */}
            <div className="fixed -left-[9999px] top-0">
                <div ref={idCardRef} className="w-[400px] h-[600px] bg-white flex flex-col rounded-[30px] border-[4px] border-black relative overflow-hidden shadow-2xl font-sans">
                    <div className="absolute top-0 left-0 w-full h-36 bg-[#55c9e0] border-b-[4px] border-black z-0 flex flex-col items-center">
                        <div className="w-16 h-3 bg-black/20 rounded-full mt-4 border border-black/40"></div>
                    </div>
                    <div className="flex items-center justify-between w-full px-8 pt-12 z-10">
                        <div className="bg-white p-1.5 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
                            <img src={APCLogo} className="h-6 w-auto object-contain rounded-md" alt="APC" />
                        </div>
                        <div className="bg-white p-1.5 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
                            <img src={SPECTRUMLogo} className="h-6 w-auto object-contain" alt="Spectrum" />
                        </div>
                    </div>
                    <div className="flex flex-col items-center z-10 mt-6 px-6 overflow-hidden">
                        <div className="w-32 h-32 rounded-full border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden mb-5 bg-white shrink-0">
                            {profile?.avatarUrl ? (
                                <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="Avatar"/>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-black text-white text-6xl font-black uppercase">
                                    {displayName.charAt(0)}
                                </div>
                            )}
                        </div>
                        <h2 className="text-[26px] font-black tracking-tight text-center text-black leading-tight w-full truncate px-2">{displayName}</h2>
                        <p className="text-gray-600 text-[13px] font-bold uppercase tracking-widest mt-1 w-full text-center truncate">{profile?.profession || 'Participant'}</p>
                        <div className="flex items-center gap-1.5 mt-3 text-black bg-white px-3 py-1.5 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] max-w-full">
                            <GraduationCap size={14} className="shrink-0" />
                            <p className="text-[11px] font-bold uppercase tracking-wider text-center truncate">{profile?.collegeDetails?.institutionName || 'College Not Provided'}</p>
                        </div>
                    </div>
                    <div className="mt-auto bg-white w-full flex flex-col p-6 border-t-[4px] border-black z-10">
                        <div className="flex items-center justify-between w-full gap-4">
                            <div className="bg-white p-2.5 rounded-[1.25rem] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
                                <QRCode value={displayRegId} size={75} fgColor="#000" />
                            </div>
                            <div className="flex flex-col items-end text-right w-full overflow-hidden">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-0.5">Registration ID</p>
                                <p className="text-3xl font-mono font-black text-black tracking-wider">{`${String(displayRegId).slice(0, 2)}-${String(displayRegId).slice(2, 8)}`}</p>
                                <div className="flex flex-wrap justify-end gap-1.5 mt-2">
                                    {registrations.length > 0 ? registrations.map((reg, i) => (
                                        <span key={i} className="text-[9px] bg-black px-2 py-1 rounded-md text-white font-bold uppercase tracking-wider truncate max-w-[120px]">{reg.eventName || reg.registrationType}</span>
                                    )) : (
                                        <span className="text-[9px] bg-gray-200 px-2 py-1 rounded-md text-gray-600 font-bold uppercase tracking-wider border border-gray-400">No Registrations</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />

            <div className="w-full h-64 md:h-72 relative overflow-hidden z-10">
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20">
                <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-2xl border-[3px] border-black">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-end -mt-20 md:-mt-24 mb-8">
                        <div className="relative group cursor-pointer" onClick={() => !uploading && fileInputRef.current?.click()}>
                            <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-[4px] border-black overflow-hidden bg-white shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${uploading ? 'opacity-50' : ''}`}>
                                {profile?.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#EBBA32] text-black text-5xl font-bold uppercase">
                                        {displayName.split(' ').map(n => n.charAt(0)).join('')}
                                    </div>
                                )}
                            </div>
                            <button disabled={uploading} className="absolute bottom-2 right-2 p-3 bg-[#95CDED] text-black border-2 border-black rounded-full hover:bg-[#588ca4] transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none flex items-center justify-center shrink-0">
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Camera className="w-4 h-4 shrink-0" />}
                            </button>
                        </div>

                        <div className="flex-grow flex flex-col md:flex-row md:items-end justify-between gap-6 w-full pb-2 overflow-hidden">
                            <div className="flex flex-col justify-end w-full overflow-hidden">
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black mb-1 truncate w-full" title={displayName}>{displayName}</h1>
                                <div className="flex items-center gap-2 text-gray-600 font-bold w-full overflow-hidden">
                                    <Mail className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{user.email}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-5 pb-1 hidden sm:flex shrink-0">
                                <img src={APCLogo} alt="APC Logo" className="h-8 w-auto object-contain hover:scale-105 transition-transform duration-300 drop-shadow-sm rounded-lg" />
                                <div className="w-px h-8 bg-black"></div>
                                <img src={SPECTRUMLogo} alt="SPECTRUM Logo" className="h-10 w-auto object-contain hover:scale-105 transition-transform duration-300 drop-shadow-sm" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="p-6 rounded-4xl bg-white border-[3px] border-black text-center relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col">
                                <div className="absolute top-0 left-0 w-full h-2 bg-[#5AE0FE]"></div>
                                <h3 className="text-xs font-black text-black uppercase tracking-widest mb-5 flex items-center justify-center gap-2 shrink-0">
                                    <QrCode className="w-4 h-4 shrink-0" /> Entry Pass
                                </h3>

                                <div className="relative inline-block mb-3 self-center">
                                    <div className={`bg-white p-3 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center ${!isVerified ? 'opacity-30 blur-[2px] pointer-events-none' : ''}`}>
                                        <QRCode value={displayRegId} size={120} level="H" fgColor="#000" />
                                    </div>
                                    {!isVerified && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-xl whitespace-nowrap truncate max-w-full">
                                                {registrations.length === 0 ? "Not Registered" : "Pending Verify"}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2 truncate">Registration ID</p>
                                <p className="text-2xl font-mono font-black text-black tracking-[0.2em] mt-1 mb-5 truncate">{`${String(displayRegId).slice(0, 2)}-${String(displayRegId).slice(2, 8)}`}</p>

                                <button
                                    onClick={handleDownloadCard}
                                    disabled={!isVerified}
                                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 border-black shrink-0 ${isVerified ? "bg-[#95CDED] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#66a9d0] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none" : "bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed"}`}
                                >
                                    <Download size={16} className="shrink-0" />
                                    <span className="truncate">Download Pass</span>
                                </button>
                            </div>

                            <div className="space-y-5 text-sm bg-white border-[3px] border-black rounded-[2rem] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative">
                                <DetailItem icon={<GraduationCap size={16} className="shrink-0" />} label="College / University" value={profile?.collegeDetails?.institutionName || 'Not Updated'} />
                                <DetailItem icon={<Phone size={16} className="shrink-0" />} label="Phone" value={profile?.phone || 'Not Updated'} />
                                <DetailItem icon={<Briefcase size={16} className="shrink-0" />} label="Profession / Major" value={profile?.profession || 'Not Updated'} />
                                <DetailItem icon={<Calendar size={16} className="shrink-0" />} label="Age" value={`${calculateAge(profile?.dob)} Years Old`} />
                                <button 
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="w-full flex gap-2 items-center justify-center bg-black p-2 text-white rounded-full hover:bg-gray-800 transition-colors shadow-sm"
                                    title="Edit Profile"
                                >
                                    <Edit2 size={14} /> Edit Profile
                                </button>
                            </div>
                        </div>

                        {/* Main Content Tabs */}
                        <div className="lg:col-span-2 overflow-hidden flex flex-col">
                            <div className="flex gap-6 border-b-[3px] border-gray-200 mb-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                <TabButton id="registrations" activeTab={activeTab} onClick={setActiveTab} label="Registrations" icon={<Ticket size={16} className="shrink-0" />} badge={registrations.some(r => r.status === 'pending')} />
                                <TabButton id="submissions" activeTab={activeTab} onClick={setActiveTab} label={`My Submissions (${submissions.length}/4)`} icon={<Grid size={16} className="shrink-0" />} />
                            </div>

                            {activeTab === 'submissions' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {submissions.map((sub) => (
                                        <SubmissionCard key={sub._id} sub={sub} />
                                    ))}

                                    {submissions.length < 4 && (
                                        <UploadPlaceholder
                                            registrations={registrations}
                                            isContestOpen={isContestOpen}
                                            onRegister={() => router.push('/registration')}
                                            onNewSubmission={() => setIsSubmitModalOpen(true)}
                                        />
                                    )}
                                </div>
                            )}

                            {activeTab === 'registrations' && (
                                <div className="space-y-4">
                                    {registrations.length === 0 ? (
                                        <EmptyState icon={<Ticket size={48} className="shrink-0" />} title="No active registrations" subtitle="You haven't registered for any SPECTRUM contests yet." actionLabel="Register Now" onAction={() => router.push('/registration')} />
                                    ) : (
                                        <>
                                            {registrations.map(reg => <RegistrationItem key={reg._id} reg={reg} />)}
                                            {registrations.length < 2 && (
                                                <button onClick={() => router.push('/registration')} className="w-full mt-2 py-4 border-[3px] border-dashed border-gray-300 bg-white text-black rounded-[1.25rem] text-sm font-black uppercase tracking-widest hover:border-black hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                                    <Plus className="w-5 h-5 shrink-0" /> <span className="truncate">Register for another category</span>
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <CompleteProfileModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onComplete={fetchDashboardData}
                userId={user.uid}
                initialName={displayName}
            />

            <NewSubmissionModal
                isOpen={isSubmitModalOpen}
                onClose={() => setIsSubmitModalOpen(false)}
                onSuccess={fetchDashboardData}
                user={user}
                registrations={registrations}
            />

            {/* NEW EDIT PROFILE MODAL */}
            <EditProfileModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={refreshData} // using context's refresh to update UI everywhere
                user={user}
                profile={profile}
            />
        </div>
    );
};

// --- Sub-components ---

const DetailItem = ({ icon, label, value }) => (
    <div className="flex items-center gap-4 w-full overflow-hidden">
        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">{icon}</div>
        <div className="overflow-hidden w-full">
            <p className="text-[10px] font-black text-gray-500 mb-0.5 uppercase tracking-widest truncate w-full">{label}</p>
            <p className="text-black font-bold leading-tight truncate w-full" title={value}>{value}</p>
        </div>
    </div>
);

const TabButton = ({ id, activeTab, onClick, label, icon, badge }) => (
    <button onClick={() => onClick(id)} className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative flex items-center gap-2 whitespace-nowrap ${activeTab === id ? 'text-black' : 'text-gray-400 hover:text-black'}`}>
        {icon} <span className="truncate">{label}</span>
        {badge && <span className="w-2 h-2 rounded-full bg-red-500 absolute top-0 -right-2"></span>}
        {activeTab === id && <span className="absolute -bottom-[3px] left-0 w-full h-[3px] bg-black rounded-t-full"></span>}
    </button>
);

const SubmissionCard = ({ sub }) => (
    <div className="group relative aspect-square rounded-2xl overflow-hidden bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <img src={sub.imageUrl} alt={sub.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
            <div className="flex justify-between items-end gap-3 overflow-hidden">
                <div className="overflow-hidden w-full">
                    <h4 className="text-white font-black text-lg leading-tight mb-1 truncate w-full" title={sub.title}>{sub.title}</h4>
                    <p className="text-[#7CA458] text-xs font-bold uppercase tracking-widest truncate w-full">{sub.category}</p>
                </div>
                <div className="flex items-center gap-1.5 text-black bg-white px-3 py-1.5 rounded-full text-xs font-black shadow-sm shrink-0">
                    <Heart className="w-3.5 h-3.5 fill-black text-black shrink-0" />
                    <span>{sub.likedBy?.length || 0}</span>
                </div>
            </div>
        </div>
    </div>
);

const RegistrationItem = ({ reg }) => {
    const isArt = reg.eventId?.toLowerCase().includes('art');
    
    // Determine the ticket type text and color
    const isGroup10 = reg.registrationType === 'group10';
    const isGroup5 = reg.registrationType === 'group5';
    
    return (
        <div className="bg-white border-[3px] border-black rounded-[1.25rem] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] overflow-hidden relative">
            
            {/* NEW: Group Ticket Badge */}
            {(isGroup5 || isGroup10) && (
                <div className="absolute top-0 right-0">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl border-b-2 border-l-2 border-black ${isGroup10 ? 'bg-[#F6E245] text-black' : 'bg-[#5AE0FE] text-black'}`}>
                        {isGroup10 ? 'Group of 10 Ticket' : 'Group of 5 Ticket'}
                    </span>
                </div>
            )}

            <div className={`flex items-center gap-4 overflow-hidden w-full ${ (isGroup5 || isGroup10) ? 'mt-2' : ''}`}>
                <div className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center bg-black text-white shadow-inner border-2 border-black">
                    {isArt ? <Palette size={20} className="shrink-0" /> : <Camera size={20} className="shrink-0" />}
                </div>
                <div className="overflow-hidden w-full">
                    <h4 className="text-black font-black text-base capitalize uppercase tracking-wide truncate w-full" title={contestMap[reg.eventId]}>
                        {contestMap[reg.eventId]}
                    </h4>
                    <p className="text-xs text-gray-500 font-bold mt-0.5 truncate w-full">
                        Applied on {new Date(reg.createdAt).toLocaleDateString()}
                    </p>
                </div>
            </div>
            <div className="self-start sm:self-auto ml-16 sm:ml-0 shrink-0">
                <StatusBadge status={reg.paymentStatus || 'pending'} />
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const configs = {
        pending: { color: 'text-black', bg: 'bg-[#FFDE59]', border: 'border-black', icon: <Clock size={14} className="shrink-0" /> },
        completed: { color: 'text-white', bg: 'bg-black', border: 'border-black', icon: <CheckCircle2 size={14} className="shrink-0" /> },
        verified: { color: 'text-white', bg: 'bg-black', border: 'border-black', icon: <CheckCircle2 size={14} className="shrink-0" /> },
        failed: { color: 'text-white', bg: 'bg-red-600', border: 'border-black', icon: <XCircle size={14} className="shrink-0" /> },
        rejected: { color: 'text-white', bg: 'bg-red-600', border: 'border-black', icon: <XCircle size={14} className="shrink-0" /> },
    };
    const config = configs[status] || configs.pending;
    return (
        <span className={`px-3 py-1.5 ${config.bg} border-2 ${config.border} ${config.color} text-[11px] font-black uppercase tracking-widest rounded-full flex items-center w-fit gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] truncate`}>
            {config.icon} <span className="truncate">{status}</span>
        </span>
    );
};

const UploadPlaceholder = ({ registrations, isContestOpen, onRegister, onNewSubmission }) => {
    if (registrations.length === 0) {
        return (
            <button onClick={onRegister} className="flex flex-col items-center justify-center aspect-square rounded-2xl bg-gray-50 border-[3px] border-dashed border-gray-300 hover:border-black hover:bg-white transition-all group shadow-sm overflow-hidden p-4 text-center">
                <Ticket className="w-10 h-10 text-black mb-3 group-hover:scale-110 transition-transform shrink-0" />
                <p className="text-sm font-black uppercase tracking-widest text-black truncate w-full">Register to Submit</p>
            </button>
        );
    }
    if (!isContestOpen) {
        return (
            <div className="flex flex-col items-center justify-center aspect-square rounded-2xl bg-gray-100 border-[3px] border-dashed border-gray-300 overflow-hidden p-4 text-center">
                <Lock className="w-10 h-10 text-gray-400 mb-3 shrink-0" />
                <p className="text-sm font-black uppercase tracking-widest text-gray-500 truncate w-full">Portal Locked</p>
            </div>
        );
    }
    return (
        <button onClick={onNewSubmission} className="flex flex-col items-center justify-center aspect-square rounded-2xl bg-white border-[3px] border-dashed border-gray-300 hover:border-black hover:bg-gray-50 transition-all group overflow-hidden p-4 text-center">
            <Plus className="w-10 h-10 text-gray-400 mb-3 group-hover:scale-110 group-hover:text-black transition-all shrink-0" />
            <p className="text-sm font-black uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors truncate w-full">New Submission</p>
        </button>
    );
};

const EmptyState = ({ icon, title, subtitle, actionLabel, onAction }) => (
    <div className="py-16 px-6 text-center bg-white border-[3px] border-black rounded-[2rem] overflow-hidden">
        <div className="text-black flex justify-center mb-5 shrink-0">{icon}</div>
        <h3 className="text-lg font-black uppercase tracking-wide text-black truncate w-full">{title}</h3>
        <p className="text-sm text-gray-600 font-bold mt-1 mb-6 max-w-sm mx-auto line-clamp-2">{subtitle}</p>
        {actionLabel && (
            <button onClick={onAction} className="px-8 py-3.5 bg-[#95CDED] border-2 border-black text-black text-sm font-black uppercase tracking-widest rounded-xl transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#588ca4] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none truncate max-w-full">
                {actionLabel}
            </button>
        )}
    </div>
);

// --- CLOUDINARY SUBMISSION MODAL ---
const NewSubmissionModal = ({ isOpen, onClose, onSuccess, user, registrations }) => {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setFile(null);
            setPreviewUrl(null);
            setTitle('');
            setCategory('');
            setLoading(false);

            if (registrations && registrations.length === 1) {
                const singleReg = registrations[0];
                setCategory(singleReg.eventId || singleReg.registrationType || singleReg.eventName || '');
            }
        }
    }, [isOpen, registrations]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file || !title.trim() || !category) {
            toast.error("Please fill all fields and upload artwork.");
            return;
        }

        try {
            setLoading(true);
            const toastId = toast.loading("Uploading your masterpiece...");

            const fileRef = ref(
                storage,
                `submissions/${user.uid}/${Date.now()}-${file.name}`
            );

            await uploadBytes(fileRef, file);
            const downloadURL = await getDownloadURL(fileRef);

            const categoryString = category.toLowerCase();
            const dbCategory = (categoryString.includes("painting") || categoryString.includes("art"))
                ? "art"
                : "photography";

            const token = await user.getIdToken();
            const saveRes = await fetch("/api/user/submissions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: title.trim(),
                    category: dbCategory,
                    imageUrl: downloadURL,
                }),
            });

            if (!saveRes.ok) {
                const err = await saveRes.json();
                throw new Error(err.error || "Failed to save submission");
            }

            toast.success("Artwork submitted successfully!", { id: toastId });
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-[4px] border-black flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-5 border-b-[4px] border-black bg-[#F6E245]">
                    <h3 className="text-xl font-black uppercase tracking-wider text-black truncate pr-2">New Submission</h3>
                    <button onClick={onClose} disabled={loading} className="text-black hover:bg-black hover:text-[#4BA1D8] border-2 border-transparent hover:border-black p-1.5 rounded-full transition-colors shrink-0">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[80vh] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div>
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                        <div
                            onClick={() => !loading && fileInputRef.current?.click()}
                            className={`w-full aspect-video rounded-2xl border-[3px] border-dashed flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all p-4 text-center ${previewUrl ? 'border-black bg-gray-50' : 'border-gray-300 bg-gray-50 hover:border-black'}`}
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-black mb-2 shrink-0" />
                                    <p className="text-sm font-black uppercase tracking-widest text-black truncate w-full">Upload Artwork</p>
                                    <p className="text-xs font-bold text-gray-500 mt-1 truncate w-full">High quality JPEG or PNG</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-black uppercase tracking-widest mb-2 truncate">Artwork Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Neon Dreams"
                            disabled={loading}
                            className="w-full px-4 py-3 bg-white border-[3px] border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-black uppercase tracking-widest mb-2 truncate">Contest Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            disabled={loading || (registrations && registrations.length === 1)}
                            className="w-full px-4 py-3 bg-white border-[3px] border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer appearance-none truncate disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <option value="" disabled>Select a category...</option>
                            {registrations && registrations.map(reg => {
                                const regValue = reg.eventId || reg.registrationType || reg.eventName;
                                return (
                                    <option key={reg._id} value={regValue} className="capitalize font-bold">
                                        {contestMap[reg.eventId] || regValue}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading || !file || !title.trim() || !category}
                            className="w-full py-4 bg-black disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed text-white font-black uppercase tracking-widest rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[2px] active:translate-x-[2px] active:shadow-none flex items-center justify-center gap-2 hover:bg-gray-900 shrink-0"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin shrink-0" /> : <Plus className="w-5 h-5 shrink-0" />}
                            <span className="truncate">{loading ? 'Submitting...' : 'Submit Artwork'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- EDIT PROFILE MODAL ---
const EditProfileModal = ({ isOpen, onClose, onSuccess, user, profile }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        profession: '',
        dob: '',
        institutionName: ''
    });
    const [loading, setLoading] = useState(false);

    const remove91Number = (number) => {
        return number.startsWith('+91') ? number.slice(3) : number;
    }

    const add91Number = (number) => {
        return number.startsWith('+91') ? number : `+91${number}`;
    }

    useEffect(() => {
        if (isOpen && profile) {
            // Pre-fill existing data
            const dateObj = new Date(profile.dob || Date.now());
            const formattedDate = !isNaN(dateObj) ? dateObj.toISOString().split('T')[0] : '';
            
            setFormData({
                fullName: profile.fullName || user?.displayName || '',
                phone: remove91Number(profile.phone) || '',
                profession: profile.profession || '',
                dob: formattedDate,
                institutionName: profile.collegeDetails?.institutionName || ''
            });
        }
    }, [isOpen, profile, user]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            const toastId = toast.loading("Updating your profile...");
            const token = await user.getIdToken();

            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    phone: add91Number(formData.phone),
                    profession: formData.profession,
                    dob: formData.dob,
                    collegeDetails: {
                        institutionName: formData.institutionName
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to update profile");
            }

            toast.success("Profile updated successfully!", { id: toastId });
            onSuccess(); // Refresh the overarching dashboard data
            onClose();
        } catch (error) {
            toast.error(error.message, { id: "edit-profile-error" });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-[4px] border-black flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-5 border-b-[4px] border-black bg-[#95CDED]">
                    <h3 className="text-xl font-black uppercase tracking-wider text-black truncate pr-2">Edit Profile</h3>
                    <button onClick={onClose} disabled={loading} className="text-black hover:bg-black hover:text-[#95CDED] border-2 border-transparent hover:border-black p-1.5 rounded-full transition-colors shrink-0">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[80vh] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div>
                        <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className="w-full px-4 py-3 bg-white border-[3px] border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className="w-full px-4 py-3 bg-white border-[3px] border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">Profession / Major</label>
                        <input
                            type="text"
                            name="profession"
                            value={formData.profession}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-full px-4 py-3 bg-white border-[3px] border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">College / University</label>
                        <input
                            type="text"
                            name="institutionName"
                            value={formData.institutionName}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-full px-4 py-3 bg-white border-[3px] border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">Date of Birth</label>
                        <input
                            type="date"
                            name="dob"
                            value={formData.dob}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-full px-4 py-3 bg-white border-[3px] border-black rounded-xl text-sm font-bold text-black focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-black disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed text-white font-black uppercase tracking-widest rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[2px] active:translate-x-[2px] active:shadow-none flex items-center justify-center gap-2 hover:bg-gray-900 shrink-0"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                            <span className="truncate">{loading ? 'Saving Changes...' : 'Save Profile'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserProfile;