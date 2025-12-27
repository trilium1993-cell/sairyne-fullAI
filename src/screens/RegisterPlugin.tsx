import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import '../styles/RegisterPlugin.css';
import { safeSetItem } from '../utils/storage';
import { AnalyticsService } from '../services/analyticsService';

export const RegisterPlugin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Register handler called', { email, password, confirmPassword });
    setError('');

    // Validate
    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      console.log('Validation failed - missing fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const rawBases = [
        API_URL,
        'http://127.0.0.1:3001',
        'http://localhost:3001',
        'http://127.0.0.1:8000',
        'http://localhost:8000',
        'https://sairyne-fullai-5.onrender.com',
      ];

      const locationProtocol = typeof window !== 'undefined' ? window.location.protocol : 'n/a';
      const candidateBases = Array.from(
        new Set(
          rawBases.filter((b) => {
            if (b === '' || b == null) return true;
            if (locationProtocol === 'https:' && b.startsWith('http://')) return false;
            return true;
          })
        )
      );

      const requestBody = JSON.stringify({ email: email.trim(), password });

      let response: Response | null = null;
      let lastError: any = null;

      for (const base of candidateBases) {
        try {
          const url = base ? `${base}/api/auth/simple-register` : '/api/auth/simple-register';
          response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody,
          });
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!response) {
        setError(`Network error. Unable to reach register server. ${lastError?.message ?? ''}`);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      setSuccess(true);
      AnalyticsService.track('RegisterSuccess', { email: email.trim().toLowerCase() });
      // Prefill email on SignIn and return to plugin main flow
      try {
        safeSetItem('sairyne_signin_draft_email', email.trim());
      } catch {}

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-plugin-container">
      <div className="register-plugin-card">
        <h1>Create Your Account</h1>
        <p className="subtitle">Register for Sairyne Plugin Access</p>

        {success ? (
          <div className="success-message">
            <h2>✅ Registration Successful!</h2>
            <p>Your account has been created. Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="register-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  console.log('Email changed:', e.target.value);
                  setEmail(e.target.value);
                }}
                placeholder="your@email.com"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                disabled={loading}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="finish-button" 
              disabled={loading}
              onClick={(e) => {
                console.log('Register button clicked');
                if (e.target instanceof HTMLButtonElement) {
                  e.target.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                }
              }}
            >
              {loading ? 'Creating Account...' : 'Finish Registration'}
            </button>
          </form>
        )}

        <div className="info-text">
          <p>Already have an account?{' '}
            <a href="/login-plugin">Sign in here</a>
          </p>
        </div>
      </div>
    </div>
  );
};

