import api from './api';

export const familyMemberService = {
  // Tüm aile bireylerini getir
  getFamilyMembers: async () => {
    const response = await api.get('/family-members');
    return response.data;
  },

  // Yeni aile bireyi ekle
  createFamilyMember: async (memberData) => {
    const response = await api.post('/family-members', memberData);
    return response.data;
  },

  // Aile bireyi güncelle
  updateFamilyMember: async (id, memberData) => {
    const response = await api.put(`/family-members/${id}`, memberData);
    return response.data;
  },

  // Aile bireyi sil
  deleteFamilyMember: async (id) => {
    const response = await api.delete(`/family-members/${id}`);
    return response.data;
  }
}; 