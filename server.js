const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// eBay Sandbox URLs
const SANDBOX_AUTH_URL = 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';
const SANDBOX_API_URL = 'https://api.sandbox.ebay.com/buy/browse/v1';

// Get eBay token
app.post('/api/ebay/token', async (req, res) => {
  try {
    // Log the environment variables (without exposing full values)
    console.log('Environment check:');
    console.log('EBAY_APP_ID length:', process.env.EBAY_APP_ID?.length || 0);
    console.log('EBAY_CERT_ID length:', process.env.EBAY_CERT_ID?.length || 0);
    console.log('EBAY_DEV_ID length:', process.env.EBAY_DEV_ID?.length || 0);

    // Validate environment variables
    if (!process.env.EBAY_APP_ID || !process.env.EBAY_CERT_ID) {
      console.error('Missing eBay credentials in environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error: Missing eBay credentials' 
      });
    }

    const credentials = Buffer.from(`${process.env.EBAY_APP_ID}:${process.env.EBAY_CERT_ID}`).toString('base64');
    
    console.log('Making request to eBay with credentials length:', credentials.length);
    const response = await fetch(SANDBOX_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
    });

    console.log('eBay response status:', response.status);
    
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
    console.log('Successfully obtained eBay token');
    res.json(data);
  } catch (error) {
    console.error('Error getting eBay token:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Check server logs for more information'
    });
  }
});

// Search eBay items
app.get('/api/ebay/search', async (req, res) => {
  try {
    const { query, token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Missing token parameter' });
    }

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log('Searching eBay with query:', query);
    const response = await fetch(
      `${SANDBOX_API_URL}/item_summary/search?q=${encodeURIComponent(query.trim())}&limit=10`,
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
    console.log('eBay API response structure:', JSON.stringify(data, null, 2)); // Debug log
    res.json(data);
  } catch (error) {
    console.error('Error searching eBay:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Check server logs for more information'
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Environment variables check:');
  console.log('EBAY_APP_ID:', process.env.EBAY_APP_ID ? 'Present' : 'Missing');
  console.log('EBAY_CERT_ID:', process.env.EBAY_CERT_ID ? 'Present' : 'Missing');
  console.log('EBAY_DEV_ID:', process.env.EBAY_DEV_ID ? 'Present' : 'Missing');
}); 