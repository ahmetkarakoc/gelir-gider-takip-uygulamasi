import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const CardDebtChart = ({ cards }) => {
  const chartData = {
    labels: cards.map(card => card.name),
    datasets: [
      {
        data: cards.map(card => card.remainingDebt),
        backgroundColor: cards.map(card => card.color || '#3B82F6'),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            return `${label}: ${new Intl.NumberFormat('tr-TR', {
              style: 'currency',
              currency: 'TRY',
            }).format(value)}`;
          },
        },
      },
    },
  };

  if (!cards || cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Henüz kart bulunmuyor</p>
      </div>
    );
  }

  return <Doughnut data={chartData} options={options} />;
};

export default CardDebtChart; 