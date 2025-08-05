const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  relationship: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  color: {
    type: String,
    default: '#3B82F6' // Varsayılan mavi renk
  },
  icon: {
    type: String,
    default: '👤' // Varsayılan ikon
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Kullanıcı başına benzersiz isim kontrolü
familyMemberSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('FamilyMember', familyMemberSchema); 