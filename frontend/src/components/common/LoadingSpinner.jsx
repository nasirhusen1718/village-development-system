import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <ArrowPathIcon className={`${sizeClasses[size]} text-blue-500 animate-spin`} />
      {text && (
        <p className={`mt-2 ${textSizeClasses[size]} text-gray-600`}>{text}</p>
      )}
    </div>
  );
};

const LoadingCard = ({ title, size = 'md' }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="p-3 rounded-full bg-gray-200">
          <div className="h-6 w-6 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  );
};

const LoadingOverlay = ({ isVisible, children }) => {
  if (!isVisible) return children;

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
      {children}
    </div>
  );
};

export { LoadingSpinner, LoadingCard, LoadingOverlay };
export default LoadingSpinner;
