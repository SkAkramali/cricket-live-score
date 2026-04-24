const { verifyToken } = require('../utils/jwt');

/**
 * Middleware to authenticate JWT token
 * Protects routes that require authentication
 */
const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required. Please login.'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Attach user info to request object
    req.user = {
      user_id: decoded.user_id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
};

/**
 * Middleware to check if user has required role
 * @param {Array} roles - Array of allowed roles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for routes that work both with and without auth
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      req.user = {
        user_id: decoded.user_id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role
      };
    }
    
    next();
  } catch (error) {
    // Continue without user info if token is invalid
    next();
  }
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  optionalAuth
};
