import api from './api';

export const sendAiMessage = (message, loads = []) =>
  api.post('/ai/chat', { message, loads }).then((r) => r.data);
