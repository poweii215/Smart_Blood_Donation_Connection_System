import api from './api';
export const analyticsService = {
  getForecast: async (months = 3) => (await api.get(`/analytics/forecast?months=${months}`)).data,
  getSummary: async () => (await api.get('/analytics/summary')).data,
  recommendDonors: async (data) => (await api.post('/analytics/recommendations', data)).data,
};
