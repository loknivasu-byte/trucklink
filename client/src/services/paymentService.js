import api from './api';

export const getPaymentStatus = (loadId) =>
  api.get(`/payments/status/${loadId}`).then((r) => r.data);

export const getMyPayments = () =>
  api.get('/payments/my').then((r) => r.data);

export const releasePayment = (loadId) =>
  api.post(`/payments/release/${loadId}`).then((r) => r.data);
