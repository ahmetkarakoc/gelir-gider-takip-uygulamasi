import api from './api';

export const transactionService = {
  // Tüm işlemleri getir
  getTransactions: async (params = {}) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  // Yeni işlem ekle
  createTransaction: async (transactionData) => {
    const response = await api.post('/transactions', transactionData);
    return response.data;
  },

  // İşlem güncelle
  updateTransaction: async (id, transactionData) => {
    const response = await api.put(`/transactions/${id}`, transactionData);
    return response.data;
  },

  // İşlem sil
  deleteTransaction: async (id) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },

  // Aylık özet
  getMonthlySummary: async (month, year) => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    
    const response = await api.get('/transactions/monthly-summary', { params });
    return response.data;
  },

  // Son işlemler
  getRecentTransactions: async () => {
    const response = await api.get('/transactions/recent');
    return response.data;
  }
}; 