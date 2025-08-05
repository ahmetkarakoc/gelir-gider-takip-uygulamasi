const Card = require('../models/Card');

// Kart borcu kontrolü ve otomatik tarih güncelleme
const checkAndUpdateCardDueDate = async (card) => {
  // Eğer kartın borcu 0 ise ve son ödeme tarihi geçmişse
  if (card.totalDebt === 0 && new Date(card.lastPaymentDate) < new Date()) {
    // Son ödeme tarihini bir sonraki ayın aynı gününe ayarla
    const nextMonth = new Date(card.lastPaymentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    // minPaymentDoneThisMonth'i sıfırla
    await Card.findByIdAndUpdate(card._id, {
      lastPaymentDate: nextMonth,
      minPaymentDoneThisMonth: false
    });
    
    return {
      ...card.toObject(),
      lastPaymentDate: nextMonth,
      minPaymentDoneThisMonth: false
    };
  }
  
  return card;
};

// Tüm kartlar için borç kontrolü ve tarih güncelleme
const updateAllCardsDueDates = async (userId) => {
  const cards = await Card.find({ user: userId, isActive: true });
  
  const updatedCards = await Promise.all(
    cards.map(async (card) => {
      return await checkAndUpdateCardDueDate(card);
    })
  );
  
  return updatedCards;
};

module.exports = {
  checkAndUpdateCardDueDate,
  updateAllCardsDueDates
}; 