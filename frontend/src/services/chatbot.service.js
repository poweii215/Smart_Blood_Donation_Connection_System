import api from './api';

export const chatbotService = {
  ask: async (message) => {
    const response = await api.post('/chatbot/ask', { message });
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/chatbot/history');
    return response.data;
  },
  getSuggestions: async () => {
    const response = await api.get('/chatbot/suggestions');
    return response.data;
  },
};
