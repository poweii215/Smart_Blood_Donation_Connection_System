import api from './api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.dispatchEvent(new Event('sbdcs-auth-changed'));
    }
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.documentElement.classList.remove('dark');
    window.dispatchEvent(new Event('sbdcs-auth-changed'));
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  updateProfile: async (profileData) => {
    const response = await api.patch('/auth/profile', profileData);
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.dispatchEvent(new Event('sbdcs-auth-changed'));
    }
    return response.data;
  },
  getHomepageMedia: async () => {
    const response = await api.get('/auth/homepage-media');
    return response.data;
  },
  uploadHomepageMedia: async (mediaType, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/auth/homepage-media/${mediaType}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/auth/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.dispatchEvent(new Event('sbdcs-auth-changed'));
    }
    return response.data;
  }
};
