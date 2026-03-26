import api from './api';

export const submitRating = ({ loadId, score, comment }) =>
  api.post('/ratings', { loadId, score, comment }).then((r) => r.data);

export const getMyRatings = () =>
  api.get('/ratings/my').then((r) => r.data);

export const getRatingForLoad = (loadId) =>
  api.get(`/ratings/load/${loadId}`).then((r) => r.data);

export const getUserRatings = (userId) =>
  api.get(`/ratings/user/${userId}`).then((r) => r.data);
