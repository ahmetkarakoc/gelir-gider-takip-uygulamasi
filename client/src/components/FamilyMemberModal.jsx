import React, { useState, useEffect } from 'react';
import { X, Palette, Smile } from 'lucide-react';
import { useForm } from 'react-hook-form';

const FamilyMemberModal = ({ isOpen, onClose, onSubmit, member = null }) => {
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [selectedIcon, setSelectedIcon] = useState('👤');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue
  } = useForm({
    defaultValues: {
      name: '',
      relationship: ''
    }
  });

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1'
  ];

  const icons = [
    '👤', '👨', '👩', '👶', '👴', '👵', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦',
    '👨‍👩‍👧‍👧', '👨‍👩‍👦', '👨‍👩‍👧', '👨‍👦', '👨‍👧', '👩‍👦', '👩‍👧'
  ];

  useEffect(() => {
    if (isOpen) {
      if (member) {
        setValue('name', member.name);
        setValue('relationship', member.relationship);
        setSelectedColor(member.color);
        setSelectedIcon(member.icon);
      } else {
        reset();
        setSelectedColor('#3B82F6');
        setSelectedIcon('👤');
      }
    }
  }, [isOpen, member, reset, setValue]);

  const onSubmitForm = async (data) => {
    try {
      const formData = {
        ...data,
        color: selectedColor,
        icon: selectedIcon
      };
      await onSubmit(formData);
      onClose();
      reset();
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {member ? 'Aile Bireyi Düzenle' : 'Yeni Aile Bireyi'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmitForm)} className="p-4 sm:p-6 space-y-4">
          {/* İsim */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İsim
            </label>
            <input
              type="text"
              {...register('name', { 
                required: 'İsim gereklidir',
                minLength: { value: 2, message: 'İsim en az 2 karakter olmalıdır' }
              })}
              className="input w-full"
              placeholder="Aile bireyinin adı"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* İlişki */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İlişki
            </label>
            <input
              type="text"
              {...register('relationship', { 
                required: 'İlişki gereklidir',
                minLength: { value: 2, message: 'İlişki en az 2 karakter olmalıdır' }
              })}
              className="input w-full"
              placeholder="Örn: Eş, Çocuk, Anne, Baba"
            />
            {errors.relationship && (
              <p className="text-red-600 text-sm mt-1">{errors.relationship.message}</p>
            )}
          </div>

          {/* Renk Seçimi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Palette className="h-4 w-4 inline mr-1" />
              Renk
            </label>
            <div className="grid grid-cols-5 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all ${
                    selectedColor === color 
                      ? 'border-gray-800 scale-110' 
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* İkon Seçimi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Smile className="h-4 w-4 inline mr-1" />
              İkon
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
              {icons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded border-2 text-lg transition-all ${
                    selectedIcon === icon 
                      ? 'border-primary-600 bg-primary-50' 
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  title={icon}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Önizleme */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Önizleme</h4>
            <div className="flex items-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg mr-3"
                style={{ backgroundColor: selectedColor }}
              >
                {selectedIcon}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {register('name').value || 'İsim'}
                </p>
                <p className="text-sm text-gray-600">
                  {register('relationship').value || 'İlişki'}
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Kaydediliyor...' : (member ? 'Güncelle' : 'Kaydet')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FamilyMemberModal; 