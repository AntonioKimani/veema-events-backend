const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Google profile received:', profile.id);
        
        // Check if user exists with this google_id
        let user = await User.findByGoogleId(profile.id);
        
        if (!user) {
            // Check if user exists with this email
            user = await User.findByEmail(profile.emails[0].value);
            
            if (user) {
                // Link Google account to existing user
                await User.linkGoogleAccount(user.id, profile.id, profile.photos[0]?.value);
                user = await User.findById(user.id);
            } else {
                // Create new user from Google profile
                const newUser = {
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    password: null,
                    phone: '',
                    googleId: profile.id,
                    avatar: profile.photos[0]?.value,
                    authProvider: 'google'
                };
                
                const userId = await User.createGoogleUser(newUser);
                user = await User.findById(userId);
            }
        }
        
        return done(null, user);
    } catch (error) {
        console.error('Google auth error:', error);
        return done(error, null);
    }
}));

module.exports = passport;