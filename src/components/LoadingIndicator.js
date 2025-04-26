import React from 'react';

const LoadingIndicator = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-indicator">
      <div className="loading-spinner"></div>
      <span>{message}</span>
    </div>
  );
};

export default LoadingIndicator;
