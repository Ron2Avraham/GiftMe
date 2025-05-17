import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, setDoc, getDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import LoginModal from './LoginModal';
import GiftExchange from './GiftExchange';
import './LandingPage.scss';
import giftExchange from '../assets/images/GiftExchange.png';
import giftIcon from '../assets/images/Gift.png';
import abstractAvatar from '../assets/images/AbstractAvatar.png';

const DEFAULT_AVATAR = abstractAvatar;

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

        console.log('Current user:', currentUser.uid);
        console.log('Target user:', userId);

        // Don't connect if it's the same user
        if (currentUser.uid === userId) {
          console.log('Same user detected, redirecting to gift exchange');
          navigate('/gift-exchange');
          return;
        }

        // Get or create user documents
        const [currentUserDoc, targetUserDoc] = await Promise.all([
          getDoc(doc(db, 'users', currentUser.uid)),
          getDoc(doc(db, 'users', userId))
        ]);

        // Create current user document if it doesn't exist
        if (!currentUserDoc.exists()) {
          console.log('Creating current user document');
          await setDoc(doc(db, 'users', currentUser.uid), {
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            partnerId: null,
            lastConnectionUpdate: null,
            wishlist: []
          });
        }

        // Create target user document if it doesn't exist
        if (!targetUserDoc.exists()) {
          console.log('Creating target user document');
          await setDoc(doc(db, 'users', userId), {
            displayName: 'New User',
            email: null,
            photoURL: null,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            partnerId: null,
            lastConnectionUpdate: null,
            wishlist: []
          });
        }

        // Get updated user data
        const updatedTargetUserDoc = await getDoc(doc(db, 'users', userId));
        console.log('Target user data:', updatedTargetUserDoc.data());
        setUserData(updatedTargetUserDoc.data());

        // Check if connection already exists
        const connectionRef = doc(db, 'connections', `${currentUser.uid}_${userId}`);
        const connectionDoc = await getDoc(connectionRef);

        if (!connectionDoc.exists()) {
          console.log('Creating new connection');
          // Create a connection document in the connections collection
          const connectionData = {
            users: [currentUser.uid, userId],
            status: 'connected',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          };

          try {
            // Save the connection
            await setDoc(connectionRef, connectionData);
            console.log('Connection document created');

            // Update both users' documents with partner information
            await Promise.all([
              updateDoc(doc(db, 'users', currentUser.uid), {
                partnerId: userId,
                lastConnectionUpdate: new Date().toISOString()
              }),
              updateDoc(doc(db, 'users', userId), {
                partnerId: currentUser.uid,
                lastConnectionUpdate: new Date().toISOString()
              })
            ]);
            console.log('User documents updated');
          } catch (dbError) {
            console.error('Database error:', dbError);
            throw new Error(`Database error: ${dbError.message}`);
          }
        } else {
          console.log('Connection already exists');
        }

        // Redirect to gift exchange
        console.log('Redirecting to gift exchange');
        navigate('/gift-exchange');
      } catch (err) {
        console.error('Detailed error during connection:', err);
        setError(`Connection failed: ${err.message}. Please try again.`);
      } finally {
        setLoading(false);
      }
    };

    const loadConnections = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        console.log('Loading connections for user:', currentUser.uid);
        
        // Get all connections where the current user is involved
        const connectionsRef = collection(db, 'connections');
        const q = query(
          connectionsRef,
          where('users', 'array-contains', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        
        console.log('Found connections:', querySnapshot.docs.length);
        
        const friends = [];
        for (const connectionDoc of querySnapshot.docs) {
          const connectionData = connectionDoc.data();
          console.log('Connection data:', connectionData);
          
          // Find the partner's ID (the other user in the connection)
          const partnerId = connectionData.users.find(id => id !== currentUser.uid);
          console.log('Partner ID:', partnerId);
          
          if (partnerId) {
            const partnerDoc = await getDoc(doc(db, 'users', partnerId));
            if (partnerDoc.exists()) {
              const partnerData = partnerDoc.data();
              console.log('Partner data:', partnerData);
              
              friends.push({
                id: partnerId,
                ...partnerData,
                connectionStatus: connectionData.status,
                connectedAt: connectionData.createdAt
              });
            }
          }
        }

        console.log('Processed friends:', friends);
        setConnectedFriends(friends);

        // Get wishlists for each friend
        const wishlists = {};
        for (const friend of friends) {
          try {
            console.log('Loading wishlist for friend:', friend.id);
            const wishlistRef = collection(db, 'users', friend.id, 'wishlist');
            const wishlistQuery = query(wishlistRef);
            const wishlistSnapshot = await getDocs(wishlistQuery);
            console.log('Wishlist items found:', wishlistSnapshot.docs.length);
            
            wishlists[friend.id] = wishlistSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log('Processed wishlist items:', wishlists[friend.id]);
          } catch (wishlistError) {
            console.error('Error loading wishlist for friend:', friend.id, wishlistError);
            wishlists[friend.id] = [];
          }
        }
        console.log('All wishlists loaded:', wishlists);
        setFriendWishlists(wishlists);
      } catch (err) {
        console.error('Error loading connections:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      connectUsers();
    } else {
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

  const handleImageError = (e) => {
    e.target.onerror = null; // Prevent infinite loop
    e.target.src = DEFAULT_AVATAR;
  };

  if (loading) {
    return (
      <div className="landing-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="landing-page">
        <div className="error-container">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="back-button">
            Return to Home
          </button>
        </div>
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

          <div className="connections-status">
            <h3>Your Connections</h3>
            {connectedFriends.length > 0 ? (
              <div className="friends-list">
                {connectedFriends.map((friend) => (
                  <div key={friend.id} className="friend-card">
                    <div className="friend-header">
                      <img 
                        src={friend.photoURL || DEFAULT_AVATAR} 
                        alt={friend.displayName || 'Friend'} 
                        className="friend-avatar"
                        onError={handleImageError}
                      />
                      <div className="friend-info">
                        <h4>{friend.displayName || 'Your Spouse'}</h4>
                        <span className={`connection-status ${friend.connectionStatus}`}>
                          {friend.connectionStatus === 'pending' ? 'Pending Connection' : 'Connected'}
                        </span>
                        <span className="connected-date">
                          Connected on {new Date(friend.connectedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="friend-wishlist">
                      <h5>Their Wishlist</h5>
                      {friendWishlists[friend.id]?.length > 0 ? (
                        <ul>
                          {friendWishlists[friend.id].map((item) => (
                            <li key={item.id} className="wishlist-item">
                              {item.image && (
                                <img src={item.image} alt={item.name} className="item-image" />
                              )}
                              <div className="item-details">
                                <span className="item-name">{item.name}</span>
                                {item.price && (
                                  <span className="item-price">${item.price}</span>
                                )}
                              </div>
                              {item.link && (
                                <a 
                                  href={item.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="view-item-link"
                                >
                                  View Item
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="no-wishlist">No wishlist items yet</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-connections">
                <p>You haven't connected with anyone yet. Share your profile link to get started!</p>
              </div>
            )}
          </div>
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