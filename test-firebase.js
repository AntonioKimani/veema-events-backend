const { auth } = require('./config/firebase');

async function testFirebase() {
  try {
    // List users (limit 1)
    const listUsersResult = await auth.listUsers(1);
    console.log('✅ Firebase Admin SDK is working!');
    console.log('Users count:', listUsersResult.users.length);
  } catch (error) {
    console.error('❌ Firebase connection error:', error.message);
  }
}

testFirebase();