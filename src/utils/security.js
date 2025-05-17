// Utility functions for security and content escaping

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
export const escapeHtml = (str) => {
  if (typeof str !== 'string') return '';
  
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return str.replace(/[&<>"'`=\/]/g, char => htmlEntities[char]);
};

/**
 * Sanitizes a URL to prevent XSS and ensure it's safe to use
 * @param {string} url - The URL to sanitize
 * @returns {string} The sanitized URL or empty string if invalid
 */
export const sanitizeUrl = (url) => {
  if (typeof url !== 'string') return '';
  
  try {
    const parsedUrl = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return '';
    }
    return parsedUrl.toString();
  } catch {
    return '';
  }
};

/**
 * Sanitizes user input by trimming and escaping special characters
 * @param {string} input - The user input to sanitize
 * @returns {string} The sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  // Only remove potentially dangerous characters, preserve spaces
  return input.replace(/[<>]/g, '');
}; 