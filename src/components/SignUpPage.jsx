import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import './LoginPage.css';

// Vanta Globe imports
import * as THREE from 'three';
import GLOBE from 'vanta/dist/vanta.globe.min';

function SignUpPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  // Vanta background effect (same as LoginPage)
  useEffect(() => {
    if (!vantaEffect.current) {
      vantaEffect.current = GLOBE({
        el: vantaRef.current,
        THREE: THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 100.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0x75b4b8,
        size: 1.40,
        backgroundColor: 0x10101f
      });
      setTimeout(() => {
        if (vantaEffect.current && vantaEffect.current.scene) {
          vantaEffect.current.scene.traverse((child) => {
            if (child.isMesh) {
              child.rotation.y = Math.PI;
              child.scale.x = -1;
            }
          });
        }
      }, 100);
    }
    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  const passwordValid = (pw) =>
    pw.length >= 8 &&
    /[a-z]/.test(pw) &&
    /[A-Z]/.test(pw) &&
    /\d/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw);

  const handleSignUp = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    if (!passwordValid(password)) {
      setError(
        'Password must be at least 8 characters and include a digit, a-z, A-Z, and a special character'
      );
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Signup failed');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSignUp();
  };

  return (
    <div className="login-page">
      {/* VANTA GLOBE BACKGROUND */}
      <div ref={vantaRef} className="vanta-background"></div>
      {/* APP TITLE - Top left corner with glowing cyan effect */}
      <div className="login-heading">VSpace-A vilagge planner</div>
      <div className="login-container">
        <h2 className="login-title">Sign Up</h2>
        <div className="login-input-block">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="login-input"
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>
        <div className="login-input-block">
          <div className="password-container">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="login-input password-input"
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="eye-button"
              tabIndex={-1}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        {error && <div className="login-error">{error}</div>}
        <button
          onClick={handleSignUp}
          className="login-button"
          disabled={loading}
        >
          {loading ? <span className="login-spinner"></span> : 'Sign Up'}
        </button>
        <div style={{ marginTop: 16, color: "#fff" }}>
          Already have an account?{' '}
          <button
            type="button"
            className="link-button"
            onClick={() => navigate('/login')}
            style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;