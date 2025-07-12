import React from 'react';

const SimpleCollaboration = ({ planId, planData, isOwner, onPlanUpdate }) => {
  // This is a placeholder component for collaboration features
  // You can expand this based on your specific requirements
  
  return (
    <div style={{
      position: 'absolute',
      top: 10,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0, 0, 0, 0.8)',
      color: '#fff',
      padding: '8px 16px',
      borderRadius: 4,
      fontSize: 12,
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }}>
      <span>🔄</span>
      <span>Plan ID: {planId}</span>
      {isOwner && <span style={{ color: '#ffd700' }}>👑 Owner</span>}
    </div>
  );
};

export default SimpleCollaboration;
