import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pollApi, voteApi } from '../api';
import { useAuth } from '../AuthContext';
import { toast } from '../Toast';

function ResultBar({ candidate, totalVotes, isWinner }) {
    const pct = totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0;
    return (
        <div className="result-bar-wrap">
            <div className="result-bar-header">
                <span className="result-bar-name">
                    {isWinner && <span className="winner-crown">👑</span>} {candidate.name}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                        ({candidate.membershipId})
                    </span>
                </span>
                <span className="result-bar-count">{candidate.votes} votes · {pct}%</span>
            </div>
            <div className="result-bar-track">
                <div
                    className={`result-bar-fill ${isWinner ? 'winner' : ''}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

export default function ResultsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await voteApi.results(id);
                setResults(data.data);
            } catch (err) {
                toast(err.response?.data?.message || 'Failed to load results', 'error');
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        load();
        // Refresh every 30s if poll is active (live count for admins)
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, [id, navigate]);

    if (loading) return <div className="with-navbar page-loader"><div className="spinner" /></div>;
    if (!results) return null;

    return (
        <div className="with-navbar">
            <div className="page-content" style={{ maxWidth: 780 }}>
                <div style={{ marginBottom: '2rem' }}>
                    <p className="hero-eyebrow" style={{ marginBottom: '0.75rem' }}>
                        {results.status === 'active' ? 'Live Count' : 'Election Results'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <h1 style={{ fontSize: 'clamp(1.3rem, 3vw, 2rem)' }}>{results.pollTitle}</h1>
                        <span className={`badge badge-${results.status}`}>{results.status}</span>
                    </div>
                    {results.status === 'active' && (
                        <p style={{ color: 'var(--warning)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                            ⚠ Live results — refreshes every 30s
                        </p>
                    )}
                </div>

                {results.results?.map((position) => (
                    <div key={position.positionName} className="card" style={{ marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.9rem', letterSpacing: '0.08em', color: 'var(--cyan)' }}>
                                ⚡ {position.positionName}
                            </h3>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {position.totalVotes} total vote{position.totalVotes !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {position.candidates.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No votes recorded.</p>
                        ) : (
                            position.candidates.map((candidate, idx) => (
                                <ResultBar
                                    key={candidate.candidateId}
                                    candidate={candidate}
                                    totalVotes={position.totalVotes}
                                    isWinner={idx === 0 && results.status === 'closed'}
                                />
                            ))
                        )}
                    </div>
                ))}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
                        ← Back to Dashboard
                    </button>
                    {isAdmin && results.status === 'active' && (
                        <button className="btn btn-outline btn-sm" onClick={() => window.location.reload()}>
                            Refresh
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
