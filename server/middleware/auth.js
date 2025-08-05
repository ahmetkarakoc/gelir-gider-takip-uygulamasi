const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Yetkilendirme token\'ı bulunamadı' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Geçersiz token' });
    }

    // Şifre değişiklik kontrolü
    if (user.passwordChangedAt) {
      const passwordChangedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < passwordChangedAt) {
        return res.status(401).json({ message: 'Şifre değiştirildi, lütfen tekrar giriş yapın' });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Geçersiz token' });
  }
};

module.exports = auth; 