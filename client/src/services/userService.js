import api from './api';

export const getUserProfile = (userId) =>
  api.get(`/users/${userId}`).then((r) => r.data);
