const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log('✅ Firebase: Using environment variable config');
    } catch (error) {
        console.error('❌ Firebase: Failed to parse environment variable:', error.message);
    }
} else {
    try {
        // For local development
        serviceAccount = require('../config/firebase-service-account.json');
        console.log('✅ Firebase: Using local config file');
    } catch (error) {
        console.error('❌ Firebase: No service account found');
    }
}

if (!admin.apps.length && serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin SDK initialized');
}

const verifyFirebaseToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            message: 'No token provided' 
        });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.admin === true) {
        next();
    } else {
        return res.status(403).json({ 
            success: false, 
            message: 'Admin access required' 
        });
    }
};

module.exports = { verifyFirebaseToken, isAdmin };