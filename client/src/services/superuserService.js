import api from './api';

export const superuserService = {
  // Tüm kullanıcıları getir
  getUsers: async (params = {}) => {
    const response = await api.get('/superuser/users', { params });
    return response.data;
  },

  // Kullanıcı detaylarını getir
  getUserDetails: async (userId) => {
    const response = await api.get(`/superuser/users/${userId}`);
    return response.data;
  },

  // Kullanıcının işlemlerini getir
  getUserTransactions: async (userId, params = {}) => {
    const response = await api.get(`/superuser/users/${userId}/transactions`, { params });
    return response.data;
  },

  // Kullanıcının kartlarını getir
  getUserCards: async (userId) => {
    const response = await api.get(`/superuser/users/${userId}/cards`);
    return response.data;
  },

  // Kullanıcının aile üyelerini getir
  getUserFamilyMembers: async (userId) => {
    const response = await api.get(`/superuser/users/${userId}/family-members`);
    return response.data;
  },

  // Kullanıcı şifresini değiştir
  updateUserPassword: async (userId, newPassword) => {
    const response = await api.put(`/superuser/users/${userId}/password`, {
      newPassword
    });
    return response.data;
  }
}; 