"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Firebase imports
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isProfileComplete, setIsProfileComplete] = useState(false);

    const router = useRouter();

    // Fetches the Mongoose profile securely using the Firebase token
    const fetchUserData = useCallback(async (currentUser) => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        try {
            // 1. Get a secure token from Firebase
            const token = await currentUser.getIdToken();

            // 2. Fetch the corresponding Mongoose user profile from your Next.js backend
            const response = await fetch('/api/user/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const profileData = await response.json();
                setProfile(profileData);
                setIsProfileComplete(profileData && profileData.collegeDetails?.institutionName && profileData.dob && profileData.phone);
                localStorage.setItem('spectrum_profile', JSON.stringify(profileData));
            } else {
                console.error("Failed to fetch Mongoose profile");
                setProfile(null);
            }
        } catch (error) {
            console.error("Context fetch error:", error);
        } finally {
            setLoading(false); // 🔥 ALWAYS stop loading
        }
    }, []);

    useEffect(() => {
        // 1. Load cached profile immediately for snappy UI
        const cached = localStorage.getItem('spectrum_profile');
        if (cached) {
            try {
                setProfile(JSON.parse(cached));
            } catch (e) {
                localStorage.removeItem('spectrum_profile');
            }
        }

        // 2. Listen to Firebase Auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                await fetchUserData(firebaseUser);
            } else {
                // User is logged out
                setUser(null);
                setProfile(null);
                localStorage.removeItem('spectrum_profile');
                setLoading(false);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [fetchUserData]);

    const logout = async () => {
        setLoading(true);
        try {
            await signOut(auth); // Firebase logout
            localStorage.removeItem('spectrum_profile');
            setProfile(null);
            setUser(null);
            router.push('/login');
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            loading,
            isProfileComplete,
            refreshData: () => fetchUserData(user),
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useLogin = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useLogin must be used within an AuthProvider");
    return context;
};