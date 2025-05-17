import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { searchProducts, getProductCategories } from '../api/products';
import { searchExperiences, getExperienceCategories } from '../api/experiences';
import { getEbayToken, searchEbayItems } from '../api/ebay';
import { sanitizeInput, sanitizeUrl } from '../utils/security';
import TrendingGifts from './TrendingGifts';
import SeasonalGuides from './SeasonalGuides';
import ProductImageGallery from './ProductImageGallery';
import WishlistPrivacy from './WishlistPrivacy';
import GiftCalendar from './GiftCalendar';
import Wishlist from './Wishlist';
import { showNotification } from '../utils/notifications';
import './GiftExchange.scss';

function GiftExchange() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('wishlist');
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
  const [allResults, setAllResults] = useState([]); // Store all results from API
  const [wishlistPrivacy, setWishlistPrivacy] = useState('public');

  const budgetCategories = [
    { id: 'budget', label: 'Budget-Friendly', range: 'Under $50', icon: '💰' },
    { id: 'moderate', label: 'Moderate', range: '$50 - $150', icon: '🎁' },
    { id: 'premium', label: 'Premium', range: '$150 - $500', icon: '✨' },
    { id: 'luxury', label: 'Luxury', range: 'Over $500', icon: '💎' }
  ];

  // Initial search
  useEffect(() => {
    searchGifts('gift', 'all');
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback((query, category) => {
    const timeoutId = setTimeout(() => {
      searchGifts(query, category);
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, []);

  // Handle search query changes with debouncing
  useEffect(() => {
    if (searchQuery !== undefined) {
      debouncedSearch(searchQuery, selectedCategory);
    }
  }, [searchQuery, selectedCategory, debouncedSearch]);

  const searchGifts = async (query, category, budgetOverride = null) => {
    console.log('Starting search, setting isSearching to true');
    setIsSearching(true);
    try {
      let results = [];
      
      if (giftType === 'products') {
        console.log('Searching for products...');
        const token = await getEbayToken();
        const searchQuery = query.trim() || 'gift';

        // Use the budgetOverride if provided, otherwise use selectedBudget
        const currentBudget = budgetOverride !== null ? budgetOverride : selectedBudget;

        // Set strict price ranges based on budget
        let minPrice, maxPrice;
        switch (currentBudget) {
          case 'budget':
            minPrice = 0;
            maxPrice = 49.99;
            break;
          case 'moderate':
            minPrice = 50;
            maxPrice = 149.99;
            break;
          case 'premium':
            minPrice = 150;
            maxPrice = 499.99;
            break;
          case 'luxury':
            minPrice = 500;
            maxPrice = 1000;
            break;
          default:
            // When no budget is selected, don't apply price filtering
            minPrice = 0;
            maxPrice = 1000;
        }

        const searchOptions = {
          limit: 20,
          sort: 'bestMatch',
          filter: currentBudget ? `buyingOptions:{buyItNow},conditions:{NEW|USED},price:[${minPrice}..${maxPrice}]` : 'buyingOptions:{buyItNow},conditions:{NEW|USED}'
        };

        console.log('Calling eBay API with options:', searchOptions);
        const ebayResults = await searchEbayItems(searchQuery, token, searchOptions);
        console.log('Received eBay results:', ebayResults?.length || 0, 'items');
        
        if (ebayResults && ebayResults.length > 0) {
          results = ebayResults
            .filter(item => {
              const price = parseFloat(item.price?.value || 0);
              
              // Only apply strict price filtering if a budget is selected
              if (currentBudget) {
                if (currentBudget === 'budget' && price >= 50) return false;
                if (currentBudget === 'moderate' && (price < 50 || price >= 150)) return false;
                if (currentBudget === 'premium' && (price < 150 || price >= 500)) return false;
                if (currentBudget === 'luxury' && price < 500) return false;
              }

              return true;
            })
            .map(item => ({
              id: item.itemId,
              name: item.title,
              price: item.price?.value || '0',
              description: item.shortDescription || item.title,
              images: [
                item.image?.imageUrl,
                ...(item.additionalImages || []).map(img => img.imageUrl)
              ].filter(Boolean),
              shop: 'eBay',
              category: category,
              link: item.itemWebUrl
            }));
        }
      } else {
        console.log('Searching for experiences...');
        results = await searchExperiences(query, category);
      }

      console.log('Setting results:', results.length, 'items');
      setAllResults(results);
      setSearchResults(results);
      console.log('Search complete, setting isSearching to false');
      setIsSearching(false);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  // Update category selection
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    searchGifts(searchQuery, categoryId);
  };

  // Update budget selection
  const handleBudgetChange = (budgetId) => {
    const newBudget = selectedBudget === budgetId ? null : budgetId;
    setSelectedBudget(newBudget);
    searchGifts(searchQuery, selectedCategory, newBudget);
  };

  // Update gift type
  const handleGiftTypeChange = (type) => {
    setGiftType(type);
    searchGifts(searchQuery, selectedCategory);
  };

  useEffect(() => {
    const loadExperienceCategories = async () => {
      const categories = await getExperienceCategories();
      setExperienceCategories(categories);
    };
    loadExperienceCategories();
  }, []);

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
        // Get all connections where the current user is involved
        const connectionsRef = collection(db, 'connections');
        const q = query(
          connectionsRef,
          where('users', 'array-contains', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        
        const friends = [];
        for (const connectionDoc of querySnapshot.docs) {
          const connectionData = connectionDoc.data();
          
          // Find the partner's ID (the other user in the connection)
          const partnerId = connectionData.users.find(id => id !== currentUser.uid);
          
          if (partnerId) {
            const partnerDoc = await getDoc(doc(db, 'users', partnerId));
            if (partnerDoc.exists()) {
              const partnerData = partnerDoc.data();
              friends.push({
                id: partnerId,
                ...partnerData,
                connectionStatus: connectionData.status,
                connectedAt: connectionData.createdAt
              });
            }
          }
        }

        setConnectedFriends(friends);

        // Get wishlists for each friend
        const wishlists = {};
        for (const friend of friends) {
          try {
            const wishlistRef = collection(db, 'users', friend.id, 'wishlist');
            const wishlistQuery = query(wishlistRef);
            const wishlistSnapshot = await getDocs(wishlistQuery);
            
            wishlists[friend.id] = wishlistSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          } catch (wishlistError) {
            console.error('Error loading wishlist for friend:', friend.id, wishlistError);
            wishlists[friend.id] = [];
          }
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
      const itemToDelete = wishlist.find(item => item.id === itemId);
      await deleteDoc(doc(db, 'users', currentUser.uid, 'wishlist', itemId));
      setWishlist(wishlist.filter(item => item.id !== itemId));
      showNotification(`Removed "${itemToDelete.name}" from your wishlist`, 'info');
    } catch (error) {
      console.error('Error deleting item:', error);
      showNotification('Failed to delete item: ' + error.message, 'error');
    }
  };

  const handleEditItem = async (itemId, updatedData) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const sanitizedData = {
        ...updatedData,
        name: sanitizeInput(updatedData.name),
        description: sanitizeInput(updatedData.description || ''),
        image: sanitizeUrl(updatedData.image || ''),
        category: sanitizeInput(updatedData.category || 'uncategorized')
      };

      await updateDoc(doc(db, 'users', currentUser.uid, 'wishlist', itemId), sanitizedData);
      setWishlist(wishlist.map(item => 
        item.id === itemId ? { ...item, ...sanitizedData } : item
      ));
      setEditingItem(null);
      showNotification(`Updated "${updatedData.name}" successfully`, 'success');
    } catch (error) {
      console.error('Error updating item:', error);
      showNotification('Failed to update item: ' + error.message, 'error');
    }
  };

  const handleAddToWishlist = async (item) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      // Validate and sanitize required fields
      if (!item.name || !item.price) {
        throw new Error('Item name and price are required');
      }

      // Check for duplicate items
      const isDuplicate = wishlist.some(
        existingItem => existingItem.name.toLowerCase() === item.name.toLowerCase()
      );

      if (isDuplicate) {
        showNotification('This item is already in your wishlist!', 'warning');
        return;
      }

      const wishlistRef = collection(db, 'users', currentUser.uid, 'wishlist');
      const wishlistItem = {
        name: sanitizeInput(item.name),
        price: `$${parseFloat(item.price).toFixed(2)}`,
        description: sanitizeInput(item.description || ''),
        image: sanitizeUrl(item.image || ''),
        category: sanitizeInput(item.category || 'uncategorized'),
        budgetCategory: selectedBudget || 'moderate',
        createdAt: new Date().toISOString(),
        giftType: giftType
      };

      const docRef = await addDoc(wishlistRef, wishlistItem);

      setWishlist([...wishlist, { 
        id: docRef.id, 
        ...wishlistItem
      }]);
      setSearchQuery('');
      setSearchResults([]);

      showNotification(`Added "${item.name}" to your wishlist!`, 'success');
    } catch (error) {
      console.error('Error adding item:', error);
      showNotification('Failed to add item to wishlist: ' + error.message, 'error');
    }
  };

  const searchEbay = async (query) => {
    try {
      const response = await fetch(`https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_EBAY_SANDBOX_TOKEN}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`eBay API error: ${response.status}`);
      }

      const data = await response.json();
      return data.itemSummaries || [];
    } catch (error) {
      console.error('Error searching eBay:', error);
      return [];
    }
  };

  const handlePrivacySave = async (settings) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        wishlistPrivacy: settings
      });
      setWishlistPrivacy(settings);
      showNotification('Privacy settings updated successfully', 'success');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      showNotification('Failed to update privacy settings', 'error');
    }
  };

  return (
    <div className="gift-exchange">
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'wishlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('wishlist')}
        >
          My Wishlist
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'wishlist' && (
          <div className="wishlist-section">
            <WishlistPrivacy 
              onSave={handlePrivacySave}
              initialSettings={wishlistPrivacy}
            />

            <div className="exchange-options">
              <div className="budget-categories">
                <h3>Select a Budget Range</h3>
                <div className="category-grid">
                  {budgetCategories.map((category) => (
                    <div
                      key={category.id}
                      className={`category-card ${selectedBudget === category.id ? 'selected' : ''}`}
                      onClick={() => handleBudgetChange(category.id)}
                    >
                      <div className="category-icon">{category.icon}</div>
                      <h4>{category.label}</h4>
                      <p className="budget-range">{category.range}</p>
                    </div>
                  ))}
                </div>
                {selectedBudget && (
                  <button 
                    className="clear-budget-btn"
                    onClick={() => handleBudgetChange(selectedBudget)}
                  >
                    Clear Budget Filter
                  </button>
                )}
              </div>

              <div className="gift-type-selector">
                <button
                  className={`gift-type-btn ${giftType === 'products' ? 'active' : ''}`}
                  onClick={() => handleGiftTypeChange('products')}
                >
                  🎁 Products
                </button>
                <button
                  className={`gift-type-btn ${giftType === 'experiences' ? 'active' : ''}`}
                  onClick={() => handleGiftTypeChange('experiences')}
                >
                  ✨ Experiences
                </button>
              </div>
            </div>

            <TrendingGifts 
              onAddToWishlist={handleAddToWishlist}
              budgetRange={selectedBudget ? {
                min: selectedBudget === 'budget' ? 0 : 
                     selectedBudget === 'moderate' ? 50 :
                     selectedBudget === 'premium' ? 150 : 500,
                max: selectedBudget === 'budget' ? 50 :
                     selectedBudget === 'moderate' ? 150 :
                     selectedBudget === 'premium' ? 500 : 1000
              } : undefined}
            />

            <SeasonalGuides 
              onAddToWishlist={handleAddToWishlist}
              budgetRange={selectedBudget ? {
                min: selectedBudget === 'budget' ? 0 : 
                     selectedBudget === 'moderate' ? 50 :
                     selectedBudget === 'premium' ? 150 : 500,
                max: selectedBudget === 'budget' ? 50 :
                     selectedBudget === 'moderate' ? 150 :
                     selectedBudget === 'premium' ? 500 : 1000
              } : undefined}
            />

            <div className="gift-search-section">
              <div className="search-container">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  placeholder={`Search for ${giftType}...`}
                  className="search-input"
                />
                {isSearching && (
                  <div className="search-loading">
                    <div className="loading-spinner"></div>
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
              </div>

              {isSearching ? (
                <div className="search-results-loading">
                  <div className="loading-skeleton">
                    {[1, 2, 3, 4].map((index) => (
                      <div key={index} className="skeleton-card">
                        <div className="skeleton-image"></div>
                        <div className="skeleton-content">
                          <div className="skeleton-title"></div>
                          <div className="skeleton-price"></div>
                          <div className="skeleton-description"></div>
                          <div className="skeleton-button"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="search-results">
                  {searchResults.map(item => (
                    <div key={item.id} className="gift-card">
                      <ProductImageGallery 
                        images={item.images || [item.image]} 
                        alt={item.name}
                      />
                      <div className="gift-details">
                        <h3>{item.name}</h3>
                        <p className="price">
                          {giftType === 'products' 
                            ? (typeof item.price === 'number' 
                              ? `$${item.price.toFixed(2)}`
                              : `$${parseFloat(item.price).toFixed(2)}`)
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
                        <button 
                          className="add-to-wishlist-btn"
                          onClick={() => handleAddToWishlist(item)}
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
            
            <h3>My Wishlist Items</h3>
            <div className="wishlist-items">
              {wishlist.map(item => (
                <div key={item.id} className="wishlist-item">
                  <ProductImageGallery 
                    images={item.images || [item.image]} 
                    alt={item.name}
                  />
                  <h4>{item.name}</h4>
                  <p className="price">{item.price}</p>
                  <p className="description">{item.description}</p>
                  <div className="item-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => setEditingItem(item)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GiftExchange;