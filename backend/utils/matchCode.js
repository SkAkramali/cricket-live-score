const { customAlphabet } = require('nanoid');

/**
 * Generate unique match code
 * Format: ABC123 (6 characters - uppercase letters and numbers)
 * @returns {String} Unique match code
 */
const generateMatchCode = () => {
  // Custom alphabet without confusing characters (0, O, I, 1)
  const nanoid = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 6);
  return nanoid();
};

/**
 * Validate match code format
 * @param {String} code - Match code to validate
 * @returns {Boolean} True if valid format
 */
const isValidMatchCode = (code) => {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  // Check length and characters
  const regex = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/;
  return regex.test(code);
};

/**
 * Generate user-friendly match code with separator
 * Format: ABC-123
 * @returns {String} Formatted match code
 */
const generateFormattedMatchCode = () => {
  const code = generateMatchCode();
  return `${code.substring(0, 3)}-${code.substring(3)}`;
};

module.exports = {
  generateMatchCode,
  isValidMatchCode,
  generateFormattedMatchCode
};
