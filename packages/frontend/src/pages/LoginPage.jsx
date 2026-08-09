import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { toast } from '../Toast';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const user = await login(form.email, form.password);
            toast(`Welcome back, ${user.name}!`, 'success');
            navigate('/dashboard');
        } catch (err) {
            const msg = err.response?.data?.message || '';
            // Map backend messages to friendly UI errors
            if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('credentials')) {
                setError('Incorrect email or password. Please try again.');
            } else if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('no user')) {
                setError('No account found with this email address.');
            } else if (msg.toLowerCase().includes('inactive') || msg.toLowerCase().includes('deactivated') || msg.toLowerCase().includes('disabled')) {
                setError('Your account has been deactivated. Please contact an admin.');
            } else if (msg.toLowerCase().includes('expired')) {
                setError('Your session has expired. Please sign in again.');
            } else {
                setError(msg || 'Login failed. Please check your credentials and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Background decorative diagonals */}
            <div style={{
                position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none',
                background: 'radial-gradient(ellipse 60% 50% at 20% 50%, rgba(0,212,255,0.07) 0%, transparent 60%)',
            }} />

            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-badge">⚡</div>
                    <h1 className="auth-title">AVEON POLLING</h1>
                    <p className="auth-sub">Sign in to your club account</p>
                </div>

                {error && (
                    <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>&#x26A0;</span>
                        <span>{error}</span>
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            className="form-input"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            required
                            style={error ? { borderColor: 'var(--danger)' } : {}}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            className="form-input"
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            style={error ? { borderColor: 'var(--danger)' } : {}}
                        />
                    </div>

                    <button className="btn btn-primary auth-btn" type="submit" disabled={loading}>
                        {loading ? 'Authenticating...' : 'Sign In →'}
                    </button>
                </form>

                <div className="auth-footer">
                    Have an invite link?{' '}
                    <Link to="/register">Create your account</Link>
                </div>
            </div>
        </div>
    );
}
