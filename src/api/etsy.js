const API_BASE_URL = 'http://localhost:3001/api';

export const searchEtsyProducts = async (query, category) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/etsy/listings?keywords=${encodeURIComponent(query)}&category=${category}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results.map(item => ({
      id: item.listing_id,
      name: item.title,
      price: item.price.amount,
      description: item.description,
      image: item.images[0]?.url_fullxfull,
      shop: item.shop.shop_name,
      materials: item.materials,
      shipping: {
        price: item.shipping_profile?.primary_cost?.amount || 0
      }
    }));
  } catch (error) {
    console.error('Error searching Etsy products:', error);
    return [];
  }
};

export const getEtsyCategories = () => [
  { id: 'all', label: 'All Items', icon: '🎁' },
  { id: 'art', label: 'Art & Collectibles', icon: '🎨' },
  { id: 'home', label: 'Home & Living', icon: '🏠' },
  { id: 'jewelry', label: 'Jewelry', icon: '💍' },
  { id: 'clothing', label: 'Clothing', icon: '👕' },
  { id: 'crafts', label: 'Crafts & Supplies', icon: '✂️' },
  { id: 'vintage', label: 'Vintage', icon: '🕰️' },
  { id: 'wedding', label: 'Wedding', icon: '💒' },
  { id: 'toys', label: 'Toys & Games', icon: '🎮' },
  { id: 'beauty', label: 'Beauty & Personal Care', icon: '💄' },
  { id: 'paper', label: 'Paper & Party Supplies', icon: '📄' },
  { id: 'pets', label: 'Pet Supplies', icon: '🐾' },
  { id: 'accessories', label: 'Accessories', icon: '👜' },
  { id: 'bath', label: 'Bath & Beauty', icon: '🛁' },
  { id: 'bags', label: 'Bags & Purses', icon: '🛍️' }
]; 