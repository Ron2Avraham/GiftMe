import React, { useState, useEffect } from 'react';
import { getEbayToken, searchEbayItems } from '../api/ebay';
import ProductImageGallery from './ProductImageGallery';
import './TrendingGifts.scss';

const TrendingGifts = ({ onAddToWishlist, budgetRange }) => {
  const [trendingItems, setTrendingItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTrendingItems = async () => {
      setIsLoading(true);
      try {
        const token = await getEbayToken();
        
        // Search for trending gifts with high view count
        const searchOptions = {
          sort: 'viewCount',
          limit: 12
        };

        // Only add price filters if both min and max are defined
        if (budgetRange?.min !== undefined && budgetRange?.max !== undefined) {
          searchOptions.minPrice = budgetRange.min;
          searchOptions.maxPrice = budgetRange.max;
        }

        const results = await searchEbayItems('gift', token, searchOptions);

        if (!results || results.length === 0) {
          // Try again without sort parameter if no results
          const fallbackResults = await searchEbayItems('gift', token, {
            limit: 12,
            minPrice: searchOptions.minPrice,
            maxPrice: searchOptions.maxPrice
          });
          
          if (fallbackResults && fallbackResults.length > 0) {
            results = fallbackResults;
          }
        }

        // Skip filtering entirely if no budget range is provided
        let filteredResults = results;
        if (budgetRange && (budgetRange.min !== undefined || budgetRange.max !== undefined)) {
          filteredResults = results.filter(item => {
            const price = parseFloat(item.price?.value);
            if (isNaN(price)) return false;
            
            const meetsMinPrice = budgetRange.min === undefined || price >= budgetRange.min;
            const meetsMaxPrice = budgetRange.max === undefined || price <= budgetRange.max;
            
            return meetsMinPrice && meetsMaxPrice;
          });
        }

        const formattedResults = filteredResults.map(item => ({
          id: item.itemId,
          name: item.title,
          price: item.price?.value || '0',
          description: item.shortDescription || item.title,
          images: [
            item.image?.imageUrl,
            ...(item.additionalImages || []).map(img => img.imageUrl)
          ].filter(Boolean),
          shop: 'eBay',
          category: 'trending',
          link: item.itemWebUrl,
          views: item.viewCount || 0,
          sales: item.soldQuantity || 0
        }));

        setTrendingItems(formattedResults);
      } catch (error) {
        console.error('Error loading trending items:', error);
        setTrendingItems([]); // Clear items on error
      } finally {
        setIsLoading(false);
      }
    };

    // Reset items when budget range changes
    setTrendingItems([]);
    loadTrendingItems();
  }, [budgetRange]); // Re-run when budget range changes

  if (isLoading) {
    return (
      <div className="trending-gifts">
        <h3>Loading Trending Gifts...</h3>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="trending-gifts">
      <h3>Trending Gifts</h3>
      <p className="section-description">
        Discover what's popular right now and trending among gift-givers
      </p>
      <div className="trending-items-grid">
        {trendingItems.length > 0 ? (
          trendingItems.map(item => (
            <div key={item.id} className="trending-item-card">
              <div className="trending-badge">
                <span className="views">👁️ {item.views}</span>
                <span className="sales">💰 {item.sales}</span>
              </div>
              <ProductImageGallery 
                images={item.images} 
                alt={item.name}
              />
              <div className="item-details">
                <h4>{item.name}</h4>
                <p className="price">${parseFloat(item.price).toFixed(2)}</p>
                <p className="description">{item.description}</p>
                <button 
                  className="add-to-wishlist-btn"
                  onClick={() => onAddToWishlist(item)}
                >
                  Add to Wishlist
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>No trending items found in this price range. Try adjusting your budget or searching for specific gifts.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendingGifts; 