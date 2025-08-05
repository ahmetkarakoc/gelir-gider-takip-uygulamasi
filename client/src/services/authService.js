import api from './api';

export const authService = {
  // Kullanıcı kaydı
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', {
      name,
      email,
      password
    });
    return response.data;
  },

  // Kullanıcı girişi
  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    return response.data;
  },

  // Mevcut kullanıcı bilgilerini getir
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data.user;
  }
}; 