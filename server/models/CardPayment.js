const mongoose = require('mongoose');

const cardPaymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  card: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Ödeme tutarı gereklidir'],
    min: [0, 'Ödeme tutarı 0\'dan küçük olamaz']
  },
  paymentDate: {
    type: Date,
    required: [true, 'Ödeme tarihi gereklidir'],
    default: Date.now
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Açıklama 200 karakterden uzun olamaz']
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cash', 'other'],
    default: 'bank_transfer'
  },
  isMinimumPayment: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Kart ödemeleri için indeksler
cardPaymentSchema.index({ user: 1, card: 1, paymentDate: -1 });
cardPaymentSchema.index({ card: 1, paymentDate: -1 });

module.exports = mongoose.model('CardPayment', cardPaymentSchema); 