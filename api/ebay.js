const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Enable CORS for all routes with specific options
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Handle OPTIONS requests for CORS preflight
app.options('*', cors());

// eBay Sandbox URLs
const SANDBOX_AUTH_URL = 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';
const SANDBOX_API_URL = 'https://api.sandbox.ebay.com/buy/browse/v1';

// Get eBay token
app.post('/token', async (req, res) => {
  try {
    if (!process.env.EBAY_APP_ID || !process.env.EBAY_CERT_ID) {
      return res.status(500).json({ 
        error: 'Server configuration error: Missing eBay credentials' 
      });
    }

    const credentials = Buffer.from(`${process.env.EBAY_APP_ID}:${process.env.EBAY_CERT_ID}`).toString('base64');
    
    const response = await fetch(SANDBOX_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
    });
    
    if (!response.ok) {
      throw new Error(`eBay API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Token error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search eBay items
app.get('/search', async (req, res) => {
  try {
    const { query, token, sort, filter, limit = 10, minPrice, maxPrice } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Missing token parameter' });
    }

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    let ebayUrl = `${SANDBOX_API_URL}/item_summary/search?q=${encodeURIComponent(query.trim())}&limit=${limit}`;
    
    if (sort) {
      ebayUrl += `&sort=${sort}`;
    }

    // Build filter string with proper price ranges
    const filters = [];
    if (filter) {
      filters.push(filter);
    }

    // Add price filters with proper format
    if (minPrice !== undefined) {
      filters.push(`price:[${minPrice}..]`);
    }
    if (maxPrice !== undefined) {
      filters.push(`price:[..${maxPrice}]`);
    }

    // Add filter parameter if we have any filters
    if (filters.length > 0) {
      ebayUrl += `&filter=${filters.join(',')}`;
    }

    const response = await fetch(ebayUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`eBay API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Double-check price filtering on the server side
    if (data.itemSummaries) {
      data.itemSummaries = data.itemSummaries.filter(item => {
        const price = parseFloat(item.price?.value || 0);
        if (minPrice !== undefined && price < parseFloat(minPrice)) return false;
        if (maxPrice !== undefined && price > parseFloat(maxPrice)) return false;
        return true;
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app; 