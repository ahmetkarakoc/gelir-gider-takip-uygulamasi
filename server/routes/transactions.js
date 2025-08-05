const express = require('express');
const { body, query } = require('express-validator');
const Transaction = require('../models/Transaction');
const validate = require('../middleware/validation');
const { getMonthRange, getLast7DaysRange } = require('../utils/dateHelpers');

const router = express.Router();

// Tüm işlemleri getir (filtreleme ile)
router.get('/', [
  query('type').optional().isIn(['income', 'expense']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('category').optional().isString(),
  query('familyMember').optional().isMongoId(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], validate, async (req, res) => {
  try {
    const { type, startDate, endDate, category, familyMember, search, page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    // Filtre oluştur
    const filter = { user: userId };
    
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (familyMember) filter.familyMember = familyMember;
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Arama filtresi
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Sayfalama
    const skip = (page - 1) * limit;
    
    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('card', 'name bankName')
      .populate('familyMember', 'name relationship color icon');

    const total = await Transaction.countDocuments(filter);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni işlem ekle
router.post('/', [
  body('type').isIn(['income', 'expense']).withMessage('Geçerli bir tip seçiniz'),
  body('category').trim().notEmpty().withMessage('Kategori gereklidir'),
  body('amount').isFloat({ min: 0 }).withMessage('Geçerli bir tutar giriniz'),
  body('description').optional().isString().isLength({ max: 200 }),
  body('date').optional().isISO8601(),
  body('paymentMethod').optional().isIn(['cash', 'card', 'bank_transfer', 'other']),
  body('card').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    return /^[0-9a-fA-F]{24}$/.test(value);
  }).withMessage('Geçerli bir kart ID giriniz'),
  body('familyMember').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    return /^[0-9a-fA-F]{24}$/.test(value);
  }).withMessage('Geçerli bir aile bireyi ID giriniz'),
  body('isRecurring').optional().isBoolean(),
  body('recurringInterval').optional().custom((value) => {
    if (value === null || value === undefined) return true;
    return ['weekly', 'monthly', 'yearly'].includes(value);
  }).withMessage('Geçerli bir tekrarlama sıklığı seçiniz')
], validate, async (req, res) => {
  try {
    const {
      type,
      category,
      amount,
      description,
      date,
      paymentMethod = 'cash',
      card,
      familyMember,
      isRecurring = false,
      recurringInterval
    } = req.body;

    const transaction = new Transaction({
      user: req.user._id,
      type,
      category,
      amount: parseFloat(amount),
      description,
      date: date ? new Date(date) : new Date(),
      paymentMethod,
      card: card || null,
      familyMember: familyMember || null,
      isRecurring,
      recurringInterval: isRecurring ? recurringInterval : null
    });

    await transaction.save();

    // Eğer işlem bir karta bağlıysa ve gider ise, kart borcunu güncelle
    if (card && type === 'expense') {
      const Card = require('../models/Card');
      const cardDoc = await Card.findById(card);
      if (cardDoc) {
        // Kart limiti kontrolü
        if (cardDoc.cardLimit) {
          const availableLimit = cardDoc.getAvailableLimit();
          if (availableLimit < parseFloat(amount)) {
            return res.status(400).json({ 
              message: `Kart limiti yetersiz. Kullanılabilir limit: ${availableLimit.toFixed(2)} ${cardDoc.currency}` 
            });
          }
        }
        
        // Kartın toplam borcunu artır
        cardDoc.totalDebt += parseFloat(amount);
        await cardDoc.save();
      }
    }

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('card', 'name bankName')
      .populate('familyMember', 'name relationship color icon');

    res.status(201).json({
      message: 'İşlem başarıyla eklendi',
      transaction: populatedTransaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// İşlem güncelle
router.put('/:id', [
  body('type').optional().isIn(['income', 'expense']),
  body('category').optional().trim().notEmpty(),
  body('amount').optional().isFloat({ min: 0 }),
  body('description').optional().isString().isLength({ max: 200 }),
  body('date').optional().isISO8601(),
  body('paymentMethod').optional().isIn(['cash', 'card', 'bank_transfer', 'other']),
  body('card').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    return /^[0-9a-fA-F]{24}$/.test(value);
  }).withMessage('Geçerli bir kart ID giriniz'),
  body('isRecurring').optional().isBoolean(),
  body('recurringInterval').optional().custom((value) => {
    if (value === null || value === undefined) return true;
    return ['weekly', 'monthly', 'yearly'].includes(value);
  }).withMessage('Geçerli bir tekrarlama sıklığı seçiniz')
], validate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const transaction = await Transaction.findOne({ _id: id, user: userId });
    
    if (!transaction) {
      return res.status(404).json({ message: 'İşlem bulunamadı' });
    }

    // Güncelleme alanları
    const updateFields = {};
    if (req.body.type) updateFields.type = req.body.type;
    if (req.body.category) updateFields.category = req.body.category;
    if (req.body.amount) updateFields.amount = parseFloat(req.body.amount);
    if (req.body.description !== undefined) updateFields.description = req.body.description;
    if (req.body.date) updateFields.date = new Date(req.body.date);
    if (req.body.paymentMethod) updateFields.paymentMethod = req.body.paymentMethod;
    if (req.body.card !== undefined) updateFields.card = req.body.card || null;
    if (req.body.isRecurring !== undefined) updateFields.isRecurring = req.body.isRecurring;
    if (req.body.recurringInterval !== undefined) updateFields.recurringInterval = req.body.isRecurring ? req.body.recurringInterval : null;

    Object.assign(transaction, updateFields);
    await transaction.save();

    const updatedTransaction = await Transaction.findById(id)
      .populate('card', 'name bankName');

    res.json({
      message: 'İşlem başarıyla güncellendi',
      transaction: updatedTransaction
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// İşlem sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const transaction = await Transaction.findOneAndDelete({ _id: id, user: userId });
    
    if (!transaction) {
      return res.status(404).json({ message: 'İşlem bulunamadı' });
    }

    res.json({ message: 'İşlem başarıyla silindi' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Aylık özet
router.get('/monthly-summary', async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;
    
    let dateFilter = {};
    if (month && year) {
      const { startOfMonth, endOfMonth } = getMonthRange(new Date(year, month - 1));
      dateFilter = { date: { $gte: startOfMonth, $lte: endOfMonth } };
    } else {
      const { startOfMonth, endOfMonth } = getMonthRange();
      dateFilter = { date: { $gte: startOfMonth, $lte: endOfMonth } };
    }

    const transactions = await Transaction.find({ user: userId, ...dateFilter });
    
    const summary = transactions.reduce((acc, transaction) => {
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
      
      return acc;
    }, { totalIncome: 0, totalExpense: 0, categories: {} });

    summary.netBalance = summary.totalIncome - summary.totalExpense;

    res.json(summary);
  } catch (error) {
    console.error('Monthly summary error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Son 7 günlük işlemler
router.get('/recent', async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = getLast7DaysRange();

    const transactions = await Transaction.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    })
    .sort({ date: -1 })
    .populate('card', 'name bankName');

    res.json({ transactions });
  } catch (error) {
    console.error('Recent transactions error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 