const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const validate = require('../middleware/validation');
const auth = require('../middleware/auth');

const router = express.Router();

// Profil bilgilerini getir
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Profil bilgilerini güncelle
router.put('/', [
  auth,
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('İsim 2-50 karakter arasında olmalıdır'),
  body('email').optional().isEmail().withMessage('Geçerli bir e-posta adresi giriniz')
], validate, async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // E-posta değişikliği varsa benzersizlik kontrolü
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor' });
      }
    }

    // Güncelleme alanları
    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    const userResponse = await User.findById(userId).select('-password');

    res.json({
      message: 'Profil başarıyla güncellendi',
      user: userResponse
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Şifre değiştir
router.put('/password', [
  auth,
  body('currentPassword').notEmpty().withMessage('Mevcut şifre gereklidir'),
  body('newPassword').isLength({ min: 6 }).withMessage('Yeni şifre en az 6 karakter olmalıdır'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Şifreler eşleşmiyor');
    }
    return true;
  })
], validate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Mevcut şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Mevcut şifre yanlış' });
    }

    // Yeni şifreyi set et (pre-save hook otomatik olarak hashleyecek)
    user.password = newPassword;

    await user.save();

    // Yeni token oluştur
    const { generateToken } = require('../utils/jwt');
    const newToken = generateToken(user._id);

    const response = { 
      message: 'Şifre başarıyla güncellendi',
      token: newToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
    

    res.json(response);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 