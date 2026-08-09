import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pollApi } from '../api';
import { toast } from '../Toast';

// ── Candidate row ─────────────────────────────────────────
function CandidateRow({ pollId, positionName, candidate, onRemoved, isDraft }) {
    const [removing, setRemoving] = useState(false);

    const remove = async () => {
        if (!confirm(`Remove ${candidate.name}?`)) return;
        setRemoving(true);
        try {
            await pollApi.removeCandidate(pollId, positionName, candidate._id);
            toast(`Removed ${candidate.name}`, 'success');
            onRemoved(candidate._id);
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to remove', 'error');
        } finally {
            setRemoving(false);
        }
    };

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.6rem 0.75rem', background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-sm)', marginBottom: '0.4rem',
            border: '1px solid var(--border)',
        }}>
            <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{candidate.name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                    ({candidate.membershipId})
                </span>
                {candidate.bio && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.2rem 0 0' }}>
                        {candidate.bio}
                    </p>
                )}
            </div>
            {isDraft && (
                <button className="btn btn-danger btn-sm" onClick={remove} disabled={removing}>
                    {removing ? '...' : 'Remove'}
                </button>
            )}
        </div>
    );
}

// ── Add Candidate Form ────────────────────────────────────
function AddCandidateForm({ pollId, positionName, onAdded }) {
    const [form, setForm] = useState({ name: '', membershipId: '', bio: '' });
    const [saving, setSaving] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await pollApi.addCandidate(pollId, positionName, form);
            toast('Candidate added!', 'success');
            const position = data.data.positions.find(p => p.positionName === positionName);
            onAdded(position?.candidates || []);
            setForm({ name: '', membershipId: '', bio: '' });
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to add candidate', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-strong)' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--cyan)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>
                ADD CANDIDATE
            </p>
            <div className="grid-2" style={{ gap: '0.6rem', marginBottom: '0.6rem' }}>
                <input className="form-input" style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                    placeholder="Full name *" value={form.name} required
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                <input className="form-input" style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                    placeholder="Membership ID *" value={form.membershipId} required
                    onChange={e => setForm(p => ({ ...p, membershipId: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
                <input className="form-input" style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                    placeholder="Bio (optional)" value={form.bio}
                    onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
                <button className="btn btn-primary btn-sm" type="submit" disabled={saving}>
                    {saving ? 'Adding…' : '+ Add'}
                </button>
            </div>
        </form>
    );
}

// ── Position Card ─────────────────────────────────────────
function PositionCard({ pollId, position, isDraft, onCandidatesChange }) {
    const [candidates, setCandidates] = useState(position.candidates || []);
    const [showAdd, setShowAdd] = useState(false);

    const handleRemoved = (candidateId) => {
        setCandidates(prev => prev.filter(c => c._id !== candidateId));
        onCandidatesChange();
    };

    const handleAdded = (newList) => {
        setCandidates(newList);
        setShowAdd(false);
        onCandidatesChange();
    };

    return (
        <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                <h3 style={{ fontSize: '0.88rem', fontFamily: 'var(--font-heading)', fontStyle: 'italic', color: 'var(--cyan)' }}>
                    ⚡ {position.positionName}
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
                </span>
            </div>

            {candidates.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                    No candidates yet.
                </p>
            ) : (
                candidates.map(c => (
                    <CandidateRow
                        key={c._id}
                        pollId={pollId}
                        positionName={position.positionName}
                        candidate={c}
                        onRemoved={handleRemoved}
                        isDraft={isDraft}
                    />
                ))
            )}

            {isDraft && (
                <>
                    <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.4rem' }} onClick={() => setShowAdd(s => !s)}>
                        {showAdd ? '✕ Cancel' : '+ Add Candidate'}
                    </button>
                    {showAdd && (
                        <AddCandidateForm pollId={pollId} positionName={position.positionName} onAdded={handleAdded} />
                    )}
                </>
            )}
        </div>
    );
}

// ── Main PollEditPage ─────────────────────────────────────
export default function PollEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [poll, setPoll] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newPosition, setNewPosition] = useState('');
    const [addingPos, setAddingPos] = useState(false);
    const [showAddPos, setShowAddPos] = useState(false);
    const [changingStatus, setChangingStatus] = useState(false);

    const load = async () => {
        try {
            const { data } = await pollApi.get(id);
            setPoll(data.data);
        } catch (err) {
            toast(err.response?.data?.message || 'Poll not found', 'error');
            navigate('/admin');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [id]);

    const addPosition = async (e) => {
        e.preventDefault();
        if (!newPosition.trim()) return;
        setAddingPos(true);
        try {
            const { data } = await pollApi.addPosition(id, newPosition.trim());
            setPoll(data.data);
            setNewPosition('');
            setShowAddPos(false);
            toast('Position added!', 'success');
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to add position', 'error');
        } finally {
            setAddingPos(false);
        }
    };

    const changeStatus = async (nextStatus) => {
        if (!confirm(`Move poll to "${nextStatus}"?`)) return;
        setChangingStatus(true);
        try {
            const { data } = await pollApi.updateStatus(id, nextStatus);
            setPoll(data.data);
            toast(`Poll is now ${nextStatus}`, 'success');
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to update status', 'error');
        } finally {
            setChangingStatus(false);
        }
    };

    if (loading) return <div className="with-navbar page-loader"><div className="spinner" /></div>;
    if (!poll) return null;

    const isDraft = poll.status === 'draft';
    const statusBadge = { active: 'badge-active', closed: 'badge-closed', draft: 'badge-draft' };

    return (
        <div className="with-navbar">
            <div className="page-content" style={{ maxWidth: 820 }}>
                {/* Header */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <button className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }} onClick={() => navigate('/admin')}>
                        ← Back to Admin
                    </button>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        <div>
                            <p className="hero-eyebrow" style={{ marginBottom: '0.4rem' }}>Poll Editor</p>
                            <h1 style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)' }}>{poll.title}</h1>
                            {poll.description && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>{poll.description}</p>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span className={`badge ${statusBadge[poll.status]}`}>{poll.status}</span>
                            {isDraft && (
                                <button className="btn btn-primary btn-sm" disabled={changingStatus}
                                    onClick={() => changeStatus('active')}>
                                    {changingStatus ? '…' : '▶ Activate Poll'}
                                </button>
                            )}
                            {poll.status === 'active' && (
                                <>
                                    <button className="btn btn-outline btn-sm"
                                        onClick={() => navigate(`/poll/${id}/results`)}>
                                        View Live Results
                                    </button>
                                    <button className="btn btn-danger btn-sm" disabled={changingStatus}
                                        onClick={() => changeStatus('closed')}>
                                        {changingStatus ? '…' : '⏹ Close Poll'}
                                    </button>
                                </>
                            )}
                            {poll.status === 'closed' && (
                                <button className="btn btn-ghost btn-sm"
                                    onClick={() => navigate(`/poll/${id}/results`)}>
                                    View Final Results
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status banner */}
                {!isDraft && (
                    <div className="card" style={{ marginBottom: '1.25rem', background: 'rgba(0,200,255,0.06)', borderColor: 'var(--border-strong)', padding: '0.9rem 1.25rem' }}>
                        <p style={{ color: 'var(--cyan)', fontFamily: 'var(--font-heading)', fontSize: '0.72rem', letterSpacing: '0.12em' }}>
                            ⚠ POLL IS {poll.status.toUpperCase()} — EDITING IS DISABLED
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.25rem' }}>
                            Only draft polls can have positions and candidates modified.
                        </p>
                    </div>
                )}

                {/* Positions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1rem', fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}>
                        Positions ({poll.positions?.length || 0})
                    </h2>
                    {isDraft && (
                        <button className="btn btn-outline btn-sm" onClick={() => setShowAddPos(s => !s)}>
                            {showAddPos ? '✕ Cancel' : '+ Add Position'}
                        </button>
                    )}
                </div>

                {showAddPos && isDraft && (
                    <form onSubmit={addPosition}>
                        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
                            <input
                                className="form-input"
                                placeholder="e.g. President, Secretary, Treasurer"
                                value={newPosition}
                                onChange={e => setNewPosition(e.target.value)}
                                required
                                autoFocus
                            />
                            <button className="btn btn-primary btn-sm" type="submit" disabled={addingPos}>
                                {addingPos ? 'Adding…' : 'Add'}
                            </button>
                        </div>
                    </form>
                )}

                {(!poll.positions || poll.positions.length === 0) ? (
                    <div className="card">
                        <div className="empty-state" style={{ padding: '2rem' }}>
                            <div className="empty-icon">🗂</div>
                            <div className="empty-title">No Positions Yet</div>
                            <div className="empty-sub">Add positions like "President", "Secretary" to get started.</div>
                        </div>
                    </div>
                ) : (
                    poll.positions.map(position => (
                        <PositionCard
                            key={position.positionName}
                            pollId={id}
                            position={position}
                            isDraft={isDraft}
                            onCandidatesChange={load}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
