import React, { useState, useEffect } from 'react';
import { getEbayToken, searchEbayItems } from '../api/ebay';
import ProductImageGallery from './ProductImageGallery';
import './SeasonalGuides.scss';

const SeasonalGuides = ({ onAddToWishlist, budgetRange }) => {
  const [seasonalItems, setSeasonalItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSeasonalItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getEbayToken();
        const currentSeason = getCurrentSeason();
        console.log('Current season:', currentSeason);
        
        const searchQueries = getSeasonalSearchQueries(currentSeason);
        console.log('Search queries:', searchQueries);
        
        // Try each search query until we get results
        let results = [];
        for (const query of searchQueries) {
          console.log('Searching for:', query);
          const queryResults = await searchEbayItems(query, token, {
            limit: 4, // Get 4 items per query
            minPrice: budgetRange?.min,
            maxPrice: budgetRange?.max
          });
          console.log('Results for', query, ':', queryResults.length);
          results = [...results, ...queryResults];
          if (results.length >= 8) break; // Stop if we have enough items
        }

        console.log('Total results:', results.length);

        const formattedResults = results.map(item => ({
          id: item.itemId,
          name: item.title,
          price: item.price.value,
          description: item.shortDescription || item.title,
          images: [
            item.image?.imageUrl,
            ...(item.additionalImages || []).map(img => img.imageUrl)
          ].filter(Boolean),
          shop: 'eBay',
          category: 'seasonal',
          link: item.itemWebUrl
        }));

        console.log('Formatted results:', formattedResults);
        setSeasonalItems(formattedResults);
      } catch (error) {
        console.error('Error loading seasonal items:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadSeasonalItems();
  }, [budgetRange]);

  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };

  const getSeasonalSearchQueries = (season) => {
    const queries = {
      spring: [
        'spring gift ideas',
        'easter gifts',
        'mothers day gifts',
        'spring home decor'
      ],
      summer: [
        'summer gift ideas',
        'fathers day gifts',
        'beach gifts',
        'summer outdoor'
      ],
      fall: [
        'fall gift ideas',
        'halloween gifts',
        'thanksgiving gifts',
        'autumn decor'
      ],
      winter: [
        'winter gift ideas',
        'christmas gifts',
        'holiday gifts',
        'winter decor'
      ]
    };
    return queries[season] || queries.spring;
  };

  if (isLoading) {
    return (
      <div className="seasonal-guides">
        <h3>Seasonal Gift Ideas</h3>
        <p className="section-description">
          Discover perfect gifts for the current season
        </p>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="seasonal-guides">
        <h3>Seasonal Gift Ideas</h3>
        <p className="section-description">
          Discover perfect gifts for the current season
        </p>
        <div className="error-message">
          <p>Error loading seasonal items: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="seasonal-guides">
      <h3>Seasonal Gift Ideas</h3>
      <p className="section-description">
        Discover perfect gifts for the current season
      </p>
      <div className="seasonal-items-grid">
        {seasonalItems && seasonalItems.length > 0 ? (
          seasonalItems.map(item => (
            <div key={item.id} className="seasonal-item-card">
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
            <p>No seasonal items found. Try searching for specific gifts instead.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonalGuides; 