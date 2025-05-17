import React, { useState, useEffect } from 'react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.mobile-menu') && !event.target.closest('.mobile-menu-btn')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      setShowDropdown(false);
      setIsMobileMenuOpen(false);
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
      <div className="header-content">
        <Link to="/" className="logo">GiftMe</Link>
        
        {/* Mobile Menu Button */}
        <button 
          className={`mobile-menu-btn ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Desktop Navigation */}
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
        
        {/* Mobile Menu */}
        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
          <Link to="/about" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
          {user && (
            <>
              <Link to="/gift-exchange" onClick={() => setIsMobileMenuOpen(false)}>Gift Exchange</Link>
              <Link to="/calendar" onClick={() => setIsMobileMenuOpen(false)}>Gift Calendar</Link>
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
      </div>
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </header>
  );
}

export default Header; 