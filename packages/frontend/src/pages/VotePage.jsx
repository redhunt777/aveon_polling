import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pollApi, voteApi } from '../api';
import { useAuth } from '../AuthContext';
import { toast } from '../Toast';

export default function VotePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [poll, setPoll] = useState(null);
    const [selections, setSelections] = useState({});
    const [alreadyVoted, setAlreadyVoted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const [pollRes, statusRes] = await Promise.all([
                    pollApi.get(id),
                    voteApi.status(id),
                ]);
                setPoll(pollRes.data.data);
                if (statusRes.data.data?.hasVoted) setAlreadyVoted(true);
            } catch {
                toast('Failed to load poll', 'error');
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, navigate]);

    const selectCandidate = (positionName, candidateId) => {
        setSelections(s => ({ ...s, [positionName]: candidateId }));
    };

    const handleSubmit = async () => {
        const votes = Object.entries(selections).map(([positionName, candidateId]) => ({
            positionName, candidateId,
        }));

        if (votes.length < (poll?.positions?.length || 0)) {
            setError(`Please vote for all ${poll.positions.length} position(s).`);
            return;
        }

        setSubmitting(true); setError('');
        try {
            await voteApi.cast({ pollId: id, votes });
            toast('Your votes have been recorded anonymously! 🎉', 'success');
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit votes.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="with-navbar page-loader"><div className="spinner" /></div>;
    if (!poll) return null;

    return (
        <div className="with-navbar">
            <div className="page-content" style={{ maxWidth: 780 }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <p className="hero-eyebrow" style={{ marginBottom: '0.75rem' }}>
                        AVEON Racing Club — Active Election
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <h1 style={{ fontSize: 'clamp(1.3rem, 3vw, 2rem)', marginRight: '1rem' }}>
                            {poll.title}
                        </h1>
                        <span className="badge badge-active">Active</span>
                    </div>
                    {poll.description && (
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                            {poll.description}
                        </p>
                    )}
                </div>

                {alreadyVoted ? (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <h3 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>You've Already Voted</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Your votes have been recorded. Results will be published after the poll closes.
                        </p>
                        <button className="btn btn-outline btn-sm" style={{ marginTop: '1.5rem' }}
                            onClick={() => navigate('/dashboard')}>
                            Back to Dashboard
                        </button>
                    </div>
                ) : (
                    <>
                        {error && <div className="alert alert-error">{error}</div>}

                        <div className="card" style={{ marginBottom: '1.5rem' }}>
                            <div className="alert alert-info" style={{ marginBottom: '0' }}>
                                🔒 Your vote is <strong>anonymous</strong>. Select one candidate per position and submit.
                            </div>
                        </div>

                        {poll.positions?.map((position) => (
                            <div key={position.positionName} className="card vote-position" style={{ marginBottom: '1rem' }}>
                                <div className="vote-position-title">
                                    ⚡ {position.positionName}
                                    {selections[position.positionName] && (
                                        <span style={{ color: 'var(--success)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                                            ✓ Selected
                                        </span>
                                    )}
                                </div>

                                <div className="candidate-list">
                                    {position.candidates?.length === 0 ? (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No candidates yet.</p>
                                    ) : (
                                        position.candidates.map((candidate) => {
                                            const isSelected = selections[position.positionName] === candidate._id;
                                            return (
                                                <div
                                                    key={candidate._id}
                                                    className={`candidate-option ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => selectCandidate(position.positionName, candidate._id)}
                                                >
                                                    <div className="candidate-radio">
                                                        {isSelected && <div />}
                                                    </div>
                                                    <div className="candidate-info">
                                                        <div className="candidate-name">{candidate.name}</div>
                                                        <div className="candidate-id">ID: {candidate.membershipId}</div>
                                                        {candidate.bio && (
                                                            <div className="candidate-bio">{candidate.bio}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        ))}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={submitting || Object.keys(selections).length === 0}
                            >
                                {submitting ? 'Submitting...' : `Submit ${Object.keys(selections).length}/${poll.positions?.length} Vote(s) →`}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
