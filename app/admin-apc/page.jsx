"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getAuth, signOut } from 'firebase/auth'; // REAL AUTH + LOGOUT
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
    ShieldCheck, Search, Loader2, CheckCircle, XCircle,
    Camera, Users, CreditCard, Eye, GraduationCap,
    Calendar, Palette, Trash2, Hash, Send,
    Gavel, Heart, Image as ImageIcon, Phone, Banknote,
    Download, Filter, Home, CheckSquare, Users2, Shirt, User, LogOut
} from 'lucide-react';

async function getAuthHeaders() {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Not authenticated');
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
}

async function apiFetch(url, options = {}) {
    const headers = await getAuthHeaders();
    const res = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'API error');
    }
    return res.json();
}

export default function AdminPanel() {
    const router = useRouter();
    const auth = getAuth();

    const [activeTab, setActiveTab] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    const [data, setData] = useState([]);
    const [pending, setPending] = useState([]);
    const [groupedSubmissions, setGroupedSubmissions] = useState({});

    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);

    const [filters, setFilters] = useState({
        modelling: false,
        canvas_painting: false,
        totebag_painting: false,
        photography: false,
        accommodation: false,
        day1: false,
        day2: false,
        authDay2: false,
        // NEW FILTERS
        group5: false,
        group10: false,
        pec_students: false
    });

    const [activeDay, setActiveDay] = useState(1);
    const [manualCode, setManualCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const scannerRef = useRef(null);

     const userRole = currentUser?.role || 'participant';
    const isAdmin = userRole === 'admin';
    const isFinance = userRole === 'admin' || userRole === 'finance';
    const isRegistration = userRole === 'admin' || userRole === 'registration';

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            if (!firebaseUser) {
                router.replace('/login');
                return;
            }
            try {
                // FIXED PATH: Added /profile to match your actual API route
                const profile = await apiFetch('/api/user/profile');
                
                // CRITICAL: Check if role is actually admin before setting user
                const normalizedRole = profile?.role?.toLowerCase();
                if (normalizedRole !== 'admin' && normalizedRole !== 'finance' && normalizedRole !== 'registration') {
                    toast.error("Access Denied: Admin privileges required.");
                    router.replace('/profile');
                    return;
                }

                setCurrentUser(profile);
            } catch (err) {
                console.error("Admin Auth Error:", err);
                router.replace('/profile');
            }
        });
        return () => unsubscribe();
    }, [router, auth]);

    const fetchData = useCallback(async () => {
        if (!currentUser) return;

        const rawRole = currentUser.role || 'participant';
        const role = rawRole.toLowerCase();

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
    }, [currentUser]);

    useEffect(() => {
        if (currentUser) fetchData();
    }, [currentUser, fetchData]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast.success("Logged out successfully");
            router.replace('/');
        } catch (error) {
            toast.error("Failed to log out.");
        }
    };

    const handleAttendance = async (code) => {
        if (isProcessing || !code) return;
        setIsProcessing(true);
        const cleanCode = code.trim().toUpperCase();
        const toastId = toast.loading(`Verifying ID: ${cleanCode}...`);

        try {
            const result = await apiFetch('/api/admin/attendance', {
                method: 'PATCH',
                body: JSON.stringify({ registrationCode: cleanCode, day: activeDay }),
            });

            if (result.alreadyPresent) {
                toast.info(`${result.fullName} is already marked for Day ${activeDay}.`, { id: toastId });
            } else {
                toast.success(`${result.fullName} authorized for Day ${activeDay}!`, { id: toastId });
            }

            setManualCode('');
            fetchData();
            return true;
        } catch (err) {
            toast.error(err.message || 'Connection error.', { id: toastId });
            return false;
        } finally {
            setIsProcessing(false);
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
            await handleAttendance(decodedText);
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
            toast.success(`Participant ${newStatus ? 'Qualified' : 'Disqualified'} for Finals.`);
        } catch (err) {
            toast.error(err.message || 'Failed to update Day 2 access.');
        }
    }

    async function handleToggleGroupMemberDay2(userId, memberIndex, currentStatus) {
        const newStatus = !currentStatus;
        try {
            await apiFetch(`/api/admin/users/${userId}/members/${memberIndex}`, {
                method: 'PATCH',
                body: JSON.stringify({ isSelectedDay2: newStatus }),
            });
            setSelectedUser((prev) => {
                const newMembers = [...prev.groupMembers];
                newMembers[memberIndex] = { ...newMembers[memberIndex], isSelectedDay2: newStatus };
                return { ...prev, groupMembers: newMembers };
            });
            fetchData();
            toast.success(`Group Member ${newStatus ? 'Qualified' : 'Disqualified'}.`);
        } catch (err) {
            toast.error(err.message || 'Failed to update member access.');
        }
    }

    const toggleFilter = (key) => {
        setFilters(prev => ({ ...prev, [key]: !prev[key] }));
    }

    const filteredData = data.filter(u => {
        const matchesSearch =
            u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            u.registrationCode?.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        const regs = u.eventsRegistered || [];
        const hasArt = regs.some(r => r.eventId === 'art' || r.category === 'art');
        const hasPhoto = regs.some(r => r.eventId === 'photography' || r.category === 'photography');
        const hasCanvasPainting = regs.some(r => r.eventId === 'canvas_painting' || r.category === 'canvas_painting');
        const hasTotePainting = regs.some(r => r.eventId === 'totebag_painting' || r.category === 'totebag_painting');
        const hasModelling = regs.some(r => r.eventId === 'modelling' || r.category === 'modelling');
        
        const isGroup5 = u.type === 'group5';
        const isGroup10 = u.type === 'group10';
        const isPec = /\bpec\b|punjab engineering/i.test(u.collegeDetails?.institutionName || u.college || '');

        if (filters.canvas_painting && !hasCanvasPainting) return false;
        if (filters.totebag_painting && !hasTotePainting) return false;
        if (filters.modelling && !hasModelling) return false;
        if (filters.art && !hasArt) return false;
        if (filters.photography && !hasPhoto) return false;
        if (filters.accommodation && !regs.some(r => r.requiresAccommodation)) return false;
        if (filters.day1 && !regs.some(r => r.dayOneAttendance)) return false;
        if (filters.day2 && !regs.some(r => r.dayTwoAttendance)) return false;
        if (filters.authDay2 && !regs.some(r => r.dayTwoAccess)) return false;
        
        if (filters.group5 && !isGroup5) return false;
        if (filters.group10 && !isGroup10) return false;
        if (filters.pec_students && !isPec) return false;

        return true;
    });

    const downloadCSV = () => {
        const headers = [
            'Registration Code', 'Full Name', 'Phone', 'College',
            'Events Registered', 'Amount Paid', 'Needs Accommodation',
            'Day 1 Present', 'Day 2 Present', 'Authorized for Day 2'
        ];
        const csvRows = [headers.join(',')];
        filteredData.forEach(u => {
            const regs = u.eventsRegistered || [];
            const events = regs.map(r => r.eventId).join(' & ') || 'None';
            const amount = regs.reduce((s, r) => s + (Number(r.amountPaid) || 0), 0);
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
            ].join(','));
        });
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), {
            href: url,
            download: `Spectrum_Registry_${new Date().toISOString().split('T')[0]}.csv`,
        });
        a.click();
        URL.revokeObjectURL(url);
    };

    const dashboardStats = data.reduce((acc, user) => {
    // Check if groupMembers exists before checking length
    const headcount = (user?.groupMembers && user.groupMembers.length > 0) ? user.groupMembers.length : 1;
        
        (user?.eventsRegistered || []).forEach(r => {
        if (r.paymentStatus === 'verified') acc.totalRevenue += Number(r.amountPaid || 0);
        if (r.eventId === 'canvas_painting') acc.canvasCount += headcount;
        if (r.eventId === 'totebag_painting') acc.toteCount += headcount;
        if (r.eventId === 'modelling') acc.modellingCount += headcount;
        if (r.eventId === 'photography') acc.photoCount += headcount;
    });
    return acc;
}, { totalRevenue: 0, canvasCount: 0, toteCount: 0, modellingCount: 0, photoCount: 0 });

    if (!currentUser) return (
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
                        <div className="flex items-center flex-wrap gap-3">
                            <h1 className="text-lg font-black uppercase tracking-tighter text-gray-900 italic flex items-center">
                                Spectrum Admin
                                <span className="text-[10px] bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded ml-2 not-italic">
                                    {userRole}
                                </span>
                            </h1>
                            <button 
                                onClick={handleLogout}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-red-200 shadow-sm active:scale-95"
                            >
                                <LogOut size={12} /> Logout
                            </button>
                        </div>
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
                                            onClick={() => handleAttendance(manualCode)}
                                            disabled={manualCode.length < 4 || isProcessing}
                                            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-rose-500 transition-all active:scale-95 disabled:opacity-50 disabled:hover:bg-gray-900"
                                        >
                                            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <><Send size={14} /> Authorize Entry</>}
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

                        {/* FULL FILTER LIST MATCHING SCREENSHOT */}
                        <div className="bg-white border border-gray-200 p-3 rounded-2xl shadow-sm flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-2 px-2 border-r border-gray-200 mr-2">
                                <Filter size={14} className="text-gray-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Filters</span>
                            </div>
                            <FilterChip active={filters.canvas_painting} onClick={() => toggleFilter('canvas_painting')} icon={<Palette size={12} />} label="Canvas Painting" />
                            <FilterChip active={filters.totebag_painting} onClick={() => toggleFilter('totebag_painting')} icon={<Shirt size={12} />} label="Tote Bag Painting" />
                            <FilterChip active={filters.modelling} onClick={() => toggleFilter('modelling')} icon={<User size={12} />} label="Modelling" />
                            <FilterChip active={filters.photography} onClick={() => toggleFilter('photography')} icon={<Camera size={12} />} label="Photography" />
                            <FilterChip active={filters.accommodation} onClick={() => toggleFilter('accommodation')} icon={<Home size={12} />} label="Accommodation" />
                            <FilterChip active={filters.day1} onClick={() => toggleFilter('day1')} icon={<CheckCircle size={12} />} label="Present Day 1" />
                            <FilterChip active={filters.day2} onClick={() => toggleFilter('day2')} icon={<CheckCircle size={12} />} label="Present Day 2" />
                            <FilterChip active={filters.authDay2} onClick={() => toggleFilter('authDay2')} icon={<CheckSquare size={12} />} label="Auth Day 2" colorClass="rose" />
                            <FilterChip active={filters.group5} onClick={() => toggleFilter('group5')} icon={<Users2 size={12} />} label="Group 5" colorClass="blue" />
                            <FilterChip active={filters.group10} onClick={() => toggleFilter('group10')} icon={<Users2 size={12} />} label="Group 10" colorClass="blue" />
                            <FilterChip active={filters.pec_students} onClick={() => toggleFilter('pec_students')} icon={<GraduationCap size={12} />} label="PEC Students" colorClass="amber" />
                        </div>

                        {/* ALL 6 STAT CARDS MATCHING SCREENSHOT */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard icon={<Banknote size={20} className="text-emerald-500" />} title="Total Revenue" value={`₹${dashboardStats.totalRevenue.toLocaleString('en-IN')}`} subtitle="Verified payments only" bgClass="bg-[#f0fdf4]" borderClass="border-[#bbf7d0]" />
                            <StatCard icon={<Palette size={20} className="text-pink-500" />} title="Total Registrations" value={dashboardStats.canvasCount + dashboardStats.toteCount + dashboardStats.modellingCount + dashboardStats.photoCount} subtitle="Total applications including unverified" bgClass="bg-[#fff1f2]" borderClass="border-[#fbcfe8]" />
                            <StatCard icon={<Palette size={20} className="text-pink-500" />} title="Painting Registrations" value={dashboardStats.canvasCount} subtitle="Total applications including unverified" bgClass="bg-[#fff1f2]" borderClass="border-[#fbcfe8]" />
                            <StatCard icon={<Palette size={20} className="text-pink-500" />} title="Tote Bag Painting Registrations" value={dashboardStats.toteCount} subtitle="Total applications including unverified" bgClass="bg-[#fff1f2]" borderClass="border-[#fbcfe8]" />
                            <StatCard icon={<Palette size={20} className="text-pink-500" />} title="Modelling Registrations" value={dashboardStats.modellingCount} subtitle="Total applications including unverified" bgClass="bg-[#fff1f2]" borderClass="border-[#fbcfe8]" />
                            <StatCard icon={<Camera size={20} className="text-blue-500" />} title="Photo Registrations" value={dashboardStats.photoCount} subtitle="Total applications including unverified" bgClass="bg-[#eff6ff]" borderClass="border-[#bfdbfe]" />
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
                                                const isGroup = u.type === 'group5' || u.type === 'group10';

                                                return (
                                                    <tr key={u._id} className="hover:bg-gray-50/50 transition-colors group">
                                                        <td className="p-4 md:p-6">
                                                            <div className="flex items-center gap-3 md:gap-4">
                                                                <img
                                                                    src={u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${u.fullName}`}
                                                                    className="w-10 h-10 rounded-xl border border-gray-200 shadow-sm"
                                                                    alt=""
                                                                />
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-black text-gray-900 text-[13px]">{u.fullName}</p>
                                                                        {isGroup && (
                                                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${u.type === 'group5' ? 'bg-[#5AE0FE]/20 text-blue-700 border-blue-200' : 'bg-[#F6E245]/30 text-yellow-800 border-yellow-300'}`}>
                                                                                {u.type === 'group5' ? 'Group 5' : 'Group 10'}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 font-medium">
                                                                        <span className="flex items-center gap-1"><Phone size={10} className="text-gray-400" /> {u.phone || 'No phone'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="p-4 md:p-6 font-mono text-rose-500 font-black tracking-widest text-[13px]">{u.registrationCode ? `${u.registrationCode.slice(0, 2)}-${u.registrationCode.slice(2, 8)}` : '------'}</td>

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
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => setSelectedUser(u)}
                                                                    className="p-2 md:p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all shadow-sm active:scale-95"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {filteredData.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="py-12 text-center text-gray-400 font-bold text-sm">No matching records found.</td>
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

            {/* ── USER INSPECTOR MODAL ── */}
            {selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
                        <div className="relative p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                {selectedUser.fullName}
                                {(selectedUser.type === 'group5' || selectedUser.type === 'group10') && (
                                    <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-widest rounded-md shadow-sm ${selectedUser.type === 'group5' ? 'bg-[#5AE0FE] border-blue-400 text-black' : 'bg-[#F6E245] border-yellow-400 text-black'}`}>
                                        {selectedUser.type === 'group5' ? 'Group of 5' : 'Group of 10'}
                                    </span>
                                )}
                            </h2>
                            <button onClick={() => setSelectedUser(null)} className="p-2 bg-white text-gray-700 rounded-full hover:bg-red-500 hover:text-white shadow-sm border border-gray-200 transition-all"><XCircle size={18} /></button>
                        </div>

                        <div className="p-6 md:p-8 overflow-y-auto">
                            
                            <div className="mb-8">
                                <p className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] px-1 mb-3">
                                    {selectedUser.type === 'single' ? 'Participant Details & Qualification' : 'Group Roster & Qualification'}
                                </p>
                                <div className="space-y-2">
                                    {/* SINGLE USER LAYOUT */}
                                    {selectedUser.type === 'single' ? (
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-white border-2 border-gray-100 rounded-xl gap-4">
                                            <div>
                                                <p className="text-sm font-black text-gray-900 flex items-center gap-2">
                                                    {selectedUser.fullName}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-3 mt-2">
                                                    <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1.5"><GraduationCap size={12} className="text-rose-400"/> {selectedUser.collegeDetails?.institutionName || selectedUser.college || 'N/A'}</p>
                                                    <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1.5"><Calendar size={12} className="text-rose-400"/> {selectedUser.dob || 'N/A'}</p>
                                                    <p className="text-[10px] font-mono text-gray-500 flex items-center gap-1.5"><Phone size={12} className="text-rose-400"/> {selectedUser.phone || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => handleToggleDay2(selectedUser._id, selectedUser.isSelectedDay2)}
                                                        className={`flex items-center justify-center w-full sm:w-auto gap-1.5 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${selectedUser.isSelectedDay2 ? 'bg-rose-500 text-white border-rose-600 shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200'}`}
                                                    >
                                                        <CheckSquare size={14} /> {selectedUser.isSelectedDay2 ? 'Qualified' : 'Qualify'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        /* GROUP ROSTER LAYOUT */
                                        selectedUser.groupMembers.map((m, i) => (
                                            <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-white border-2 border-gray-100 rounded-xl gap-4">
                                                <div>
                                                    <p className="text-sm font-black text-gray-900 flex items-center gap-2">
                                                        <span className="text-gray-400 font-mono text-[10px]">{i+1}.</span> {m.name}
                                                        {i === 0 && <span className="text-[8px] bg-black text-white px-1.5 py-0.5 rounded uppercase tracking-widest">Leader</span>}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-3 mt-2">
                                                        <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1.5"><GraduationCap size={12} className="text-rose-400"/> {m.college || 'N/A'}</p>
                                                        <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1.5"><Calendar size={12} className="text-rose-400"/> {m.dob || 'N/A'}</p>
                                                        <p className="text-[10px] font-mono text-gray-500 flex items-center gap-1.5"><Phone size={12} className="text-rose-400"/> {m.phone || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleToggleGroupMemberDay2(selectedUser._id, i, m.isSelectedDay2)}
                                                            className={`flex items-center justify-center w-full sm:w-auto gap-1.5 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${m.isSelectedDay2 ? 'bg-rose-500 text-white border-rose-600 shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200'}`}
                                                        >
                                                            <CheckSquare size={14} /> {m.isSelectedDay2 ? 'Qualified' : 'Qualify'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="mb-8">
                                <DetailRow icon={<Home size={14} />} label="Accommodation Required" value={(selectedUser.eventsRegistered || []).some(r => r.requiresAccommodation) ? 'Yes (Verify details on arrival)' : 'No'} />
                            </div>

                            <div className="space-y-3 mb-8">
                                <p className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] px-1">Registration History</p>
                                {(selectedUser.eventsRegistered || []).map(r => (
                                    <div key={r._id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg text-rose-500 border border-rose-100 shadow-sm"><Palette size={14} /></div>
                                            <div>
                                                <span className="text-xs font-bold capitalize text-gray-900 block">{r.eventId}</span>
                                                <span className="text-[10px] text-gray-500 font-medium mt-0.5 flex items-center gap-1"><Banknote size={10} className="text-emerald-500" /> Amount Paid: ₹{r.amountPaid || '0'}</span>
                                            </div>
                                        </div>
                                        <span className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded-md border ${r.paymentStatus === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>{r.paymentStatus}</span>
                                    </div>
                                ))}
                                {(!selectedUser.eventsRegistered || selectedUser.eventsRegistered.length === 0) && (
                                    <p className="text-xs text-gray-500 p-4 bg-gray-50 rounded-2xl border border-gray-100">No active registrations.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FilterChip({ active, onClick, icon, label, colorClass = 'gray' }) {
    let activeClass = 'bg-gray-900 border-gray-900 text-white';
    if (colorClass === 'rose') activeClass = 'bg-rose-50 border-rose-200 text-rose-600';
    if (colorClass === 'amber') activeClass = 'bg-amber-50 border-amber-200 text-amber-600';
    if (colorClass === 'blue') activeClass = 'bg-blue-50 border-blue-200 text-blue-600';
    
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
        <span className={`px-2.5 py-1.5 rounded-md text-[9px] font-black border transition-all duration-300 ${
            present 
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm scale-105' // Active Green State
                : 'bg-gray-50 text-gray-400 border-gray-200 opacity-50' // Inactive State
        }`}>
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
