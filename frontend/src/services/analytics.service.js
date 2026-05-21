import api from './api';
export const analyticsService = {
  getForecast: async (months = 3) => (await api.get(`/analytics/forecast?months=${months}`)).data,
  getSummary: async () => (await api.get('/analytics/summary')).data,
  recommendDonors: async (data) => (await api.post('/analytics/recommendations', data)).data,
  getRecommendationSettings: async () => (await api.get('/analytics/recommendation-settings')).data,
  updateRecommendationSettings: async (data) => (await api.put('/analytics/recommendation-settings', data)).data,
  exportDonors: async () => (await api.get('/analytics/donors/export', { responseType: 'blob' })).data,
  exportTodayAppointments: async (params = {}) => (await api.get('/analytics/appointments/today/export', { params, responseType: 'blob' })).data,
};
