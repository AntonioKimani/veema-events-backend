const { auth } = require('../config/firebase');

async function createAdminUser(email, password) {
  try {
    // Create the user
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: 'Admin User',
      emailVerified: true
    });
    
    console.log(`✅ User created successfully: ${userRecord.uid}`);
    
    // Set custom claims (admin role)
    await auth.setCustomUserClaims(userRecord.uid, { admin: true, role: 'admin' });
    console.log(`✅ Admin role assigned to ${email}`);
    
    // Verify it worked
    const updatedUser = await auth.getUser(userRecord.uid);
    console.log('Custom claims:', updatedUser.customClaims);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'auth/email-already-exists') {
      console.log('User already exists. Try setting admin role instead.');
    }
  }
}

// Replace with your admin email and a strong password
createAdminUser('veemaevents2008@gmail.com', 'Admin123#');