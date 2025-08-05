const moment = require('moment');

// Ayın başlangıç ve bitiş tarihlerini al
const getMonthRange = (date = new Date()) => {
  const startOfMonth = moment(date).startOf('month').toDate();
  const endOfMonth = moment(date).endOf('month').toDate();
  return { startOfMonth, endOfMonth };
};

// Son 7 günün tarih aralığını al
const getLast7DaysRange = () => {
  const endDate = moment().endOf('day').toDate();
  const startDate = moment().subtract(6, 'days').startOf('day').toDate();
  return { startDate, endDate };
};

// Son 30 günün tarih aralığını al
const getLast30DaysRange = () => {
  const endDate = moment().endOf('day').toDate();
  const startDate = moment().subtract(29, 'days').startOf('day').toDate();
  return { startDate, endDate };
};

// Tarih formatını düzenle
const formatDate = (date) => {
  return moment(date).format('DD/MM/YYYY');
};

// Tarih ve saat formatını düzenle
const formatDateTime = (date) => {
  return moment(date).format('DD/MM/YYYY HH:mm');
};

// Bugünün tarihini al
const getToday = () => {
  return moment().startOf('day').toDate();
};

// Yarının tarihini al
const getTomorrow = () => {
  return moment().add(1, 'day').startOf('day').toDate();
};

// Günler kaldı hesapla
const getDaysUntil = (targetDate) => {
  const today = moment().startOf('day');
  const target = moment(targetDate).startOf('day');
  return target.diff(today, 'days');
};

module.exports = {
  getMonthRange,
  getLast7DaysRange,
  getLast30DaysRange,
  formatDate,
  formatDateTime,
  getToday,
  getTomorrow,
  getDaysUntil
}; 