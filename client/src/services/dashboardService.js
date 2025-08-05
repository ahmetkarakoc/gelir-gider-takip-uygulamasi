import api from './api';

export const dashboardService = {
  // Dashboard ana verileri
  getDashboardData: async (month, year) => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    
    const response = await api.get('/dashboard', { params });
    return response.data;
  },

  // Kategori bazlı rapor
  getCategoryReport: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get('/dashboard/category-report', { params });
    return response.data;
  },

  // Kart borcu raporu
  getCardReport: async () => {
    const response = await api.get('/dashboard/card-report');
    return response.data;
  },

  // Trend analizi
  getTrends: async (days = 30) => {
    const response = await api.get('/dashboard/trends', { params: { days } });
    return response.data;
  }
}; 