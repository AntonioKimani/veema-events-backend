const { auth } = require('../config/firebase');

async function verifyAdmin(email) {
  try {
    const user = await auth.getUserByEmail(email);
    console.log(`User: ${user.email}`);
    console.log('Custom claims:', user.customClaims);
    
    if (user.customClaims && user.customClaims.admin === true) {
      console.log('✅ User is ADMIN!');
    } else {
      console.log('❌ User is NOT admin');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

verifyAdmin('veemaevents2008@gmail.com');