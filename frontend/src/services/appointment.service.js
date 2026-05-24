import api from './api';

export const appointmentService = {
  create: async (data) => {
    const response = await api.post('/appointments', data);
    return response.data;
  },
  getMyAppointments: async () => {
    const response = await api.get('/appointments/my');
    return response.data;
  },
  getAllAppointments: async () => {
    const response = await api.get('/appointments/all');
    return response.data;
  },
  getEligibility: async () => {
    const response = await api.get('/appointments/eligibility');
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.patch(`/appointments/${id}/status`, { status });
    return response.data;
  },
  cancelMyAppointment: async (id) => {
    const response = await api.patch(`/appointments/${id}/cancel`);
    return response.data;
  }
};
