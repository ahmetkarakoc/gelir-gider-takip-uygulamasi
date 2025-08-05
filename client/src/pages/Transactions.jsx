import React, { useState, useEffect, useCallback } from 'react';
import { transactionService } from '../services/transactionService';
import { cardService } from '../services/cardService';
import { familyMemberService } from '../services/familyMemberService';
import { 
  Plus, 
  Filter, 
  Search, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  Calendar,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import TransactionModal from '../components/TransactionModal';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [cards, setCards] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    familyMember: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Filtreleri API parametrelerine dönüştür
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.familyMember) params.familyMember = filters.familyMember;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.search) params.search = filters.search;

      const [transactionsData, cardsData, familyMembersData] = await Promise.all([
        transactionService.getTransactions(params),
        cardService.getCards(),
        familyMemberService.getFamilyMembers()
      ]);
      setTransactions(transactionsData.transactions || []);
      setCards(cardsData.cards || []);
      setFamilyMembers(familyMembersData.familyMembers || []);
    } catch (error) {
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (date) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: tr });
  };

  const getTransactionIcon = (type) => {
    return type === 'income' ? (
      <TrendingUp className="h-5 w-5 text-success-600" />
    ) : (
      <TrendingDown className="h-5 w-5 text-danger-600" />
    );
  };

  const getTransactionColor = (type) => {
    return type === 'income' ? 'text-success-600' : 'text-danger-600';
  };

  const getTransactionBgColor = (type) => {
    return type === 'income' 
      ? 'bg-emerald-50 hover:bg-emerald-100 border-l-4 border-emerald-500' 
      : 'bg-rose-50 hover:bg-rose-100 border-l-4 border-rose-500';
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Backend filtering kullanıldığı için frontend filtering kaldırıldı
  const filteredTransactions = transactions;

  const categories = [...new Set(transactions.map(t => t.category))];

  const handleAddTransaction = () => {
    setSelectedTransaction(null);
    setShowTransactionModal(true);
  };

  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleTransactionSubmit = async (data) => {
    try {
      if (selectedTransaction) {
        await transactionService.updateTransaction(selectedTransaction._id, data);
        toast.success('İşlem başarıyla güncellendi');
      } else {
        await transactionService.createTransaction(data);
        toast.success('İşlem başarıyla eklendi');
      }
      loadData(); // Refresh data
    } catch (error) {
      toast.error('İşlem kaydedilirken hata oluştu');
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
      try {
        await transactionService.deleteTransaction(transactionId);
        toast.success('İşlem başarıyla silindi');
        loadData(); // Refresh data
          } catch (error) {
      toast.error('İşlem silinirken hata oluştu');
    }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İşlemler</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gelir ve gider işlemlerinizi yönetin
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button 
            onClick={handleAddTransaction}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni İşlem
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filtreler:</span>
            </div>
            
            {/* Tip Filtresi */}
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="input max-w-xs"
            >
              <option value="">Tüm Tipler</option>
              <option value="income">Gelir</option>
              <option value="expense">Gider</option>
            </select>

            {/* Kategori Filtresi */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="input max-w-xs"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Aile Bireyi Filtresi */}
            <select
              value={filters.familyMember}
              onChange={(e) => handleFilterChange('familyMember', e.target.value)}
              className="input max-w-xs"
            >
              <option value="">Tüm Aile Bireyleri</option>
              {familyMembers.map(member => (
                <option key={member._id} value={member._id}>
                  {member.icon} {member.name}
                </option>
              ))}
            </select>

            {/* Tarih Başlangıç */}
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="input max-w-xs"
              placeholder="Başlangıç tarihi"
            />

            {/* Tarih Bitiş */}
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="input max-w-xs"
              placeholder="Bitiş tarihi"
            />
          </div>

          {/* Arama */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="İşlem ara..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="input pl-10 max-w-xs"
            />
          </div>
        </div>
      </div>

      {/* İşlemler Listesi */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">İşlemler ({filteredTransactions.length})</h3>
        </div>
        
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Henüz işlem bulunmuyor</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div 
                key={transaction._id} 
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg transition-colors ${getTransactionBgColor(transaction.type)}`}
              >
                <div className="flex items-start sm:items-center space-x-4 mb-3 sm:mb-0">
                  <div className="flex-shrink-0">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.description || transaction.category}
                    </p>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-gray-500 mt-1">
                      <span className="bg-gray-100 px-2 py-1 rounded">{transaction.category}</span>
                      {transaction.card && (
                        <div className="flex items-center bg-blue-100 px-2 py-1 rounded">
                          <CreditCard className="h-3 w-3 mr-1" />
                          <span className="truncate max-w-20">{transaction.card.name}</span>
                        </div>
                      )}
                      {transaction.familyMember && (
                        <div className="flex items-center bg-purple-100 px-2 py-1 rounded">
                          <span 
                            className="mr-1"
                            style={{ color: transaction.familyMember.color }}
                          >
                            {transaction.familyMember.icon}
                          </span>
                          <span className="truncate max-w-20">{transaction.familyMember.name}</span>
                        </div>
                      )}
                      <div className="flex items-center bg-gray-100 px-2 py-1 rounded">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{formatDate(transaction.date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end space-x-4">
                  <span className={`text-lg font-semibold ${getTransactionColor(transaction.type)}`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleEditTransaction(transaction)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteTransaction(transaction._id)}
                      className="p-2 text-gray-400 hover:text-danger-600 rounded-full hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        onSubmit={handleTransactionSubmit}
        transaction={selectedTransaction}
        cards={cards}
        familyMembers={familyMembers}
      />
    </div>
  );
};

export default Transactions; 