const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// Routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const cardRoutes = require('./routes/cards');
const dashboardRoutes = require('./routes/dashboard');
const familyMemberRoutes = require('./routes/familyMembers');
const profileRoutes = require('./routes/profile');
const superuserRoutes = require('./routes/superuser');

// Middleware
const authMiddleware = require('./middleware/auth');
const superuserMiddleware = require('./middleware/superuser');

dotenv.config();

// JWT_SECRET kontrolü
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET not found in environment. Please set JWT_SECRET in production.');
  process.exit(1);
}

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına maksimum 100 istek
  message: {
    error: 'Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiting (daha sıkı)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5, // IP başına maksimum 5 auth isteği
  message: {
    error: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://vercel.com/ahmets-projects-c2a9b3d7/gelir-gider-takip-uygulamasi/AqhFrwg4ep8kGR5trsZ1rAcPvD6W'] 
    : ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting uygula
app.use('/api/auth', authLimiter);
app.use('/api', limiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gelir-gider-app')
  .then(() => console.log('✅ MongoDB bağlantısı başarılı'))
  .catch(err => {
    console.error('❌ MongoDB bağlantı hatası:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', authMiddleware, transactionRoutes);
app.use('/api/cards', authMiddleware, cardRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/family-members', authMiddleware, familyMemberRoutes);
app.use('/api/profile', authMiddleware, profileRoutes);
app.use('/api/superuser', authMiddleware, superuserMiddleware, superuserRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Gelir-Gider API çalışıyor' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Sunucu hatası',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portunda çalışıyor`);
}); 