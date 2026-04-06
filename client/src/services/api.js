import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const user = JSON.parse(sessionStorage.getItem('trucklink_user') || 'null');
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// If token is rejected by the server, clear session and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('trucklink_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
