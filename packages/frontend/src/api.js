import axios from 'axios';
import { isDemoModeActive, mockAuthApi, mockPollApi, mockVoteApi, mockMonitorApi } from './mockApi';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_API_BASE_URL || '/api',
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
        if (err.response?.status === 401 && !isDemoModeActive()) {
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
    login: (data) => {
        if (isDemoModeActive() || data?.isDemo || data?.email?.toLowerCase().includes('demo') || data?.password === 'demo') {
            return mockAuthApi.login(data);
        }
        return api.post('/auth/login', data).catch(err => {
            // Fallback to mock if server is down and user attempted demo login
            if (!err.response && (data?.email?.includes('demo') || data?.password === 'demo')) {
                return mockAuthApi.login(data);
            }
            throw err;
        });
    },
    register: (data) => isDemoModeActive() || data?.token?.includes('demo') ? mockAuthApi.register(data) : api.post('/auth/register', data),
    refresh: (data) => isDemoModeActive() ? mockAuthApi.me() : api.post('/auth/refresh', data),
    logout: () => isDemoModeActive() ? mockAuthApi.logout() : api.post('/auth/logout'),
    me: () => isDemoModeActive() ? mockAuthApi.me() : api.get('/auth/me'),
    invite: (data) => isDemoModeActive() ? mockAuthApi.invite(data) : api.post('/auth/invite', data),
    listInvites: () => isDemoModeActive() ? mockAuthApi.listInvites() : api.get('/auth/invites'),
    cancelInvite: (id) => isDemoModeActive() ? mockAuthApi.cancelInvite(id) : api.delete(`/auth/invites/${id}`),
    listUsers: () => isDemoModeActive() ? mockAuthApi.listUsers() : api.get('/auth/users'),
    updateRole: (id, role) => isDemoModeActive() ? mockAuthApi.updateRole(id, role) : api.patch(`/auth/users/${id}/role`, { role }),
    activateUser: (id) => isDemoModeActive() ? mockAuthApi.activateUser(id) : api.patch(`/auth/users/${id}/activate`),
    deactivateUser: (id) => isDemoModeActive() ? mockAuthApi.deactivateUser(id) : api.delete(`/auth/users/${id}`),
};

// ── Polls ─────────────────────────────────────────────────────
export const pollApi = {
    list: () => isDemoModeActive() ? mockPollApi.list() : api.get('/polls'),
    get: (id) => isDemoModeActive() ? mockPollApi.get(id) : api.get(`/polls/${id}`),
    create: (data) => isDemoModeActive() ? mockPollApi.create(data) : api.post('/polls', data),
    updateStatus: (id, status) => isDemoModeActive() ? mockPollApi.updateStatus(id, status) : api.patch(`/polls/${id}/status`, { status }),
    delete: (id) => isDemoModeActive() ? mockPollApi.delete(id) : api.delete(`/polls/${id}`),
    addPosition: (id, positionName) => isDemoModeActive() ? mockPollApi.addPosition(id, positionName) : api.post(`/polls/${id}/positions`, { positionName }),
    addCandidate: (id, pos, data) => isDemoModeActive() ? mockPollApi.addCandidate(id, pos, data) : api.post(`/polls/${id}/positions/${pos}/candidates`, data),
    removeCandidate: (id, pos, cId) => isDemoModeActive() ? mockPollApi.removeCandidate(id, pos, cId) : api.delete(`/polls/${id}/positions/${pos}/candidates/${cId}`),
};

// ── Votes ─────────────────────────────────────────────────────
export const voteApi = {
    cast: (data) => isDemoModeActive() ? mockVoteApi.cast(data) : api.post('/votes', data),
    status: (pollId) => isDemoModeActive() ? mockVoteApi.status(pollId) : api.get(`/votes/status/${pollId}`),
    results: (pollId) => isDemoModeActive() ? mockVoteApi.results(pollId) : api.get(`/votes/results/${pollId}`),
    liveCount: (pollId) => isDemoModeActive() ? mockVoteApi.liveCount(pollId) : api.get(`/votes/count/${pollId}`),
};

// ── Monitor ───────────────────────────────────────────────────
export const monitorApi = {
    logs: (params) => isDemoModeActive() ? mockMonitorApi.logs(params) : api.get('/monitor/logs', { params }),
    clearLogs: () => isDemoModeActive() ? mockMonitorApi.clearLogs() : api.delete('/monitor/logs'),
    services: () => isDemoModeActive() ? mockMonitorApi.services() : api.get('/monitor/services'),
};

export default api;

