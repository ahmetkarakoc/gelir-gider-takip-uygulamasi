import React from 'react';
import { useForm } from 'react-hook-form';
import { X, CreditCard, Building, Calendar, DollarSign, Settings } from 'lucide-react';

const CardModal = ({ isOpen, onClose, onSubmit, card = null }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      name: card?.name || '',
      bankName: card?.bankName || '',
      cardLimit: card?.cardLimit || '',
      lastPaymentDate: card?.lastPaymentDate ? new Date(card.lastPaymentDate).toISOString().split('T')[0] : '',
      minimumPayment: card?.minimumPayment || '',
      currency: card?.currency || 'TRY'
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmitForm = async (data) => {
    try {
      await onSubmit({
        ...data,
        cardLimit: data.cardLimit ? parseFloat(data.cardLimit) : null,
        minimumPayment: parseFloat(data.minimumPayment)
      });
      handleClose();
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {card ? 'Kartı Düzenle' : 'Yeni Kart Ekle'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-4">
          {/* Kart Adı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kart Adı *
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                {...register('name', {
                  required: 'Kart adı giriniz'
                })}
                className="input w-full pl-10"
                placeholder="Örn: Garanti Bonus"
              />
            </div>
            {errors.name && (
              <p className="text-danger-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Banka Adı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banka Adı
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                {...register('bankName')}
                className="input w-full pl-10"
                placeholder="Örn: Garanti BBVA"
              />
            </div>
          </div>

          {/* Kart Limiti */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kart Limiti
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('cardLimit', {
                  min: { value: 0, message: 'Limit 0\'dan küçük olamaz' }
                })}
                className="input w-full pl-10"
                placeholder="0.00"
              />
            </div>
            {errors.cardLimit && (
              <p className="text-danger-600 text-sm mt-1">{errors.cardLimit.message}</p>
            )}
          </div>

          {/* Son Ödeme Tarihi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Son Ödeme Tarihi *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                {...register('lastPaymentDate', {
                  required: 'Son ödeme tarihi giriniz'
                })}
                className="input w-full pl-10"
              />
            </div>
            {errors.lastPaymentDate && (
              <p className="text-danger-600 text-sm mt-1">{errors.lastPaymentDate.message}</p>
            )}
          </div>

          {/* Minimum Ödeme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Ödeme Tutarı *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('minimumPayment', {
                  required: 'Minimum ödeme tutarı giriniz',
                  min: { value: 0, message: 'Tutar 0\'dan küçük olamaz' }
                })}
                className="input w-full pl-10"
                placeholder="0.00"
              />
            </div>
            {errors.minimumPayment && (
              <p className="text-danger-600 text-sm mt-1">{errors.minimumPayment.message}</p>
            )}
          </div>

          {/* Para Birimi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Para Birimi
            </label>
            <div className="relative">
              <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                {...register('currency')}
                className="input w-full pl-10"
              >
                <option value="TRY">Türk Lirası (₺)</option>
                <option value="USD">Amerikan Doları ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
          </div>

          {/* Butonlar */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary flex-1"
            >
              İptal
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              {card ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CardModal; 