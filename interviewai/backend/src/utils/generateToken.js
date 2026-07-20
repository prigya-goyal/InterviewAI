const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

/**
 * Signs a JWT for a given user id. Kept as a single-responsibility helper so
 * token shape/claims can change in one place without touching controllers.
 */
function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

module.exports = generateToken;
