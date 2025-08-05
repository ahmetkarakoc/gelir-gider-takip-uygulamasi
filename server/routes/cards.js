const express = require('express');
const { body } = require('express-validator');
const Card = require('../models/Card');
const CardPayment = require('../models/CardPayment');
const Transaction = require('../models/Transaction');
const validate = require('../middleware/validation');
const { getDaysUntil } = require('../utils/dateHelpers');

const router = express.Router();

// Tüm kartları getir
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    
    const cards = await Card.find({ user: userId, isActive: true })
      .sort({ createdAt: -1 });

    // Her kart için ödeme bilgilerini hesapla
    const cardsWithPayments = await Promise.all(
      cards.map(async (card) => {
        const payments = await CardPayment.find({ card: card._id });
        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        
        const cardData = {
          ...card.toJSON(), // toObject() yerine toJSON() kullan
          totalPaid,
          daysUntilDue: getDaysUntil(card.lastPaymentDate),
          isPaymentDue: getDaysUntil(card.lastPaymentDate) < 0
        };
        

        
        return cardData;
      })
    );

    res.json({ cards: cardsWithPayments });
  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni kart ekle
router.post('/', [
  body('name').trim().notEmpty().withMessage('Kart adı gereklidir'),
  body('bankName').optional().trim(),
  body('cardLimit').optional().isFloat({ min: 0 }).withMessage('Geçerli bir kart limiti giriniz'),
  body('lastPaymentDate').isISO8601().withMessage('Geçerli bir son ödeme tarihi giriniz'),
  body('minimumPayment').isFloat({ min: 0 }).withMessage('Geçerli bir minimum ödeme tutarı giriniz'),
  body('currency').optional().isIn(['TRY', 'USD', 'EUR']).withMessage('Geçerli bir para birimi seçiniz')
], validate, async (req, res) => {
  try {
    const {
      name,
      bankName,
      cardLimit,
      lastPaymentDate,
      minimumPayment,
      currency = 'TRY'
    } = req.body;

    const card = new Card({
      user: req.user._id,
      name,
      bankName: bankName || '',
      cardLimit: cardLimit ? parseFloat(cardLimit) : null,
      totalDebt: 0, // Yeni kartta borç 0
      lastPaymentDate: new Date(lastPaymentDate),
      minimumPayment: parseFloat(minimumPayment),
      currency
    });

    await card.save();

    res.status(201).json({
      message: 'Kart başarıyla eklendi',
      card
    });
  } catch (error) {
    console.error('Create card error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kart güncelle
router.put('/:id', [
  body('name').optional().trim().notEmpty(),
  body('bankName').optional().trim(),
  body('cardLimit').optional().isFloat({ min: 0 }),
  body('lastPaymentDate').optional().isISO8601(),
  body('minimumPayment').optional().isFloat({ min: 0 }),
  body('currency').optional().isIn(['TRY', 'USD', 'EUR'])
], validate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const card = await Card.findOne({ _id: id, user: userId });
    
    if (!card) {
      return res.status(404).json({ message: 'Kart bulunamadı' });
    }

    // Güncelleme alanları
    const updateFields = {};
    if (req.body.name) updateFields.name = req.body.name;
    if (req.body.bankName !== undefined) updateFields.bankName = req.body.bankName;
    if (req.body.cardLimit !== undefined) updateFields.cardLimit = req.body.cardLimit ? parseFloat(req.body.cardLimit) : null;
    if (req.body.lastPaymentDate) updateFields.lastPaymentDate = new Date(req.body.lastPaymentDate);
    if (req.body.minimumPayment) updateFields.minimumPayment = parseFloat(req.body.minimumPayment);
    if (req.body.currency) updateFields.currency = req.body.currency;

    Object.assign(card, updateFields);
    await card.save();

    res.json({
      message: 'Kart başarıyla güncellendi',
      card
    });
  } catch (error) {
    console.error('Update card error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kart sil (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const card = await Card.findOne({ _id: id, user: userId });
    
    if (!card) {
      return res.status(404).json({ message: 'Kart bulunamadı' });
    }

    card.isActive = false;
    await card.save();

    res.json({ message: 'Kart başarıyla silindi' });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kart ödemesi ekle
router.post('/:id/payments', [
  body('amount').isFloat({ min: 0 }).withMessage('Geçerli bir ödeme tutarı giriniz'),
  body('paymentDate').optional().isISO8601(),
  body('description').optional().isString().isLength({ max: 200 }),
  body('paymentMethod').optional().isIn(['bank_transfer', 'cash', 'other']),
  body('isMinimumPayment').optional().isBoolean()
], validate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const {
      amount,
      paymentDate,
      description,
      paymentMethod = 'bank_transfer',
      isMinimumPayment = false
    } = req.body;

    const card = await Card.findOne({ _id: id, user: userId });
    
    if (!card) {
      return res.status(404).json({ message: 'Kart bulunamadı' });
    }

    const payment = new CardPayment({
      user: userId,
      card: id,
      amount: parseFloat(amount),
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      description,
      paymentMethod,
      isMinimumPayment
    });

    await payment.save();

    // Kartın toplam borcunu güncelle
    card.totalDebt = Math.max(0, card.totalDebt - parseFloat(amount));
    
    // Son ödeme tarihi güncelleme kontrolü
    const paymentDateObj = new Date(payment.paymentDate);
    const dueDate = new Date(card.lastPaymentDate);
    

    
    // Borç sıfırlandıysa veya minimum ödeme yapıldıysa tarih güncelle
    let shouldUpdateDate = false;
    
    if (card.totalDebt === 0) {
      // Borç tamamen sıfırlandı
      shouldUpdateDate = true;
    } else if (isMinimumPayment && paymentDateObj <= dueDate && parseFloat(amount) >= card.minimumPayment) {
      // Minimum ödeme yapıldı
      shouldUpdateDate = true;
      card.minPaymentDoneThisMonth = true;
    }
    
    if (shouldUpdateDate) {
      // Son ödeme tarihini bir sonraki ayın aynı gününe ertelenir
      const nextMonth = new Date(dueDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      card.lastPaymentDate = nextMonth;
      

    }

    await card.save();

    // Ödeme işlemini Transaction olarak da kaydet (gider olarak)
    const transaction = new Transaction({
      user: userId,
      type: 'expense',
      category: 'Kart Ödemesi',
      amount: parseFloat(amount),
      description: `Kart ödemesi: ${card.name}${description ? ` - ${description}` : ''}`,
      date: payment.paymentDate,
      paymentMethod: 'card',
      card: id
    });

    await transaction.save();

    res.status(201).json({
      message: 'Ödeme başarıyla eklendi',
      payment,
      updatedCard: card
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kart ödemelerini getir
router.get('/:id/payments', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const card = await Card.findOne({ _id: id, user: userId });
    
    if (!card) {
      return res.status(404).json({ message: 'Kart bulunamadı' });
    }

    const payments = await CardPayment.find({ card: id })
      .sort({ paymentDate: -1 });

    res.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kartla ilişkili işlemleri getir
router.get('/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const card = await Card.findOne({ _id: id, user: userId });
    
    if (!card) {
      return res.status(404).json({ message: 'Kart bulunamadı' });
    }

    const transactions = await Transaction.find({ card: id, user: userId })
      .sort({ date: -1 });

    res.json({ transactions });
  } catch (error) {
    console.error('Get card transactions error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Günü gelen ödemeler
router.get('/due-payments', async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Minimum ödeme yapılmamış kartları getir
    const dueCards = await Card.find({
      user: userId,
      isActive: true,
      lastPaymentDate: { $lte: tomorrow },
      minPaymentDoneThisMonth: false
    });

    const duePayments = dueCards.map(card => ({
      card,
      daysUntilDue: getDaysUntil(card.lastPaymentDate),
      isOverdue: getDaysUntil(card.lastPaymentDate) < 0
    }));

    res.json({ duePayments });
  } catch (error) {
    console.error('Get due payments error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 