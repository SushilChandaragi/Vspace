// Import React hooks and navigation
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SavedPlans.css'; // Import component-specific styles
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import ShareModal from './ShareModal';
import ExportModal from './ExportModal';

function SavedPlans() {
  // Hook for programmatic navigation
  const navigate = useNavigate();
  
  // STATE MANAGEMENT
  const [savedPlans, setSavedPlans] = useState([]);
  const [sharedPlans, setSharedPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [planToShare, setPlanToShare] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [planToExport, setPlanToExport] = useState(null);

  // LOAD SAVED PLANS
  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setSavedPlans([]);
        setSharedPlans([]);
        setLoading(false);
        return;
      }
      
      // Fetch owned plans
      const q = query(collection(db, "plans"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const plans = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isOwned: true
      }));
      setSavedPlans(plans);

      // Fetch shared plans (where current user is in collaborators array)
      const sharedQuery = query(
        collection(db, "plans"), 
        where("collaborators", "array-contains", user.email)
      );
      const sharedSnapshot = await getDocs(sharedQuery);
      const collaboratorPlans = sharedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isOwned: false,
        isShared: true
      }));
      setSharedPlans(collaboratorPlans);
      
      setLoading(false);
    };
    fetchPlans();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = () => setOpenDropdownId(null);
    if (openDropdownId !== null) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [openDropdownId]);

  // FILTER AND SEARCH FUNCTIONALITY
  const allPlans = [...savedPlans, ...sharedPlans];
  const filteredPlans = allPlans.filter(plan => {
    const name = plan.planName || plan.name || "";
    const description = plan.description || "";
    const tags = Array.isArray(plan.tags) ? plan.tags : [];
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    // If you want to filter by type, you can use a resource type or skip
    const matchesFilter = filterType === 'all' ||
      (plan.type === filterType) ||
      (plan.resources && plan.resources.some(r => r.type === filterType));

    return matchesSearch && matchesFilter;
  });

  // SORT FUNCTIONALITY
  const sortedPlans = [...filteredPlans].sort((a, b) => {
    // Use createdAt for sorting if lastModified is missing
    const aDate = a.lastModified || a.createdAt || "";
    const bDate = b.lastModified || b.createdAt || "";
    switch (sortBy) {
      case 'newest':
        return new Date(bDate) - new Date(aDate);
      case 'oldest':
        return new Date(aDate) - new Date(bDate);
      case 'name':
        return (a.planName || a.name || "").localeCompare(b.planName || b.name || "");
      case 'size':
        return parseFloat(b.size || 0) - parseFloat(a.size || 0);
      default:
        return 0;
    }
  });

  // PLAN ACTIONS
  const handleViewEditPlan = (plan) => {
    if (plan.isShared) {
      // For shared plans, navigate with the plan ID as a URL parameter
      navigate(`/plan?id=${plan.id}`);
    } else {
      // For owned plans, use the existing method
      navigate('/plan', { state: { loadedPlan: plan, planId: plan.id } });
    }
  };

  const handleDeletePlan = (plan) => {
    if (plan.isOwned) {
      setPlanToDelete(plan);
      setShowDeleteModal(true);
    } else {
      alert("You can only delete plans that you own.");
    }
  };

  const handleSharePlan = (plan) => {
    if (plan.isOwned) {
      setPlanToShare(plan);
      setShowShareModal(true);
    } else {
      alert("You can only share plans that you own.");
    }
  };

  const handleShareModalClose = () => {
    setShowShareModal(false);
    setPlanToShare(null);
  };

  const handlePlanUpdate = async () => {
    // Refresh the plans list after sharing updates
    const fetchPlans = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setSavedPlans([]);
        setSharedPlans([]);
        setLoading(false);
        return;
      }
      
      // Fetch owned plans
      const q = query(collection(db, "plans"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const plans = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isOwned: true
      }));
      setSavedPlans(plans);

      // Fetch shared plans
      const sharedQuery = query(
        collection(db, "plans"), 
        where("collaborators", "array-contains", user.email)
      );
      const sharedSnapshot = await getDocs(sharedQuery);
      const collaboratorPlans = sharedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isOwned: false,
        isShared: true
      }));
      setSharedPlans(collaboratorPlans);
      
      setLoading(false);
    };
    await fetchPlans();
  };

  // Delete from Firestore and update UI
  const confirmDelete = async () => {
    if (!planToDelete || !planToDelete.isOwned) {
      alert("You can only delete plans that you own.");
      return;
    }
    try {
      await deleteDoc(doc(db, "plans", planToDelete.id));
      setSavedPlans(savedPlans.filter(plan => plan.id !== planToDelete.id));
    } catch (err) {
      alert("Failed to delete plan from database.");
    }
    setShowDeleteModal(false);
    setPlanToDelete(null);
  };

  const handleExportPlan = (plan) => {
    setPlanToExport(plan);
    setShowExportModal(true);
  };

  const handleExportModalClose = () => {
    setShowExportModal(false);
    setPlanToExport(null);
  };

  // Toggle completed status
  const handleToggleCompleted = async (plan) => {
    if (!plan.isOwned) {
      alert("You can only modify plans that you own.");
      return;
    }
    
    const newStatus = plan.status === 'completed' ? 'active' : 'completed';
    try {
      await updateDoc(doc(db, "plans", plan.id), { status: newStatus, lastModified: new Date().toISOString() });
      setSavedPlans(savedPlans =>
        savedPlans.map(p =>
          p.id === plan.id ? { ...p, status: newStatus, lastModified: new Date().toISOString() } : p
        )
      );
    } catch (err) {
      alert("Failed to update plan status.");
    }
  };

  // FORMAT DATE
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // GET STATUS COLOR
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'var(--success-green)';
      case 'in-progress': return 'var(--primary-cyan)';
      case 'draft': return 'var(--warning-yellow)';
      default: return 'var(--text-secondary)';
    }
  };

  // RENDER COMPONENT
  return (
    <div className="saved-plans-page">
      {/* HEADER SECTION */}
      <div className="plans-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              onClick={() => navigate('/dashboard')}
              className="back-button"
            >
              ← Back to Dashboard
            </button>
            <div className="page-title">
              <h1>Saved Plans</h1>
              <p className="page-subtitle">Manage your plans and view collaborations ({savedPlans.length} owned, {sharedPlans.length} shared)</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => navigate('/plan-location')}
              className="create-plan-button"
            >
              + Create New Plan
            </button>
          </div>
        </div>
      </div>

      {/* FILTERS AND SEARCH */}
      <div className="filters-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search plans by name, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
        <div className="filter-controls">
          {/* Remove Filter by Type */}
          {/* <div className="filter-group">
            <label>Filter by Type:</label>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="urban">Urban</option>
              <option value="industrial">Industrial</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="educational">Educational</option>
              <option value="healthcare">Healthcare</option>
            </select>
          </div> */}
          
          <div className="filter-group">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="size">File Size</option>
            </select>
          </div>
          
          <div className="results-count">
            {sortedPlans.length} plan{sortedPlans.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* PLANS GRID */}
      <div className="plans-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your saved plans...</p>
          </div>
        ) : sortedPlans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No plans found</h3>
            <p>
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first digital twin plan to get started'
              }
            </p>
            <button 
              onClick={() => navigate('/plan-location')}
              className="empty-action-button"
            >
              Create New Plan
            </button>
          </div>
        ) : (
          <div className="plans-grid">
            {sortedPlans.map(plan => (
              <div key={plan.id} className="plan-card">
                <div className="plan-thumbnail">
                  <div className="thumbnail-placeholder">
                    <span className="thumbnail-icon">🏗️</span>
                  </div>
                  {/* Status is optional, fallback to 'draft' */}
                  <div className="plan-status" style={{ backgroundColor: getStatusColor(plan.status || 'draft') }}>
                    {(plan.status || 'draft').replace('-', ' ')}
                  </div>
                  {/* Add shared indicator */}
                  {plan.isShared && (
                    <div className="shared-indicator" title="Shared with you" style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(0, 255, 0, 0.9)',
                      color: '#000',
                      padding: '4px 6px',
                      borderRadius: '50%',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      zIndex: 10
                    }}>
                      👥
                    </div>
                  )}
                </div>
                
                <div className="plan-content">
                  <div className="plan-header">
                    <h3 className="plan-name">{plan.planName || plan.name || "Untitled Plan"}</h3>
                    {/* Add owner info for shared plans */}
                    {plan.isShared && (
                      <div className="plan-owner" style={{
                        fontSize: '0.75rem',
                        color: 'rgba(0, 255, 255, 0.6)',
                        fontStyle: 'italic',
                        marginTop: '4px'
                      }}>
                        by {plan.userEmail || 'Unknown'}
                      </div>
                    )}
                  </div>
                  {/* Remove description */}
                  {/* <p className="plan-description">{plan.description || "No description."}</p> */}
                  <div className="plan-tags">
                    {(Array.isArray(plan.tags) ? plan.tags : []).map((tag, index) => (
                      <span key={index} className="plan-tag">#{tag}</span>
                    ))}
                  </div>
                  <div className="plan-metadata">
                    <button
                      style={{
                        margin: '8px 0',
                        background: '#0ff',
                        color: '#181c24',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 16px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.95em',
                        boxShadow: '0 0 8px #0ff4',
                      }}
                      onClick={() => navigate(`/plan-quality-score/${plan.id}`)}
                    >
                      View Plan Quality Score
                    </button>
                    {/* Remove Size */}
                    {/* <div className="metadata-item">
                      <span className="metadata-label">Size:</span>
                      <span className="metadata-value">{plan.size || "N/A"}</span>
                    </div> */}
                    <div className="metadata-item">
                      <span className="metadata-label">Created:</span>
                      <span className="metadata-value">
                        {formatDate(plan.createdAt || plan.lastModified || "")}
                      </span>
                    </div>
                  </div>
                  {/* Completed Checkbox - Only for owned plans */}
                  {plan.isOwned && (
                    <div style={{ marginTop: 8 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={plan.status === 'completed'}
                          onChange={() => handleToggleCompleted(plan)}
                          style={{ accentColor: 'var(--success-green)' }}
                        />
                        Mark as Completed
                      </label>
                    </div>
                  )}
                </div>
                
                <div className="plan-actions">
                  <button 
                    onClick={() => handleViewEditPlan(plan)}
                    className="action-button primary"
                  >
                    {plan.isShared ? 'View & Collaborate' : 'View & Edit'}
                  </button>
                  {/* Only show Share button for owned plans */}
                  {plan.isOwned && (
                    <button 
                      onClick={() => handleSharePlan(plan)}
                      className="action-button secondary"
                    >
                      Share
                    </button>
                  )}
                  <div className="dropdown-menu" style={{ position: "relative" }}>
                    <button
                      className="dropdown-trigger"
                      onClick={e => {
                        e.stopPropagation();
                        setOpenDropdownId(openDropdownId === plan.id ? null : plan.id);
                      }}
                    >
                      ⋯
                    </button>
                    <div
                      className="dropdown-content"
                      style={{
                        opacity: openDropdownId === plan.id ? 1 : 0,
                        visibility: openDropdownId === plan.id ? "visible" : "hidden",
                        transform: openDropdownId === plan.id ? "translateY(0)" : "translateY(-8px)",
                        pointerEvents: openDropdownId === plan.id ? "auto" : "none"
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button onClick={() => handleExportPlan(plan)}>Export</button>
                      {/* Only show Delete option for owned plans */}
                      {plan.isOwned && (
                        <button
                          onClick={() => handleDeletePlan(plan)}
                          className="delete-action"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Plan</h3>
            <p>
              Are you sure you want to delete "{planToDelete?.name}"? 
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="modal-button secondary"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="modal-button danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && planToShare && (
        <ShareModal
          plan={planToShare}
          isOpen={showShareModal}
          onClose={handleShareModalClose}
          onUpdate={handlePlanUpdate}
        />
      )}

      {/* EXPORT MODAL */}
      {showExportModal && planToExport && (
        <ExportModal
          plan={planToExport}
          isOpen={showExportModal}
          onClose={handleExportModalClose}
        />
      )}
    </div>
  );
}

export default SavedPlans;


