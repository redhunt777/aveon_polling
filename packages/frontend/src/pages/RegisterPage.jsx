import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../api';
import { toast } from '../Toast';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [form, setForm] = useState({ token: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldError, setFieldError] = useState(''); // 'token' | 'password' | ''

    useEffect(() => {
        const t = searchParams.get('token');
        if (t) setForm(f => ({ ...f, token: t }));
    }, [searchParams]);

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match. Please re-enter your password.');
            setFieldError('password');
            return;
        }
        if (form.password.length < 8) {
            setError('Password must be at least 8 characters.');
            setFieldError('password');
            return;
        }
        setError(''); setFieldError(''); setLoading(true);
        try {
            await authApi.register(form);
            toast('Account created! Please sign in.', 'success');
            navigate('/login');
        } catch (err) {
            const msg = err.response?.data?.message || '';
            if (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('invite')) {
                setError('Invalid or expired invite token. Ask your admin for a new invite link.');
                setFieldError('token');
            } else if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
                setError('An account with this membership ID or email already exists.');
                setFieldError('token');
            } else if (msg.toLowerCase().includes('password')) {
                setError(msg);
                setFieldError('password');
            } else {
                setError(msg || 'Registration failed. Please check your invite link.');
                setFieldError('');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div style={{
                position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none',
                background: 'radial-gradient(ellipse 60% 50% at 80% 50%, rgba(26,91,255,0.07) 0%, transparent 60%)',
            }} />

            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-badge">🏁</div>
                    <h1 className="auth-title">JOIN THE TEAM</h1>
                    <p className="auth-sub">Create your AVEON Racing Club account</p>
                </div>

                {error && (
                    <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>&#x26A0;</span>
                        <span>{error}</span>
                    </div>
                )}
                {!form.token && (
                    <div className="alert alert-info">
                        You need an invite link from an admin to register.
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Invite Token</label>
                        <input
                            className="form-input"
                            name="token"
                            value={form.token}
                            onChange={handleChange}
                            placeholder="Paste your invite token"
                            required
                            style={fieldError === 'token' ? { borderColor: 'var(--danger)' } : {}}
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
                            placeholder="Min 8 characters"
                            minLength={8}
                            required
                            style={fieldError === 'password' ? { borderColor: 'var(--danger)' } : {}}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            className="form-input"
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            placeholder="Repeat your password"
                            required
                            style={fieldError === 'password' ? { borderColor: 'var(--danger)' } : {}}
                        />
                    </div>

                    <button className="btn btn-primary auth-btn" type="submit" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account →'}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account?{' '}
                    <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
