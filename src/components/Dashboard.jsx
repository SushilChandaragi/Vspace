import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

function Dashboard() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    totalPlans: 0,
    activePlans: 0,
    completedPlans: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  // Update time every second for live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch recent activity from Firestore
  const fetchRecentActivity = async () => {
    const user = auth.currentUser;
    if (!user) {
      setRecentActivity([]);
      return;
    }
    let activities = [];
    try {
      const q = query(
        collection(db, "plans"),
        where("userId", "==", user.uid),
        orderBy("lastModified", "desc"),
        limit(4)
      );
      const snapshot = await getDocs(q);
      console.log("Fetched plans:", snapshot.docs.map(d => d.data())); // <-- Add this line
      activities = snapshot.docs.map(doc => {
        const data = doc.data();
        let action = "Created";
        let icon = "🆕";
        if (data.lastModified && data.createdAt && data.lastModified !== data.createdAt) {
          action = "Modified";
          icon = "✏️";
        }
        const timeString = data.lastModified || data.createdAt;
        return {
          id: doc.id,
          action,
          item: data.planName || data.name || "Untitled Plan",
          time: timeAgo(timeString),
          icon
        };
      });
    } catch (e) {
      // Fallback to createdAt if lastModified is missing in some docs
      const q = query(
        collection(db, "plans"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(4)
      );
      const snapshot = await getDocs(q);
      activities = snapshot.docs.map(doc => {
        const data = doc.data();
        let action = "Created";
        let icon = "🆕";
        const timeString = data.createdAt;
        return {
          id: doc.id,
          action,
          item: data.planName || data.name || "Untitled Plan",
          time: timeAgo(timeString),
          icon
        };
      });
    }
    setRecentActivity(activities);
  };

  // Fetch plans for stats
  const fetchStats = async () => {
    const user = auth.currentUser;
    if (!user) {
      setStats({ totalPlans: 0, activePlans: 0, completedPlans: 0 });
      return;
    }
    const q = query(
      collection(db, "plans"),
      where("userId", "==", user.uid)
    );
    const snapshot = await getDocs(q);
    const plans = snapshot.docs.map(doc => doc.data());
    const totalPlans = plans.length;
    const completedPlans = plans.filter(p => p.status === 'completed').length;
    const activePlans = totalPlans - completedPlans;
    setStats({ totalPlans, activePlans, completedPlans });
  };

  useEffect(() => {
    fetchRecentActivity();
    fetchStats();
    // Refetch when tab/window regains focus
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchRecentActivity();
        fetchStats();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Helper: time ago string
  function timeAgo(dateString) {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  const quickActions = [
    {
      icon: '🏗️',
      title: 'New Plan',
      description: 'Create a new digital twin plan',
      action: () => navigate('/plan-location'),
      color: 'primary'
    },
    {
      icon: '💾',
      title: 'Saved Plans',
      description: 'View and manage your saved plans',
      action: () => navigate('/saved-plans'),
      color: 'secondary'
    },
    {
      icon: '🗄️',
      title: 'Your Databases',
      description: 'Manage your databases and resources',
      action: () => navigate('/databases'),
      color: 'database'
    },
    {
      icon: '📊',
      title: 'Analytics',
      description: 'View detailed analytics and reports',
      action: () => navigate('/analytics'),
      color: 'tertiary'
    },
  ];

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="dashboard-page">
      {/* Header Section */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1 className="dashboard-title">Digital Twin Command Center</h1>
            <p className="welcome-message">Welcome back, Architect</p>
          </div>
          <div className="header-info">
            <div className="live-clock">
              <div className="time">{formatTime(currentTime)}</div>
              <div className="date">{formatDate(currentTime)}</div>
            </div>
            <button className="logout-button" onClick={() => navigate('/')}>
              <span className="logout-icon">🚪</span>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="dashboard-main">
        {/* Statistics Cards */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalPlans}</div>
                <div className="stat-label">Total Plans</div>
              </div>
            </div>
            <div className="stat-card secondary">
              <div className="stat-icon">🚀</div>
              <div className="stat-content">
                <div className="stat-number">{stats.activePlans}</div>
                <div className="stat-label">Active Plans</div>
              </div>
            </div>
            <div className="stat-card tertiary">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-number">{stats.completedPlans}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="actions-grid">
            {quickActions.map((action, index) => (
              <div key={index} className={`action-card ${action.color}`} onClick={action.action}>
                <div className="action-icon">{action.icon}</div>
                <div className="action-content">
                  <h3 className="action-title">{action.title}</h3>
                  <p className="action-description">{action.description}</p>
                </div>
                <div className="action-arrow">→</div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="activity-section">
          <h2 className="section-title">Recent Activity</h2>
          <div className="activity-list">
            {recentActivity.length === 0 ? (
              <div className="activity-item">
                <div className="activity-content">
                  <div className="activity-main">
                    <span className="activity-action">No recent activity found.</span>
                  </div>
                </div>
              </div>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={activity.id || index} className="activity-item">
                  <div className="activity-icon">{activity.icon}</div>
                  <div className="activity-content">
                    <div className="activity-main">
                      <span className="activity-action">{activity.action}</span>
                      <span className="activity-item-name">"{activity.item}"</span>
                    </div>
                    <div className="activity-time">{activity.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;