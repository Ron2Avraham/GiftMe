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
        console.log('Loading trending items with budget range:', budgetRange);
        const token = await getEbayToken();
        
        // Search for trending gifts with high view count and sales
        const results = await searchEbayItems('gift', token, {
          sort: 'viewCount',
          filter: 'soldItems',
          limit: 12,
          minPrice: budgetRange?.min,
          maxPrice: budgetRange?.max
        });

        console.log('Raw eBay results:', results);

        // Filter results by price range as a backup
        const filteredResults = results.filter(item => {
          const price = parseFloat(item.price?.value);
          if (!budgetRange) return true;
          if (budgetRange.min !== undefined && price < budgetRange.min) return false;
          if (budgetRange.max !== undefined && price > budgetRange.max) return false;
          return true;
        });

        console.log('Filtered results:', filteredResults);

        const formattedResults = filteredResults.map(item => ({
          id: item.itemId,
          name: item.title,
          price: item.price.value,
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

        console.log('Formatted results:', formattedResults);
        setTrendingItems(formattedResults);
      } catch (error) {
        console.error('Error loading trending items:', error);
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