const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const { isValidEmail } = require('../utils/helpers');

// ============================================
// REGISTER NEW USER (EMAIL/PASSWORD)
// ============================================
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide name, email and password' 
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide a valid email address' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists with this email' 
            });
        }

        // Create user
        const userId = await User.create({
            name,
            email,
            password,
            phone
        });

        // Get the created user (without password)
        const user = await User.findById(userId);

        // Create token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Registration failed. Please try again.' 
        });
    }
});

// ============================================
// LOGIN USER (EMAIL/PASSWORD)
// ============================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide email and password' 
            });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Check if user has password (might be Google-only user)
        if (!user.password) {
            return res.status(401).json({ 
                success: false, 
                message: 'This account uses Google Sign-In. Please login with Google.' 
            });
        }

        const isPasswordValid = await User.verifyPassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Login failed. Please try again.' 
        });
    }
});

// ============================================
// GOOGLE OAUTH ROUTES
// ============================================

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// Google OAuth callback
router.get('/google/callback', 
    passport.authenticate('google', { 
        session: true,
        failureRedirect: `${process.env.FRONTEND_URL}/Veema%20Household%20frontend/login.html?error=google_auth_failed`
    }),
    (req, res) => {
        // Generate JWT for frontend
        const token = jwt.sign(
            { id: req.user.id, email: req.user.email, role: req.user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );
        
        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL}/Veema%20Household%20frontend/auth-success.html?token=${token}`);
    }
);

// ============================================
// GET CURRENT USER (PROTECTED)
// ============================================
router.get('/me', async (req, res) => {
    try {
        // Check for token in header
        const token = req.headers.authorization?.split(' ')[1];
        
        if (token) {
            // Token-based authentication
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            
            if (!user) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'User not found' 
                });
            }
            
            return res.json({
                success: true,
                user
            });
        }
        
        // Session-based authentication (from Google OAuth)
        if (req.user) {
            return res.json({
                success: true,
                user: req.user
            });
        }
        
        return res.status(401).json({ 
            success: false, 
            message: 'Not authenticated' 
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
});

// ============================================
// LOGOUT
// ============================================
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Logout failed' 
            });
        }
        
        // Clear session
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
            }
            res.redirect(`${process.env.FRONTEND_URL}/Veema%20Household%20frontend`);
        });
    });
});

// ============================================
// UPDATE USER PROFILE (PROTECTED)
// ============================================
router.put('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { name, phone, address } = req.body;
        
        const updated = await User.update(decoded.id, { name, phone, address });
        
        if (!updated) {
            return res.status(400).json({ 
                success: false, 
                message: 'Update failed' 
            });
        }
        
        const user = await User.findById(decoded.id);
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Update failed' 
        });
    }
});

// ============================================
// CHANGE PASSWORD (PROTECTED)
// ============================================
router.post('/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { currentPassword, newPassword } = req.body;
        
        const user = await User.findByEmail(decoded.email);
        
        // Check if user has password (might be Google-only)
        if (!user.password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Google accounts cannot change password here' 
            });
        }
        
        const isValid = await User.verifyPassword(currentPassword, user.password);
        
        if (!isValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }
        
        await User.updatePassword(decoded.id, newPassword);
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Password change failed' 
        });
    }
});

module.exports = router;