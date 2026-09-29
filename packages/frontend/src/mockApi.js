// ── Frontend Pure Demo Mode Store & API Mock ───────────────────────
// Stores all state in localStorage. No requests are sent to any backend server.

const KEYS = {
    DEMO_MODE: 'aveon_is_demo_mode',
    CURRENT_USER: 'aveon_demo_current_user',
    USERS: 'aveon_demo_users_db',
    POLLS: 'aveon_demo_polls_db',
    VOTES: 'aveon_demo_votes_db',
    INVITES: 'aveon_demo_invites_db',
    LOGS: 'aveon_demo_logs_db',
};

const delay = (ms = 120) => new Promise(resolve => setTimeout(resolve, ms));

// Default Seed Data
const DEFAULT_USERS = [
    {
        _id: 'demo_user_admin',
        name: 'Demo Admin (Team Lead)',
        email: 'admin@aveon-demo.com',
        membershipId: 'AVEON-ADMIN-01',
        role: 'admin',
        isActive: true,
        createdAt: new Date('2026-01-01').toISOString(),
    },
    {
        _id: 'demo_user_member',
        name: 'Demo Member (Race Driver)',
        email: 'member@aveon-demo.com',
        membershipId: 'AVEON-MEM-07',
        role: 'member',
        isActive: true,
        createdAt: new Date('2026-01-05').toISOString(),
    },
    {
        _id: 'demo_user_3',
        name: 'Alex Rivera',
        email: 'alex@aveon.org',
        membershipId: 'AVEON-MEM-12',
        role: 'member',
        isActive: true,
        createdAt: new Date('2026-01-10').toISOString(),
    },
    {
        _id: 'demo_user_4',
        name: 'Sarah Chen',
        email: 'sarah@aveon.org',
        membershipId: 'AVEON-MEM-15',
        role: 'admin',
        isActive: true,
        createdAt: new Date('2026-01-15').toISOString(),
    }
];

const DEFAULT_POLLS = [
    {
        _id: 'demo_poll_1',
        title: 'Formula Student Team Captain & Subsystem Leads 2026',
        description: 'Annual election for AVEON Racing Club student leadership and technical subsystem heads.',
        status: 'active',
        startTime: new Date('2026-09-20T09:00:00Z').toISOString(),
        createdAt: new Date('2026-09-19T14:00:00Z').toISOString(),
        positions: [
            {
                positionName: 'Team Captain',
                candidates: [
                    {
                        _id: 'cand_1',
                        name: 'Lucas Vance',
                        membershipId: 'AVEON-012',
                        bio: '3 years in Chassis & Suspension, lead driver for Formula Bharat 2025.'
                    },
                    {
                        _id: 'cand_2',
                        name: 'Elena Rostova',
                        membershipId: 'AVEON-019',
                        bio: 'Powertrain lead, reduced EV battery module weight by 14%.'
                    }
                ]
            },
            {
                positionName: 'Technical Director',
                candidates: [
                    {
                        _id: 'cand_3',
                        name: 'Marcus Sterling',
                        membershipId: 'AVEON-033',
                        bio: 'Aerodynamics specialist & CFD optimization lead.'
                    },
                    {
                        _id: 'cand_4',
                        name: 'Priya Sharma',
                        membershipId: 'AVEON-041',
                        bio: 'Telemetry & Autonomous Systems head.'
                    }
                ]
            }
        ]
    },
    {
        _id: 'demo_poll_2',
        title: 'Best Track Performance & Driver of the Season 2025',
        description: 'Member vote for outstanding racing driver in national championship.',
        status: 'closed',
        startTime: new Date('2025-11-01T10:00:00Z').toISOString(),
        createdAt: new Date('2025-10-25T11:00:00Z').toISOString(),
        positions: [
            {
                positionName: 'Driver of the Year',
                candidates: [
                    {
                        _id: 'cand_5',
                        name: 'Rohan Verma',
                        membershipId: 'AVEON-005',
                        bio: 'Set fastest lap time at Kari Motor Speedway.'
                    },
                    {
                        _id: 'cand_6',
                        name: 'Zoe Miller',
                        membershipId: 'AVEON-009',
                        bio: 'P3 finish in Endurance Test.'
                    }
                ]
            }
        ]
    },
    {
        _id: 'demo_poll_3',
        title: 'Mid-Season Workshop Equipment Allocation',
        description: 'Vote on priority equipment purchases for carbon fiber monocoque tooling.',
        status: 'draft',
        startTime: null,
        createdAt: new Date('2026-09-25T16:00:00Z').toISOString(),
        positions: [
            {
                positionName: 'Primary Tooling Upgrade',
                candidates: [
                    {
                        _id: 'cand_7',
                        name: 'CNC Aluminum Uprights Tooling',
                        membershipId: 'EQ-01',
                        bio: 'Precision machining fixture for suspension points.'
                    },
                    {
                        _id: 'cand_8',
                        name: 'Autoclave Vacuum Sealing System',
                        membershipId: 'EQ-02',
                        bio: 'Composite curing enhancement for chassis stiffening.'
                    }
                ]
            }
        ]
    }
];

const DEFAULT_VOTES = [
    // Poll 2 initial votes (closed poll)
    { pollId: 'demo_poll_2', positionName: 'Driver of the Year', candidateId: 'cand_5', userId: 'demo_user_3' },
    { pollId: 'demo_poll_2', positionName: 'Driver of the Year', candidateId: 'cand_5', userId: 'demo_user_4' },
    { pollId: 'demo_poll_2', positionName: 'Driver of the Year', candidateId: 'cand_5', userId: 'user_mock_1' },
    { pollId: 'demo_poll_2', positionName: 'Driver of the Year', candidateId: 'cand_6', userId: 'user_mock_2' }
];

const DEFAULT_INVITES = [
    {
        _id: 'demo_inv_1',
        name: 'David Kim',
        email: 'david@aveon.org',
        membershipId: 'AVEON-MEM-99',
        role: 'member',
        token: 'demo-token-david-99',
        used: false,
        expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(),
    }
];

const DEFAULT_LOGS = [
    { timestamp: new Date(Date.now() - 50000).toISOString(), service: 'auth-service', method: 'POST', path: '/auth/login', status: 200, responseTime: 24, level: 'info' },
    { timestamp: new Date(Date.now() - 42000).toISOString(), service: 'poll-service', method: 'GET', path: '/polls', status: 200, responseTime: 12, level: 'info' },
    { timestamp: new Date(Date.now() - 35000).toISOString(), service: 'vote-service', method: 'GET', path: '/votes/status/demo_poll_1', status: 200, responseTime: 8, level: 'info' },
    { timestamp: new Date(Date.now() - 20000).toISOString(), service: 'gateway', method: 'GET', path: '/monitor/services', status: 200, responseTime: 4, level: 'info' },
    { timestamp: new Date(Date.now() - 10000).toISOString(), service: 'notification-service', method: 'POST', path: '/auth/invite', status: 200, responseTime: 88, level: 'info' },
];

function initDemoStorage() {
    if (!localStorage.getItem(KEYS.USERS)) localStorage.setItem(KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    if (!localStorage.getItem(KEYS.POLLS)) localStorage.setItem(KEYS.POLLS, JSON.stringify(DEFAULT_POLLS));
    if (!localStorage.getItem(KEYS.VOTES)) localStorage.setItem(KEYS.VOTES, JSON.stringify(DEFAULT_VOTES));
    if (!localStorage.getItem(KEYS.INVITES)) localStorage.setItem(KEYS.INVITES, JSON.stringify(DEFAULT_INVITES));
    if (!localStorage.getItem(KEYS.LOGS)) localStorage.setItem(KEYS.LOGS, JSON.stringify(DEFAULT_LOGS));
}

function getStored(key, defaultVal) {
    initDemoStorage();
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultVal;
    } catch {
        return defaultVal;
    }
}

function setStored(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
}

function logDemoEvent(service, method, path, status = 200, responseTime = Math.floor(Math.random() * 25) + 5) {
    const logs = getStored(KEYS.LOGS, []);
    const entry = {
        timestamp: new Date().toISOString(),
        service,
        method,
        path,
        status,
        responseTime,
        level: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info',
    };
    logs.unshift(entry);
    if (logs.length > 200) logs.pop();
    setStored(KEYS.LOGS, logs);
}

export function isDemoModeActive() {
    return localStorage.getItem(KEYS.DEMO_MODE) === 'true';
}

export function activateDemoMode(userRole = 'admin') {
    initDemoStorage();
    localStorage.setItem(KEYS.DEMO_MODE, 'true');
    const users = getStored(KEYS.USERS, DEFAULT_USERS);
    const target = users.find(u => u.role === userRole) || users[0];
    localStorage.setItem('access_token', `demo_access_token_${target._id}`);
    localStorage.setItem('refresh_token', 'demo_refresh_token');
    localStorage.setItem('user_id', target._id);
    setStored(KEYS.CURRENT_USER, target);
    logDemoEvent('auth-service', 'POST', '/auth/login [DEMO]', 200, 15);
    return target;
}

export function resetDemoStorage() {
    localStorage.setItem(KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    localStorage.setItem(KEYS.POLLS, JSON.stringify(DEFAULT_POLLS));
    localStorage.setItem(KEYS.VOTES, JSON.stringify(DEFAULT_VOTES));
    localStorage.setItem(KEYS.INVITES, JSON.stringify(DEFAULT_INVITES));
    localStorage.setItem(KEYS.LOGS, JSON.stringify(DEFAULT_LOGS));
}

export function deactivateDemoMode() {
    localStorage.removeItem(KEYS.DEMO_MODE);
    localStorage.removeItem(KEYS.CURRENT_USER);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
}

// ── Mock Auth API ──────────────────────────────────────────────────
export const mockAuthApi = {
    login: async ({ email, password }) => {
        await delay();
        initDemoStorage();
        const users = getStored(KEYS.USERS, DEFAULT_USERS);
        let user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
        
        // If credentials match or email/password contains demo, select demo user
        if (!user) {
            if (email?.includes('admin')) {
                user = users.find(u => u.role === 'admin');
            } else {
                user = users.find(u => u.role === 'member');
            }
        }

        if (!user) {
            const err = new Error('Invalid credentials');
            err.response = { data: { message: 'Invalid email or password.' }, status: 401 };
            throw err;
        }

        localStorage.setItem(KEYS.DEMO_MODE, 'true');
        localStorage.setItem('access_token', `demo_access_token_${user._id}`);
        localStorage.setItem('refresh_token', 'demo_refresh_token');
        localStorage.setItem('user_id', user._id);
        setStored(KEYS.CURRENT_USER, user);
        logDemoEvent('auth-service', 'POST', '/auth/login', 200);

        return {
            data: {
                success: true,
                data: {
                    accessToken: `demo_access_token_${user._id}`,
                    refreshToken: 'demo_refresh_token',
                    user,
                }
            }
        };
    },

    register: async ({ token, password }) => {
        await delay();
        const invites = getStored(KEYS.INVITES, DEFAULT_INVITES);
        const invIndex = invites.findIndex(i => i.token === token && !i.used);
        if (invIndex === -1) {
            const err = new Error('Invalid token');
            err.response = { data: { message: 'Invalid or expired invite token.' }, status: 400 };
            throw err;
        }

        const inv = invites[invIndex];
        invites[invIndex].used = true;
        setStored(KEYS.INVITES, invites);

        const users = getStored(KEYS.USERS, DEFAULT_USERS);
        const newUser = {
            _id: `demo_user_${Date.now()}`,
            name: inv.name,
            email: inv.email,
            membershipId: inv.membershipId,
            role: inv.role || 'member',
            isActive: true,
            createdAt: new Date().toISOString(),
        };
        users.push(newUser);
        setStored(KEYS.USERS, users);
        logDemoEvent('auth-service', 'POST', '/auth/register', 201);

        return { data: { success: true, message: 'User registered successfully' } };
    },

    me: async () => {
        await delay(50);
        const currentUser = getStored(KEYS.CURRENT_USER, DEFAULT_USERS[0]);
        logDemoEvent('auth-service', 'GET', '/auth/me', 200);
        return { data: { success: true, data: currentUser } };
    },

    logout: async () => {
        await delay(50);
        logDemoEvent('auth-service', 'POST', '/auth/logout', 200);
        deactivateDemoMode();
        return { data: { success: true } };
    },

    invite: async ({ email, name, membershipId, role }) => {
        await delay();
        const invites = getStored(KEYS.INVITES, DEFAULT_INVITES);
        const token = `demo-token-${Math.random().toString(36).substring(2, 9)}`;
        const newInv = {
            _id: `demo_inv_${Date.now()}`,
            name,
            email,
            membershipId,
            role: role || 'member',
            token,
            used: false,
            expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(),
        };
        invites.push(newInv);
        setStored(KEYS.INVITES, invites);
        logDemoEvent('notification-service', 'POST', '/auth/invite', 200);

        return {
            data: {
                success: true,
                data: {
                    emailSent: false,
                    registrationLink: `${window.location.origin}/register?token=${token}`,
                }
            }
        };
    },

    listInvites: async () => {
        await delay();
        const invites = getStored(KEYS.INVITES, DEFAULT_INVITES);
        logDemoEvent('auth-service', 'GET', '/auth/invites', 200);
        return { data: { success: true, data: invites } };
    },

    cancelInvite: async (id) => {
        await delay();
        let invites = getStored(KEYS.INVITES, DEFAULT_INVITES);
        invites = invites.filter(i => i._id !== id);
        setStored(KEYS.INVITES, invites);
        logDemoEvent('auth-service', 'DELETE', `/auth/invites/${id}`, 200);
        return { data: { success: true } };
    },

    listUsers: async () => {
        await delay();
        const users = getStored(KEYS.USERS, DEFAULT_USERS);
        logDemoEvent('auth-service', 'GET', '/auth/users', 200);
        return { data: { success: true, data: users } };
    },

    updateRole: async (id, role) => {
        await delay();
        const users = getStored(KEYS.USERS, DEFAULT_USERS);
        const target = users.find(u => u._id === id);
        if (target) target.role = role;
        setStored(KEYS.USERS, users);
        logDemoEvent('auth-service', 'PATCH', `/auth/users/${id}/role`, 200);
        return { data: { success: true } };
    },

    activateUser: async (id) => {
        await delay();
        const users = getStored(KEYS.USERS, DEFAULT_USERS);
        const target = users.find(u => u._id === id);
        if (target) target.isActive = true;
        setStored(KEYS.USERS, users);
        logDemoEvent('auth-service', 'PATCH', `/auth/users/${id}/activate`, 200);
        return { data: { success: true } };
    },

    deactivateUser: async (id) => {
        await delay();
        const users = getStored(KEYS.USERS, DEFAULT_USERS);
        const target = users.find(u => u._id === id);
        if (target) target.isActive = false;
        setStored(KEYS.USERS, users);
        logDemoEvent('auth-service', 'DELETE', `/auth/users/${id}`, 200);
        return { data: { success: true } };
    }
};

// ── Mock Poll API ──────────────────────────────────────────────────
export const mockPollApi = {
    list: async () => {
        await delay();
        const polls = getStored(KEYS.POLLS, DEFAULT_POLLS);
        logDemoEvent('poll-service', 'GET', '/polls', 200);
        return { data: { success: true, data: polls } };
    },

    get: async (id) => {
        await delay();
        const polls = getStored(KEYS.POLLS, DEFAULT_POLLS);
        const poll = polls.find(p => p._id === id);
        if (!poll) {
            const err = new Error('Poll not found');
            err.response = { data: { message: 'Poll not found' }, status: 404 };
            throw err;
        }
        logDemoEvent('poll-service', 'GET', `/polls/${id}`, 200);
        return { data: { success: true, data: poll } };
    },

    create: async ({ title, description }) => {
        await delay();
        const polls = getStored(KEYS.POLLS, DEFAULT_POLLS);
        const newPoll = {
            _id: `demo_poll_${Date.now()}`,
            title,
            description: description || '',
            status: 'draft',
            startTime: null,
            createdAt: new Date().toISOString(),
            positions: []
        };
        polls.unshift(newPoll);
        setStored(KEYS.POLLS, polls);
        logDemoEvent('poll-service', 'POST', '/polls', 201);
        return { data: { success: true, data: newPoll } };
    },

    updateStatus: async (id, status) => {
        await delay();
        const polls = getStored(KEYS.POLLS, DEFAULT_POLLS);
        const poll = polls.find(p => p._id === id);
        if (poll) {
            poll.status = status;
            if (status === 'active' && !poll.startTime) {
                poll.startTime = new Date().toISOString();
            }
        }
        setStored(KEYS.POLLS, polls);
        logDemoEvent('poll-service', 'PATCH', `/polls/${id}/status`, 200);
        return { data: { success: true, data: poll } };
    },

    delete: async (id) => {
        await delay();
        let polls = getStored(KEYS.POLLS, DEFAULT_POLLS);
        const poll = polls.find(p => p._id === id);
        if (poll?.status === 'active') {
            const err = new Error('Cannot delete active poll');
            err.response = { data: { message: 'Cannot delete active poll' }, status: 400 };
            throw err;
        }
        polls = polls.filter(p => p._id !== id);
        setStored(KEYS.POLLS, polls);
        logDemoEvent('poll-service', 'DELETE', `/polls/${id}`, 200);
        return { data: { success: true } };
    },

    addPosition: async (id, positionName) => {
        await delay();
        const polls = getStored(KEYS.POLLS, DEFAULT_POLLS);
        const poll = polls.find(p => p._id === id);
        if (poll) {
            if (!poll.positions) poll.positions = [];
            if (!poll.positions.some(p => p.positionName === positionName)) {
                poll.positions.push({ positionName, candidates: [] });
            }
        }
        setStored(KEYS.POLLS, polls);
        logDemoEvent('poll-service', 'POST', `/polls/${id}/positions`, 200);
        return { data: { success: true, data: poll } };
    },

    addCandidate: async (id, positionName, { name, membershipId, bio }) => {
        await delay();
        const polls = getStored(KEYS.POLLS, DEFAULT_POLLS);
        const poll = polls.find(p => p._id === id);
        if (poll) {
            const pos = poll.positions?.find(p => p.positionName === positionName);
            if (pos) {
                pos.candidates.push({
                    _id: `cand_${Date.now()}`,
                    name,
                    membershipId,
                    bio: bio || '',
                });
            }
        }
        setStored(KEYS.POLLS, polls);
        logDemoEvent('poll-service', 'POST', `/polls/${id}/positions/${positionName}/candidates`, 200);
        return { data: { success: true, data: poll } };
    },

    removeCandidate: async (id, positionName, candidateId) => {
        await delay();
        const polls = getStored(KEYS.POLLS, DEFAULT_POLLS);
        const poll = polls.find(p => p._id === id);
        if (poll) {
            const pos = poll.positions?.find(p => p.positionName === positionName);
            if (pos) {
                pos.candidates = pos.candidates.filter(c => c._id !== candidateId);
            }
        }
        setStored(KEYS.POLLS, polls);
        logDemoEvent('poll-service', 'DELETE', `/polls/${id}/positions/${positionName}/candidates/${candidateId}`, 200);
        return { data: { success: true, data: poll } };
    }
};

// ── Mock Vote API ──────────────────────────────────────────────────
export const mockVoteApi = {
    cast: async ({ pollId, votes }) => {
        await delay();
        const currentUser = getStored(KEYS.CURRENT_USER, DEFAULT_USERS[0]);
        const allVotes = getStored(KEYS.VOTES, DEFAULT_VOTES);

        // Check if already voted
        const hasVoted = allVotes.some(v => v.pollId === pollId && v.userId === currentUser._id);
        if (hasVoted) {
            const err = new Error('Already voted');
            err.response = { data: { message: 'You have already voted in this poll.' }, status: 400 };
            throw err;
        }

        // Record new votes
        votes.forEach(v => {
            allVotes.push({
                pollId,
                positionName: v.positionName,
                candidateId: v.candidateId,
                userId: currentUser._id,
                createdAt: new Date().toISOString()
            });
        });

        setStored(KEYS.VOTES, allVotes);
        logDemoEvent('vote-service', 'POST', '/votes', 201);
        return { data: { success: true, message: 'Votes cast successfully' } };
    },

    status: async (pollId) => {
        await delay();
        const currentUser = getStored(KEYS.CURRENT_USER, DEFAULT_USERS[0]);
        const allVotes = getStored(KEYS.VOTES, DEFAULT_VOTES);
        const hasVoted = allVotes.some(v => v.pollId === pollId && v.userId === currentUser._id);
        logDemoEvent('vote-service', 'GET', `/votes/status/${pollId}`, 200);
        return { data: { success: true, data: { hasVoted } } };
    },

    results: async (pollId) => {
        await delay();
        const polls = getStored(KEYS.POLLS, DEFAULT_POLLS);
        const poll = polls.find(p => p._id === pollId);
        if (!poll) {
            const err = new Error('Poll not found');
            err.response = { data: { message: 'Poll not found' }, status: 404 };
            throw err;
        }

        const allVotes = getStored(KEYS.VOTES, DEFAULT_VOTES);
        const pollVotes = allVotes.filter(v => v.pollId === pollId);

        const positionResults = (poll.positions || []).map(pos => {
            const posVotes = pollVotes.filter(v => v.positionName === pos.positionName);
            const candidateCounts = pos.candidates.map(cand => {
                const count = posVotes.filter(v => v.candidateId === cand._id).length;
                return {
                    candidateId: cand._id,
                    name: cand.name,
                    membershipId: cand.membershipId,
                    votes: count,
                };
            });

            // Sort candidates by highest votes
            candidateCounts.sort((a, b) => b.votes - a.votes);

            return {
                positionName: pos.positionName,
                totalVotes: posVotes.length,
                candidates: candidateCounts,
            };
        });

        logDemoEvent('vote-service', 'GET', `/votes/results/${pollId}`, 200);
        return {
            data: {
                success: true,
                data: {
                    pollId,
                    pollTitle: poll.title,
                    status: poll.status,
                    results: positionResults,
                }
            }
        };
    },

    liveCount: async (pollId) => {
        return mockVoteApi.results(pollId);
    }
};

// ── Mock Monitor API ───────────────────────────────────────────────
export const mockMonitorApi = {
    logs: async ({ page = 1, limit = 100, service, level } = {}) => {
        await delay();
        let logs = getStored(KEYS.LOGS, DEFAULT_LOGS);
        if (service) logs = logs.filter(l => l.service === service);
        if (level) logs = logs.filter(l => l.level === level);

        const total = logs.length;
        const pages = Math.ceil(total / limit) || 1;
        const pagedLogs = logs.slice((page - 1) * limit, page * limit);

        return {
            data: {
                success: true,
                data: {
                    logs: pagedLogs,
                    pagination: { page, limit, total, pages }
                }
            }
        };
    },

    clearLogs: async () => {
        await delay();
        setStored(KEYS.LOGS, []);
        return { data: { success: true } };
    },

    services: async () => {
        await delay();
        const now = new Date().toISOString();
        const servicesList = [
            { service: 'gateway', status: 'healthy', lastSeen: now },
            { service: 'auth-service', status: 'healthy', lastSeen: now },
            { service: 'poll-service', status: 'healthy', lastSeen: now },
            { service: 'vote-service', status: 'healthy', lastSeen: now },
            { service: 'notification-service', status: 'healthy', lastSeen: now },
            { service: 'monitor-service', status: 'healthy', lastSeen: now },
        ];
        return { data: { success: true, data: servicesList } };
    }
};
