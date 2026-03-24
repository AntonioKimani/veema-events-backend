const { auth } = require('../config/firebase');

async function setAdminRole(email) {
  try {
    // Find the user by email
    const user = await auth.getUserByEmail(email);
    
    // Set custom claims (admin role)
    await auth.setCustomUserClaims(user.uid, { admin: true, role: 'admin' });
    
    console.log(`✅ Admin role assigned to ${email} (UID: ${user.uid})`);
    
    // Verify it worked
    const updatedUser = await auth.getUser(user.uid);
    console.log('Custom claims:', updatedUser.customClaims);
  } catch (error) {
    console.error('❌ Error setting admin role:', error.message);
  }
}

// Replace with your email
setAdminRole('veemaevents2008@gmail.com');