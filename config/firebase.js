const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Firebase Admin SDK
let serviceAccount;

// Check if running on Railway (with environment variable)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('✅ Firebase: Using environment variable config');
  } catch (error) {
    console.error('❌ Firebase: Failed to parse environment variable:', error.message);
    process.exit(1);
  }
} else {
  // For local development - create a local file
  console.log('⚠️  Firebase: No environment variable found. Looking for local file...');
  try {
    // Try to load from local file (keep this in .gitignore)
    serviceAccount = require('./firebase-service-account.json');
    console.log('✅ Firebase: Using local config file');
  } catch (error) {
    console.error('❌ Firebase: No service account found. Please set FIREBASE_SERVICE_ACCOUNT environment variable');
    console.error('   or create config/firebase-service-account.json file');
    process.exit(1);
  }
}

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  process.exit(1);
}

const auth = admin.auth();

module.exports = { admin, auth };