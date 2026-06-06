import axios from 'axios';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const BASE_URL = isLocal
  ? import.meta.env.VITE_LOCAL_API_URL
  : import.meta.env.VITE_TUNNEL_API_URL;

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vb_token');
      localStorage.removeItem('vb_user');
      // Avoid redirect loop if already on login page
      if (!window.location.pathname.startsWith('/login')) {
        window.location.replace('/login?expired=1');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
