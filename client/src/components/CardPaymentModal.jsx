import React from 'react';
import { useForm } from 'react-hook-form';
import { X, DollarSign, Calendar, FileText, CreditCard, CheckCircle } from 'lucide-react';

const CardPaymentModal = ({ isOpen, onClose, onSubmit, card = null }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    defaultValues: {
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      description: '',
      paymentMethod: 'bank_transfer',
      isMinimumPayment: false
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
        amount: parseFloat(data.amount),
        paymentDate: new Date(data.paymentDate).toISOString()
      });
      handleClose();
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const isMinimumPayment = watch('isMinimumPayment');
  const amount = watch('amount');

  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Kart Ödemesi
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Kart Bilgileri */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <CreditCard className="h-5 w-5 text-primary-600" />
              <div>
                <h3 className="font-semibold text-gray-900">{card.name}</h3>
                {card.bankName && (
                  <p className="text-sm text-gray-500">{card.bankName}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Kalan Borç:</span>
                <p className="font-semibold text-gray-900">
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY'
                  }).format(card.totalDebt)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Minimum Ödeme:</span>
                <p className="font-semibold text-orange-600">
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY'
                  }).format(card.minimumPayment)}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
            {/* Ödeme Tutarı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ödeme Tutarı *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={card.totalDebt}
                  {...register('amount', {
                    required: 'Ödeme tutarı giriniz',
                    min: { value: 0, message: 'Tutar 0\'dan küçük olamaz' },
                    max: { value: card.totalDebt, message: `Tutar ${card.totalDebt} TL'den fazla olamaz` }
                  })}
                  className="input w-full pl-10"
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="text-danger-600 text-sm mt-1">{errors.amount.message}</p>
              )}
            </div>

            {/* Ödeme Tarihi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ödeme Tarihi
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  {...register('paymentDate')}
                  className="input w-full pl-10"
                />
              </div>
            </div>

            {/* Açıklama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  {...register('description')}
                  className="input w-full pl-10"
                  placeholder="Ödeme açıklaması"
                />
              </div>
            </div>

            {/* Ödeme Yöntemi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ödeme Yöntemi
              </label>
              <select
                {...register('paymentMethod')}
                className="input w-full"
              >
                <option value="bank_transfer">Banka Transferi</option>
                <option value="cash">Nakit</option>
                <option value="other">Diğer</option>
              </select>
            </div>

            {/* Minimum Ödeme Kontrolü */}
            <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <input
                type="checkbox"
                id="isMinimumPayment"
                {...register('isMinimumPayment')}
                className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="isMinimumPayment" className="flex items-center space-x-2 cursor-pointer">
                <CheckCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  Bu minimum ödeme
                </span>
              </label>
            </div>

            {/* Minimum Ödeme Uyarısı */}
            {isMinimumPayment && amount && parseFloat(amount) < card.minimumPayment && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">
                  ⚠️ Minimum ödeme tutarı {card.minimumPayment} TL'dir. 
                  Bu tutardan az ödeme yaparsanız minimum ödeme sayılmayacaktır.
                </p>
              </div>
            )}

            {/* Butonlar */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
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
                Ödemeyi Kaydet
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CardPaymentModal; 