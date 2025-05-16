import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import './LoginModal.scss';

function LoginModal({ isOpen, onClose }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Create or update user document in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(userRef, {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          partnerId: null,
          lastConnectionUpdate: null,
          wishlist: [] // Initialize empty wishlist
        });
        console.log('Created new user document for:', user.uid);
      } else {
        // Update existing user document
        await setDoc(userRef, {
          ...userDoc.data(),
          lastLogin: new Date().toISOString(),
          photoURL: user.photoURL // Update photo URL in case it changed
        }, { merge: true });
        console.log('Updated existing user document for:', user.uid);
      }

      onClose();
    } catch (err) {
      console.error('Error during login:', err);
      setError('Failed to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Welcome to GiftMe</h2>
        <p>Sign in to start your gift-giving journey</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          className="google-login-button" 
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>
      </div>
    </div>
  );
}

export default LoginModal; 