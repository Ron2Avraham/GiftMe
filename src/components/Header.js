import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';
import './Header.scss';
import abstractAvatar from '../assets/images/AbstractAvatar.png';

function Header() {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      setShowDropdown(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleImageError = () => {
    setImgError(true);
  };

  return (
    <header className="header">
      <Link to="/" className="logo">GiftMe</Link>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        {user && (
          <>
            <Link to="/gift-exchange">Gift Exchange</Link>
            <Link to="/calendar">Gift Calendar</Link>
          </>
        )}
      </div>
      
      {user ? (
        <div className="user-profile" onClick={() => setShowDropdown(!showDropdown)}>
          <img 
            src={!imgError && user.photoURL ? user.photoURL : abstractAvatar} 
            alt={user.displayName || 'User'} 
            className="user-profile-image"
            onError={handleImageError}
          />
          <span className="user-profile-name">{user.displayName}</span>
          {showDropdown && (
            <div className="profile-dropdown">
              <div className="user-info">
                <p className="user-name">{user.displayName}</p>
                <p className="user-email">{user.email}</p>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="auth-buttons">
          <button 
            className="login"
            onClick={() => setShowLoginModal(true)}
          >
            Sign In
          </button>
        </div>
      )}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </header>
  );
}

export default Header; 