const express = require('express');
const { body } = require('express-validator');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Card = require('../models/Card');
const FamilyMember = require('../models/FamilyMember');
const validate = require('../middleware/validation');

const router = express.Router();

// Tüm kullanıcıları listele (superuser için)
router.get('/users', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Arama filtresi
    let filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Kullanıcıları getir
    const users = await User.find(filter)
      .select('name email role createdAt lastLogin')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Toplam kullanıcı sayısı
    const totalUsers = await User.countDocuments(filter);

    // Her kullanıcı için istatistikleri hesapla
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // Toplam işlem sayısı
        const transactionCount = await Transaction.countDocuments({ user: user._id });
        
        // Toplam gelir ve gider
        const transactions = await Transaction.find({ user: user._id });
        const totalIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        // Toplam bakiye
        const totalBalance = totalIncome - totalExpense;
        
        // Kart sayısı
        const cardCount = await Card.countDocuments({ user: user._id });
        
        // Aile üyesi sayısı
        const familyMemberCount = await FamilyMember.countDocuments({ user: user._id });

        return {
          ...user.toObject(),
          stats: {
            transactionCount,
            totalIncome,
            totalExpense,
            totalBalance,
            cardCount,
            familyMemberCount
          }
        };
      })
    );

    res.json({
      users: usersWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNext: skip + users.length < totalUsers,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı detaylarını getir
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Kullanıcıyı bul
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Kullanıcının işlemlerini getir
    const transactions = await Transaction.find({ user: userId })
      .sort({ date: -1 })
      .limit(50)
      .populate('familyMember', 'name relationship')
      .populate('card', 'name bankName');

    // Kullanıcının kartlarını getir
    const cards = await Card.find({ user: userId });

    // Kullanıcının aile üyelerini getir
    const familyMembers = await FamilyMember.find({ user: userId });

    // İstatistikler
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      user,
      transactions,
      cards,
      familyMembers,
      stats: {
        totalIncome,
        totalExpense,
        totalBalance: totalIncome - totalExpense,
        transactionCount: transactions.length,
        cardCount: cards.length,
        familyMemberCount: familyMembers.length
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcının işlemlerini getir
router.get('/users/:userId/transactions', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, type, category, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    let filter = { user: userId };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate && endDate) {
      filter.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }

    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('familyMember', 'name relationship')
      .populate('card', 'name bankName');

    const totalTransactions = await Transaction.countDocuments(filter);

    res.json({
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTransactions / limit),
        totalTransactions,
        hasNext: skip + transactions.length < totalTransactions,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcının kartlarını getir
router.get('/users/:userId/cards', async (req, res) => {
  try {
    const { userId } = req.params;

    const cards = await Card.find({ user: userId });

    res.json({ cards });
  } catch (error) {
    console.error('Get user cards error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcının aile üyelerini getir
router.get('/users/:userId/family-members', async (req, res) => {
  try {
    const { userId } = req.params;

    const familyMembers = await FamilyMember.find({ user: userId });

    res.json({ familyMembers });
  } catch (error) {
    console.error('Get user family members error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı şifresini değiştir (superuser için)
router.put('/users/:userId/password', [
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalıdır')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir')
], validate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    // Kullanıcıyı bul
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Şifreyi güncelle (pre-save hook otomatik olarak hashleyecek)
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Kullanıcı şifresi başarıyla güncellendi',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user password error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 