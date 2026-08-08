import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { RequireAuth, RequireAdmin, RedirectIfAuthed } from './Guards';
import Navbar from './Navbar';
import ToastContainer from './Toast';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import VotePage from './pages/VotePage';
import ResultsPage from './pages/ResultsPage';
import AdminPage from './pages/AdminPage';
import MonitorPage from './pages/MonitorPage';

function AuthLayout({ children }) {
    return <>{children}</>;
}

function AppLayout({ children }) {
    return (
        <>
            <Navbar />
            {children}
        </>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={
                        <RedirectIfAuthed>
                            <AuthLayout><LoginPage /></AuthLayout>
                        </RedirectIfAuthed>
                    } />
                    <Route path="/register" element={
                        <RedirectIfAuthed>
                            <AuthLayout><RegisterPage /></AuthLayout>
                        </RedirectIfAuthed>
                    } />

                    {/* Protected member routes */}
                    <Route path="/dashboard" element={
                        <RequireAuth>
                            <AppLayout><DashboardPage /></AppLayout>
                        </RequireAuth>
                    } />
                    <Route path="/poll/:id/vote" element={
                        <RequireAuth>
                            <AppLayout><VotePage /></AppLayout>
                        </RequireAuth>
                    } />
                    <Route path="/poll/:id/results" element={
                        <RequireAuth>
                            <AppLayout><ResultsPage /></AppLayout>
                        </RequireAuth>
                    } />

                    {/* Admin-only routes */}
                    <Route path="/admin" element={
                        <RequireAdmin>
                            <AppLayout><AdminPage /></AppLayout>
                        </RequireAdmin>
                    } />
                    <Route path="/monitor" element={
                        <RequireAdmin>
                            <AppLayout><MonitorPage /></AppLayout>
                        </RequireAdmin>
                    } />

                    {/* Fallback */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>

                <ToastContainer />
            </BrowserRouter>
        </AuthProvider>
    );
}
