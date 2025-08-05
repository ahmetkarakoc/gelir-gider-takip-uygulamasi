import React, { useState, useEffect } from 'react';
import { X, Calendar, CreditCard } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const TransactionModal = ({ isOpen, onClose, onSubmit, transaction = null, cards = [], familyMembers = [] }) => {
  const [selectedDate, setSelectedDate] = useState(
    transaction && transaction.date ? format(new Date(transaction.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch
  } = useForm({
    defaultValues: {
      type: transaction?.type || 'expense',
      category: transaction?.category || '',
      amount: transaction?.amount || '',
      description: transaction?.description || '',
      paymentMethod: transaction?.paymentMethod || 'cash',
      card: transaction?.card?._id || '',
      familyMember: transaction?.familyMember?._id || '',
      isRecurring: transaction?.isRecurring || false,
      recurringInterval: transaction?.recurringInterval || 'monthly'
    }
  });

  const transactionType = watch('type');

  const categories = {
    income: ['Maaş', 'Freelance', 'Yatırım', 'Kira Geliri', 'Diğer'],
    expense: ['Market', 'Fatura', 'Kira', 'Ulaşım', 'Eğlence', 'Sağlık', 'Eğitim', 'Diğer']
  };

  useEffect(() => {
    if (isOpen) {
      reset({
        type: transaction?.type || 'expense',
        category: transaction?.category || '',
        amount: transaction?.amount || '',
        description: transaction?.description || '',
        paymentMethod: transaction?.paymentMethod || 'cash',
                 card: transaction?.card?._id || '',
         familyMember: transaction?.familyMember?._id || '',
         isRecurring: transaction?.isRecurring || false,
         recurringInterval: transaction?.recurringInterval || 'monthly'
      });
      setSelectedDate(
        transaction && transaction.date ? format(new Date(transaction.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
      );
    }
  }, [isOpen, transaction, reset]);

  const onSubmitForm = async (data) => {
    try {
      const formData = {
        ...data,
        date: selectedDate,
        amount: parseFloat(data.amount),
                 card: data.card || null,
         familyMember: data.familyMember || null,
         isRecurring: Boolean(data.isRecurring),
         recurringInterval: data.isRecurring ? data.recurringInterval : null
      };

      await onSubmit(formData);
      onClose();
      reset();
    } catch (error) {
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
        toast.error(`Validasyon hatası: ${errorMessages}`);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('İşlem kaydedilirken hata oluştu');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {transaction ? 'İşlem Düzenle' : 'Yeni İşlem'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-4">
          {/* İşlem Tipi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İşlem Tipi
            </label>
            <div className="flex space-x-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="expense"
                  {...register('type')}
                  className="mr-2"
                />
                <span className="text-sm">Gider</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="income"
                  {...register('type')}
                  className="mr-2"
                />
                <span className="text-sm">Gelir</span>
              </label>
            </div>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori
            </label>
            <select
              {...register('category', { required: 'Kategori seçiniz' })}
              className="input w-full"
            >
              <option value="">Kategori seçiniz</option>
              {categories[transactionType]?.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {errors.category && (
              <p className="text-danger-600 text-sm mt-1">{errors.category.message}</p>
            )}
          </div>

          {/* Tutar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tutar (₺)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register('amount', { 
                required: 'Tutar giriniz',
                min: { value: 0.01, message: 'Tutar 0\'dan büyük olmalıdır' }
              })}
              className="input w-full"
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="text-danger-600 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              {...register('description')}
              className="input w-full"
              rows="3"
              placeholder="İşlem açıklaması..."
            />
          </div>

          {/* Tarih */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarih
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input w-full pl-10"
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
               <option value="cash">Nakit</option>
               <option value="card">Kart</option>
               <option value="bank_transfer">Banka Transferi</option>
               <option value="other">Diğer</option>
             </select>
          </div>

          {/* Kart Seçimi */}
          {watch('paymentMethod') === 'card' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kart
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  {...register('card')}
                  className="input w-full pl-10"
                >
                  <option value="">Kart seçiniz</option>
                  {cards.map(card => (
                    <option key={card._id} value={card._id}>
                      {card.name} - {card.bankName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

                     {/* Aile Bireyi Seçimi */}
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
               Aile Bireyi (Opsiyonel)
             </label>
             <select
               {...register('familyMember')}
               className="input w-full"
             >
               <option value="">Aile bireyi seçiniz</option>
               {familyMembers.map(member => (
                 <option key={member._id} value={member._id}>
                   {member.icon} {member.name} - {member.relationship}
                 </option>
               ))}
             </select>
           </div>

           {/* Tekrarlayan İşlem */}
           <div>
             <label className="flex items-center">
               <input
                 type="checkbox"
                 {...register('isRecurring')}
                 className="mr-2"
               />
               <span className="text-sm font-medium text-gray-700">
                 Tekrarlayan işlem
               </span>
             </label>
           </div>

          {watch('isRecurring') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tekrarlama Sıklığı
              </label>
              <select
                {...register('recurringInterval')}
                className="input w-full"
              >
                <option value="weekly">Haftalık</option>
                <option value="monthly">Aylık</option>
                <option value="yearly">Yıllık</option>
              </select>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1"
            >
              {isSubmitting ? 'Kaydediliyor...' : (transaction ? 'Güncelle' : 'Kaydet')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal; 