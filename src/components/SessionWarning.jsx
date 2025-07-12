// src/components/SessionWarning.jsx
import React, { useState, useEffect } from 'react';
import { sessionManager } from '../utils/sessionManager';

const SessionWarning = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    // Check if we should show warning (2 minutes before expiration)
    const WARNING_TIME = 2 * 60 * 1000; // 2 minutes
    const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes
    
    const checkWarning = () => {
      const lastActivity = localStorage.getItem('lastActivity');
      if (lastActivity) {
        const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
        const timeUntilExpiry = SESSION_TIMEOUT - timeSinceLastActivity;
        
        if (timeUntilExpiry <= WARNING_TIME && timeUntilExpiry > 0) {
          setShowWarning(true);
          setTimeLeft(Math.floor(timeUntilExpiry / 1000));
        } else {
          setShowWarning(false);
        }
      }
    };

    const interval = setInterval(checkWarning, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleExtendSession = () => {
    sessionManager.resetSessionTimer();
    setShowWarning(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!showWarning) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000
    }}>
      <div style={{
        background: 'linear-gradient(120deg, #181c24 0%, #23272f 100%)',
        border: '2px solid #0ff',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 0 24px rgba(0, 255, 255, 0.3)'
      }}>
        <h3 style={{ color: '#0ff', marginBottom: '16px' }}>⏰ Session Expiring Soon</h3>
        <p style={{ color: '#fff', marginBottom: '16px' }}>
          Your session will expire in <strong style={{ color: '#ff0' }}>{formatTime(timeLeft)}</strong>
        </p>
        <p style={{ color: '#ccc', marginBottom: '20px', fontSize: '14px' }}>
          Would you like to extend your session?
        </p>
        <button
          onClick={handleExtendSession}
          style={{
            background: 'linear-gradient(90deg, #0ff, #09f)',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 0 16px rgba(0, 255, 255, 0.4)'
          }}
        >
          Extend Session
        </button>
      </div>
    </div>
  );
};

export default SessionWarning;
