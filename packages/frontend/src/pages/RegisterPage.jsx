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

    useEffect(() => {
        const t = searchParams.get('token');
        if (t) setForm(f => ({ ...f, token: t }));
    }, [searchParams]);

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setError(''); setLoading(true);
        try {
            await authApi.register(form);
            toast('Account created! Please sign in.', 'success');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.');
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

                {error && <div className="alert alert-error">{error}</div>}
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
