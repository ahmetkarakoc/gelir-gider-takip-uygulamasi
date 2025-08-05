import api from './api';

export const profileService = {
  // Profil bilgilerini getir
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  // Profil bilgilerini güncelle
  updateProfile: async (profileData) => {
    const response = await api.put('/profile', profileData);
    return response.data;
  },

  // Şifre değiştir
  changePassword: async (passwordData) => {
    const response = await api.put('/profile/password', passwordData);
    return response.data;
  }
}; 