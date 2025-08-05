const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: String,
    required: [true, 'Kategori gereklidir'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Tutar gereklidir'],
    min: [0, 'Tutar 0\'dan küçük olamaz']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Açıklama 200 karakterden uzun olamaz']
  },
  date: {
    type: Date,
    required: [true, 'Tarih gereklidir'],
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'other'],
    default: 'cash'
  },
  card: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    default: null
  },
  familyMember: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
    default: null
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringInterval: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly'],
    default: null
  },
  nextRecurringDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Tarih bazlı indeksler
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });
transactionSchema.index({ user: 1, card: 1 });

module.exports = mongoose.model('Transaction', transactionSchema); 