import React, { useState, useEffect } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import LoadingSpinner from '../common/LoadingSpinner';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const SectorDistribution = ({ data, loading = false, error = null, height = 320 }) => {
  const [chartType, setChartType] = useState('pie'); // 'pie' or 'bar'

  const chartData = {
    labels: Object.keys(data || {}),
    datasets: [
      {
        label: 'Problems',
        data: Object.values(data || {}),
        backgroundColor: [
          '#3B82F6', // blue-500
          '#10B981', // emerald-500
          '#F59E0B', // amber-500
          '#8B5CF6', // violet-500
          '#EC4899', // pink-500
          '#14B8A6', // teal-500
          '#F97316', // orange-500
          '#6366F1', // indigo-500
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#3B82F6',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} problems (${percentage}%)`;
          },
        },
      },
    },
    scales: chartType === 'bar' ? {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    } : undefined,
  };

  const renderChart = () => {
    if (chartType === 'pie') {
      return <Pie data={chartData} options={options} />;
    } else {
      return <Bar data={chartData} options={options} />;
    }
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner size="lg" text="Loading sector data..." />;
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-red-500">
          <div className="text-center">
            <p className="text-lg font-medium">Failed to load data</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      );
    }

    if (!data || Object.keys(data).length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p className="text-lg font-medium">No data available</p>
            <p className="text-sm mt-1">No problems found for the selected criteria</p>
          </div>
        </div>
      );
    }

    return renderChart();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Sector Distribution</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setChartType('pie')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                chartType === 'pie'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Pie
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                chartType === 'bar'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Bar
            </button>
          </div>
        </div>
      </div>
      <div className="p-6" style={{ height: height }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default SectorDistribution;
