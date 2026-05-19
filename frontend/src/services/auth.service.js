import api from './api';

export const authService = {
  requestOtp: async (phone) => {
    const response = await api.post('/auth/request-otp', { phone });
    return response.data;
  },
  verifyOtp: async ({ phone, otp }) => {
    const response = await api.post('/auth/verify-otp', { phone, otp });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  login: async (credentials) => {
    return authService.verifyOtp(credentials);
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  updateProfile: async (profileData) => {
    const response = await api.patch('/auth/profile', profileData);
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }
};
