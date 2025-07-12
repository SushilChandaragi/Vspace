import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import './ShareModal.css';

const ShareModal = ({ plan, isOpen, onClose, onUpdate }) => {
  const [shareEmail, setShareEmail] = useState('');
  const [isPublic, setIsPublic] = useState(plan?.isPublic || false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAddCollaborator = async () => {
    if (!shareEmail.trim()) {
      setMessage('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shareEmail)) {
      setMessage('Please enter a valid email address');
      return;
    }

    if (plan.collaborators && plan.collaborators.includes(shareEmail)) {
      setMessage('This user is already a collaborator');
      return;
    }

    if (plan.userEmail === shareEmail) {
      setMessage('Cannot add yourself as a collaborator');
      return;
    }

    setLoading(true);
    try {
      const planRef = doc(db, 'plans', plan.id);
      await updateDoc(planRef, {
        collaborators: arrayUnion(shareEmail),
        lastModified: new Date().toISOString()
      });
      
      setMessage('Collaborator added successfully!');
      setShareEmail('');
      onUpdate(); // Refresh the plan data
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error adding collaborator:', error);
      setMessage('Failed to add collaborator. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = async (email) => {
    setLoading(true);
    try {
      const planRef = doc(db, 'plans', plan.id);
      await updateDoc(planRef, {
        collaborators: arrayRemove(email),
        lastModified: new Date().toISOString()
      });
      
      setMessage('Collaborator removed successfully!');
      onUpdate(); // Refresh the plan data
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error removing collaborator:', error);
      setMessage('Failed to remove collaborator. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublic = async () => {
    setLoading(true);
    try {
      const planRef = doc(db, 'plans', plan.id);
      await updateDoc(planRef, {
        isPublic: !isPublic,
        lastModified: new Date().toISOString()
      });
      
      setIsPublic(!isPublic);
      setMessage(`Plan is now ${!isPublic ? 'public' : 'private'}`);
      onUpdate(); // Refresh the plan data
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating plan visibility:', error);
      setMessage('Failed to update plan visibility. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = () => {
    const shareLink = `${window.location.origin}/plan?id=${plan.id}`;
    navigator.clipboard.writeText(shareLink).then(() => {
      setMessage('Share link copied to clipboard!');
      setTimeout(() => setMessage(''), 3000);
    }).catch(() => {
      setMessage('Failed to copy link');
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay share-modal-overlay">
      <div className="modal-content share-modal">
        <div className="modal-header">
          <h3>Share Plan: {plan?.planName || plan?.name || 'Untitled Plan'}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {message && (
            <div className={`message ${message.includes('Failed') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          {/* Public/Private Toggle */}
          <div className="sharing-section">
            <h4>Plan Visibility</h4>
            <div className="toggle-container">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={handleTogglePublic}
                  disabled={loading}
                />
                <span className="toggle-text">
                  {isPublic ? 'Public (anyone can view)' : 'Private (only you and collaborators)'}
                </span>
              </label>
            </div>
          </div>

          {/* Share Link */}
          <div className="sharing-section">
            <h4>Share Link</h4>
            <div className="share-link-container">
              <input
                type="text"
                value={`${window.location.origin}/plan?id=${plan.id}`}
                readOnly
                className="share-link-input"
              />
              <button
                onClick={copyShareLink}
                className="copy-button"
                disabled={loading}
              >
                📋 Copy
              </button>
            </div>
          </div>

          {/* Collaborators */}
          <div className="sharing-section">
            <h4>Collaborators</h4>
            <div className="add-collaborator">
              <input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="Enter email address"
                className="email-input"
                disabled={loading}
              />
              <button
                onClick={handleAddCollaborator}
                className="add-button"
                disabled={loading || !shareEmail.trim()}
              >
                {loading ? 'Adding...' : 'Add'}
              </button>
            </div>

            <div className="collaborators-list">
              {plan.collaborators && plan.collaborators.length > 0 ? (
                plan.collaborators.map((email, index) => (
                  <div key={index} className="collaborator-item">
                    <span className="collaborator-email">{email}</span>
                    <button
                      onClick={() => handleRemoveCollaborator(email)}
                      className="remove-button"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <p className="no-collaborators">No collaborators yet. Add some above!</p>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            onClick={onClose}
            className="modal-button secondary"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
