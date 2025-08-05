const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Kart adı gereklidir'],
    trim: true,
    maxlength: [50, 'Kart adı 50 karakterden uzun olamaz']
  },
  bankName: {
    type: String,
    trim: true,
    maxlength: [50, 'Banka adı 50 karakterden uzun olamaz']
  },
  cardLimit: {
    type: Number,
    min: [0, 'Kart limiti 0\'dan küçük olamaz']
  },
  totalDebt: {
    type: Number,
    required: [true, 'Toplam borç gereklidir'],
    min: [0, 'Toplam borç 0\'dan küçük olamaz'],
    default: 0
  },
  lastPaymentDate: {
    type: Date,
    required: [true, 'Son ödeme tarihi gereklidir']
  },
  minimumPayment: {
    type: Number,
    required: [true, 'Minimum ödeme tutarı gereklidir'],
    min: [0, 'Minimum ödeme 0\'dan küçük olamaz']
  },
  currency: {
    type: String,
    enum: ['TRY', 'USD', 'EUR'],
    default: 'TRY'
  },
  minPaymentDoneThisMonth: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Kullanılabilir limit hesaplama metodu
cardSchema.methods.getAvailableLimit = function() {
  if (!this.cardLimit) return null;
  return Math.max(0, this.cardLimit - this.totalDebt);
};

// Kart bilgilerini JSON'a çevirirken kullanılabilir limiti ekle
cardSchema.methods.toJSON = function() {
  const card = this.toObject();
  card.availableLimit = this.getAvailableLimit();
  return card;
};

module.exports = mongoose.model('Card', cardSchema); 