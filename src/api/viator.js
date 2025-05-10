const VIATOR_API_KEY = process.env.REACT_APP_VIATOR_API_KEY;
const VIATOR_BASE_URL = 'https://api.viator.com/partner/v1';

export const searchViatorExperiences = async (query, category = 'all') => {
  try {
    const response = await fetch(`${VIATOR_BASE_URL}/tours/search?q=${encodeURIComponent(query)}&count=20&currency=USD`, {
      headers: {
        'exp-api-key': VIATOR_API_KEY,
        'Accept': 'application/json',
        'Accept-Language': 'en-US'
      }
    });

    const data = await response.json();
    
    if (data.tours) {
      return data.tours.map(tour => ({
        id: tour.productCode,
        name: tour.title,
        price: tour.price?.fromPrice || 0,
        description: tour.shortDescription || tour.description,
        image: tour.primaryPhoto?.photoURL || '',
        category: tour.categories?.[0]?.name || 'other',
        link: `https://www.viator.com${tour.webURL}`,
        duration: tour.duration,
        location: tour.destinationName,
        rating: tour.reviewAverage || 0,
        reviewCount: tour.reviewCount || 0,
        highlights: tour.highlights || [],
        included: tour.included || [],
        excluded: tour.excluded || [],
        cancellationPolicy: tour.cancellationPolicy,
        bookingConfirmation: tour.bookingConfirmation
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error searching Viator experiences:', error);
    return [];
  }
};

export const getExperienceCategories = () => {
  return [
    { id: 'all', label: 'All Experiences', icon: '🌟' },
    { id: 'adventure', label: 'Adventure', icon: '🏃' },
    { id: 'food', label: 'Food & Drink', icon: '🍽️' },
    { id: 'spa', label: 'Spa & Wellness', icon: '💆' },
    { id: 'culture', label: 'Cultural', icon: '🏛️' },
    { id: 'nature', label: 'Nature & Wildlife', icon: '🌿' },
    { id: 'water', label: 'Water Activities', icon: '🏊' },
    { id: 'sports', label: 'Sports & Leisure', icon: '⚽' },
    { id: 'shopping', label: 'Shopping', icon: '🛍️' },
    { id: 'nightlife', label: 'Nightlife', icon: '🌙' },
    { id: 'family', label: 'Family Friendly', icon: '👨‍👩‍👧‍👦' },
    { id: 'romantic', label: 'Romantic', icon: '💑' },
    { id: 'luxury', label: 'Luxury', icon: '✨' },
    { id: 'educational', label: 'Educational', icon: '📚' },
    { id: 'seasonal', label: 'Seasonal', icon: '🎄' }
  ];
};

const getCategoryIcon = (categoryName) => {
  const icons = {
    'Adventure': '🏃',
    'Attractions': '🎡',
    'Food & Drink': '🍽️',
    'Nature & Wildlife': '🌿',
    'Spa & Wellness': '💆',
    'Water Activities': '🏊',
    'Cultural & Theme Tours': '🏛️',
    'Shopping & Fashion': '🛍️',
    'Nightlife': '🌃',
    'Classes & Workshops': '🎨',
    'Sports & Outdoor': '⚽',
    'Entertainment': '🎭',
    'Religious Sites': '⛪',
    'Museums': '🏛️',
    'Parks & Gardens': '🌳'
  };

  return icons[categoryName] || '🎁';
}; 