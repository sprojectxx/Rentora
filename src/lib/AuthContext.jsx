import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    
    // Polyfill missing expected fields to prevent app crash
    const authError = null;
    const isLoadingPublicSettings = false;
    const checkUserAuth = async () => {
        await refreshUser();
    };

    const fetchUserAndSetState = async (session) => {
        if (!session?.user) {
            setUser(null);
            setIsAuthenticated(false);
            setIsLoadingAuth(false);
            setAuthChecked(true);
            return;
        }

        try {
            // Fetch user details from our "users" table using ID (safer than email)
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            if (!userError && userData) {
                setUser({ ...session.user, ...userData });
            } else {
                // Profile hasn't been created yet
                setUser(session.user);
            }
            setIsAuthenticated(true);
        } catch (error) {
            console.error('User auth sync failed:', error);
        } finally {
            setIsLoadingAuth(false);
            setAuthChecked(true);
        }
    };

    // Extracted method so we can call it manually
    const refreshUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        await fetchUserAndSetState(session);
    };

    useEffect(() => {
        // 1. Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            fetchUserAndSetState(session);
        });

        // 2. Listen for auth changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                // Only run full fetch if it's an actual state change, not just the initial burst
                if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT' || _event === 'TOKEN_REFRESHED' || _event === 'INITIAL_SESSION') {
                    // Quick UI unblocking if logged out
                    if (!session) {
                        setUser(null);
                        setIsAuthenticated(false);
                        setIsLoadingAuth(false);
                        return;
                    }
                    fetchUserAndSetState(session);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const logout = async () => {
        setIsLoadingAuth(true);
        await supabase.auth.signOut();
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
    };

    const navigateToLogin = () => {
        window.location.href = '/login'; 
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLoadingAuth,
            authChecked,
            logout,
            navigateToLogin,
            refreshUser,
            authError,
            isLoadingPublicSettings,
            checkUserAuth,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
