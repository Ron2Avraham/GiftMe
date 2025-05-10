const FAKE_STORE_API = 'https://fakestoreapi.com';

export const searchProducts = async (query, category) => {
  try {
    let products = [];
    
    // If category is selected, fetch only that category
    if (category && category !== 'all') {
      const response = await fetch(`${FAKE_STORE_API}/products/category/${encodeURIComponent(category)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      products = await response.json();
    } else {
      // Fetch all products
      const response = await fetch(`${FAKE_STORE_API}/products`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      products = await response.json();
    }
    
    // Filter by search query
    if (query) {
      const searchLower = query.toLowerCase();
      products = products.filter(product => 
        product.title.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower)
      );
    }

    // Add some variety by duplicating products with slight modifications
    const enhancedProducts = products.map(item => ({
      id: item.id,
      name: item.title,
      price: parseFloat(item.price),
      description: item.description,
      image: item.image,
      shop: item.category,
      materials: [item.category],
      shipping: {
        price: 0 // Free shipping
      },
      rating: item.rating?.rate,
      reviewCount: item.rating?.count
    }));

    // Add variations of each product
    const variations = products.map(item => ({
      id: `${item.id}-var`,
      name: `${item.title} (Premium)`,
      price: parseFloat(item.price) * 1.2, // 20% more expensive
      description: `Premium version of ${item.description}`,
      image: item.image,
      shop: `${item.category} Premium`,
      materials: [item.category, 'Premium'],
      shipping: {
        price: 0
      },
      rating: item.rating?.rate,
      reviewCount: item.rating?.count
    }));

    return [...enhancedProducts, ...variations];
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};

export const getProductCategories = () => [
  { id: 'all', label: 'All Items', icon: '🎁' },
  { id: 'electronics', label: 'Electronics', icon: '📱' },
  { id: 'jewelery', label: 'Jewelry', icon: '💍' },
  { id: 'men\'s clothing', label: 'Men\'s Clothing', icon: '👔' },
  { id: 'women\'s clothing', label: 'Women\'s Clothing', icon: '👗' }
]; 