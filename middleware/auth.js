const { auth } = require('../config/firebase');

// Verify Firebase ID token middleware
async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided' 
    });
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken; // Add user info to request
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
}

// Check if user is admin (requires verifyFirebaseToken first)
async function isAdmin(req, res, next) {
  // Check custom claims
  if (req.user && req.user.admin === true) {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
}

module.exports = { verifyFirebaseToken, isAdmin };