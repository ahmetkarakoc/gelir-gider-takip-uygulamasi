import React from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { TrendingUp, TrendingDown, CreditCard } from 'lucide-react';

const RecentTransactions = ({ transactions }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (date) => {
    return format(new Date(date), 'dd MMM', { locale: tr });
  };

  const getTransactionIcon = (type) => {
    return type === 'income' ? (
      <TrendingUp className="h-4 w-4 text-success-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-danger-600" />
    );
  };

  const getTransactionColor = (type) => {
    return type === 'income' ? 'text-success-600' : 'text-danger-600';
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Henüz işlem bulunmuyor</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.slice(0, 5).map((transaction) => (
        <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {getTransactionIcon(transaction.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {transaction.description || transaction.category}
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{transaction.category}</span>
                {transaction.card && (
                  <>
                    <span>•</span>
                    <div className="flex items-center">
                      <CreditCard className="h-3 w-3 mr-1" />
                      <span>{transaction.card.name}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`text-sm font-medium ${getTransactionColor(transaction.type)}`}>
              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
            </span>
            <span className="text-xs text-gray-400">
              {formatDate(transaction.date)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentTransactions; 