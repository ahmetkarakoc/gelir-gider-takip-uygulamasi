import React from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CreditCard, AlertTriangle, Calendar } from 'lucide-react';

const DuePayments = ({ payments }) => {
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

  const getPaymentStatus = (dueDate) => {
    const daysUntilDue = getDaysUntilDue(dueDate);
    
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

  if (!payments || payments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Günü gelen ödeme bulunmuyor</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => {
        // Güvenli erişim - payment.card undefined olabilir
        if (!payment.card || !payment.card.lastPaymentDate) {
          return null;
        }

        // Sadece borcu olan kartları göster
        if (payment.card.totalDebt === 0) {
          return null;
        }

        const status = getPaymentStatus(payment.card.lastPaymentDate);
        
        return (
          <div key={payment.card._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <CreditCard className="h-5 w-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {payment.card.name}
                </p>
                <p className="text-xs text-gray-500">
                  {payment.card.bankName}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${status.bgColor}`}>
                {status.icon}
                <span className={status.color}>{status.text}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(payment.card.minimumPayment)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(payment.card.lastPaymentDate)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DuePayments; 