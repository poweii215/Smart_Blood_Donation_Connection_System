import api from './api';

export const hospitalService = {
  getAll: async () => {
    const response = await api.get('/hospitals');
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/hospitals', data);
    return response.data;
  }
};
