const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['payment_due', 'low_balance', 'recurring_transaction', 'system'],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Bildirim başlığı gereklidir'],
    trim: true,
    maxlength: [100, 'Başlık 100 karakterden uzun olamaz']
  },
  message: {
    type: String,
    required: [true, 'Bildirim mesajı gereklidir'],
    trim: true,
    maxlength: [500, 'Mesaj 500 karakterden uzun olamaz']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedCard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    default: null
  },
  relatedTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// İndeksler
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Notification', notificationSchema); 