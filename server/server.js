const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const EBAY_APP_ID = process.env.EBAY_APP_ID;
const EBAY_CERT_ID = process.env.EBAY_CERT_ID;
const EBAY_DEV_ID = process.env.EBAY_DEV_ID;

// eBay API URLs
const SANDBOX_API_URL = 'https://api.sandbox.ebay.com/buy/browse/v1';

// Get eBay OAuth token
app.post('/api/ebay/token', async (req, res) => {
  try {
    const response = await axios.post('https://api.sandbox.ebay.com/identity/v1/oauth2/token', 
      'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${EBAY_APP_ID}:${EBAY_CERT_ID}`).toString('base64')}`
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error getting eBay token:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get eBay token' });
  }
});

// Search items
app.get('/api/ebay/item_summary/search', async (req, res) => {
  try {
    const { q, token, limit = 10, minPrice, maxPrice, sort, filter } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Missing token parameter' });
    }

    if (!q) {
      return res.status(400).json({ error: 'Missing search query parameter' });
    }

    // Properly encode the query while preserving spaces
    const encodedQuery = encodeURIComponent(q.trim());

    // Build filter string
    let filterString = 'conditions:{NEW}';
    if (minPrice !== undefined) {
      filterString += `,price:[${minPrice}..]`;
    }
    if (maxPrice !== undefined) {
      filterString += `,price:[..${maxPrice}]`;
    }
    if (filter) {
      filterString += `,${filter}`;
    }

    console.log('Searching items with query:', q);
    console.log('Filters:', filterString);
    console.log('Sort:', sort);

    const response = await fetch(
      `${SANDBOX_API_URL}/item_summary/search?q=${encodedQuery}&limit=${limit}&filter=${encodeURIComponent(filterString)}${sort ? `&sort=${sort}` : ''}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('eBay search response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('eBay search error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`eBay API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Number of search results:', data.itemSummaries?.length || 0);
    console.log('Price range of items:', data.itemSummaries?.map(item => item.price?.value).join(', '));
    res.json(data);
  } catch (error) {
    console.error('Error searching items:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Check server logs for more information'
    });
  }
});

// Get trending items
app.get('/api/ebay/trending', async (req, res) => {
  try {
    const { token, limit = 10, minPrice, maxPrice } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Missing token parameter' });
    }

    // Build filter string
    let filterString = 'conditions:{NEW}';
    if (minPrice !== undefined) {
      filterString += `,price:[${minPrice}..]`;
    }
    if (maxPrice !== undefined) {
      filterString += `,price:[..${maxPrice}]`;
    }

    console.log('Getting trending items with filters:', filterString);
    const response = await fetch(
      `${SANDBOX_API_URL}/item_summary/search?q=gift&limit=${limit}&filter=${encodeURIComponent(filterString)}&sort=price`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('eBay trending response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('eBay trending error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`eBay API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Number of trending items:', data.itemSummaries?.length || 0);
    console.log('Price range of items:', data.itemSummaries?.map(item => item.price?.value).join(', '));
    res.json(data);
  } catch (error) {
    console.error('Error getting trending items:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Check server logs for more information'
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 