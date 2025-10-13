import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="loading">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '16px', color: '#6b7280' }}>{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
