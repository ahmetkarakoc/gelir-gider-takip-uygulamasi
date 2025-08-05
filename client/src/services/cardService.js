import api from './api';

export const cardService = {
  // Tüm kartları getir
  getCards: async () => {
    const response = await api.get('/cards');
    return response.data;
  },

  // Yeni kart ekle
  createCard: async (cardData) => {
    const response = await api.post('/cards', cardData);
    return response.data;
  },

  // Kart güncelle
  updateCard: async (id, cardData) => {
    const response = await api.put(`/cards/${id}`, cardData);
    return response.data;
  },

  // Kart sil
  deleteCard: async (id) => {
    const response = await api.delete(`/cards/${id}`);
    return response.data;
  },

  // Kart ödemesi ekle
  createPayment: async (cardId, paymentData) => {
    const response = await api.post(`/cards/${cardId}/payments`, paymentData);
    return response.data;
  },

  // Kart borcu ödemesi ekle
  addCardPayment: async (cardId, paymentData) => {
    const response = await api.post(`/cards/${cardId}/payments`, paymentData);
    return response.data;
  },

  // Kart ödemelerini getir
  getCardPayments: async (cardId) => {
    const response = await api.get(`/cards/${cardId}/payments`);
    return response.data;
  },

  // Kartla ilişkili işlemleri getir
  getCardTransactions: async (cardId) => {
    const response = await api.get(`/cards/${cardId}/transactions`);
    return response.data;
  },

  // Günü gelen ödemeler
  getDuePayments: async () => {
    const response = await api.get('/cards/due-payments');
    return response.data;
  }
}; 