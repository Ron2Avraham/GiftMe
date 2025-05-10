import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './LoginModal.scss';

function LoginModal({ isOpen, onClose }) {
  const { signInWithGoogle, signInWithFacebook } = useAuth();

  const handleLogin = async (provider) => {
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else if (provider === 'facebook') {
        await signInWithFacebook();
      }
      onClose();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="auth-form">
          <h2>Welcome to GiftMe</h2>
          <p>Sign in to continue</p>
          <div className="social-login">
            <button 
              className="social-login-button"
              onClick={() => handleLogin('google')}
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" />
              Continue with Google
            </button>
            <button 
              className="social-login-button"
              onClick={() => handleLogin('facebook')}
            >
              <img src="https://www.facebook.com/favicon.ico" alt="Facebook" />
              Continue with Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginModal; 