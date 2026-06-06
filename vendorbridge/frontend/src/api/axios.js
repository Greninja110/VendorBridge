import axios from 'axios';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const BASE_URL = isLocal
  ? import.meta.env.VITE_LOCAL_API_URL
  : import.meta.env.VITE_TUNNEL_API_URL;

const api = axios.create({ baseURL: BASE_URL });

export default api;
