import React from 'react';
import './LoadingSpinner.css'; // We'll create this CSS file next

const LoadingSpinner: React.FC = () => {
  return (
    <div className="spinner-container">
      <div className="loading-spinner"></div>
    </div>
  );
};

export default LoadingSpinner; 