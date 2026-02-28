import API_BASE from '../utils/api';
import { createContext, useState, useEffect, useContext } from 'react';

// ── Create context ────────────────────────────────────────────
export const AuthContext = createContext(null);

// ── Custom hook for easy access ───────────────────────────────
export function useAuth() {
    return useContext(AuthContext);
}

// ── Provider ──────────────────────────────────────────────────
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);         // user object from API | localStorage
    const [token, setToken] = useState(null);       // JWT string
    const [loading, setLoading] = useState(true);  // block render until checked

    // ── 1. Restore session on cold start / refresh ────────────
    useEffect(() => {
        const savedToken = localStorage.getItem('kas_token');
        const savedUser = localStorage.getItem('kas_user');

        if (savedToken && savedUser) {
            try {
                const parsed = JSON.parse(savedUser);
                setToken(savedToken);
                setUser(parsed);

                // Re-validate against the real API (silent refresh)
                fetch(`${API_BASE}/api/user/profile`, {
                    headers: { 'x-auth-token': savedToken }
                })
                    .then(r => r.ok ? r.json() : null)
                    .then(data => {
                        if (data?.data) {
                            setUser(data.data);
                            localStorage.setItem('kas_user', JSON.stringify(data.data));
                        }
                    })
                    .catch(() => {/* offline — keep cached user */ });
            } catch {
                localStorage.removeItem('kas_token');
                localStorage.removeItem('kas_user');
            }
        }
        setLoading(false);
    }, []);

    // ── 2. Login ─────────────────────────────────────────────
    const login = (authData) => {
        // authData = { token, user } returned from /api/auth/login
        setToken(authData.token);
        setUser(authData.user);
        localStorage.setItem('kas_token', authData.token);
        localStorage.setItem('kas_user', JSON.stringify(authData.user));
    };

    // ── 3. Logout ─────────────────────────────────────────────
    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('kas_token');
        localStorage.removeItem('kas_user');
    };

    // ── 4. Update local user (after KYC re-submission etc.) ───
    const refreshUser = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/api/user/profile`, {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                const userData = data?.data ?? data;   // handle both {success,data} and raw user
                setUser(userData);
                localStorage.setItem('kas_user', JSON.stringify(userData));
            }
        } catch { /* ignore */ }
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'Admin',
        isVerified: user?.kycStatus === 'Verified',
        login,
        logout,
        refreshUser
    };

    // Don't render children until we've checked localStorage (avoids flash)
    if (loading) return null;

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
