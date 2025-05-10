import axios from 'axios';

const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.REACT_APP_GOOGLE_CSE_ID;

export const searchProducts = async (query, priceRange) => {
  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CSE_ID,
        q: query,
        searchType: 'shopping',
        num: 10,
        gl: 'us',
        hl: 'en',
        price: priceRange
      }
    });

    return response.data.items.map(item => ({
      title: item.title,
      description: item.snippet,
      price: parseFloat(item.pagemap?.offer?.[0]?.price || '0'),
      image: item.pagemap?.cse_image?.[0]?.src || '',
      link: item.link
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }
}; 