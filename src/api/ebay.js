const EBAY_APP_ID = process.env.REACT_APP_EBAY_APP_ID;
const EBAY_CERT_ID = process.env.REACT_APP_EBAY_CERT_ID;
const EBAY_DEV_ID = process.env.REACT_APP_EBAY_DEV_ID;

const API_BASE_URL = 'http://localhost:5000/api/ebay';

// Get OAuth token
export const getEbayToken = async () => {
  try {
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
    return data.access_token;
  } catch (error) {
    console.error('Error getting eBay token:', error);
    throw error;
  }
};

// Get trending items
export const searchEbayItems = async (query, token, options = {}) => {
  try {
    const { limit = 10, minPrice, maxPrice, sort, filter } = options;
    let url = `${API_BASE_URL}/item_summary/search?q=${encodeURIComponent(query)}&limit=${limit}&token=${encodeURIComponent(token)}`;
    
    // Add price filters if provided
    if (minPrice !== undefined) {
      url += `&filter=price:[${minPrice}..]`;
    }
    if (maxPrice !== undefined) {
      url += `&filter=price:[..${maxPrice}]`;
    }

    // Add sort if provided
    if (sort) {
      url += `&sort=${sort}`;
    }

    // Add filter if provided
    if (filter) {
      url += `&filter=${filter}`;
    }

    console.log('Searching eBay with URL:', url);
    console.log('Search options:', { query, limit, minPrice, maxPrice, sort, filter });

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('eBay API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`eBay API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('eBay search results:', {
      totalItems: data.itemSummaries?.length || 0,
      priceRange: data.itemSummaries?.map(item => item.price?.value).join(', ')
    });

    return data.itemSummaries || [];
  } catch (error) {
    console.error('Error searching eBay:', error);
    return [];
  }
}; 