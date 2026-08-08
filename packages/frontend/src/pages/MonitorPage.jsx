import { useState, useEffect, useRef } from 'react';
import { monitorApi } from '../api';
import { toast } from '../Toast';

function LogRow({ entry }) {
    const time = new Date(entry.timestamp).toLocaleTimeString();
    const level = entry.level || 'info';
    return (
        <div className={`log-row log-${level}`}>
            <span className="log-time">{time}</span>
            <span className="log-service">{entry.service}</span>
            <span className="log-method" style={{ color: entry.method === 'GET' ? 'var(--cyan)' : entry.method === 'POST' ? 'var(--success)' : entry.method === 'DELETE' ? 'var(--danger)' : 'var(--warning)' }}>
                {entry.method}
            </span>
            <span className="log-path">{entry.path}</span>
            <span className="log-status">{entry.status}</span>
            <span className="log-time-ms">{entry.responseTime}ms</span>
        </div>
    );
}

export default function MonitorPage() {
    const [logs, setLogs] = useState([]);
    const [services, setServices] = useState([]);
    const [filterService, setFilterService] = useState('');
    const [filterLevel, setFilterLevel] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const eventSourceRef = useRef(null);
    const logEndRef = useRef(null);

    const loadLogs = async (pg = 1) => {
        try {
            const params = { page: pg, limit: 100 };
            if (filterService) params.service = filterService;
            if (filterLevel) params.level = filterLevel;
            const { data } = await monitorApi.logs(params);
            setLogs(data.data.logs);
            setTotalPages(data.data.pagination.pages);
            setPage(pg);
        } catch {
            toast('Failed to load logs', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadServices = async () => {
        try {
            const { data } = await monitorApi.services();
            setServices(data.data || []);
        } catch { /* ignore */ }
    };

    useEffect(() => {
        loadLogs(1);
        loadServices();
    }, [filterService, filterLevel]);

    const startStream = () => {
        if (eventSourceRef.current) return;
        const token = localStorage.getItem('access_token');
        // Use EventSource via fetch workaround (auth header needed)
        // Instead, poll every 3s when "live" is on
        setStreaming(true);
        const interval = setInterval(() => loadLogs(1), 3000);
        eventSourceRef.current = { close: () => clearInterval(interval) };
    };

    const stopStream = () => {
        eventSourceRef.current?.close();
        eventSourceRef.current = null;
        setStreaming(false);
    };

    useEffect(() => () => stopStream(), []);

    const clearLogs = async () => {
        if (!confirm('Clear all stored logs?')) return;
        try {
            await monitorApi.clearLogs();
            setLogs([]);
            toast('Logs cleared', 'success');
        } catch {
            toast('Failed to clear logs', 'error');
        }
    };

    const uniqueServices = [...new Set(logs.map(l => l.service))].sort();

    return (
        <div className="with-navbar">
            <div className="page-content">
                {/* Header */}
                <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                    <div>
                        <h1 className="section-title"><span className="accent">System</span> Monitor</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                            Real-time HTTP request logs from all microservices
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                            className={`btn btn-sm ${streaming ? 'btn-danger' : 'btn-outline'}`}
                            onClick={streaming ? stopStream : startStream}
                        >
                            {streaming ? '⏹ Stop Live' : '▶ Live Mode'}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => loadLogs(1)}>
                            ↻ Refresh
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={clearLogs}>
                            🗑 Clear
                        </button>
                    </div>
                </div>

                {/* Service heartbeats */}
                {services.length > 0 && (
                    <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                        <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                            ACTIVE SERVICES
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {services.map(s => (
                                <div key={s.service} style={{
                                    padding: '0.35rem 0.85rem',
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-strong)',
                                    borderRadius: 'var(--radius-sm)',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', boxShadow: '0 0 6px var(--success)' }} />
                                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.65rem', fontStyle: 'italic', color: 'var(--cyan)' }}>
                                        {s.service}
                                    </span>
                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                        {new Date(s.lastSeen).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Service</label>
                            <select className="form-input" style={{ width: 160 }} value={filterService} onChange={e => setFilterService(e.target.value)}>
                                <option value="">All</option>
                                {uniqueServices.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label className="form-label" style={{ margin: 0 }}>Level</label>
                            <select className="form-input" style={{ width: 120 }} value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
                                <option value="">All</option>
                                <option value="info">Info</option>
                                <option value="warn">Warn</option>
                                <option value="error">Error</option>
                            </select>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                            {logs.length} entries
                            {streaming && <span style={{ color: 'var(--danger)', marginLeft: '0.5rem' }}>● LIVE</span>}
                        </span>
                    </div>
                </div>

                {/* Log table */}
                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    {/* Header row */}
                    <div className="log-row" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', padding: '0.5rem 1rem', fontFamily: 'var(--font-heading)', fontSize: '0.6rem', letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        <span className="log-time">Time</span>
                        <span className="log-service">Service</span>
                        <span className="log-method">Method</span>
                        <span className="log-path">Path</span>
                        <span className="log-status">Status</span>
                        <span className="log-time-ms">ms</span>
                    </div>

                    <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0 1rem' }}>
                        {loading ? (
                            <div className="page-loader" style={{ minHeight: '200px' }}><div className="spinner" /></div>
                        ) : logs.length === 0 ? (
                            <div className="empty-state" style={{ padding: '3rem' }}>
                                <div className="empty-icon">📋</div>
                                <div className="empty-title">No Logs</div>
                                <div className="empty-sub">Make some API calls and they'll appear here.</div>
                            </div>
                        ) : (
                            logs.map((entry, i) => <LogRow key={i} entry={entry} />)
                        )}
                        <div ref={logEndRef} />
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
                        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => loadLogs(page - 1)}>← Prev</button>
                        <span style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {page} / {totalPages}
                        </span>
                        <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => loadLogs(page + 1)}>Next →</button>
                    </div>
                )}
            </div>
        </div>
    );
}
