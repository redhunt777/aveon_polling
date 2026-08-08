import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function RequireAuth({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="page-loader"><div className="spinner" /></div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

export function RequireAdmin({ children }) {
    const { user, loading, isAdmin } = useAuth();
    if (loading) return <div className="page-loader"><div className="spinner" /></div>;
    if (!user) return <Navigate to="/login" replace />;
    if (!isAdmin) return <Navigate to="/dashboard" replace />;
    return children;
}

export function RedirectIfAuthed({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="page-loader"><div className="spinner" /></div>;
    if (user) return <Navigate to="/dashboard" replace />;
    return children;
}
