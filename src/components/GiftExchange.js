import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { searchProducts, getProductCategories } from '../api/products';
import { searchExperiences, getExperienceCategories } from '../api/experiences';
import './GiftExchange.scss';

function GiftExchange() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('my-wishlist');
  const [wishlist, setWishlist] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [connectedFriends, setConnectedFriends] = useState([]);
  const [friendWishlists, setFriendWishlists] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [giftType, setGiftType] = useState('products'); // 'products' or 'experiences'
  const [experienceCategories, setExperienceCategories] = useState([]);

  const formatPrice = (price) => {
    if (!price) return '';
    // Remove any non-numeric characters except decimal point
    const numPrice = parseFloat(price.replace(/[^0-9.-]+/g, ''));
    if (isNaN(numPrice)) return '';
    // Format with 2 decimal places and add dollar sign
    return `$${numPrice.toFixed(2)}`;
  };

  const getBudgetCategory = (price) => {
    const numPrice = parseFloat(price.replace(/[^0-9.-]+/g, ''));
    if (isNaN(numPrice)) return null;
    
    if (numPrice < 50) return 'budget';
    if (numPrice <= 150) return 'moderate';
    if (numPrice <= 500) return 'premium';
    return 'luxury';
  };

  const giftCategories = giftType === 'products' ? getProductCategories() : getExperienceCategories();

  const budgetCategories = [
    { id: 'budget', label: 'Budget-Friendly', range: 'Under $50', icon: '💰' },
    { id: 'moderate', label: 'Moderate', range: '$50 - $150', icon: '🎁' },
    { id: 'premium', label: 'Premium', range: '$150 - $500', icon: '✨' },
    { id: 'luxury', label: 'Luxury', range: 'Over $500', icon: '💎' }
  ];

  useEffect(() => {
    const loadExperienceCategories = async () => {
      const categories = await getExperienceCategories();
      setExperienceCategories(categories);
    };
    loadExperienceCategories();
  }, []);

  useEffect(() => {
    searchGifts('', 'all');
  }, [giftType]);

  useEffect(() => {
    console.log('Current gift type:', giftType);
    console.log('Current search results:', searchResults);
  }, [giftType, searchResults]);

  const searchGifts = async (query, category) => {
    console.log('Searching gifts with query:', query, 'category:', category, 'type:', giftType);
    setIsSearching(true);
    try {
      let results = [];
      
      if (giftType === 'products') {
        results = await searchProducts(query, category);
        console.log('Product search results:', results);
      } else {
        results = await searchExperiences(query, category);
        console.log('Experience search results:', results);
      }

      // Filter results based on selected budget
      if (selectedBudget) {
        const budgetRange = budgetCategories.find(cat => cat.id === selectedBudget);
        if (budgetRange) {
          results = results.filter(item => {
            const price = parseFloat(item.price);
            if (selectedBudget === 'budget') return price < 50;
            if (selectedBudget === 'moderate') return price >= 50 && price <= 150;
            if (selectedBudget === 'premium') return price > 150 && price <= 500;
            if (selectedBudget === 'luxury') return price > 500;
            return true;
          });
        }
      }

      console.log('Final filtered results:', results);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const loadWishlist = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate('/');
        return;
      }

      try {
        const wishlistRef = collection(db, 'users', currentUser.uid, 'wishlist');
        const snapshot = await getDocs(wishlistRef);
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setWishlist(items);
      } catch (error) {
        console.error('Error loading wishlist:', error);
      }
    };

    const loadConnections = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
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

    loadWishlist();
    loadConnections();
  }, [navigate]);

  useEffect(() => {
    searchGifts(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const handleDeleteItem = async (itemId) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'wishlist', itemId));
      setWishlist(wishlist.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleEditItem = async (itemId, updatedData) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      await updateDoc(doc(db, 'users', currentUser.uid, 'wishlist', itemId), updatedData);
      setWishlist(wishlist.map(item => 
        item.id === itemId ? { ...item, ...updatedData } : item
      ));
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleAddToWishlist = async (item) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const wishlistRef = collection(db, 'users', currentUser.uid, 'wishlist');
      const docRef = await addDoc(wishlistRef, {
        name: item.name,
        price: `$${item.price.toFixed(2)}`,
        description: item.description,
        image: item.image,
        category: item.category,
        budgetCategory: selectedBudget,
        createdAt: new Date().toISOString()
      });

      setWishlist([...wishlist, { 
        id: docRef.id, 
        ...item,
        price: `$${item.price.toFixed(2)}`,
        budgetCategory: selectedBudget 
      }]);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  return (
    <div className="gift-exchange">
      <div className="exchange-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'my-wishlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-wishlist')}
          >
            My Wishlist
          </button>
          <button 
            className={`tab ${activeTab === 'spouse-wishlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('spouse-wishlist')}
          >
            Spouse's Wishlist
          </button>
        </div>

        {activeTab === 'my-wishlist' ? (
          <div className="wishlist-section">
            <h2>My Gift Wishlist</h2>
            <p className="section-description">
              Discover and add gifts you would love to receive from your spouse. Make it special and meaningful!
            </p>
            
            <div className="gift-type-selector">
              <button
                className={`gift-type-btn ${giftType === 'products' ? 'active' : ''}`}
                onClick={() => setGiftType('products')}
              >
                🎁 Products
              </button>
              <button
                className={`gift-type-btn ${giftType === 'experiences' ? 'active' : ''}`}
                onClick={() => setGiftType('experiences')}
              >
                ✨ Experiences
              </button>
            </div>
            
            <div className="budget-categories">
              <h2>Select a Budget Range</h2>
              <div className="category-grid">
                {budgetCategories.map((category) => (
                  <div
                    key={category.id}
                    className={`category-card ${selectedBudget === category.id ? 'selected' : ''}`}
                    onClick={() => setSelectedBudget(category.id)}
                  >
                    <div className="category-icon">{category.icon}</div>
                    <h3>{category.label}</h3>
                    <p className="budget-range">{category.range}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="gift-search-section">
              <div className="search-container">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search for ${giftType}...`}
                  className="search-input"
                />
                {isSearching && <div className="search-spinner"></div>}
              </div>

              <div className="category-filters">
                {(giftType === 'products' ? giftCategories : experienceCategories).map(category => (
                  <button
                    key={category.id}
                    className={`category-filter ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <span className="category-icon">{category.icon}</span>
                    <span className="category-label">{category.label}</span>
                  </button>
                ))}
              </div>

              {searchResults.length > 0 ? (
                <div className="search-results">
                  {searchResults.map(item => (
                    <div key={item.id} className="gift-card">
                      <img src={item.image} alt={item.name} className="gift-image" />
                      <div className="gift-details">
                        <h3>{item.name}</h3>
                        <p className="price">
                          {giftType === 'products' 
                            ? `$${item.price.toFixed(2)}`
                            : item.price}
                        </p>
                        <p className="description">{item.description}</p>
                        {giftType === 'products' && (
                          <>
                            <p className="shop">Shop: {item.shop}</p>
                            {item.materials && item.materials.length > 0 && (
                              <p className="materials">Materials: {item.materials.join(', ')}</p>
                            )}
                            {item.shipping && (
                              <p className="shipping">Shipping: ${item.shipping.price.toFixed(2)}</p>
                            )}
                          </>
                        )}
                        {giftType === 'experiences' && (
                          <>
                            <p className="duration">Duration: {item.duration}</p>
                            <p className="location">Location: {item.location}</p>
                            {item.rating > 0 && (
                              <p className="rating">
                                Rating: {item.rating} ({item.reviewCount} reviews)
                              </p>
                            )}
                            {item.highlights && item.highlights.length > 0 && (
                              <p className="highlights">Highlights: {item.highlights.join(', ')}</p>
                            )}
                          </>
                        )}
                        <button
                          className="add-to-wishlist-btn"
                          onClick={() => handleAddToWishlist(item)}
                          disabled={!selectedBudget}
                        >
                          Add to Wishlist
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  <p>No {giftType} found. Try a different search or category.</p>
                </div>
              )}
            </div>

            <div className="wishlist-items">
              {wishlist.map((item) => (
                <div key={item.id} className="wishlist-item">
                  {item.image && <img src={item.image} alt={item.name} className="item-image" />}
                  <h4>{item.name}</h4>
                  {item.price && <p className="price">Price: {item.price}</p>}
                  {item.budgetCategory && (
                    <p className="budget-category">
                      {budgetCategories.find(cat => cat.id === item.budgetCategory)?.label} 
                      <span className="budget-range">
                        ({budgetCategories.find(cat => cat.id === item.budgetCategory)?.range})
                      </span>
                    </p>
                  )}
                  {item.description && <p>{item.description}</p>}
                  {item.duration && <p className="duration">Duration: {item.duration}</p>}
                  {item.location && <p className="location">Location: {item.location}</p>}
                  {item.rating && (
                    <p className="rating">
                      Rating: {item.rating} ({item.reviewCount} reviews)
                    </p>
                  )}
                  <div className="item-actions">
                    <button className="delete" onClick={() => handleDeleteItem(item.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="friends-section">
            <h2>Your Spouse's Wishlist</h2>
            <p className="section-description">
              See what your spouse would love to receive. Make their dreams come true!
            </p>
            
            {connectedFriends.length === 0 ? (
              <div className="no-connection">
                <p>You haven't connected with your spouse yet.</p>
                <p className="hint">Share your profile link with them to start your gift-giving journey together!</p>
              </div>
            ) : (
              <div className="friends-list">
                {connectedFriends.map(friend => (
                  <div key={friend.id} className="friend-card">
                    <h3>{friend.displayName || 'Your Spouse'}</h3>
                    <div className="friend-wishlist">
                      <h4>Their Wishlist</h4>
                      <ul>
                        {friendWishlists[friend.id]?.map(item => (
                          <li key={item.id}>
                            {item.name}
                            {item.link && (
                              <a 
                                href={item.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="product-link"
                              >
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GiftExchange; 