"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isProfileComplete, setIsProfileComplete] = useState(false);

    const router = useRouter();

    const fetchUserData = useCallback(async (currentUser) => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        try {
            const token = await currentUser.getIdToken();
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
                
                const complete = Boolean(
                    profileData && 
                    profileData.phone && 
                    profileData.dob && 
                    profileData.collegeDetails?.institutionName
                );
                
                setIsProfileComplete(complete);
                localStorage.setItem('spectrum_profile', JSON.stringify(profileData));
            } else {
                setProfile(null);
            }
        } catch (error) {
            console.error("Context fetch error:", error);
        } finally {
            setLoading(false); 
        }
    }, []);

    useEffect(() => {
        const cached = localStorage.getItem('spectrum_profile');
        if (cached) {
            try {
                const parsedCache = JSON.parse(cached);
                setProfile(parsedCache);
                setIsProfileComplete(Boolean(
                    parsedCache.phone && 
                    parsedCache.dob && 
                    parsedCache.collegeDetails?.institutionName
                ));
            } catch (e) {
                localStorage.removeItem('spectrum_profile');
            }
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                await fetchUserData(firebaseUser);
            } else {
                setUser(null);
                setProfile(null);
                setIsProfileComplete(false);
                localStorage.removeItem('spectrum_profile');
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [fetchUserData]);

    const logout = async () => {
        setLoading(true);
        try {
            await signOut(auth);
            localStorage.removeItem('spectrum_profile');
            setProfile(null);
            setUser(null);
            setIsProfileComplete(false);
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
