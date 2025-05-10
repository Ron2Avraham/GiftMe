// Gift suggestions based on budget categories
const giftSuggestions = {
  low: [
    {
      name: "Personalized Mug",
      price: "$15-20",
      description: "A custom mug with their favorite quote or photo",
      category: "Home & Kitchen"
    },
    {
      name: "Scented Candle Set",
      price: "$20-25",
      description: "A set of 3 premium scented candles",
      category: "Home & Living"
    },
    {
      name: "Book Subscription",
      price: "$15-25",
      description: "A month of their favorite book genre",
      category: "Entertainment"
    }
  ],
  medium: [
    {
      name: "Wireless Earbuds",
      price: "$50-80",
      description: "High-quality wireless earbuds with noise cancellation",
      category: "Electronics"
    },
    {
      name: "Gourmet Food Basket",
      price: "$60-90",
      description: "Curated selection of premium snacks and treats",
      category: "Food & Beverage"
    },
    {
      name: "Smart Watch",
      price: "$70-100",
      description: "Fitness and health tracking smartwatch",
      category: "Electronics"
    }
  ],
  high: [
    {
      name: "Smart Home Hub",
      price: "$150-200",
      description: "Complete smart home control system",
      category: "Electronics"
    },
    {
      name: "Luxury Watch",
      price: "$200-300",
      description: "Elegant timepiece with premium features",
      category: "Fashion"
    },
    {
      name: "Gaming Console",
      price: "$300-500",
      description: "Latest gaming console with popular games",
      category: "Entertainment"
    }
  ]
};

// Function to shuffle array (Fisher-Yates algorithm)
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Function to generate Secret Santa matches
export const generateSecretSantaMatches = (participants) => {
  if (participants.length < 2) {
    throw new Error('Need at least 2 participants for Secret Santa');
  }

  // Create a copy of participants array
  let givers = [...participants];
  let receivers = [...participants];

  // Keep trying until we get valid matches
  let validMatches = false;
  let matches = [];

  while (!validMatches) {
    // Shuffle receivers
    receivers = shuffleArray([...participants]);
    matches = [];
    validMatches = true;

    // Check if any person is assigned to themselves
    for (let i = 0; i < givers.length; i++) {
      if (givers[i] === receivers[i]) {
        validMatches = false;
        break;
      }
      matches.push({
        giver: givers[i],
        receiver: receivers[i]
      });
    }
  }

  return matches;
};

// Function to get gift suggestions based on budget
export const getGiftSuggestions = (budgetCategory, count = 3) => {
  const suggestions = giftSuggestions[budgetCategory] || [];
  return shuffleArray([...suggestions]).slice(0, count);
};

// Function to generate a complete gift exchange
export const generateGiftExchange = (participants, budgetCategory, isSecretSanta = false) => {
  const matches = isSecretSanta 
    ? generateSecretSantaMatches(participants)
    : participants.map((participant, index) => ({
        giver: participant,
        receiver: participants[(index + 1) % participants.length]
      }));

  return matches.map(match => ({
    ...match,
    suggestions: getGiftSuggestions(budgetCategory)
  }));
}; 