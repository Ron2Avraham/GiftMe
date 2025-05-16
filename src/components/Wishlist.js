import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { searchProducts, getProductCategories } from '../api/products';
import { searchExperiences, getExperienceCategories } from '../api/experiences';
import { getEbayToken, searchEbayItems } from '../api/ebay';
import TrendingGifts from './TrendingGifts';
import SeasonalGuides from './SeasonalGuides';
import ProductImageGallery from './ProductImageGallery';
import WishlistPrivacy from './WishlistPrivacy';
import './Wishlist.scss';

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [giftType, setGiftType] = useState('products');
  const [wishlistPrivacy, setWishlistPrivacy] = useState('public');
  const [allResults, setAllResults] = useState([]);

  const budgetCategories = [
    { id: 'budget', label: 'Budget-Friendly', range: 'Under $50', icon: '💰' },
    { id: 'moderate', label: 'Moderate', range: '$50 - $150', icon: '🎁' },
    { id: 'premium', label: 'Premium', range: '$150 - $500', icon: '✨' },
    { id: 'luxury', label: 'Luxury', range: 'Over $500', icon: '💎' }
  ];

  useEffect(() => {
    loadWishlist();
  }, []);

  useEffect(() => {
    searchGifts('', 'all');
  }, [giftType]);

  const loadWishlist = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

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

  const searchGifts = async (query, category) => {
    setIsSearching(true);
    try {
      let results = [];
      
      if (giftType === 'products') {
        const token = await getEbayToken();
        const ebayResults = await searchEbayItems(query || 'gift', token);
        results = ebayResults.map(item => ({
          id: item.itemId,
          name: item.title,
          price: item.price.value,
          description: item.shortDescription || item.title,
          images: [
            item.image?.imageUrl,
            ...(item.additionalImages || []).map(img => img.imageUrl)
          ].filter(Boolean),
          shop: 'eBay',
          category: category,
          link: item.itemWebUrl
        }));
      } else {
        results = await searchExperiences(query, category);
      }

      setAllResults(results);
      applyFilters(results, category, selectedBudget);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const applyFilters = (results, category, budget) => {
    let filteredResults = [...results];

    if (category && category !== 'all') {
      filteredResults = filteredResults.filter(item => item.category === category);
    }

    if (budget) {
      filteredResults = filteredResults.filter(item => {
        const price = parseFloat(item.price);
        if (budget === 'budget') return price < 50;
        if (budget === 'moderate') return price >= 50 && price <= 150;
        if (budget === 'premium') return price > 150 && price <= 500;
        if (budget === 'luxury') return price > 500;
        return true;
      });
    }

    setSearchResults(filteredResults);
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    applyFilters(allResults, categoryId, selectedBudget);
  };

  const handleBudgetChange = (budgetId) => {
    const newBudget = selectedBudget === budgetId ? null : budgetId;
    setSelectedBudget(newBudget);
    applyFilters(allResults, selectedCategory, newBudget);
  };

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

  const handleAddToWishlist = async (item) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      if (!item.name || !item.price) {
        throw new Error('Item name and price are required');
      }

      const wishlistRef = collection(db, 'users', currentUser.uid, 'wishlist');
      const wishlistItem = {
        name: item.name || '',
        price: `$${parseFloat(item.price).toFixed(2)}`,
        description: item.description || '',
        image: item.image || '',
        category: item.category || 'uncategorized',
        budgetCategory: selectedBudget || 'moderate',
        createdAt: new Date().toISOString(),
        giftType: giftType
      };

      const docRef = await addDoc(wishlistRef, wishlistItem);
      setWishlist([...wishlist, { id: docRef.id, ...wishlistItem }]);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item to wishlist: ' + error.message);
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
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      alert('Failed to update privacy settings. Please try again.');
    }
  };

  return (
    <div className="wishlist-section">
      <h2>My Gift Wishlist</h2>
      <p className="section-description">
        Discover and add gifts you would love to receive. Make it special and meaningful!
      </p>

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
        } : null}
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
        } : null}
      />

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

        {searchResults.length > 0 ? (
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
                      ? typeof item.price === 'number' 
                        ? `$${item.price.toFixed(2)}`
                        : `$${parseFloat(item.price).toFixed(2)}`
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
            <ProductImageGallery 
              images={item.images || [item.image]} 
              alt={item.name}
            />
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
  );
}

export default Wishlist; 