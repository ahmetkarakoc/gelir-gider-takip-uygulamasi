# 💰 Gelir-Gider Takip Uygulaması

Modern ve kullanıcı dostu gelir-gider takip uygulaması. Aile bireylerinin harcamalarını takip edebilir, kredi kartı borçlarını yönetebilir ve finansal durumunuzu analiz edebilirsiniz.

## 🚀 Özellikler

- **📊 Dashboard**: Aylık gelir-gider analizi ve grafikler
- **💳 Kart Yönetimi**: Kredi kartı borçları ve ödeme takibi
- **👨‍👩‍👧‍👦 Aile Bireyleri**: Harcamaları kişilere göre kategorize etme
- **📱 Mobil Uyumlu**: Responsive tasarım
- **🔐 Güvenli**: JWT authentication ve bcrypt şifreleme
- **⚡ Hızlı**: Rate limiting ve optimizasyonlar

## 🛠️ Teknolojiler

### Frontend
- React 18
- Tailwind CSS
- Chart.js
- React Hook Form
- Axios
- React Router

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- bcryptjs
- Express Rate Limit

## 📦 Kurulum

### Gereksinimler
- Node.js 16+
- MongoDB Atlas hesabı
- Git

### Adımlar

1. **Repository'yi klonlayın**
```bash
git clone https://github.com/your-username/gelir-gider-takip-uygulamasi.git
cd gelir-gider-takip-uygulamasi
```

2. **Backend kurulumu**
```bash
cd server
npm install
cp env.example .env
# .env dosyasını düzenleyin
npm start
```

3. **Frontend kurulumu**
```bash
cd client
npm install
npm start
```

## 🔧 Environment Variables

### Backend (.env)
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gelir-gider-app

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server
PORT=5000
NODE_ENV=production

# CORS (Production domain)
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

## 🚀 Production Deployment

### Backend (Render.com)
1. Render.com'da yeni Web Service oluşturun
2. GitHub repository'nizi bağlayın
3. Environment variables'ları ekleyin
4. Build Command: `npm install`
5. Start Command: `npm start`

### Frontend (Vercel)
1. Vercel.com'da yeni proje oluşturun
2. GitHub repository'nizi bağlayın
3. Framework: Create React App
4. Build Command: `npm run build`
5. Output Directory: `build`

### MongoDB Atlas
1. MongoDB Atlas'ta cluster oluşturun
2. Database Access'te kullanıcı oluşturun
3. Network Access'te IP whitelist ekleyin
4. Connection string'i environment variable'a ekleyin

## 🔐 Güvenlik

- **Rate Limiting**: API istekleri sınırlandırılmıştır
- **JWT Authentication**: Güvenli token tabanlı kimlik doğrulama
- **bcrypt**: Şifreler güvenli şekilde hashlenir
- **CORS**: Sadece güvenilir domainler erişebilir
- **Input Validation**: Tüm kullanıcı girdileri doğrulanır

## 📱 Mobil Uyumluluk

- Responsive tasarım
- Touch-friendly butonlar
- Mobil optimizasyonu
- Progressive Web App desteği

## 🧪 Test

```bash
# Backend test
cd server
npm test

# Frontend test
cd client
npm test
```

## 📈 Performans

- **Frontend**: 160KB gzipped (production build)
- **Backend**: Optimized Node.js server
- **Database**: MongoDB Atlas cloud
- **CDN**: Vercel edge network

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

MIT License - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim

- **Email**: your-email@example.com
- **GitHub**: [@your-username](https://github.com/your-username)

## 🙏 Teşekkürler

Bu proje aşağıdaki açık kaynak projelerden ilham almıştır:
- React
- Tailwind CSS
- Express.js
- MongoDB 