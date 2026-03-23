"use client";

import React, { useState } from 'react';
import { Mail, ArrowLeft, User, KeyRound, ChevronRight, Check } from 'lucide-react';
const APCLogo = 'https://spectrum.gumlet.io/APCLogoColor_r6iixw';
const SPECTRUMLogo = 'https://spectrum.gumlet.io/SPECTRUMLogoBgLess_l37nhk';
import { BeatLoader } from 'react-spinners';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useLogin } from '@/app/context/AuthContext'; // Import your hook

// Firebase imports (Adjust the path to where your Firebase config is)
import { signInWithPopup, signInWithCustomToken } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase.js';

const Login = () => {
    const router = useRouter();
    const { refreshData } = useLogin(); // Extract refreshData

    // UI State
    const [mode, setMode] = useState('register'); // 'login' or 'register'
    const [step, setStep] = useState(1); // Step 1: Email/Name | Step 2: OTP
    const [isLoading, setIsLoading] = useState(false);
    const [isGLoading, setIsGLoading] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [otp, setOtp] = useState('');

    // ==========================================
    // 1. GOOGLE AUTHENTICATION
    // ==========================================
    const handleGoogleLogin = async () => {
        setIsGLoading(true);

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const firebaseUser = result.user;
            const token = await firebaseUser.getIdToken();

            const res = await fetch("/api/auth/sync-user", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                throw new Error("Failed to sync user to database");
            }

            // ADD THIS LINE: Force context to grab the newly synced profile
            if (refreshData) await refreshData(); 

            toast.success("Welcome to Spectrum!");
            router.push("/profile");

        } catch (error) {
            toast.error(error.message || "Google sign-in failed");
        } finally {
            setIsGLoading(false);
        }
    };

    // ==========================================
    // 2. SEND OTP (NODEMAILER BACKEND)
    // ==========================================
    const handleSendOtp = async (e) => {
        e.preventDefault();

        if (mode === 'register' && !fullName) {
            return toast.error("Please enter your full name");
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, fullName, mode }),
            });

            if (!response.ok) throw new Error("Failed to send OTP");

            toast.success("OTP sent to your email!");
            setStep(2); 
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // ==========================================
    // 3. VERIFY OTP
    // ==========================================
    const handleVerifyOtp = async (e) => {
        e.preventDefault();

        if (otp.length < 4) {
            return toast.error("Please enter a valid OTP");
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Invalid or expired OTP");
            }

            if (!data.firebaseToken) {
                throw new Error("Authentication token missing from server response.");
            }

            const credential = await signInWithCustomToken(auth, data.firebaseToken);
            const idToken = await credential.user.getIdToken();

            const syncRes = await fetch("/api/auth/sync-user", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (!syncRes.ok) {
                throw new Error("Failed to sync user profile.");
            }

            if (refreshData) await refreshData();

            toast.success(
                mode === "login"
                    ? "Welcome back!"
                    : "Account created successfully!"
            );

            router.push("/profile");

        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setStep(1);
        setOtp('');
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative selection:bg-black/10">
            
            {/* 3D STATIC CARD */}
            <div 
                className="relative z-10 max-w-sm w-full mx-4 p-8 bg-white rounded-3xl border-2 border-black overflow-hidden"
                style={{
                    boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)", // Solid black neobrutalist shadow
                }}
            >
                {/* Progress Bar for Step 2 */}
                {step === 2 && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                        <div className="h-full bg-black transition-all duration-500 ease-out w-full" />
                    </div>
                )}

                {/* LOGOS SECTION */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    {/* Note: Ensure these logos look good on a white background, or apply a CSS invert if they are white-only SVGs */}
                    <img src={APCLogo} alt="APC" width={80} height={40} className="h-10 rounded-lg w-auto" />
                    <div className="w-px h-8 bg-gray-300"></div>
                    <img src={SPECTRUMLogo} alt="SPECTRUM" width={80} height={40} className="h-10 w-auto" />
                </div>

                <div className="space-y-6">
                    {/* Google Login - Only show on Step 1 */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={isGLoading}
                                className="w-full cursor-pointer flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-gray-200 rounded-2xl bg-white hover:bg-gray-50 hover:border-gray-300 active:translate-y-[2px] transition-all text-black text-sm font-medium"
                            >
                                {isGLoading ? <BeatLoader speedMultiplier={0.5} size={6} color="#000" /> : (
                                    <>
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        Continue with Google
                                    </>
                                )}
                            </button>

                            <div className="flex items-center gap-4">
                                <div className="grow border-t border-gray-200"></div>
                                <span className="text-xs text-gray-500 font-bold tracking-widest uppercase">or email</span>
                                <div className="grow border-t border-gray-200"></div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={step === 1 ? handleSendOtp : handleVerifyOtp} className="space-y-4">

                        {/* --- STEP 1: EMAIL INPUT --- */}
                        {step === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                {mode === 'register' && (
                                    <div className="group">
                                        <div className="flex items-center p-1.5 bg-white border-2 border-gray-200 rounded-2xl focus-within:border-black transition-all">
                                            <div className="pl-3 pr-2 text-gray-400 group-focus-within:text-black"><User className="w-5 h-5" /></div>
                                            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" className="w-full bg-transparent py-2.5 text-sm text-black placeholder-gray-400 outline-none" required />
                                        </div>
                                    </div>
                                )}
                                <div className="group">
                                    <div className="flex items-center p-1.5 bg-white border-2 border-gray-200 rounded-2xl focus-within:border-black transition-all">
                                        <div className="pl-3 pr-2 text-gray-400 group-focus-within:text-black"><Mail className="w-5 h-5" /></div>
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="w-full bg-transparent py-2.5 text-sm text-black placeholder-gray-400 outline-none" required />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- STEP 2: OTP INPUT --- */}
                        {step === 2 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                                <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 mb-2">
                                    <Mail className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-600">We sent a verification code to</p>
                                    <p className="text-black font-bold">{email}</p>
                                </div>
                                <div className="group relative">
                                    <div className="flex items-center p-1.5 bg-white border-2 border-gray-200 rounded-2xl focus-within:border-black transition-all">
                                        <div className="pl-3 pr-2 text-gray-400 group-focus-within:text-black"><KeyRound className="w-5 h-5" /></div>
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                                            placeholder="Enter 6-digit OTP"
                                            className="w-full bg-transparent py-2.5 text-sm text-black placeholder-gray-400 outline-none tracking-widest font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Main Submit Button */}
                        <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 active:translate-y-[2px] transition-all flex justify-center items-center gap-2">
                            {isLoading ? <BeatLoader size={6} color="#fff" /> : (
                                <>
                                    {step === 1 ? 'Send Verification Code' : 'Verify & Enter'}
                                    {step === 1 ? <ChevronRight size={18} /> : <Check size={18} />}
                                </>
                            )}
                        </button>
                    </form>

                    {/* Navigation Helpers */}
                    <div className="text-center space-y-4">
                        {step === 1 ? (
                            <p className="text-sm text-gray-600">
                                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                                <button onClick={toggleMode} className="text-black font-bold hover:underline decoration-black cursor-pointer underline-offset-4">
                                    {mode === 'login' ? 'Sign up' : 'Log in'}
                                </button>
                            </p>
                        ) : (
                            <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-black font-medium transition-colors">
                                Use a different email
                            </button>
                        )}

                        <div className="pt-2">
                            <button onClick={() => router.push('/')} className="group inline-flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-black transition-colors">
                                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                                Back to Home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;