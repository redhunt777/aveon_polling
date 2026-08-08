import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { toast } from './Toast';

export default function Navbar() {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        toast('Logged out successfully', 'success');
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <NavLink to="/" className="navbar-logo">
                    <div className="navbar-logo-icon">⚡</div>
                    AVEON <span className="cyan">POLLING</span>
                </NavLink>

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
