import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const hydrateUser = useCallback(async () => {
        const token = localStorage.getItem('access_token');
        if (!token) { setLoading(false); return; }
        try {
            const { data } = await authApi.me();
            setUser(data.data);
        } catch {
            localStorage.clear();
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { hydrateUser(); }, [hydrateUser]);

    const login = async (email, password) => {
        const { data } = await authApi.login({ email, password });
        localStorage.setItem('access_token', data.data.accessToken);
        localStorage.setItem('refresh_token', data.data.refreshToken);
        localStorage.setItem('user_id', data.data.user._id);
        setUser(data.data.user);
        return data.data.user;
    };

    const logout = async () => {
        try { await authApi.logout(); } catch { /* ignore */ }
        localStorage.clear();
        setUser(null);
    };

    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, hydrateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
