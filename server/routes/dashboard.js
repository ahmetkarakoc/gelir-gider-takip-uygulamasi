const express = require('express');
const Transaction = require('../models/Transaction');
const Card = require('../models/Card');
const CardPayment = require('../models/CardPayment');
const FamilyMember = require('../models/FamilyMember');
const { getMonthRange, getLast7DaysRange, getLast30DaysRange, getDaysUntil } = require('../utils/dateHelpers');
const { updateAllCardsDueDates } = require('../utils/cardHelpers');

const router = express.Router();

// Dashboard ana verileri
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;
    
    // Tarih filtresi
    let dateFilter = {};
    if (month && year) {
      const { startOfMonth, endOfMonth } = getMonthRange(new Date(year, month - 1));
      dateFilter = { date: { $gte: startOfMonth, $lte: endOfMonth } };
    } else {
      const { startOfMonth, endOfMonth } = getMonthRange();
      dateFilter = { date: { $gte: startOfMonth, $lte: endOfMonth } };
    }

    // Aylık işlemler
    const monthlyTransactions = await Transaction.find({ user: userId, ...dateFilter })
      .populate('familyMember', 'name relationship color icon');
    
    // Aylık özet
    const monthlySummary = monthlyTransactions.reduce((acc, transaction) => {
      if (transaction.type === 'income') {
        acc.totalIncome += transaction.amount;
      } else {
        acc.totalExpense += transaction.amount;
      }
      
      // Kategori bazlı özet
      if (!acc.categories[transaction.category]) {
        acc.categories[transaction.category] = { income: 0, expense: 0 };
      }
      
      if (transaction.type === 'income') {
        acc.categories[transaction.category].income += transaction.amount;
      } else {
        acc.categories[transaction.category].expense += transaction.amount;
      }

      // Aile bireyi bazlı özet
      if (transaction.familyMember) {
        const memberName = transaction.familyMember.name;
        if (!acc.familyMembers[memberName]) {
          acc.familyMembers[memberName] = { 
            total: 0, 
            count: 0,
            color: transaction.familyMember.color,
            icon: transaction.familyMember.icon
          };
        }
        acc.familyMembers[memberName].total += transaction.amount;
        acc.familyMembers[memberName].count += 1;
      }
      
      return acc;
    }, { totalIncome: 0, totalExpense: 0, categories: {}, familyMembers: {} });

    monthlySummary.netBalance = monthlySummary.totalIncome - monthlySummary.totalExpense;

    // En çok harcama yapılan kategori
    const topSpendingCategory = Object.entries(monthlySummary.categories)
      .filter(([_, data]) => data.expense > 0)
      .sort(([_, a], [__, b]) => b.expense - a.expense)[0];

    // En çok gider yapan aile bireyi (sadece gider işlemleri)
    const familyMemberExpenses = {};
    
    monthlyTransactions.forEach(transaction => {
      if (transaction.type === 'expense' && transaction.familyMember) {
        const memberName = transaction.familyMember.name;
        if (!familyMemberExpenses[memberName]) {
          familyMemberExpenses[memberName] = { 
            total: 0, 
            count: 0,
            color: transaction.familyMember.color,
            icon: transaction.familyMember.icon
          };
        }
        familyMemberExpenses[memberName].total += transaction.amount;
        familyMemberExpenses[memberName].count += 1;
      }
    });

    const mostFrequentFamilyMember = Object.entries(familyMemberExpenses)
      .sort(([_, a], [__, b]) => b.total - a.total)[0];

    // Kartlara göre toplam harcama
    const cardSpending = await Transaction.aggregate([
      { $match: { user: userId, ...dateFilter, card: { $exists: true, $ne: null } } },
      { $lookup: { from: 'cards', localField: 'card', foreignField: '_id', as: 'cardInfo' } },
      { $unwind: '$cardInfo' },
      { $group: { 
        _id: '$card', 
        totalSpent: { $sum: '$amount' },
        cardName: { $first: '$cardInfo.name' },
        bankName: { $first: '$cardInfo.bankName' }
      }},
      { $sort: { totalSpent: -1 } }
    ]);

    // Gelecek 7 günlük planlı ödemeler
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);
    
    const upcomingPayments = await Card.find({
      user: userId,
      isActive: true,
      lastPaymentDate: { $gte: new Date(), $lte: next7Days }
    }).sort({ lastPaymentDate: 1 });

    // Son 7 günlük işlemler
    const { startDate, endDate } = getLast7DaysRange();
    const recentTransactions = await Transaction.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    })
    .sort({ date: -1 })
    .limit(10)
    .populate('card', 'name bankName');

    // Kart borcu kontrolü ve otomatik tarih güncelleme
    const updatedCards = await updateAllCardsDueDates(userId);
    
    // Kart borcu durumu
    const cardsWithPayments = await Promise.all(
      updatedCards.map(async (card) => {
        const payments = await CardPayment.find({ card: card._id });
        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const remainingDebt = card.totalDebt - totalPaid;
        
        return {
          ...card,
          totalPaid,
          remainingDebt,
          paymentPercentage: card.totalDebt > 0 ? (totalPaid / card.totalDebt) * 100 : 0
        };
      })
    );

    // Minimum ödeme durumunu ay başında sıfırla
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    await Card.updateMany(
      { 
        user: userId, 
        isActive: true,
        minPaymentDoneThisMonth: true
      },
      { 
        minPaymentDoneThisMonth: false
      }
    );

    // Günü gelen ödemeler (minimum ödeme yapılmamış kartlar için)
    // Sadece borcu olan kartları göster
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dueCards = updatedCards.filter(card => 
      card.totalDebt > 0 && 
      new Date(card.lastPaymentDate) <= tomorrow &&
      !card.minPaymentDoneThisMonth
    );

    // duePayments'ı doğru formatta döndür
    const duePayments = dueCards.map(card => ({
      card: card.toObject(),
      daysUntilDue: getDaysUntil(card.lastPaymentDate),
      isOverdue: getDaysUntil(card.lastPaymentDate) < 0
    }));

    // Grafik verileri - son 6 ay
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const { startOfMonth, endOfMonth } = getMonthRange(date);
      
      const monthTransactions = await Transaction.find({
        user: userId,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      });
      
      const monthSummary = monthTransactions.reduce((acc, transaction) => {
        if (transaction.type === 'income') {
          acc.income += transaction.amount;
        } else {
          acc.expense += transaction.amount;
        }
        return acc;
      }, { income: 0, expense: 0 });
      
      chartData.push({
        month: date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }),
        income: monthSummary.income,
        expense: monthSummary.expense
      });
    }

    res.json({
      monthlySummary,
      recentTransactions,
      cards: cardsWithPayments,
      duePayments,
      chartData,
      topSpendingCategory,
      mostFrequentFamilyMember,
      cardSpending,
      upcomingPayments
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kategori bazlı rapor
router.get('/category-report', async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = { date: { $gte: new Date(startDate), $lte: new Date(endDate) } };
    } else {
      const { startOfMonth, endOfMonth } = getMonthRange();
      dateFilter = { date: { $gte: startOfMonth, $lte: endOfMonth } };
    }

    const transactions = await Transaction.find({ user: userId, ...dateFilter });
    
    const categoryReport = transactions.reduce((acc, transaction) => {
      if (!acc[transaction.category]) {
        acc[transaction.category] = { income: 0, expense: 0, count: 0 };
      }
      
      if (transaction.type === 'income') {
        acc[transaction.category].income += transaction.amount;
      } else {
        acc[transaction.category].expense += transaction.amount;
      }
      
      acc[transaction.category].count += 1;
      return acc;
    }, {});

    res.json({ categoryReport });
  } catch (error) {
    console.error('Category report error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kart borcu raporu
router.get('/card-report', async (req, res) => {
  try {
    const userId = req.user._id;
    
    const cards = await Card.find({ user: userId, isActive: true });
    const cardsWithDetails = await Promise.all(
      cards.map(async (card) => {
        const payments = await CardPayment.find({ card: card._id });
        const transactions = await Transaction.find({ card: card._id });
        
        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const totalSpent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
        const remainingDebt = card.totalDebt - totalPaid;
        
        return {
          ...card.toObject(),
          totalPaid,
          totalSpent,
          remainingDebt,
          paymentPercentage: card.totalDebt > 0 ? (totalPaid / card.totalDebt) * 100 : 0,
          paymentCount: payments.length,
          transactionCount: transactions.length
        };
      })
    );

    res.json({ cards: cardsWithDetails });
  } catch (error) {
    console.error('Card report error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Trend analizi
router.get('/trends', async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 30 } = req.query;
    
    const { startDate, endDate } = getLast30DaysRange();
    
    const transactions = await Transaction.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Günlük trend
    const dailyTrend = {};
    transactions.forEach(transaction => {
      const date = transaction.date.toISOString().split('T')[0];
      if (!dailyTrend[date]) {
        dailyTrend[date] = { income: 0, expense: 0 };
      }
      
      if (transaction.type === 'income') {
        dailyTrend[date].income += transaction.amount;
      } else {
        dailyTrend[date].expense += transaction.amount;
      }
    });

    // En çok kullanılan kategoriler
    const categoryUsage = {};
    transactions.forEach(transaction => {
      if (!categoryUsage[transaction.category]) {
        categoryUsage[transaction.category] = { count: 0, total: 0 };
      }
      categoryUsage[transaction.category].count += 1;
      categoryUsage[transaction.category].total += transaction.amount;
    });

    const topCategories = Object.entries(categoryUsage)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([category, data]) => ({
        category,
        count: data.count,
        total: data.total
      }));

    res.json({
      dailyTrend,
      topCategories
    });
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 