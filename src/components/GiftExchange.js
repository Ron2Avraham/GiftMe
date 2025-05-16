import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { searchProducts, getProductCategories } from '../api/products';
import { searchExperiences, getExperienceCategories } from '../api/experiences';
import { getEbayToken, searchEbayItems } from '../api/ebay';
import TrendingGifts from './TrendingGifts';
import SeasonalGuides from './SeasonalGuides';
import ProductImageGallery from './ProductImageGallery';
import WishlistPrivacy from './WishlistPrivacy';
import GiftCalendar from './GiftCalendar';
import Wishlist from './Wishlist';
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
        // Get eBay token
        const token = await getEbayToken();
        // Search eBay
        const ebayResults = await searchEbayItems(query || 'gift', token);
        // Transform eBay results to match our format
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

      // Store all results
      setAllResults(results);
      // Apply current filters
      applyFilters(results, category, selectedBudget);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const applyFilters = (results, category, budget) => {
    let filteredResults = [...results];

    // Apply category filter
    if (category && category !== 'all') {
      filteredResults = filteredResults.filter(item => item.category === category);
    }

    // Apply budget filter
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

  // Update category selection
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    applyFilters(allResults, categoryId, selectedBudget);
  };

  // Update budget selection
  const handleBudgetChange = (budgetId) => {
    const newBudget = selectedBudget === budgetId ? null : budgetId;
    setSelectedBudget(newBudget);
    applyFilters(allResults, selectedCategory, newBudget);
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
      // Validate required fields
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
        giftType: giftType // Add gift type to distinguish between products and experiences
      };

      const docRef = await addDoc(wishlistRef, wishlistItem);

      setWishlist([...wishlist, { 
        id: docRef.id, 
        ...wishlistItem
      }]);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding item:', error);
      // You might want to show this error to the user
      alert('Failed to add item to wishlist: ' + error.message);
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
      // Update privacy settings in Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        wishlistPrivacy: settings
      });

      // Update local state
      setWishlistPrivacy(settings);
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      alert('Failed to update privacy settings. Please try again.');
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
        {activeTab === 'wishlist' && <Wishlist />}
      </div>
    </div>
  );
}

export default GiftExchange; 