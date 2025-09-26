import React from 'react';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, ArrowPathIcon, BellAlertIcon } from '@heroicons/react/24/outline';

const statusIcons = {
  pending: <ClockIcon className="h-6 w-6 text-amber-500" />,
  in_progress: <ArrowPathIcon className="h-6 w-6 text-blue-500 animate-spin" />,
  resolved: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
  escalated: <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />,
  info: <BellAlertIcon className="h-6 w-6 text-blue-500" />,
};

const StatusCard = ({ title, count, status, trend, trendPercentage, icon }) => {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-50 border-amber-200',
      in_progress: 'bg-blue-50 border-blue-200',
      resolved: 'bg-green-50 border-green-200',
      escalated: 'bg-red-50 border-red-200',
      info: 'bg-blue-50 border-blue-200',
    };
    return colors[status] || colors.info;
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow border-l-4 ${getStatusColor(status)} transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{count || 0}</p>
        </div>
        <div className="p-3 rounded-full bg-gray-50">
          {icon || statusIcons[status] || statusIcons.info}
        </div>
      </div>
      {trend && trendPercentage !== undefined && (
        <div className="mt-4 flex items-center">
          <span className={`text-sm font-medium ${trendColors[trend] || trendColors.neutral}`}>
            {trendIcons[trend] || ''} {Math.abs(trendPercentage)}%
          </span>
          <span className="ml-1 text-xs text-gray-500">from last month</span>
        </div>
      )}
    </div>
  );
};

export default StatusCard;
