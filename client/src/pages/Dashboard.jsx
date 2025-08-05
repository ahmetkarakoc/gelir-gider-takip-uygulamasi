import React, { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';
import { transactionService } from '../services/transactionService';
import { familyMemberService } from '../services/familyMemberService';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  AlertTriangle,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import TransactionChart from '../components/TransactionChart';
import CardDebtChart from '../components/CardDebtChart';
import RecentTransactions from '../components/RecentTransactions';
import DuePayments from '../components/DuePayments';
import TransactionModal from '../components/TransactionModal';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState('expense');
  const [familyMembers, setFamilyMembers] = useState([]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardResponse, familyMembersResponse] = await Promise.all([
        dashboardService.getDashboardData(),
        familyMemberService.getFamilyMembers()
      ]);

      setDashboardData(dashboardResponse);
      setFamilyMembers(familyMembersResponse.familyMembers || []);
    } catch (error) {
      toast.error('Dashboard verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const { monthlySummary, chartData, cards } = dashboardData || {};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const getBalanceColor = (balance) => {
    return balance >= 0 ? 'text-success-600' : 'text-danger-600';
  };

  const handleAddTransaction = (type) => {
    setTransactionType(type);
    setShowTransactionModal(true);
  };

  const handleTransactionSubmit = async (data) => {
    try {
      await transactionService.createTransaction(data);
      toast.success('İşlem başarıyla eklendi');
      loadDashboardData(); // Refresh data
    } catch (error) {
      toast.error('İşlem eklenirken hata oluştu');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            {format(new Date(), 'EEEE, d MMMM yyyy', { locale: tr })}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button 
            onClick={() => handleAddTransaction('income')}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Gelir Ekle
          </button>
          <button 
            onClick={() => handleAddTransaction('expense')}
            className="btn-secondary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Gider Ekle
          </button>
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Toplam Gelir */}
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-success-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Toplam Gelir</p>
              <p className="text-2xl font-semibold text-success-600">
                {formatCurrency(monthlySummary?.totalIncome || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Toplam Gider */}
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-danger-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-danger-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Toplam Gider</p>
              <p className="text-2xl font-semibold text-danger-600">
                {formatCurrency(monthlySummary?.totalExpense || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Net Bakiye */}
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Net Bakiye</p>
              <p className={`text-2xl font-semibold ${getBalanceColor(monthlySummary?.netBalance || 0)}`}>
                {formatCurrency(monthlySummary?.netBalance || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Aktif Kartlar */}
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-warning-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Aktif Kartlar</p>
              <p className="text-2xl font-semibold text-warning-600">
                {cards?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detaylı İstatistikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* En Çok Harcama Kategorisi */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">En Çok Harcama Kategorisi</h3>
          </div>
          <div className="p-6">
            {dashboardData?.topSpendingCategory ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {dashboardData.topSpendingCategory[0]}
                  </p>
                  <p className="text-sm text-gray-600">
                    Bu ay en çok harcama yapılan kategori
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-danger-600">
                    {formatCurrency(dashboardData.topSpendingCategory[1].expense)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Henüz harcama verisi yok</p>
            )}
          </div>
        </div>

        {/* En Çok Gider Yapan Aile Bireyi */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">En Çok Gider Yapan Aile Bireyi</h3>
          </div>
          <div className="p-6">
            {dashboardData?.mostFrequentFamilyMember ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg mr-3"
                    style={{ backgroundColor: dashboardData.mostFrequentFamilyMember[1].color }}
                  >
                    {dashboardData.mostFrequentFamilyMember[1].icon}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {dashboardData.mostFrequentFamilyMember[0]}
                    </p>
                    <p className="text-sm text-gray-600">
                      {dashboardData.mostFrequentFamilyMember[1].count} gider işlemi
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(dashboardData.mostFrequentFamilyMember[1].total)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Henüz aile bireyi verisi yok</p>
            )}
          </div>
        </div>
      </div>

      {/* Kart Harcamaları */}
      {dashboardData?.cardSpending && dashboardData.cardSpending.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Kartlara Göre Harcamalar</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.cardSpending.slice(0, 3).map((card, index) => (
                <div key={card._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                      <CreditCard className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{card.cardName}</p>
                      <p className="text-sm text-gray-600">{card.bankName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-danger-600">
                      {formatCurrency(card.totalSpent)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gelecek 7 Günlük Ödemeler */}
      {dashboardData?.upcomingPayments && dashboardData.upcomingPayments.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Gelecek 7 Günlük Ödemeler</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {dashboardData.upcomingPayments.slice(0, 5).map((card) => (
                <div key={card._id} className="flex items-center justify-between p-3 bg-warning-50 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-warning-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{card.name}</p>
                      <p className="text-sm text-gray-600">{card.bankName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-warning-600">
                      {format(new Date(card.lastPaymentDate), 'dd MMM', { locale: tr })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grafikler ve Detaylar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gelir-Gider Grafiği */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Aylık Gelir-Gider</h3>
          </div>
          <div className="h-80">
            <TransactionChart data={chartData || []} />
          </div>
        </div>

        {/* Kart Borcu Grafiği */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Kart Borcu Durumu</h3>
          </div>
          <div className="h-80">
            <CardDebtChart cards={cards || []} />
          </div>
        </div>
      </div>

      {/* Alt Bölüm */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Son İşlemler */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Son İşlemler</h3>
            <button 
              onClick={() => window.location.href = '/transactions'}
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Tümünü Gör
            </button>
          </div>
          <RecentTransactions transactions={dashboardData?.recentTransactions || []} />
        </div>

        {/* Günü Gelen Ödemeler */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Günü Gelen Ödemeler</h3>
          </div>
          <div className="card-body">
            {dashboardData?.duePayments && dashboardData.duePayments.length > 0 ? (
              <DuePayments payments={dashboardData.duePayments} />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Günü gelen ödeme bulunmuyor</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        onSubmit={handleTransactionSubmit}
        transaction={{ type: transactionType }}
        cards={cards || []}
        familyMembers={familyMembers}
      />
    </div>
  );
};

export default Dashboard; 