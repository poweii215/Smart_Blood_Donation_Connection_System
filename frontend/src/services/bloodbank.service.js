import api from './api';

export const bloodBankService = {
  getInventory: async () => {
    const response = await api.get('/blood-bank/inventory');
    return response.data;
  },
  updateInventory: async (data) => {
    const response = await api.put('/blood-bank/inventory', data);
    return response.data;
  },
  getAlerts: async () => {
    const response = await api.get('/blood-bank/alerts');
    return response.data;
  },
  getTransactions: async (params = {}) => {
    const response = await api.get('/blood-bank/transactions', { params });
    return response.data;
  },
  createTransaction: async (data) => {
    const response = await api.post('/blood-bank/transactions', data);
    return response.data;
  }
};
