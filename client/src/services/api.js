import axios from 'axios';
const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = 'Bearer ' + t;
  return c;
});
api.interceptors.response.use((r) => r, (e) => {
  if (e.response?.status === 401 && localStorage.getItem('token')) { localStorage.clear(); window.location.href = '/login'; }
  e.friendly = e.response?.data?.message || 'Network error. Is the server running?';
  return Promise.reject(e);
});
export default api;
