import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { toast } from './Toast';
import { isDemoModeActive, resetDemoStorage, activateDemoMode } from './mockApi';

export default function Navbar() {
    const { user, logout, isAdmin, hydrateUser } = useAuth();
    const navigate = useNavigate();
    const isDemo = isDemoModeActive();

    const handleLogout = async () => {
        await logout();
        toast('Logged out successfully', 'success');
        navigate('/login');
    };

    const handleResetDemo = () => {
        resetDemoStorage();
        toast('Demo data reset to default sample state!', 'info');
        window.location.reload();
    };

    const handleSwitchRole = async (targetRole) => {
        activateDemoMode(targetRole);
        await hydrateUser();
        toast(`Switched to Demo ${targetRole === 'admin' ? 'Admin' : 'Member'}!`, 'success');
        navigate('/dashboard');
    };

    if (!user) return null;

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <NavLink to="/" className="navbar-logo">
                        <div className="navbar-logo-icon">⚡</div>
                        AVEON <span className="cyan">POLLING</span>
                    </NavLink>

                    {isDemo && (
                        <span
                            className="badge badge-admin"
                            title="Pure frontend demo mode. Nothing is saved to or sent over any server."
                            style={{
                                background: 'rgba(0, 212, 255, 0.15)',
                                color: 'var(--cyan)',
                                border: '1px solid var(--cyan)',
                                boxShadow: '0 0 10px var(--cyan-glow)',
                                fontSize: '0.65rem',
                                letterSpacing: '0.1em',
                            }}
                        >
                            ⚡ DEMO MODE (FRONTEND ONLY)
                        </span>
                    )}
                </div>

                <ul className="navbar-nav">
                    <li>
                        <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                            Dashboard
                        </NavLink>
                    </li>
                    {isAdmin && (
                        <>
                            <li>
                                <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                                    Admin
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/monitor" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                                    Monitor
                                </NavLink>
                            </li>
                        </>
                    )}
                </ul>

                <div className="navbar-actions">
                    {isDemo && (
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize: '0.68rem', padding: '0.25rem 0.6rem' }}
                                onClick={() => handleSwitchRole(isAdmin ? 'member' : 'admin')}
                                title="Switch Demo User Role"
                            >
                                🔄 Switch to {isAdmin ? 'Member' : 'Admin'}
                            </button>
                            <button
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize: '0.68rem', padding: '0.25rem 0.6rem' }}
                                onClick={handleResetDemo}
                                title="Reset Demo Data to Initial State"
                            >
                                🧹 Reset Demo
                            </button>
                        </div>
                    )}

                    <div className="navbar-user">
                        <div className="navbar-avatar">{user.name?.[0]?.toUpperCase() || 'U'}</div>
                        <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.name}
                        </span>
                        <span className={`badge badge-${user.role}`}>{user.role}</span>
                    </div>

                    <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                        Sign Out
                    </button>
                </div>
            </div>
        </nav>
    );
}

