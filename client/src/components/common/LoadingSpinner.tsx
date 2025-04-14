import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = 'text-blue-500' 
}) => {
  const sizeClass = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }[size];

  return (
    <div className="flex justify-center items-center p-4">
      <div className={`animate-spin rounded-full border-4 border-t-transparent ${sizeClass} ${color}`} />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner; 