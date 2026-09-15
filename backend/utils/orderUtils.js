/**
 * @desc Generates a random order number matching the frontend's format (e.g., ORD-123456)
 * @returns {string}
 */
const generateOrderNumber = () => {
  const digits = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
  return `ORD-${digits}`;
};

module.exports = {
  generateOrderNumber,
};
