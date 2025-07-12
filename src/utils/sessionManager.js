// src/utils/sessionManager.js
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
const LAST_ACTIVITY_KEY = 'lastActivity';

class SessionManager {
  constructor() {
    this.activityTimeout = null;
    this.checkSessionOnLoad();
    this.setupActivityListeners();
  }

  // Check if session has expired on page load
  checkSessionOnLoad() {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (lastActivity) {
      const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
      if (timeSinceLastActivity > SESSION_TIMEOUT) {
        this.expireSession();
      } else {
        this.updateLastActivity();
        this.startSessionTimer();
      }
    }
  }

  // Update last activity timestamp
  updateLastActivity() {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  }

  // Start the session timer
  startSessionTimer() {
    this.clearSessionTimer();
    this.activityTimeout = setTimeout(() => {
      this.expireSession();
    }, SESSION_TIMEOUT);
  }

  // Clear the session timer
  clearSessionTimer() {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
      this.activityTimeout = null;
    }
  }

  // Expire the session and log out user
  async expireSession() {
    try {
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      await signOut(auth);
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during session expiration:', error);
    }
  }

  // Reset the session timer on user activity
  resetSessionTimer() {
    this.updateLastActivity();
    this.startSessionTimer();
  }

  // Setup activity listeners
  setupActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        if (auth.currentUser) {
          this.resetSessionTimer();
        }
      }, { passive: true });
    });
  }

  // Initialize session when user logs in
  initializeSession() {
    this.updateLastActivity();
    this.startSessionTimer();
  }

  // Clear session when user logs out
  clearSession() {
    this.clearSessionTimer();
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  }
}

export const sessionManager = new SessionManager();
