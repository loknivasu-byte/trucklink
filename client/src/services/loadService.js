import api from './api';

export const getAvailableLoads = (filters = {}) =>
  api.get('/loads', { params: filters }).then((r) => r.data);

export const getMyLoads = () => api.get('/loads/my').then((r) => r.data);

export const getDriverLoads = () => api.get('/loads/driver').then((r) => r.data);

export const getLoadById = (id) => api.get(`/loads/${id}`).then((r) => r.data);

export const postLoad = (loadData) => api.post('/loads', loadData).then((r) => r.data);

export const acceptLoad = (id) => api.put(`/loads/${id}/accept`).then((r) => r.data);

export const updateLoadStatus = (id, status) =>
  api.put(`/loads/${id}/status`, { status }).then((r) => r.data);
