const EBAY_APP_ID = process.env.REACT_APP_EBAY_APP_ID;
const EBAY_CERT_ID = process.env.REACT_APP_EBAY_CERT_ID;
const EBAY_DEV_ID = process.env.REACT_APP_EBAY_DEV_ID;

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/ebay';

// Cache for the eBay token with longer expiration buffer
let tokenCache = {
  token: null,
  expiresAt: null
};

// Get OAuth token with improved caching
export const getEbayToken = async () => {
  try {
    // Return cached token if it's still valid (with 10-minute buffer)
    if (tokenCache.token && tokenCache.expiresAt && tokenCache.expiresAt > Date.now() + 600000) {
      return tokenCache.token;
    }

    const response = await fetch(`${API_BASE_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get eBay token: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the token
    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000)
    };

    return data.access_token;
  } catch (error) {
    throw error;
  }
};

// Search eBay items with optimized parameters
export const searchEbayItems = async (query, token, options = {}) => {
  try {
    const { limit = 10, minPrice, maxPrice, sort, filter } = options;
    
    // Return empty array for empty queries
    if (!query?.trim()) {
      return [];
    }

    let url = `${API_BASE_URL}/search?query=${encodeURIComponent(query)}&limit=${limit}&token=${encodeURIComponent(token)}`;
    
    // Combine all filters into a single filter parameter
    const filters = [];
    if (minPrice !== undefined) {
      filters.push(`price:[${minPrice}..]`);
    }
    if (maxPrice !== undefined) {
      filters.push(`price:[..${maxPrice}]`);
    }
    if (filter) {
      filters.push(filter);
    }
    if (filters.length > 0) {
      url += `&filter=${filters.join(',')}`;
    }

    // Add sort if provided
    if (sort) {
      url += `&sort=${sort}`;
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`eBay API error: ${response.status}`);
    }

    const data = await response.json();
    return data.itemSummaries || [];
  } catch (error) {
    return [];
  }
}; 