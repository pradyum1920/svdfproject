/**
 * services/api.js
 * Centralized Axios instance with JWT injection and token refresh.
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

/* ── Request interceptor: attach access token ── */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

/* ── Response interceptor: auto-refresh on 401 ── */
let refreshing = false;
let waitQueue  = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          waitQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((e) => Promise.reject(e));
      }

      original._retry = true;
      refreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefresh } = data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        waitQueue.forEach(({ resolve }) => resolve(accessToken));
        waitQueue = [];

        return api(original);
      } catch (refreshErr) {
        waitQueue.forEach(({ reject }) => reject(refreshErr));
        waitQueue = [];
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

/* ── Auth endpoints ── */
export const authAPI = {
  login:    (data)    => api.post('/auth/login', data),
  register: (data)    => api.post('/auth/register', data),
  refresh:  (token)   => api.post('/auth/refresh', { refreshToken: token }),
  me:       ()        => api.get('/auth/me'),
  logout:   ()        => api.post('/auth/logout'),
};

/* ── Dashboard endpoints ── */
export const dashboardAPI = {
  overview: () => api.get('/dashboard/overview'),
  metrics:  () => api.get('/dashboard/metrics'),
  trend:    () => api.get('/dashboard/trend'),
  status:   () => api.get('/dashboard/status'),
};

/* ── Simulation endpoints ── */
export const simulationAPI = {
  start:   (type)    => api.post('/simulation/start', { type }),
  stop:    ()        => api.post('/simulation/stop'),
  status:  ()        => api.get('/simulation/status'),
  detect:  (payload) => api.post('/simulation/detect', { payload }),
  info:    (type)    => api.get(`/simulation/info/${type}`),
  aiScan:  (data)    => api.post('/simulation/ai-scan', data),
};

/* ── Alerts endpoints ── */
export const alertsAPI = {
  list:   (params) => api.get('/alerts', { params }),
  test:   ()       => api.post('/alerts/test'),
  ackAll: ()       => api.post('/alerts/ack-all'),
  ack:    (id)     => api.post(`/alerts/${id}/ack`),
  clear:  ()       => api.delete('/alerts'),
};

/* ── Logs endpoints ── */
export const logsAPI = {
  list:     (params) => api.get('/logs', { params }),
  download: ()       => api.get('/logs/download', { responseType: 'blob' }),
  add:      (entry)  => api.post('/logs', entry),
  clear:    ()       => api.delete('/logs'),
};

/* ── Admin endpoints ── */
export const adminAPI = {
  state:   ()           => api.get('/admin/state'),
  reset:   ()           => api.post('/admin/reset'),
  users:   ()           => api.get('/admin/users'),
  update:  (id, data)   => api.patch(`/admin/users/${id}`, data),
  delete:  (id)         => api.delete(`/admin/users/${id}`),
  promote: (id)         => api.post(`/admin/users/${id}/promote`),
  stats:   ()           => api.get('/admin/stats'),
};

export default api;
