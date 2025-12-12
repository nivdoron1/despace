import { useState, useEffect, useCallback } from 'react';
import { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { AuthState, LoginCredentials, RegisterCredentials, AuthConfig } from '../types/auth';

const DEFAULT_CACHE_KEY = 'supabase_auth_state';

export function useAuth(supabaseClient: SupabaseClient, config?: AuthConfig) {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        session: null,
        loading: true,
        error: null,
    });

    const cacheEnabled = config?.cache?.enabled ?? false;
    const cacheKey = config?.cache?.key ?? DEFAULT_CACHE_KEY;

    // Load cached session
    useEffect(() => {
        const loadSession = async () => {
            try {
                // Try to get session from Supabase
                const { data: { session }, error } = await supabaseClient.auth.getSession();

                if (error) throw error;

                if (session) {
                    setAuthState({
                        user: session.user as any,
                        session: session as any,
                        loading: false,
                        error: null,
                    });

                    // Cache session if enabled
                    if (cacheEnabled) {
                        localStorage.setItem(cacheKey, JSON.stringify(session));
                    }
                } else {
                    // Try to load from cache if enabled
                    if (cacheEnabled) {
                        const cached = localStorage.getItem(cacheKey);
                        if (cached) {
                            const cachedSession = JSON.parse(cached);
                            setAuthState({
                                user: cachedSession.user,
                                session: cachedSession,
                                loading: false,
                                error: null,
                            });
                            return;
                        }
                    }
                    setAuthState(prev => ({ ...prev, loading: false }));
                }
            } catch (error) {
                setAuthState({
                    user: null,
                    session: null,
                    loading: false,
                    error: error as Error,
                });
            }
        };

        loadSession();
    }, [supabaseClient, cacheEnabled, cacheKey]);

    // Listen to auth changes
    useEffect(() => {
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
            async (event, session) => {
                if (session) {
                    setAuthState({
                        user: session.user as any,
                        session: session as any,
                        loading: false,
                        error: null,
                    });

                    if (cacheEnabled) {
                        localStorage.setItem(cacheKey, JSON.stringify(session));
                    }
                } else {
                    setAuthState({
                        user: null,
                        session: null,
                        loading: false,
                        error: null,
                    });

                    if (cacheEnabled) {
                        localStorage.removeItem(cacheKey);
                    }
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [supabaseClient, cacheEnabled, cacheKey]);

    const signInWithEmail = useCallback(async (credentials: LoginCredentials) => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password,
            });

            if (error) throw error;

            setAuthState({
                user: data.user as any,
                session: data.session as any,
                loading: false,
                error: null,
            });

            if (cacheEnabled && data.session) {
                localStorage.setItem(cacheKey, JSON.stringify(data.session));
            }

            return { data, error: null };
        } catch (error) {
            setAuthState(prev => ({
                ...prev,
                loading: false,
                error: error as Error,
            }));
            return { data: null, error: error as Error };
        }
    }, [supabaseClient, cacheEnabled, cacheKey]);

    const signUpWithEmail = useCallback(async (credentials: RegisterCredentials) => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));

            const { data, error } = await supabaseClient.auth.signUp({
                email: credentials.email,
                password: credentials.password,
                options: {
                    data: credentials.metadata,
                },
            });

            if (error) throw error;

            setAuthState({
                user: data.user as any,
                session: data.session as any,
                loading: false,
                error: null,
            });

            if (cacheEnabled && data.session) {
                localStorage.setItem(cacheKey, JSON.stringify(data.session));
            }

            return { data, error: null };
        } catch (error) {
            setAuthState(prev => ({
                ...prev,
                loading: false,
                error: error as Error,
            }));
            return { data: null, error: error as Error };
        }
    }, [supabaseClient, cacheEnabled, cacheKey]);

    const signInWithGoogle = useCallback(async () => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));

            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: config?.redirects?.onSuccess || window.location.origin,
                },
            });

            if (error) throw error;

            return { data, error: null };
        } catch (error) {
            setAuthState(prev => ({
                ...prev,
                loading: false,
                error: error as Error,
            }));
            return { data: null, error: error as Error };
        }
    }, [supabaseClient, config]);

    const signOut = useCallback(async () => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));

            const { error } = await supabaseClient.auth.signOut();

            if (error) throw error;

            setAuthState({
                user: null,
                session: null,
                loading: false,
                error: null,
            });

            if (cacheEnabled) {
                localStorage.removeItem(cacheKey);
            }

            return { error: null };
        } catch (error) {
            setAuthState(prev => ({
                ...prev,
                loading: false,
                error: error as Error,
            }));
            return { error: error as Error };
        }
    }, [supabaseClient, cacheEnabled, cacheKey]);

    return {
        ...authState,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
    };
}
