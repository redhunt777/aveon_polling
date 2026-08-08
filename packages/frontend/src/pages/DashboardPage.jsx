import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { pollApi, voteApi } from '../api';
import { toast } from '../Toast';

function PollCard({ poll, voteStatus, isAdmin, onStatusChange }) {
    const statusColor = { active: 'active', closed: 'closed', draft: 'draft' };
    const hasVoted = voteStatus?.[poll._id]?.hasVoted;

    return (
        <div className="card poll-card">
            <div className="poll-card-header">
                <div>
                    <div className="poll-card-title">{poll.title}</div>
                    <div className="poll-card-meta">
                        <span>{poll.positions?.length || 0} position{poll.positions?.length !== 1 ? 's' : ''}</span>
                        {poll.startTime && (
                            <span>Started {new Date(poll.startTime).toLocaleDateString()}</span>
                        )}
                    </div>
                </div>
                <span className={`badge badge-${statusColor[poll.status]}`}>{poll.status}</span>
            </div>

            {poll.description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {poll.description}
                </p>
            )}

            <div className="poll-card-positions">
                {poll.positions?.map(p => (
                    <span key={p.positionName} className="position-chip">{p.positionName}</span>
                ))}
            </div>

            <div className="poll-card-actions">
                {poll.status === 'active' && !isAdmin && (
                    hasVoted
                        ? <span className="badge badge-active" style={{ fontSize: '0.72rem' }}>✓ Voted</span>
                        : <Link to={`/poll/${poll._id}/vote`} className="btn btn-primary btn-sm">Cast Vote</Link>
                )}
                {poll.status === 'closed' && (
                    <Link to={`/poll/${poll._id}/results`} className="btn btn-outline btn-sm">View Results</Link>
                )}
                {isAdmin && poll.status === 'closed' && (
                    <Link to={`/poll/${poll._id}/results`} className="btn btn-outline btn-sm">Results</Link>
                )}
                {isAdmin && poll.status === 'active' && (
                    <Link to={`/poll/${poll._id}/results`} className="btn btn-ghost btn-sm">Live Count</Link>
                )}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { user, isAdmin } = useAuth();
    const [polls, setPolls] = useState([]);
    const [voteStatus, setVoteStatus] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await pollApi.list();
                const list = data.data || [];
                setPolls(list);

                if (!isAdmin) {
                    const active = list.filter(p => p.status === 'active');
                    const statuses = {};
                    await Promise.all(active.map(async (p) => {
                        try {
                            const r = await voteApi.status(p._id);
                            statuses[p._id] = r.data.data;
                        } catch { /* skip */ }
                    }));
                    setVoteStatus(statuses);
                }
            } catch {
                toast('Failed to load polls', 'error');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [isAdmin]);

    const grouped = {
        active: polls.filter(p => p.status === 'active'),
        closed: polls.filter(p => p.status === 'closed'),
        draft: polls.filter(p => p.status === 'draft'),
    };

    return (
        <div className="with-navbar">
            {/* Hero strip */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(0,212,255,0.07) 0%, transparent 60%)',
                borderBottom: '1px solid var(--border)',
                padding: '2.5rem 2rem',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
                    background: 'linear-gradient(135deg, rgba(0,212,255,0.05) 0%, transparent 50%)',
                }} />
                <div className="container" style={{ position: 'relative' }}>
                    <p className="hero-eyebrow">AVEON Racing Club</p>
                    <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', marginBottom: '0.5rem' }}>
                        Welcome, <span className="cyan">{user?.name}</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {isAdmin
                            ? 'Admin console — manage polls and monitor the system'
                            : 'Cast your votes and view election results'}
                    </p>
                </div>
            </div>

            <div className="page-content">
                {loading ? (
                    <div className="page-loader"><div className="spinner" /></div>
                ) : (
                    <>
                        {/* Active Polls */}
                        {grouped.active.length > 0 && (
                            <section style={{ marginBottom: '2.5rem' }}>
                                <div className="section-header">
                                    <h2 className="section-title">
                                        <span className="accent">Active</span> Elections
                                        <span className="badge badge-active" style={{ marginLeft: '0.75rem', verticalAlign: 'middle' }}>
                                            {grouped.active.length}
                                        </span>
                                    </h2>
                                </div>
                                <div className="grid-2">
                                    {grouped.active.map(p => (
                                        <PollCard key={p._id} poll={p} voteStatus={voteStatus} isAdmin={isAdmin} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Closed / Past */}
                        {grouped.closed.length > 0 && (
                            <section style={{ marginBottom: '2.5rem' }}>
                                <div className="section-header">
                                    <h2 className="section-title">Past <span className="accent">Elections</span></h2>
                                </div>
                                <div className="grid-3">
                                    {grouped.closed.map(p => (
                                        <PollCard key={p._id} poll={p} voteStatus={voteStatus} isAdmin={isAdmin} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Draft — admin only */}
                        {isAdmin && grouped.draft.length > 0 && (
                            <section>
                                <div className="section-header">
                                    <h2 className="section-title">Draft <span className="accent">Polls</span></h2>
                                    <Link to="/admin" className="btn btn-outline btn-sm">Manage →</Link>
                                </div>
                                <div className="grid-3">
                                    {grouped.draft.map(p => (
                                        <PollCard key={p._id} poll={p} voteStatus={voteStatus} isAdmin={isAdmin} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {polls.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-icon">🗳️</div>
                                <div className="empty-title">No Elections Yet</div>
                                <div className="empty-sub">
                                    {isAdmin ? 'Create the first poll from the Admin panel.' : 'Check back when an admin opens an election.'}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
