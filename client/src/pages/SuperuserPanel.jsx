import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search, Users, Eye, TrendingUp, CreditCard, Users as FamilyIcon, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { superuserService } from '../services/superuserService';
import { useForm } from 'react-hook-form';

// Şifre Değiştirme Modal Bileşeni
const PasswordChangeModal = ({ isOpen, onClose, userId, onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch
  } = useForm({
    defaultValues: {
      newPassword: '',
      confirmPassword: ''
    }
  });

  const watchedPassword = watch('newPassword');

  const onSubmitForm = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }
    await onSubmit(data.newPassword);
    reset();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Kullanıcı Şifresini Güncelle
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-4">
          {/* Yeni Şifre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yeni Şifre
            </label>
            <input
              type="password"
              {...register('newPassword', {
                required: 'Yeni şifre giriniz',
                minLength: { value: 6, message: 'Şifre en az 6 karakter olmalıdır' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'
                }
              })}
              className="input w-full"
              placeholder="Yeni şifre"
            />
            {errors.newPassword && (
              <p className="text-red-600 text-sm mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Şifre Tekrar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şifre Tekrar
            </label>
            <input
              type="password"
              {...register('confirmPassword', {
                required: 'Şifre tekrarını giriniz',
                validate: (value) => value === watchedPassword || 'Şifreler eşleşmiyor'
              })}
              className="input w-full"
              placeholder="Şifre tekrarı"
            />
            {errors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Şifre Gereksinimleri */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Şifre Gereksinimleri</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• En az 6 karakter</li>
              <li>• En az bir büyük harf</li>
              <li>• En az bir küçük harf</li>
              <li>• En az bir rakam</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
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
              {isSubmitting ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SuperuserPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await superuserService.getUsers({
        page: currentPage,
        search: searchTerm
      });
      setUsers(response.users);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      toast.error('Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleUserClick = async (userId) => {
    try {
      const response = await superuserService.getUserDetails(userId);
      setSelectedUser(response);
      setShowUserDetails(true);
    } catch (error) {
      toast.error('Kullanıcı detayları yüklenirken hata oluştu');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('tr-TR');
  };

  const getBalanceColor = (balance) => {
    return balance >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const handlePasswordChange = (userId) => {
    setPasswordUserId(userId);
    setShowPasswordModal(true);
  };

  if (user?.role !== 'superuser') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erişim Reddedildi</h1>
          <p className="text-gray-600">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Superuser Paneli</h1>
        <p className="text-gray-600">Tüm kullanıcıları yönetin ve izleyin</p>
      </div>

      {/* Arama */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Kullanıcı ara (isim veya email)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Kullanıcı Listesi */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kayıt Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlem Sayısı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Toplam Bakiye
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kart Sayısı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'superuser' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'superuser' ? 'Superuser' : 'Kullanıcı'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.stats.transactionCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getBalanceColor(user.stats.totalBalance)}`}>
                        {formatCurrency(user.stats.totalBalance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.stats.cardCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleUserClick(user._id)}
                        className="text-primary-600 hover:text-primary-900 flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Önceki
            </button>
            <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sonraki
            </button>
          </nav>
        </div>
      )}

      {/* Kullanıcı Detayları Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
                             <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-gray-900">
                   {selectedUser.user.name} - Detaylar
                 </h2>
                 <div className="flex items-center space-x-3">
                   <button
                     onClick={() => handlePasswordChange(selectedUser.user._id)}
                     className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                   >
                     <Lock className="h-4 w-4 mr-1" />
                     Şifreyi Güncelle
                   </button>
                   <button
                     onClick={() => setShowUserDetails(false)}
                     className="text-gray-400 hover:text-gray-600"
                   >
                     <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                   </button>
                 </div>
               </div>

              {/* İstatistikler */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">Toplam Gelir</p>
                      <p className="text-lg font-semibold text-blue-900">
                        {formatCurrency(selectedUser.stats.totalIncome)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-red-600 transform rotate-180" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-600">Toplam Gider</p>
                      <p className="text-lg font-semibold text-red-900">
                        {formatCurrency(selectedUser.stats.totalExpense)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CreditCard className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">Kart Sayısı</p>
                      <p className="text-lg font-semibold text-green-900">
                        {selectedUser.stats.cardCount}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <FamilyIcon className="h-8 w-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600">Aile Üyesi</p>
                      <p className="text-lg font-semibold text-purple-900">
                        {selectedUser.stats.familyMemberCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Son İşlemler */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Son İşlemler</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedUser.transactions.length > 0 ? (
                    <div className="space-y-2">
                      {selectedUser.transactions.slice(0, 5).map((transaction) => (
                        <div key={transaction._id} className="flex justify-between items-center p-2 bg-white rounded">
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                          </div>
                          <span className={`font-semibold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Henüz işlem bulunmuyor</p>
                  )}
                </div>
              </div>

              {/* Kartlar */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Kartlar</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedUser.cards.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.cards.map((card) => (
                        <div key={card._id} className="bg-white p-4 rounded border">
                          <h4 className="font-semibold">{card.name}</h4>
                          <p className="text-sm text-gray-600">{card.bankName}</p>
                          <p className="text-sm text-gray-600">
                            Borç: {formatCurrency(card.remainingDebt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Henüz kart bulunmuyor</p>
                  )}
                </div>
              </div>
            </div>
          </div>
                 </div>
       )}

       {/* Şifre Değiştirme Modal */}
       {showPasswordModal && (
         <PasswordChangeModal
           isOpen={showPasswordModal}
           onClose={() => {
             setShowPasswordModal(false);
             setPasswordUserId(null);
           }}
           userId={passwordUserId}
           onSubmit={async (newPassword) => {
             try {
               await superuserService.updateUserPassword(passwordUserId, newPassword);
               toast.success('Kullanıcı şifresi başarıyla güncellendi');
               setShowPasswordModal(false);
               setPasswordUserId(null);
             } catch (error) {
               toast.error(error.response?.data?.message || 'Şifre güncellenirken hata oluştu');
             }
           }}
         />
       )}
     </div>
   );
 };

export default SuperuserPanel; 