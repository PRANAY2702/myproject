"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useLogin } from '@/app/context/AuthContext'; // Using your stable context!
import {
    ShieldCheck, Search, Loader2, CheckCircle, XCircle,
    Camera, Users, CreditCard, Eye, GraduationCap,
    Calendar, Palette, Trash2, Hash, Send,
    Gavel, Heart, Image as ImageIcon, Phone, Banknote,
    Download, Filter, Home, CheckSquare, UserCircle
} from 'lucide-react';

export default function AdminPanel() {
    const router = useRouter();
    
    // Pull stable auth state from Context instead of raw Firebase calls
    const { user, profile, loading: authLoading } = useLogin();

    const [activeTab, setActiveTab] = useState(null);
    const [loading, setLoading] = useState(true);

    const [data, setData] = useState([]);
    const [pending, setPending] = useState([]);
    const [groupedSubmissions, setGroupedSubmissions] = useState({});

    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);

    const [filters, setFilters] = useState({
        modelling: false, canvas_painting: false, totebag_painting: false,
        photography: false, accommodation: false, day1: false, day2: false, authDay2: false,
    });

    const [activeDay, setActiveDay] = useState(1);
    const [manualCode, setManualCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const scannerRef = useRef(null);

    const [scannedGroup, setScannedGroup] = useState(null);
    const [selectedPresentIds, setSelectedPresentIds] = useState([]);

    const userRole = profile?.role || 'participant';
    const isAdmin = userRole === 'admin';
    const isFinance = userRole === 'admin' || userRole === 'finance';
    const isRegistration = userRole === 'admin' || userRole === 'registration';

    // Safe API Fetcher using the Context User Token
    const apiFetch = useCallback(async (url, options = {}) => {
        if (!user) throw new Error('Not authenticated');
        const token = await user.getIdToken();
        const res = await fetch(url, { 
            ...options, 
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...(options.headers || {}) 
            } 
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(err.error || 'API error');
        }
        return res.json();
    }, [user]);

    // Data Fetching Logic
    const fetchData = useCallback(async () => {
        if (!profile) return;

        const role = (profile.role || 'participant').toLowerCase();
        if (role === 'participant') {
            router.replace('/');
            return;
        }

        setActiveTab(prev => {
            if (prev) return prev; 
            if (role === 'admin') return 'users';
            if (role === 'registration') return 'scanner';
            if (role === 'finance') return 'verify';
            return 'users'; 
        });

        const canAdmin = role === 'admin';
        const canFinance = role === 'admin' || role === 'finance';

        setLoading(true);
        try {
            if (canAdmin) {
                const users = await apiFetch('/api/admin/users');
                setData(users);
            }
            if (canFinance) {
                const regs = await apiFetch('/api/admin/registrations?status=pending');
                setPending(regs);
            }
            if (canAdmin) {
                const subs = await apiFetch('/api/admin/submissions');
                const grouped = subs.reduce((acc, sub) => {
                    const uid = sub.userId?._id || sub.userId;
                    if (!acc[uid]) acc[uid] = { profile: sub.userId, submissions: [] };
                    acc[uid].submissions.push(sub);
                    return acc;
                }, {});
                setGroupedSubmissions(grouped);
            }
        } catch (err) {
            toast.error(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [profile, apiFetch, router]);

    // Master Bootloader - Waits for AuthContext
    useEffect(() => {
        if (!authLoading) {
            if (!user || (profile && profile.role === 'participant')) {
                router.replace('/');
            } else if (profile) {
                fetchData();
            }
        }
    }, [authLoading, user, profile, fetchData, router]);


    // ── SCANNER FLOW (CHECKLIST) ──────────────────────────────────────────────
    const handleScanCheck = async (code) => {
        if (isProcessing || !code) return;
        setIsProcessing(true);
        const cleanCode = code.trim().toUpperCase();
        const toastId = toast.loading(`Fetching ID: ${cleanCode}...`);

        try {
            let userDetails = data.find(u => u.registrationCode === cleanCode);
            if (!userDetails) {
                userDetails = await apiFetch(`/api/admin/users/by-code/${cleanCode}`);
            }
            if (!userDetails) throw new Error("User not found.");

            setScannedGroup(userDetails);
            setSelectedPresentIds([]);
            toast.dismiss(toastId);
        } catch (err) {
            toast.error("Invalid QR Code or User not found.", { id: toastId });
        } finally {
            setIsProcessing(false);
            setManualCode('');
        }
    };

    const toggleAttendanceCheckbox = (participantId, isChecked) => {
        if (isChecked) {
            setSelectedPresentIds(prev => [...prev, participantId]);
        } else {
            setSelectedPresentIds(prev => prev.filter(id => id !== participantId));
        }
    };

    const submitGroupAttendance = async () => {
        if (!scannedGroup) return;
        const toastId = toast.loading("Marking attendance...");

        try {
            const regs = scannedGroup.eventsRegistered || [];
            const isGroup = regs.some(r => r.registrationType === 'group5' || r.registrationType === 'group10');

            if (isGroup && selectedPresentIds.length === 0) {
                 toast.error("Please select at least one participant.", { id: toastId });
                 return;
            }

            await apiFetch('/api/admin/attendance', {
                method: 'PATCH',
                body: JSON.stringify({ 
                    registrationCode: scannedGroup.registrationCode, 
                    day: activeDay,
                    participantIds: isGroup ? selectedPresentIds : null 
                }),
            });

            toast.success("Attendance successfully recorded!", { id: toastId });
            setScannedGroup(null);
            setSelectedPresentIds([]);
            fetchData();
        } catch (err) {
            toast.error(err.message || "Failed to mark attendance.", { id: toastId });
        }
    };

    // ── INDIVIDUAL PARTICIPANT QUALIFY TOGGLE ───────────────────────────────
    const handleToggleParticipantQualify = async (regId, participantId, newStatus) => {
        const toastId = toast.loading("Updating qualification status...");
        try {
            await apiFetch(`/api/admin/registrations/${regId}/participants/${participantId}`, {
                method: 'PATCH',
                body: JSON.stringify({ isQualifiedDay2: newStatus }),
            });
            toast.success("Participant status updated!", { id: toastId });
            fetchData(); 
            
            if (selectedUser) {
                setSelectedUser(prev => {
                    const updatedEvents = prev.eventsRegistered.map(reg => {
                        if (reg._id === regId) {
                            return {
                                ...reg,
                                participants: (reg.participants || []).map(p => 
                                    p._id === participantId ? { ...p, isQualifiedDay2: newStatus } : p
                                )
                            };
                        }
                        return reg;
                    });
                    return { ...prev, eventsRegistered: updatedEvents };
                });
            }
        } catch (err) {
            toast.error(err.message || "Failed to update status.", { id: toastId });
        }
    };

    useEffect(() => {
        if (activeTab !== 'scanner') return;

        scannerRef.current = new Html5QrcodeScanner(
            'reader',
            { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
            false
        );

        scannerRef.current.render(async (decodedText) => {
            if (scannerRef.current?.getState() !== 2) return;
            scannerRef.current?.pause();
            await handleScanCheck(decodedText);
            setTimeout(() => { scannerRef.current?.resume(); }, 10000);
        }, () => { });

        return () => { scannerRef.current?.clear().catch(() => { }); };
    }, [activeTab, activeDay]);

    async function handleDeleteSubmission(id) {
        if (!window.confirm('Delete this artwork permanently?')) return;
        const toastId = toast.loading('Deleting...');
        try {
            await apiFetch(`/api/admin/submissions/${id}`, { method: 'DELETE' });
            toast.success('Artwork deleted.', { id: toastId });
            fetchData();
        } catch (err) {
            toast.error(err.message || 'Failed to delete.', { id: toastId });
        }
    }

    async function handleApprove(id, status) {
        const toastId = toast.loading('Updating payment status...');
        try {
            await apiFetch(`/api/admin/registrations/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ paymentStatus: status }),
            });
            toast.success('Status updated.', { id: toastId });
            fetchData();
        } catch (err) {
            toast.error(err.message || 'Update failed.', { id: toastId });
        }
    }

    async function handleToggleDay2(userId, current) {
        const newStatus = !current;
        try {
            await apiFetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                body: JSON.stringify({ isSelectedDay2: newStatus }),
            });
            setSelectedUser((prev) => ({ ...prev, isSelectedDay2: newStatus }));
            fetchData();
        } catch (err) {
            toast.error(err.message || 'Failed to update Day 2 access.');
        }
    }

    const toggleFilter = (key) => setFilters(prev => ({ ...prev, [key]: !prev[key] }));

    const filteredData = data.filter(u => {
        const regs = u.eventsRegistered || [];
        const isApproved = regs.some(r => r.paymentStatus === 'verified');
        if (!isApproved) return false;

        const matchesSearch =
            u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            u.registrationCode?.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        const hasArt = regs.some(r => r.eventId === 'art' || r.category === 'art');
        const hasPhoto = regs.some(r => r.eventId === 'photography' || r.category === 'photography');
        const hasCanvasPainting = regs.some(r => r.eventId === 'canvas_painting' || r.category === 'canvas_painting');
        const hasTotePainting = regs.some(r => r.eventId === 'totebag_painting' || r.category === 'totebag_painting');
        const hasModelling = regs.some(r => r.eventId === 'modelling' || r.category === 'modelling');

        if (filters.canvas_painting && !hasCanvasPainting) return false;
        if (filters.totebag_painting && !hasTotePainting) return false;
        if (filters.modelling && !hasModelling) return false;
        if (filters.art && !hasArt) return false;
        if (filters.photography && !hasPhoto) return false;
        if (filters.accommodation && !regs.some(r => r.requiresAccommodation)) return false;
        if (filters.day1 && !regs.some(r => r.dayOneAttendance)) return false;
        if (filters.day2 && !regs.some(r => r.dayTwoAttendance)) return false;
        if (filters.authDay2 && !regs.some(r => r.dayTwoAccess)) return false;

        return true;
    });

    const downloadCSV = () => {
        const headers = [
            'Registration Code', 'Full Name', 'Phone', 'College',
            'Events Registered', 'Amount Paid', 'Needs Accommodation',
            'Day 1 Present', 'Day 2 Present', 'Authorized for Day 2', 'Type'
        ];
        const csvRows = [headers.join(',')];
        filteredData.forEach(u => {
            const regs = u.eventsRegistered || [];
            const events = regs.map(r => r.eventId).join(' & ') || 'None';
            const amount = regs.reduce((s, r) => s + (Number(r.amountPaid) || 0), 0);
            
            const group10Reg = regs.find(r => r.registrationType === 'group10');
            const group5Reg = regs.find(r => r.registrationType === 'group5');
            const regType = group10Reg ? 'Group 10' : group5Reg ? 'Group 5' : 'Single';

            csvRows.push([
                u.registrationCode,
                `"${u.fullName || ''}"`,
                u.phone || 'N/A',
                `"${u.collegeDetails?.institutionName || ''}"`,
                `"${events}"`,
                amount,
                regs.some(r => r.requiresAccommodation) ? 'Yes' : 'No',
                regs.some(r => r.dayOneAttendance) ? 'Yes' : 'No',
                regs.some(r => r.dayTwoAttendance) ? 'Yes' : 'No',
                regs.some(r => r.dayTwoAccess) ? 'Yes' : 'No',
                regType
            ].join(','));
        });
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), { href: url, download: `Spectrum_Registry_${new Date().toISOString().split('T')[0]}.csv` });
        a.click();
        URL.revokeObjectURL(url);
    };

    const dashboardStats = data.reduce((acc, user) => {
        (user.eventsRegistered || []).forEach(r => {
            if (r.paymentStatus === 'verified') acc.totalRevenue += Number(r.amountPaid || 0);
            if (r.eventId === 'canvas_painting') acc.canvasCount++;
            if (r.eventId === 'totebag_painting') acc.toteCount++;
            if (r.eventId === 'modelling') acc.modellingCount++;
            if (r.eventId === 'photography') acc.photoCount++;
        });
        return acc;
    }, { totalRevenue: 0, canvasCount: 0, toteCount: 0, modellingCount: 0, photoCount: 0 });

    if (authLoading || (profile && loading && activeTab === null)) return (
        <div className="h-screen flex flex-col items-center justify-center bg-rose-50 text-gray-900 gap-4">
            <Loader2 className="animate-spin text-rose-500 w-10" />
            <p className="text-rose-500 uppercase tracking-widest text-[10px] font-black">Syncing Credentials</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#f8fafc] text-gray-900 font-sans selection:bg-rose-200">

            {/* NAV */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 p-4 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="p-2 bg-rose-500 rounded-lg shadow-sm">
                            <ShieldCheck className="text-white" size={20} />
                        </div>
                        <h1 className="text-lg font-black uppercase tracking-tighter text-gray-900 italic">
                            Spectrum Admin
                            <span className="text-[10px] bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded ml-2 not-italic">
                                {userRole}
                            </span>
                        </h1>
                    </div>

                    <div className="flex w-full md:w-auto bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200 shadow-inner overflow-x-auto [&::-webkit-scrollbar]:hidden">
                        {isAdmin && <TabBtn active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={16} />} label="Registry" />}
                        {isFinance && <TabBtn active={activeTab === 'verify'} onClick={() => setActiveTab('verify')} icon={<CreditCard size={16} />} label="Approvals" badge={pending.length} />}
                        {isRegistration && <TabBtn active={activeTab === 'scanner'} onClick={() => setActiveTab('scanner')} icon={<Camera size={16} />} label="Gate Pass" />}
                        {isAdmin && <TabBtn active={activeTab === 'moderation'} onClick={() => setActiveTab('moderation')} icon={<Gavel size={16} />} label="Moderation" />}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto p-4 md:p-8">

                {/* ── SCANNER TAB ── */}
                {activeTab === 'scanner' && (
                    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 animate-in zoom-in-95 duration-500">
                        <div className="grid grid-cols-2 gap-2 bg-white p-1.5 rounded-[2rem] border border-gray-200 shadow-sm">
                            <button onClick={() => setActiveDay(1)} className={`py-3.5 rounded-[1.5rem] text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${activeDay === 1 ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>Day 01 Access</button>
                            <button onClick={() => setActiveDay(2)} className={`py-3.5 rounded-[1.5rem] text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${activeDay === 2 ? 'bg-rose-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>Day 02 (Finals)</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 px-2">
                                    <Camera size={14} className="text-rose-500" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Live Camera Feed</span>
                                </div>
                                <div id="reader" className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm"></div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 px-2">
                                    <Hash size={14} className="text-blue-500" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Manual Override</span>
                                </div>
                                <div className="bg-white border border-gray-100 p-6 md:p-8 rounded-[2rem] shadow-sm">
                                    <p className="text-xs text-gray-500 mb-6 font-medium">Enter the registration code printed on the ID card.</p>
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            maxLength={8}
                                            value={manualCode}
                                            onChange={e => setManualCode(e.target.value.toUpperCase())}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-5 text-center text-3xl md:text-4xl font-mono font-black tracking-[0.4em] text-gray-900 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all placeholder:text-gray-300"
                                            placeholder="------"
                                        />
                                        <button
                                            onClick={() => handleScanCheck(manualCode)}
                                            disabled={manualCode.length < 4 || isProcessing}
                                            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-rose-500 transition-all active:scale-95 disabled:opacity-50 disabled:hover:bg-gray-900"
                                        >
                                            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <><Send size={14} /> Fetch ID</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── MODERATION TAB ── */}
                {activeTab === 'moderation' && (
                    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
                        <div className="text-center md:text-left">
                            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-gray-900 uppercase italic">Moderation</h2>
                            <p className="text-[10px] md:text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-1">Review and manage participant submissions</p>
                        </div>

                        {loading ? (
                            <div className="text-center py-20">
                                <Loader2 className="animate-spin text-rose-400 w-8 h-8 mx-auto" />
                            </div>
                        ) : Object.keys(groupedSubmissions).length === 0 ? (
                            <div className="text-center py-20 bg-white border border-gray-200 rounded-[2rem] shadow-sm">
                                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm font-bold">No submissions found.</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {Object.entries(groupedSubmissions).map(([userId, userGroup]) => (
                                    <div key={userId} className="bg-white border border-gray-200 rounded-[2rem] overflow-hidden shadow-sm">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gray-50/50 p-5 md:p-6 border-b border-gray-100">
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src={userGroup.profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${userGroup.profile?.fullName}`}
                                                    className="w-12 h-12 rounded-full border border-gray-200 shadow-sm"
                                                    alt=""
                                                />
                                                <div>
                                                    <h3 className="text-lg font-black text-gray-900">{userGroup.profile?.fullName}</h3>
                                                    <p className="text-[10px] text-rose-500 font-mono font-bold tracking-[0.2em]">{userGroup.profile?.registrationCode}</p>
                                                </div>
                                            </div>
                                            <div className="sm:ml-auto px-4 py-1.5 bg-white rounded-full border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-600 shadow-sm">
                                                {userGroup.submissions.length} Artworks
                                            </div>
                                        </div>

                                        <div className="p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 bg-gray-50/30">
                                            {userGroup.submissions.map(sub => (
                                                <div key={sub._id} className="group relative rounded-[1.5rem] overflow-hidden border border-gray-200 shadow-sm bg-white">
                                                    <div className="aspect-square relative">
                                                        <img src={sub.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={sub.title} />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent" />
                                                        <button
                                                            onClick={() => handleDeleteSubmission(sub._id)}
                                                            className="absolute top-3 right-3 p-2 bg-white/90 text-red-500 rounded-xl shadow-md md:opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white active:scale-90"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                        <div className="absolute bottom-0 left-0 p-4 w-full">
                                                            <span className="px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-md text-[8px] font-black uppercase tracking-widest text-white mb-2 inline-block border border-white/20">
                                                                {sub.category}
                                                            </span>
                                                            <h4 className="text-sm font-bold text-white truncate">{sub.title}</h4>
                                                            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-rose-400 font-bold bg-white/10 w-fit px-2 py-1 rounded border border-white/10">
                                                                <Heart size={10} className="fill-rose-400" /> {sub.likedBy?.length ?? 0} Likes
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── REGISTRY TAB ── */}
                {activeTab === 'users' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-gray-900 uppercase italic">Registry</h2>
                                <p className="text-[10px] md:text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-1">Showing: {filteredData.length} Records</p>
                            </div>
                            <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 shadow-sm transition-all placeholder:text-gray-400"
                                        placeholder="Filter database..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={downloadCSV}
                                    className="w-full sm:w-auto px-4 py-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Download size={14} /> Export CSV
                                </button>
                            </div>
                        </div>

                        {/* FILTER CHIPS */}
                        <div className="bg-white border border-gray-200 p-3 rounded-2xl shadow-sm flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-2 px-2 border-r border-gray-200 mr-2">
                                <Filter size={14} className="text-gray-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Filters</span>
                            </div>
                            <FilterChip active={filters.canvas_painting} onClick={() => toggleFilter('canvas_painting')} icon={<Palette size={12} />} label="Canvas Painting" />
                            <FilterChip active={filters.totebag_painting} onClick={() => toggleFilter('totebag_painting')} icon={<Palette size={12} />} label="Tote Bag Painting" />
                            <FilterChip active={filters.modelling} onClick={() => toggleFilter('modelling')} icon={<Palette size={12} />} label="Modelling" />
                            <FilterChip active={filters.photography} onClick={() => toggleFilter('photography')} icon={<Camera size={12} />} label="Photography" />
                            <FilterChip active={filters.accommodation} onClick={() => toggleFilter('accommodation')} icon={<Home size={12} />} label="Accommodation" />
                            <FilterChip active={filters.day1} onClick={() => toggleFilter('day1')} icon={<CheckCircle size={12} />} label="Present Day 1" />
                            <FilterChip active={filters.day2} onClick={() => toggleFilter('day2')} icon={<CheckCircle size={12} />} label="Present Day 2" />
                            <FilterChip active={filters.authDay2} onClick={() => toggleFilter('authDay2')} icon={<CheckSquare size={12} />} label="Auth Day 2" colorClass="rose" />
                        </div>

                        {/* STATS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard icon={<Banknote size={20} className="text-emerald-500" />} title="Total Revenue" value={`₹${dashboardStats.totalRevenue.toLocaleString('en-IN')}`} subtitle="Verified payments only" bgClass="bg-emerald-50/50" borderClass="border-emerald-100" />
                            <StatCard icon={<Palette size={20} className="text-pink-500" />} title="Total Registrations" value={dashboardStats.canvasCount + dashboardStats.toteCount + dashboardStats.modellingCount + dashboardStats.photoCount} subtitle="Total applications including unverified" bgClass="bg-pink-50/50" borderClass="border-pink-100" />
                            <StatCard icon={<Palette size={20} className="text-pink-500" />} title="Painting Registrations" value={dashboardStats.canvasCount} subtitle="Total applications including unverified" bgClass="bg-pink-50/50" borderClass="border-pink-100" />
                            <StatCard icon={<Palette size={20} className="text-pink-500" />} title="Tote Bag Painting Registrations" value={dashboardStats.toteCount} subtitle="Total applications including unverified" bgClass="bg-pink-50/50" borderClass="border-pink-100" />
                            <StatCard icon={<Palette size={20} className="text-pink-500" />} title="Modelling Registrations" value={dashboardStats.modellingCount} subtitle="Total applications including unverified" bgClass="bg-pink-50/50" borderClass="border-pink-100" />
                            <StatCard icon={<Camera size={20} className="text-blue-500" />} title="Photo Registrations" value={dashboardStats.photoCount} subtitle="Total applications including unverified" bgClass="bg-blue-50/50" borderClass="border-blue-100" />
                        </div>

                        {/* TABLE */}
                        <div className="bg-white border border-gray-200 rounded-[2rem] shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                {loading ? (
                                    <div className="text-center py-20">
                                        <Loader2 className="animate-spin text-rose-400 w-8 h-8 mx-auto" />
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-xs min-w-[850px]">
                                        <thead>
                                            <tr className="bg-gray-50 text-gray-500 uppercase text-[9px] font-black tracking-widest border-b border-gray-100">
                                                <th className="p-5 md:p-6">Type</th>
                                                <th className="p-5 md:p-6">User Details</th>
                                                <th className="p-5 md:p-6">Access Code</th>
                                                <th className="p-5 md:p-6">Events & Payments</th>
                                                <th className="p-5 md:p-6">Gate Status</th>
                                                <th className="p-5 md:p-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredData.map(u => {
                                                const regs = u.eventsRegistered || [];
                                                const day1 = regs.some(r => r.dayOneAttendance);
                                                const day2 = regs.some(r => r.dayTwoAttendance);
                                                const authDay2 = regs.some(r => r.dayTwoAccess);

                                                const group10Reg = regs.find(r => r.registrationType === 'group10');
                                                const group5Reg = regs.find(r => r.registrationType === 'group5');
                                                const regType = group10Reg ? 'group10' : group5Reg ? 'group5' : 'single';

                                                return (
                                                    <tr key={u._id} className="hover:bg-gray-50/50 transition-colors group">
                                                        <td className="p-4 md:p-6">
                                                            <span className={`px-2.5 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm ${
                                                                regType === 'group10' ? 'bg-[#F6E245] text-black border border-yellow-400' :
                                                                regType === 'group5' ? 'bg-[#5AE0FE] text-black border border-cyan-400' :
                                                                'bg-white text-gray-600 border border-gray-200'
                                                            }`}>
                                                                {regType === 'group10' ? 'Group 10' : regType === 'group5' ? 'Group 5' : 'Single'}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 md:p-6">
                                                            <div className="flex items-center gap-3 md:gap-4">
                                                                <img
                                                                    src={u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${u.fullName}`}
                                                                    className="w-10 h-10 rounded-xl border border-gray-200 shadow-sm"
                                                                    alt=""
                                                                />
                                                                <div>
                                                                    <p className="font-black text-gray-900 text-[13px]">{u.fullName}</p>
                                                                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 font-medium">
                                                                        <span className="flex items-center gap-1"><Phone size={10} className="text-gray-400" /> {u.phone || 'No phone'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="p-4 md:p-6 font-mono text-rose-500 font-black tracking-widest text-[13px]">{`${u.registrationCode.slice(0, 2)}-${u.registrationCode.slice(2, 8)}`}</td>

                                                        <td className="p-4 md:p-6">
                                                            <div className="flex flex-col gap-1.5">
                                                                {regs.length > 0 ? regs.map(r => (
                                                                    <div key={r._id} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider">
                                                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">{r.eventId}</span>
                                                                        <span className={`px-2 py-1 rounded border ${r.paymentStatus === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                                                            ₹{r.amountPaid || '0'}
                                                                        </span>
                                                                    </div>
                                                                )) : <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">None</span>}
                                                            </div>
                                                        </td>

                                                        <td className="p-4 md:p-6">
                                                            <div className="flex gap-1.5">
                                                                <AttendanceBadge present={day1} label="D1" />
                                                                <AttendanceBadge present={day2} label="D2" />
                                                                {authDay2 && (
                                                                    <span className="ml-1 px-1.5 py-1.5 bg-rose-50 text-rose-500 border border-rose-200 rounded-md text-[9px] font-black flex items-center justify-center">
                                                                        <CheckSquare size={10} />
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="p-4 md:p-6 text-right">
                                                            <button
                                                                onClick={() => setSelectedUser(u)}
                                                                className="p-2 md:p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-rose-50 hover:border-rose-200 text-gray-500 hover:text-rose-500 transition-all shadow-sm active:scale-95"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {filteredData.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="py-12 text-center text-gray-400 font-bold text-sm">No matching records found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── APPROVALS TAB ── */}
                {activeTab === 'verify' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center md:text-left">
                            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-gray-900 uppercase italic">Approvals</h2>
                            <p className="text-[10px] md:text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-1">Pending Receipts: {pending.length}</p>
                        </div>

                        {loading ? (
                            <div className="text-center py-20">
                                <Loader2 className="animate-spin text-rose-400 w-8 h-8 mx-auto" />
                            </div>
                        ) : pending.length === 0 ? (
                            <div className="text-center py-20 bg-white border border-gray-200 rounded-[2rem] shadow-sm">
                                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm font-bold">All caught up! No pending verifications.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                {pending.map(reg => (
                                    <div key={reg._id} className="bg-white border border-gray-200 p-4 md:p-6 rounded-[2rem] flex flex-col sm:flex-row gap-4 sm:gap-6 shadow-sm">
                                        <img
                                            src={reg.paymentScreenshotUrl}
                                            className="w-full sm:w-28 h-48 sm:h-36 object-cover rounded-[1.25rem] border border-gray-100 cursor-pointer hover:shadow-lg transition-all"
                                            onClick={() => window.open(reg.paymentScreenshotUrl)}
                                            alt="Receipt"
                                        />
                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div className="mb-4 sm:mb-0">
                                                <h3 className="font-black text-lg text-gray-900">{reg.userId?.fullName}</h3>
                                                <p className="text-[10px] font-black uppercase text-rose-500 tracking-[0.2em]">{reg.eventId} CATEGORY</p>
                                                <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest bg-gray-50 w-fit px-2 py-1 rounded-md border border-gray-100">{reg.city || 'Location Unknown'}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleApprove(reg._id, 'verified')} className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-sm active:scale-95">Approve</button>
                                                <button onClick={() => handleApprove(reg._id, 'failed')} className="px-4 bg-red-50 text-red-500 py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95"><XCircle size={18} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* ── SCANNED GROUP ATTENDANCE MODAL ── */}
            {scannedGroup && (() => {
                const regs = scannedGroup.eventsRegistered || [];
                const groupReg = regs.find(r => r.registrationType === 'group5' || r.registrationType === 'group10');
                const isGroup = !!groupReg;
                const members = isGroup ? (groupReg.participants || []) : [{
                    _id: scannedGroup._id,
                    fullName: scannedGroup.fullName,
                    isPresentDay1: regs.some(r => r.dayOneAttendance),
                    isPresentDay2: regs.some(r => r.dayTwoAttendance)
                }];

                return (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl flex flex-col max-h-[90vh]">
                            <h3 className="text-xl font-black uppercase text-gray-900 mb-1">Mark Attendance</h3>
                            <p className="text-xs text-gray-500 font-bold mb-4">
                                Select members present for <span className="text-rose-500">Day {activeDay}</span>.
                            </p>
                            
                            <div className="space-y-2 mb-6 overflow-y-auto">
                                {members.map((p, idx) => {
                                    const isAlreadyPresent = activeDay === 1 ? p.isPresentDay1 : p.isPresentDay2;
                                    return (
                                        <label key={p._id || idx} className={`flex items-center gap-3 p-3 border rounded-xl transition-colors ${isAlreadyPresent ? 'bg-gray-50 border-gray-100 opacity-70' : 'border-gray-200 cursor-pointer hover:bg-gray-50'}`}>
                                            <input 
                                                type="checkbox" 
                                                defaultChecked={isAlreadyPresent}
                                                disabled={isAlreadyPresent}
                                                className="w-5 h-5 rounded text-rose-500 focus:ring-rose-500"
                                                onChange={(e) => toggleAttendanceCheckbox(p._id, e.target.checked)}
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{p.fullName} {idx===0 && isGroup && '(Leader)'}</p>
                                                {isAlreadyPresent && <p className="text-[10px] text-emerald-500 font-black uppercase">Already Marked Present</p>}
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>

                            <div className="flex gap-3 mt-auto shrink-0">
                                <button onClick={() => setScannedGroup(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-black uppercase hover:bg-gray-200 transition-colors">Cancel</button>
                                <button onClick={submitGroupAttendance} className="flex-1 py-3 bg-rose-500 text-white rounded-xl text-xs font-black uppercase shadow-md hover:bg-rose-600 transition-colors">Confirm Entry</button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── USER INSPECTOR MODAL ── */}
            {selectedUser && (() => {
                const regs = selectedUser.eventsRegistered || [];
                const groupReg = regs.find(r => r.registrationType === 'group10' || r.registrationType === 'group5');
                const isGroup = !!groupReg;
                const participants = groupReg?.participants || [];
                
                return (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-xl rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
                            <div className="relative h-28 bg-gradient-to-r from-rose-100 to-pink-100 border-b border-gray-200 shrink-0">
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="absolute top-4 right-4 md:top-6 md:right-6 p-2.5 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full hover:bg-red-500 hover:text-white shadow-sm transition-all"
                                >
                                    <XCircle size={18} />
                                </button>
                                <div className="absolute -bottom-10 left-6 md:left-8 p-1.5 bg-white rounded-[1.75rem] shadow-lg border border-gray-100">
                                    <img
                                        src={selectedUser.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.fullName}`}
                                        className="w-20 h-20 rounded-[1.4rem] object-cover border border-gray-50"
                                        alt=""
                                    />
                                </div>
                            </div>

                            <div className="pt-14 px-6 md:px-8 pb-8 overflow-y-auto">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedUser.fullName} {isGroup && '(Leader)'}</h2>
                                        <p className="text-[10px] font-mono text-rose-500 font-bold tracking-[0.3em] uppercase">{selectedUser.registrationCode}</p>
                                    </div>
                                    <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[9px] font-black uppercase text-gray-500 tracking-widest shadow-sm">
                                        Role: {selectedUser.role}
                                    </div>
                                </div>

                                {/* GROUP ROSTER WITH QUALIFY BUTTONS */}
                                {isGroup ? (
                                    <div className="mb-6 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                                            <UserCircle size={14} /> Group Roster ({groupReg.registrationType === 'group5' ? '5' : '10'} members)
                                        </h4>
                                        <div className="space-y-3">
                                            {participants.map((p, idx) => (
                                                <div key={p._id || idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-900">
                                                            {p.fullName} {idx === 0 && <span className="bg-black text-white px-1.5 py-0.5 rounded text-[8px] ml-1">LEADER</span>}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 mt-0.5">{p.college || 'N/A'} • <Phone size={10} className="inline mb-0.5"/> {p.phone}</p>
                                                    </div>
                                                    
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleToggleParticipantQualify(groupReg._id, p._id, !p.isQualifiedDay2)}
                                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-sm shrink-0 ${p.isQualifiedDay2 ? 'bg-rose-500 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                                                        >
                                                            {p.isQualifiedDay2 ? 'Qualified (Revoke)' : 'Qualify for Day 2'}
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                        <DetailRow icon={<GraduationCap size={14} />} label="Campus" value={selectedUser.collegeDetails?.institutionName} />
                                        <DetailRow icon={<Phone size={14} />} label="Phone" value={selectedUser.phone || 'N/A'} />
                                        <DetailRow icon={<Calendar size={14} />} label="Born" value={selectedUser.dob} />
                                    </div>
                                )}

                                <div className="mb-8">
                                     <DetailRow icon={<Home size={14} />} label="Accommodation Required" value={regs.some(r => r.requiresAccommodation) ? 'Yes (Verify details on arrival)' : 'No'} />
                                </div>

                                <div className="space-y-3 mb-8">
                                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] px-1">Registration History</p>
                                    {regs.map(r => (
                                        <div key={r._id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-lg text-rose-500 border border-rose-100 shadow-sm"><Palette size={14} /></div>
                                                <div>
                                                    <span className="text-xs font-bold capitalize text-gray-900 block">{r.eventId}</span>
                                                    <span className="text-[10px] text-gray-500 font-medium mt-0.5 flex items-center gap-1">
                                                        <Banknote size={10} className="text-emerald-500" /> Amount Paid: ₹{r.amountPaid || '0'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded-md border ${r.paymentStatus === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                                {r.paymentStatus}
                                            </span>
                                        </div>
                                    ))}
                                    {regs.length === 0 && (
                                        <p className="text-xs text-gray-500 p-4 bg-gray-50 rounded-2xl border border-gray-100">No active registrations.</p>
                                    )}
                                </div>

                                {/* DAY 2 SELECT FOR SINGLE USERS ONLY */}
                                {isAdmin && !isGroup && (
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 md:p-6 bg-gray-50 border border-gray-200 rounded-2xl shadow-sm">
                                        <div>
                                            <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">Day 2 Selection</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5 font-medium">Authorize access for the final round</p>
                                        </div>
                                        <button
                                            onClick={() => handleToggleDay2(selectedUser._id, selectedUser.isSelectedDay2)}
                                            className={`w-full sm:w-auto px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 ${selectedUser.isSelectedDay2 ? 'bg-rose-500 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                                        >
                                            {selectedUser.isSelectedDay2 ? 'Selected (Revoke)' : 'Not Selected (Grant)'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

// ── Helper Components ─────────────────────────────────────────────────────────

function FilterChip({ active, onClick, icon, label, colorClass = 'gray' }) {
    const activeClass = colorClass === 'rose'
        ? 'bg-rose-50 border-rose-200 text-rose-600'
        : 'bg-gray-900 border-gray-900 text-white';
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 ${active ? activeClass : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
        >
            {icon} {label}
        </button>
    );
}

function StatCard({ icon, title, value, subtitle, bgClass, borderClass }) {
    return (
        <div className={`p-5 rounded-[2rem] border ${borderClass} ${bgClass} flex items-center gap-4`}>
            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-white/50">{icon}</div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{title}</p>
                <p className="text-2xl font-black text-gray-900 tracking-tight leading-tight">{value}</p>
                <p className="text-[10px] text-gray-500 font-medium mt-0.5">{subtitle}</p>
            </div>
        </div>
    );
}

function TabBtn({ active, onClick, icon, label, badge }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2.5 md:py-3 flex items-center gap-2 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${active ? 'bg-white text-rose-600 shadow-sm border border-gray-200/60' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
        >
            {icon} {label}
            {badge > 0 && <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[9px] ml-1 shadow-sm">{badge}</span>}
        </button>
    );
}

function AttendanceBadge({ present, label }) {
    return (
        <span className={`px-2.5 py-1.5 rounded-md text-[9px] font-black border ${present ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
            {label}
        </span>
    );
}

function DetailRow({ icon, label, value }) {
    return (
        <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-2xl">
            <div className="flex items-center gap-2 mb-1.5">
                <span className="text-rose-400">{icon}</span>
                <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest">{label}</p>
            </div>
            <p className="text-[12px] font-bold text-gray-900 truncate">{value || 'NOT_FOUND'}</p>
        </div>
    );
}
