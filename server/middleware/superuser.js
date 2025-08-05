const superuserMiddleware = (req, res, next) => {
  try {
    // Kullanıcının superuser olup olmadığını kontrol et
    if (!req.user || req.user.role !== 'superuser') {
      return res.status(403).json({ 
        message: 'Bu işlem için superuser yetkisi gereklidir' 
      });
    }
    next();
  } catch (error) {
    console.error('Superuser middleware error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

module.exports = superuserMiddleware; 