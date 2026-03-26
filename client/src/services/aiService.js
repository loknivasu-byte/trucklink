import api from './api';

export const sendMessage = (message, context = {}) =>
  api.post('/ai/chat', { message, context }).then((r) => r.data);
