import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pollApi, authApi } from '../api';
import { toast } from '../Toast';

// ── Poll Management Tab ───────────────────────────────────────
function PollsTab() {
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newPoll, setNewPoll] = useState({ title: '', description: '' });
    const [creating, setCreating] = useState(false);

    const load = async () => {
        try {
            const { data } = await pollApi.list();
            setPolls(data.data || []);
        } catch { toast('Failed to load polls', 'error'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const createPoll = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await pollApi.create(newPoll);
            toast('Poll created!', 'success');
            setShowCreate(false);
            setNewPoll({ title: '', description: '' });
            load();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed', 'error');
        } finally { setCreating(false); }
    };

    const changeStatus = async (poll) => {
        const next = { draft: 'active', active: 'closed' };
        const nextStatus = next[poll.status];
        if (!nextStatus) return;
        if (!confirm(`Move poll to "${nextStatus}"?`)) return;
        try {
            await pollApi.updateStatus(poll._id, nextStatus);
            toast(`Poll is now ${nextStatus}`, 'success');
            load();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed', 'error');
        }
    };

    const deletePoll = async (id) => {
        if (!confirm('Delete this poll?')) return;
        try {
            await pollApi.delete(id);
            toast('Poll deleted', 'success');
            load();
        } catch (err) {
            toast(err.response?.data?.message || 'Cannot delete active poll', 'error');
        }
    };

    const statusNext = { draft: 'Activate', active: 'Close' };
    const statusBadge = { active: 'badge-active', closed: 'badge-closed', draft: 'badge-draft' };

    return (
        <div>
            <div className="section-header">
                <h2 className="section-title">Manage <span className="accent">Polls</span></h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(s => !s)}>
                    {showCreate ? '✕ Cancel' : '+ New Poll'}
                </button>
            </div>

            {showCreate && (
                <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--border-strong)' }}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--cyan)', marginBottom: '1rem' }}>
                        ⚡ Create New Poll
                    </h3>
                    <form onSubmit={createPoll} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Poll Title</label>
                            <input className="form-input" value={newPoll.title}
                                onChange={e => setNewPoll(p => ({ ...p, title: e.target.value }))}
                                placeholder="e.g. Student Council Elections 2026" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <input className="form-input" value={newPoll.description}
                                onChange={e => setNewPoll(p => ({ ...p, description: e.target.value }))}
                                placeholder="Optional description" />
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="btn btn-primary btn-sm" type="submit" disabled={creating}>
                                {creating ? 'Creating...' : 'Create Poll'}
                            </button>
                            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowCreate(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? <div className="page-loader" style={{ minHeight: 200 }}><div className="spinner" /></div> : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Status</th>
                                <th>Positions</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {polls.length === 0 && (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No polls yet</td></tr>
                            )}
                            {polls.map(p => (
                                <tr key={p._id}>
                                    <td className="name">{p.title}</td>
                                    <td><span className={`badge ${statusBadge[p.status]}`}>{p.status}</span></td>
                                    <td style={{ color: 'var(--text-muted)' }}>{p.positions?.length || 0}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                        {new Date(p.createdAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                            <Link to={`/admin/poll/${p._id}`} className="btn btn-outline btn-sm">Edit</Link>
                                            {statusNext[p.status] && (
                                                <button className="btn btn-ghost btn-sm" onClick={() => changeStatus(p)}>
                                                    {statusNext[p.status]}
                                                </button>
                                            )}
                                            {p.status !== 'active' && (
                                                <button className="btn btn-danger btn-sm" onClick={() => deletePoll(p._id)}>
                                                    Delete
                                                </button>
                                            )}
                                            {(p.status === 'active' || p.status === 'closed') && (
                                                <Link to={`/poll/${p._id}/results`} className="btn btn-ghost btn-sm">Results</Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ── Users Tab ─────────────────────────────────────────────────
function UsersTab() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInv] = useState(false);
    const [invite, setInvite] = useState({ email: '', name: '', membershipId: '', role: 'member' });
    const [inviting, setInviting] = useState(false);
    const [inviteResult, setInviteResult] = useState(null);

    const load = async () => {
        try {
            const { data } = await authApi.listUsers();
            setUsers(data.data || []);
        } catch { toast('Failed to load users', 'error'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const sendInvite = async (e) => {
        e.preventDefault();
        setInviting(true);
        setInviteResult(null);
        try {
            const { data } = await authApi.invite(invite);
            setInviteResult(data.data);
            toast(data.data.emailSent ? `Invite email sent to ${invite.email}` : 'Invite created — copy the link below', data.data.emailSent ? 'success' : 'info');
            setInvite({ email: '', name: '', membershipId: '', role: 'member' });
            load();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to send invite', 'error');
        } finally { setInviting(false); }
    };

    const changeRole = async (id, role) => {
        if (!confirm(`Change role to "${role}"?`)) return;
        try {
            await authApi.updateRole(id, role);
            toast('Role updated', 'success');
            load();
        } catch { toast('Failed', 'error'); }
    };

    const activate = async (id) => {
        if (!confirm('Reactivate this user?')) return;
        try {
            await authApi.activateUser(id);
            toast('User reactivated', 'success');
            load();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed', 'error');
        }
    };

    const deactivate = async (id) => {
        if (!confirm('Deactivate this user?')) return;
        try {
            await authApi.deactivateUser(id);
            toast('User deactivated', 'success');
            load();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed', 'error');
        }
    };

    return (
        <div>
            <div className="section-header">
                <h2 className="section-title">Manage <span className="accent">Members</span></h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowInv(s => !s)}>
                    {showInvite ? '✕ Cancel' : '+ Invite Member'}
                </button>
            </div>

            {showInvite && (
                <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--border-strong)' }}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--cyan)', marginBottom: '1rem' }}>
                        ⚡ Send Invite
                    </h3>

                    {/* Show registration link after invite is created */}
                    {inviteResult && (
                        <div style={{ marginBottom: '1rem', padding: '0.9rem 1rem', background: 'rgba(0,200,255,0.06)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)' }}>
                            <p style={{ fontSize: '0.72rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', color: inviteResult.emailSent ? 'var(--success)' : 'var(--warning)', marginBottom: '0.5rem' }}>
                                {inviteResult.emailSent ? '✓ EMAIL SENT' : '⚠ EMAIL NOT SENT — COPY LINK MANUALLY'}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                Registration link (expires in 72 hours):
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <code style={{ flex: 1, padding: '0.4rem 0.6rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', wordBreak: 'break-all', color: 'var(--cyan)', border: '1px solid var(--border)' }}>
                                    {inviteResult.registrationLink}
                                </code>
                                <button className="btn btn-outline btn-sm" onClick={() => {
                                    navigator.clipboard.writeText(inviteResult.registrationLink);
                                    toast('Link copied!', 'success');
                                }}>Copy</button>
                            </div>
                        </div>
                    )}

                    <form onSubmit={sendInvite}>
                        <div className="grid-2" style={{ marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input className="form-input" value={invite.name}
                                    onChange={e => setInvite(p => ({ ...p, name: e.target.value }))}
                                    placeholder="John Doe" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" type="email" value={invite.email}
                                    onChange={e => setInvite(p => ({ ...p, email: e.target.value }))}
                                    placeholder="john@example.com" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Membership ID</label>
                                <input className="form-input" value={invite.membershipId}
                                    onChange={e => setInvite(p => ({ ...p, membershipId: e.target.value }))}
                                    placeholder="MEM-001" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select className="form-input" value={invite.role}
                                    onChange={e => setInvite(p => ({ ...p, role: e.target.value }))}>
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="btn btn-primary btn-sm" type="submit" disabled={inviting}>
                                {inviting ? 'Creating…' : '+ Create Invite'}
                            </button>
                            <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setShowInv(false); setInviteResult(null); }}>
                                Close
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? <div className="page-loader" style={{ minHeight: 200 }}><div className="spinner" /></div> : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Membership ID</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id}>
                                    <td className="name">{u.name}</td>
                                    <td style={{ fontSize: '0.82rem' }}>{u.email}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--cyan)' }}>{u.membershipId}</td>
                                    <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                                    <td>
                                        <span className={`badge ${u.isActive ? 'badge-active' : 'badge-closed'}`}>
                                            {u.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <button className="btn btn-ghost btn-sm"
                                                onClick={() => changeRole(u._id, u.role === 'admin' ? 'member' : 'admin')}>
                                                → {u.role === 'admin' ? 'Member' : 'Admin'}
                                            </button>
                                            {u.isActive ? (
                                                <button className="btn btn-danger btn-sm" onClick={() => deactivate(u._id)}>
                                                    Deactivate
                                                </button>
                                            ) : (
                                                <button className="btn btn-outline btn-sm" style={{ color: 'var(--success)', borderColor: 'var(--success)' }} onClick={() => activate(u._id)}>
                                                    ✓ Activate
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ── Invites Tab ───────────────────────────────────────────────
function InvitesTab() {
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const { data } = await authApi.listInvites();
            setInvites(data.data || []);
        } catch { toast('Failed to load invites', 'error'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const cancel = async (id) => {
        if (!confirm('Cancel this invite?')) return;
        try {
            await authApi.cancelInvite(id);
            toast('Invite cancelled', 'success');
            load();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed', 'error');
        }
    };

    const copy = (link) => {
        navigator.clipboard.writeText(link);
        toast('Link copied!', 'success');
    };

    const now = new Date();

    return (
        <div>
            <div className="section-header">
                <h2 className="section-title">Pending <span className="accent">Invites</span></h2>
                <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
            </div>

            {loading ? <div className="page-loader" style={{ minHeight: 200 }}><div className="spinner" /></div> : (
                invites.length === 0 ? (
                    <div className="card">
                        <div className="empty-state" style={{ padding: '2rem' }}>
                            <div className="empty-icon">📬</div>
                            <div className="empty-title">No Invites</div>
                            <div className="empty-sub">Create invites from the Members tab.</div>
                        </div>
                    </div>
                ) : (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Membership ID</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Expires</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invites.map(inv => {
                                    const expired = new Date(inv.expiresAt) < now;
                                    const status = inv.used ? 'used' : expired ? 'expired' : 'pending';
                                    const badgeClass = { used: 'badge-active', expired: 'badge-closed', pending: 'badge-draft' };
                                    const regLink = `${window.location.origin}/register?token=${inv.token}`;
                                    return (
                                        <tr key={inv._id}>
                                            <td className="name">{inv.name}</td>
                                            <td style={{ fontSize: '0.82rem' }}>{inv.email}</td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--cyan)' }}>{inv.membershipId}</td>
                                            <td><span className={`badge badge-${inv.role}`}>{inv.role}</span></td>
                                            <td><span className={`badge ${badgeClass[status]}`}>{status}</span></td>
                                            <td style={{ fontSize: '0.75rem', color: expired ? 'var(--danger)' : 'var(--text-muted)' }}>
                                                {new Date(inv.expiresAt).toLocaleString()}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    {!inv.used && !expired && (
                                                        <button className="btn btn-ghost btn-sm" onClick={() => copy(regLink)}>Copy Link</button>
                                                    )}
                                                    {!inv.used && (
                                                        <button className="btn btn-danger btn-sm" onClick={() => cancel(inv._id)}>Cancel</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )
            )}
        </div>
    );
}

// ── Admin Page ────────────────────────────────────────────────
export default function AdminPage() {
    const [tab, setTab] = useState('polls');

    return (
        <div className="with-navbar">
            <div className="page-content">
                <div style={{ marginBottom: '1.5rem' }}>
                    <p className="hero-eyebrow" style={{ marginBottom: '0.5rem' }}>Administration</p>
                    <h1 style={{ fontSize: 'clamp(1.3rem, 3vw, 2rem)' }}>
                        Admin <span className="cyan">Console</span>
                    </h1>
                </div>

                <div className="tabs">
                    <button className={`tab-btn ${tab === 'polls' ? 'active' : ''}`} onClick={() => setTab('polls')}>
                        🗳 Polls
                    </button>
                    <button className={`tab-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
                        👥 Members
                    </button>
                    <button className={`tab-btn ${tab === 'invites' ? 'active' : ''}`} onClick={() => setTab('invites')}>
                        📬 Invites
                    </button>
                </div>

                {tab === 'polls' && <PollsTab />}
                {tab === 'users' && <UsersTab />}
                {tab === 'invites' && <InvitesTab />}
            </div>
        </div>
    );
}
