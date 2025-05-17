// Sanitization utility functions

// Sanitize text input - remove HTML tags and limit length
export const sanitizeText = (text, maxLength = 100) => {
  if (!text) return '';
  // Remove HTML tags
  const sanitized = text.replace(/<[^>]*>/g, '');
  // Trim whitespace
  const trimmed = sanitized.trim();
  // Limit length
  return trimmed.slice(0, maxLength);
};

// Sanitize price/budget input - ensure valid number format
export const sanitizePrice = (price) => {
  if (!price) return '';
  // Remove any non-numeric characters except decimal point
  const sanitized = price.replace(/[^0-9.]/g, '');
  // Ensure only one decimal point
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  // Limit to 2 decimal places
  if (parts.length === 2) {
    return parts[0] + '.' + parts[1].slice(0, 2);
  }
  return sanitized;
};

// Sanitize date input - ensure valid date format
export const sanitizeDate = (date) => {
  if (!date) return '';
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return parsedDate.toISOString().split('T')[0];
};

// Sanitize description - allow some basic formatting but remove potentially dangerous content
export const sanitizeDescription = (text, maxLength = 500) => {
  if (!text) return '';
  // Remove HTML tags except basic formatting
  const sanitized = text.replace(/<(?!br|p|b|i|em|strong)[^>]*>/g, '');
  // Trim whitespace
  const trimmed = sanitized.trim();
  // Limit length
  return trimmed.slice(0, maxLength);
};

// Sanitize event type - ensure valid type
export const sanitizeEventType = (type, validTypes = ['birthday', 'anniversary', 'holiday', 'custom']) => {
  if (!type || !validTypes.includes(type)) {
    return 'custom';
  }
  return type;
};

// Sanitize boolean input
export const sanitizeBoolean = (value) => {
  return Boolean(value);
};

// Sanitize array of gift ideas
export const sanitizeGiftIdeas = (ideas, maxLength = 10) => {
  if (!Array.isArray(ideas)) return [];
  return ideas
    .slice(0, maxLength)
    .map(idea => sanitizeText(idea, 50))
    .filter(idea => idea.length > 0);
};

// Sanitize wishlist item ID
export const sanitizeWishlistItemId = (id) => {
  if (!id) return null;
  // Remove any non-alphanumeric characters
  return id.replace(/[^a-zA-Z0-9]/g, '');
}; 