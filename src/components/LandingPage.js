import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, setDoc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import LoginModal from './LoginModal';
import GiftExchange from './GiftExchange';
import './LandingPage.scss';
import giftExchange from '../assets/images/GiftExchange.png';
import giftIcon from '../assets/images/Gift.png';

function LandingPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showGiftExchange, setShowGiftExchange] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [connectedFriends, setConnectedFriends] = useState([]);
  const [friendWishlists, setFriendWishlists] = useState({});

  useEffect(() => {
    const connectUsers = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setShowLoginModal(true);
          setLoading(false);
          return;
        }

        // Don't connect if it's the same user
        if (currentUser.uid === userId) {
          navigate('/gift-exchange');
          return;
        }

        // Get user data first
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
          setError('User not found');
          setLoading(false);
          return;
        }
        setUserData(userDoc.data());

        // Check if connection already exists
        const connectionsRef = collection(db, 'userConnections');
        const q = query(
          connectionsRef,
          where('users', 'array-contains', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const existingConnection = querySnapshot.docs.find(doc => {
          const data = doc.data();
          return data.users.includes(userId);
        });

        if (!existingConnection) {
          // Create new connection in the current user's subcollection
          const userConnectionsRef = collection(db, 'users', currentUser.uid, 'connections');
          await setDoc(doc(userConnectionsRef, userId), {
            connectedAt: new Date().toISOString(),
            status: 'pending'
          });

          // Create connection in the other user's subcollection
          const otherUserConnectionsRef = collection(db, 'users', userId, 'connections');
          await setDoc(doc(otherUserConnectionsRef, currentUser.uid), {
            connectedAt: new Date().toISOString(),
            status: 'pending'
          });
        }

        // Redirect to gift exchange
        navigate('/gift-exchange');
      } catch (err) {
        console.error('Error connecting users:', err);
        setError('Failed to connect with user. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const loadConnections = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        // Get user's connections
        const connectionsRef = collection(db, 'users', currentUser.uid, 'connections');
        const querySnapshot = await getDocs(connectionsRef);
        const friends = [];

        for (const doc of querySnapshot.docs) {
          const friendId = doc.id;
          const friendData = await getDoc(doc(db, 'users', friendId));
          if (friendData.exists()) {
            friends.push({
              id: friendId,
              ...friendData.data()
            });
          }
        }

        setConnectedFriends(friends);

        // Get wishlists for each friend
        const wishlists = {};
        for (const friend of friends) {
          const wishlistRef = collection(db, 'users', friend.id, 'wishlist');
          const wishlistSnapshot = await getDocs(wishlistRef);
          wishlists[friend.id] = wishlistSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        }
        setFriendWishlists(wishlists);
      } catch (err) {
        console.error('Error loading connections:', err);
      }
    };

    if (userId) {
      connectUsers();
    } else {
      setLoading(false);
      loadConnections();
    }
  }, [userId, navigate]);

  const handleGetStarted = () => {
    if (auth.currentUser) {
      navigate('/gift-exchange');
    } else {
      setShowLoginModal(true);
    }
  };

  const handleCopyLink = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const link = `${window.location.origin}/user/${currentUser.uid}`;
      try {
        await navigator.clipboard.writeText(link);
        setShareLink(link);
        // Clear the message after 3 seconds
        setTimeout(() => {
          setShareLink('');
        }, 3000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="landing-page">
        <div className="loading">Connecting...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="landing-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (showGiftExchange) {
    return <GiftExchange />;
  }

  return (
    <div className="landing-page">
      <div className="hero">
        <div className="hero-content">
          <div className="title-container">
            <img src={giftIcon} alt="Gift" className="floating-gift-icon" />
            <h1>GiftMe</h1>
            <div className="tagline">Where Love Meets Gift-Giving</div>
          </div>
          <p className="hero-subtitle">
            Create a special connection with your spouse through thoughtful gift-giving. 
            Share your wishes, discover theirs, and make every gift a moment of love.
          </p>
          {!auth.currentUser ? (
            <button onClick={handleGetStarted} className="cta-button">
              Start Your Journey
            </button>
          ) : (
            <button onClick={() => navigate('/gift-exchange')} className="cta-button">
              View Your Wishlist
            </button>
          )}
        </div>
        <div className="hero-image">
          <img src={giftExchange} alt="Couple exchanging gifts" />
        </div>
      </div>

      {auth.currentUser && (
        <div className="connect-section">
          <h2>Connect Your Hearts</h2>
          <p className="connect-description">
            Share your profile with your spouse to start your gift-giving journey together. 
            Create a special bond through thoughtful surprises and meaningful gifts.
          </p>
          <div className="share-link">
            <button onClick={handleCopyLink} className="share-button">
              Share Your Profile
            </button>
            {shareLink && (
              <div className="link-copied">
                <span className="heart-icon">❤️</span> Link copied! Share this with your spouse to begin your journey together.
              </div>
            )}
          </div>
          {connectedFriends.length > 0 && (
            <div className="connected-friends">
              <h3>Your Spouse's Wishlist</h3>
              <div className="friends-list">
                {connectedFriends.map((friend) => (
                  <div key={friend.id} className="friend-card">
                    <h4>{friend.displayName || 'Your Spouse'}</h4>
                    <div className="friend-wishlist">
                      <h5>Their Wishlist</h5>
                      <ul>
                        {friend.wishlist?.map((item, index) => (
                          <li key={index}>
                            {item.name}
                            {item.link && (
                              <a href={item.link} target="_blank" rel="noopener noreferrer" className="product-link">
                                View Item
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  );
}

export default LandingPage; 