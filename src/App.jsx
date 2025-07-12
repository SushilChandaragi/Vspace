import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LoginPage from './components/LoginPage.jsx';
import Dashboard from './components/Dashboard.jsx';
import PlanPage from './components/PlanPage_old.jsx';
import SavedPlans from './components/SavedPlans.jsx';
import Analytics from './components/Analytics.jsx';
import Databases from './components/Databases.jsx';
import PlanLocationSelect from "./components/PlanLocationSelect";
import SignUpPage from './components/SignUpPage';
import SessionWarning from './components/SessionWarning.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { sessionManager } from './utils/sessionManager';

// ProtectedRoute component
function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        sessionManager.initializeSession();
      } else {
        sessionManager.clearSession();
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: 'linear-gradient(120deg, #181c24 0%, #23272f 100%)',
        color: '#0ff',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <div className="app">
        <SessionWarning />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/plan-location"
              element={
              <ProtectedRoute>
                <PlanLocationSelect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plan"
            element={<PlanPage />}
          />
          <Route
            path="/saved-plans"
            element={
              <ProtectedRoute>
                <SavedPlans />
              </ProtectedRoute>
            }
          />
          <Route
            path="/databases"
            element={
              <ProtectedRoute>
                <Databases />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
    </ErrorBoundary>
  );
}

export default App;
