import api from './api';

// Returns the loads array directly (server now returns { loads, total, page, pages })
export const getAvailableLoads = (filters = {}, signal) =>
  api.get('/loads', { params: filters, signal }).then((r) => r.data.loads ?? r.data);

export const getMyLoads = () => api.get('/loads/my').then((r) => r.data);

export const getDriverLoads = () => api.get('/loads/driver').then((r) => r.data);

export const getLoadById = (id) => api.get(`/loads/${id}`).then((r) => r.data);

export const postLoad = (loadData) => api.post('/loads', loadData).then((r) => r.data);

export const acceptLoad = (id) => api.put(`/loads/${id}/accept`).then((r) => r.data);

export const updateLoadStatus = (id, status) =>
  api.put(`/loads/${id}/status`, { status }).then((r) => r.data);
