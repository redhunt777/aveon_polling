import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// On 401, clear auth and redirect to login
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    refresh: (data) => api.post('/auth/refresh', data),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me'),
    invite: (data) => api.post('/auth/invite', data),
    listInvites: () => api.get('/auth/invites'),
    listUsers: () => api.get('/auth/users'),
    updateRole: (id, role) => api.patch(`/auth/users/${id}/role`, { role }),
    deactivateUser: (id) => api.delete(`/auth/users/${id}`),
};

// ── Polls ─────────────────────────────────────────────────────
export const pollApi = {
    list: () => api.get('/polls'),
    get: (id) => api.get(`/polls/${id}`),
    create: (data) => api.post('/polls', data),
    updateStatus: (id, status) => api.patch(`/polls/${id}/status`, { status }),
    delete: (id) => api.delete(`/polls/${id}`),
    addPosition: (id, positionName) => api.post(`/polls/${id}/positions`, { positionName }),
    addCandidate: (id, pos, data) => api.post(`/polls/${id}/positions/${pos}/candidates`, data),
    removeCandidate: (id, pos, cId) => api.delete(`/polls/${id}/positions/${pos}/candidates/${cId}`),
};

// ── Votes ─────────────────────────────────────────────────────
export const voteApi = {
    cast: (data) => api.post('/votes', data),
    status: (pollId) => api.get(`/votes/status/${pollId}`),
    results: (pollId) => api.get(`/votes/results/${pollId}`),
    liveCount: (pollId) => api.get(`/votes/count/${pollId}`),
};

// ── Monitor ───────────────────────────────────────────────────
export const monitorApi = {
    logs: (params) => api.get('/monitor/logs', { params }),
    clearLogs: () => api.delete('/monitor/logs'),
    services: () => api.get('/monitor/services'),
};

export default api;
