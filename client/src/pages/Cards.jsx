import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, AlertTriangle, Calendar, DollarSign, Edit, Trash2, Eye } from 'lucide-react';
import { cardService } from '../services/cardService';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import CardModal from '../components/CardModal';
import CardPaymentModal from '../components/CardPaymentModal';

const Cards = () => {
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [editingCard, setEditingCard] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (date) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: tr });
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPaymentStatus = (card) => {
    const daysUntilDue = getDaysUntilDue(card.lastPaymentDate);
    
    if (daysUntilDue < 0) {
      return {
        text: `${Math.abs(daysUntilDue)} gün gecikmiş`,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: <AlertTriangle className="h-4 w-4 text-red-600" />
      };
    } else if (daysUntilDue === 0) {
      return {
        text: 'Bugün son gün',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        icon: <AlertTriangle className="h-4 w-4 text-orange-600" />
      };
    } else if (daysUntilDue <= 3) {
      return {
        text: `${daysUntilDue} gün kaldı`,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        icon: <Calendar className="h-4 w-4 text-orange-600" />
      };
    } else {
      return {
        text: `${daysUntilDue} gün kaldı`,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: <Calendar className="h-4 w-4 text-gray-600" />
      };
    }
  };

  const loadCards = async () => {
    try {
      setIsLoading(true);
      const response = await cardService.getCards();
      setCards(response.cards);
    } catch (error) {
      toast.error('Kartlar yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleAddCard = async (cardData) => {
    try {
      await cardService.createCard(cardData);
      toast.success('Kart başarıyla eklendi');
      loadCards();
    } catch (error) {
      toast.error('Kart eklenirken hata oluştu');
    }
  };

  const handleUpdateCard = async (cardData) => {
    try {
      await cardService.updateCard(editingCard._id, cardData);
      toast.success('Kart başarıyla güncellendi');
      loadCards();
    } catch (error) {
      toast.error('Kart güncellenirken hata oluştu');
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Bu kartı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await cardService.deleteCard(cardId);
      toast.success('Kart başarıyla silindi');
      loadCards();
    } catch (error) {
      toast.error('Kart silinirken hata oluştu');
    }
  };

  const handlePayDebt = (card) => {
    setSelectedCard(card);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (paymentData) => {
    try {
      await cardService.createPayment(selectedCard._id, paymentData);
      toast.success('Ödeme başarıyla eklendi');
      loadCards(); // Kart listesini yenile
      setShowPaymentModal(false);
      setSelectedCard(null);
    } catch (error) {
      toast.error('Ödeme eklenirken hata oluştu');
    }
  };

  const openEditModal = (card) => {
    setEditingCard(card);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCard(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 space-y-4 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Kartlarım</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="h-5 w-5" />
          <span>Yeni Kart</span>
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz kart eklenmemiş</h3>
          <p className="text-gray-500 mb-6">Kredi kartlarınızı ekleyerek borç takibinizi yapabilirsiniz.</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            İlk Kartınızı Ekleyin
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {cards.map((card) => {
            const status = getPaymentStatus(card);
            
            return (
              <div key={card._id} className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-primary-500">
                {/* Kart Başlığı */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <CreditCard className="h-6 w-6 text-primary-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{card.name}</h3>
                      {card.bankName && (
                        <p className="text-sm text-gray-500 truncate">{card.bankName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1 sm:space-x-2 ml-2">
                    <button
                      onClick={() => openEditModal(card)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card._id)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Borç Bilgileri */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Toplam Borç:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(card.totalDebt)}
                    </span>
                  </div>
                  {card.cardLimit && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Kart Limiti:</span>
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(card.cardLimit)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Kullanılabilir Limit:</span>
                        <span className={`font-semibold ${card.availableLimit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(card.availableLimit || 0)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Minimum Ödeme:</span>
                    <span className="font-semibold text-orange-600">
                      {formatCurrency(card.minimumPayment)}
                    </span>
                  </div>
                </div>

                {/* Ödeme Durumu */}
                <div className="mb-4">
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm ${status.bgColor}`}>
                    {status.icon}
                    <span className={status.color}>{status.text}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Son ödeme: {formatDate(card.lastPaymentDate)}
                  </p>
                </div>

                {/* Minimum Ödeme Durumu */}
                {card.minPaymentDoneThisMonth && (
                  <div className="mb-4 p-2 bg-green-100 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-700 font-medium">
                        Bu ay minimum ödeme yapıldı
                      </span>
                    </div>
                  </div>
                )}

                {/* Aksiyon Butonları */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={() => handlePayDebt(card)}
                    className="btn-primary flex items-center justify-center space-x-2"
                    disabled={card.totalDebt <= 0}
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>Borç Öde</span>
                  </button>
                  <button
                    onClick={() => {/* Kart detayları modal'ı */}}
                    className="btn-secondary flex items-center justify-center"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Kart Modal */}
      <CardModal
        isOpen={showModal}
        onClose={closeModal}
        onSubmit={editingCard ? handleUpdateCard : handleAddCard}
        card={editingCard}
      />

      {/* Ödeme Modal */}
      <CardPaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedCard(null);
        }}
        onSubmit={handlePaymentSubmit}
        card={selectedCard}
      />
    </div>
  );
};

export default Cards; 