const mockExperiences = [
  {
    id: 1,
    name: "Sunset Beach Picnic",
    price: 45,
    description: "A romantic beach picnic setup with local delicacies, perfect for couples.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    category: "romantic",
    duration: "2-3 hours",
    location: "Local Beach",
    rating: 4.8,
    reviewCount: 120,
    highlights: ["Beach setup", "Local food", "Sunset views", "Blanket provided"],
    included: ["Picnic basket", "Blanket", "Local delicacies", "Drinks"],
    excluded: ["Transportation", "Alcohol"],
    cancellationPolicy: "Free cancellation up to 24 hours before",
    bookingConfirmation: "Instant confirmation"
  },
  {
    id: 2,
    name: "Cooking Class with Local Chef",
    price: 65,
    description: "Learn to cook authentic local dishes with a professional chef.",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800",
    category: "food",
    duration: "3 hours",
    location: "Downtown Kitchen",
    rating: 4.9,
    reviewCount: 85,
    highlights: ["Hands-on cooking", "Recipe book", "Local ingredients", "Group activity"],
    included: ["Ingredients", "Apron", "Recipe book", "Meal"],
    excluded: ["Transportation"],
    cancellationPolicy: "Free cancellation up to 48 hours before",
    bookingConfirmation: "Instant confirmation"
  },
  {
    id: 3,
    name: "Mountain Hiking Adventure",
    price: 35,
    description: "Guided hiking tour through scenic mountain trails with breathtaking views.",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800",
    category: "adventure",
    duration: "4-5 hours",
    location: "Mountain Trails",
    rating: 4.7,
    reviewCount: 150,
    highlights: ["Scenic views", "Wildlife spotting", "Photo opportunities", "Expert guide"],
    included: ["Guide", "Snacks", "Water", "First aid kit"],
    excluded: ["Hiking gear", "Transportation"],
    cancellationPolicy: "Free cancellation up to 24 hours before",
    bookingConfirmation: "Instant confirmation"
  },
  {
    id: 4,
    name: "Spa & Wellness Day",
    price: 120,
    description: "Full day of relaxation with massages, facials, and wellness treatments.",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800",
    category: "spa",
    duration: "6 hours",
    location: "Luxury Spa Center",
    rating: 4.9,
    reviewCount: 95,
    highlights: ["Massage", "Facial", "Sauna", "Pool access"],
    included: ["All treatments", "Lunch", "Robes", "Slippers"],
    excluded: ["Transportation", "Additional treatments"],
    cancellationPolicy: "Free cancellation up to 48 hours before",
    bookingConfirmation: "Instant confirmation"
  },
  {
    id: 5,
    name: "Art Workshop",
    price: 55,
    description: "Creative art workshop with professional artist guidance.",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800",
    category: "cultural",
    duration: "3 hours",
    location: "Art Studio",
    rating: 4.8,
    reviewCount: 75,
    highlights: ["All materials provided", "Take home artwork", "Small groups", "Expert guidance"],
    included: ["Art supplies", "Canvas", "Apron", "Refreshments"],
    excluded: ["Transportation"],
    cancellationPolicy: "Free cancellation up to 24 hours before",
    bookingConfirmation: "Instant confirmation"
  }
];

export const searchExperiences = async (query, category = 'all') => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let results = [...mockExperiences];
    
    // Filter by search query
    if (query) {
      const searchLower = query.toLowerCase();
      results = results.filter(exp => 
        exp.name.toLowerCase().includes(searchLower) ||
        exp.description.toLowerCase().includes(searchLower) ||
        exp.location.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by category
    if (category !== 'all') {
      results = results.filter(exp => exp.category === category);
    }
    
    return results;
  } catch (error) {
    console.error('Error searching experiences:', error);
    return [];
  }
};

export const getExperienceCategories = () => {
  return [
    { id: 'all', label: 'All Experiences', icon: '🌟' },
    { id: 'romantic', label: 'Romantic', icon: '💑' },
    { id: 'food', label: 'Food & Drink', icon: '🍽️' },
    { id: 'adventure', label: 'Adventure', icon: '🏃' },
    { id: 'spa', label: 'Spa & Wellness', icon: '💆' },
    { id: 'cultural', label: 'Cultural', icon: '🏛️' }
  ];
}; 