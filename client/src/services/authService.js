import api from './api';

export const login = async (email, password, role) => {
  const { data } = await api.post('/auth/login', { email, password, role });
  return data;
};

export const register = async (userData) => {
  const { data } = await api.post('/auth/register', userData);
  return data;
};
