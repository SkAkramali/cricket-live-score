import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/signin';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ==================== MATCHES API ====================
export const matchesAPI = {
  getAllMatches: (status) => api.get('/matches', { params: { status } }),
  createMatch: (data) => api.post('/matches', data),
  getMatchByCode: (code) => api.get(`/matches/code/${code}`),
  getMatchSummary: (matchId) => api.get(`/matches/${matchId}/summary`),
  startMatch: (matchId, data) => api.post(`/matches/${matchId}/start`, data),
};

// ==================== TEAMS API ====================
export const teamsAPI = {
  getAllTeams: () => api.get('/teams'),
  createTeam: (data) => api.post('/teams', data),
  getTeamById: (id) => api.get(`/teams/${id}`),
};

// ==================== PLAYERS API ====================
export const playersAPI = {
  getAllPlayers: () => api.get('/players'),
  createPlayer: (data) => api.post('/players', data),
  getPlayerById: (id) => api.get(`/players/${id}`),
};

// ==================== SCORING API ====================
export const scoringAPI = {
  recordBall: (data) => api.post('/scoring/ball', data),
  startInnings: (inningsId, data) => api.post(`/scoring/innings/${inningsId}/start`, data),
  changeBatsman: (inningsId, data) => api.post(`/scoring/innings/${inningsId}/batsman/change`, data),
  changeBowler: (inningsId, data) => api.post(`/scoring/innings/${inningsId}/bowler/change`, data),
  endInnings: (inningsId) => api.post(`/scoring/innings/${inningsId}/end`),
};

// ==================== ANALYTICS API ====================
export const analyticsAPI = {
  getMatchScorecard: (matchId) => api.get(`/analytics/match/${matchId}/scorecard`),
  getMatchAnalytics: (matchId) => api.get(`/analytics/match/${matchId}/analytics`),
  getTopBatsmen: (matchId, limit = 5) => api.get(`/analytics/match/${matchId}/top-batsmen`, { params: { limit } }),
  getTopBowlers: (matchId, limit = 5) => api.get(`/analytics/match/${matchId}/top-bowlers`, { params: { limit } }),
  getPlayerCareer: (playerId) => api.get(`/analytics/player/${playerId}/career`),
  getPartnerships: (inningsId) => api.get(`/analytics/innings/${inningsId}/partnerships`),
  getCommentary: (inningsId, limit = 50, offset = 0) => 
    api.get(`/analytics/innings/${inningsId}/commentary`, { params: { limit, offset } }),
};

export default api;
