const db = require('../config/database');
const bcrypt = require('bcryptjs');

const User = {
    // ============================================
    // CREATE NEW USER (EMAIL/PASSWORD)
    // ============================================
    create: async (userData) => {
        const { name, email, password, phone } = userData;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        try {
            const result = await db.pool.query(
                `INSERT INTO users (name, email, password, phone, auth_provider) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING id`,
                [name, email, hashedPassword, phone || null, 'local']
            );
            return result.rows[0].id;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    // ============================================
    // CREATE USER FROM GOOGLE
    // ============================================
    createGoogleUser: async (userData) => {
        const { name, email, googleId, avatar, authProvider } = userData;
        
        try {
            const result = await db.pool.query(
                `INSERT INTO users (name, email, google_id, avatar, auth_provider) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING id`,
                [name, email, googleId, avatar || null, authProvider || 'google']
            );
            return result.rows[0].id;
        } catch (error) {
            console.error('Error creating Google user:', error);
            throw error;
        }
    },

    // ============================================
    // FIND USER BY EMAIL
    // ============================================
    findByEmail: async (email) => {
        try {
            const result = await db.pool.query(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    },

    // ============================================
    // FIND USER BY GOOGLE ID
    // ============================================
    findByGoogleId: async (googleId) => {
        try {
            const result = await db.pool.query(
                'SELECT * FROM users WHERE google_id = $1',
                [googleId]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error finding user by Google ID:', error);
            throw error;
        }
    },

    // ============================================
    // FIND USER BY ID (EXCLUDE SENSITIVE DATA)
    // ============================================
    findById: async (id) => {
        try {
            const result = await db.pool.query(
                `SELECT id, name, email, phone, address, role, 
                        google_id, avatar, auth_provider, created_at 
                 FROM users 
                 WHERE id = $1`,
                [id]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error finding user by ID:', error);
            throw error;
        }
    },

    // ============================================
    // VERIFY PASSWORD (FOR EMAIL LOGIN)
    // ============================================
    verifyPassword: async (plainPassword, hashedPassword) => {
        return await bcrypt.compare(plainPassword, hashedPassword);
    },

    // ============================================
    // LINK GOOGLE ACCOUNT TO EXISTING USER
    // ============================================
    linkGoogleAccount: async (userId, googleId, avatar) => {
        try {
            const result = await db.pool.query(
                `UPDATE users 
                 SET google_id = $1, avatar = $2, auth_provider = 'both' 
                 WHERE id = $3 
                 RETURNING id`,
                [googleId, avatar || null, userId]
            );
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error linking Google account:', error);
            throw error;
        }
    },

    // ============================================
    // UPDATE USER PROFILE
    // ============================================
    update: async (id, userData) => {
        const { name, phone, address } = userData;
        try {
            const result = await db.pool.query(
                `UPDATE users 
                 SET name = $1, phone = $2, address = $3 
                 WHERE id = $4 
                 RETURNING id`,
                [name, phone || null, address || null, id]
            );
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },

    // ============================================
    // UPDATE PASSWORD
    // ============================================
    updatePassword: async (id, newPassword) => {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            
            const result = await db.pool.query(
                'UPDATE users SET password = $1 WHERE id = $2 RETURNING id',
                [hashedPassword, id]
            );
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error updating password:', error);
            throw error;
        }
    },

    // ============================================
    // GET ALL USERS (ADMIN ONLY)
    // ============================================
    getAll: async () => {
        try {
            const result = await db.pool.query(
                `SELECT id, name, email, phone, role, auth_provider, created_at 
                 FROM users 
                 ORDER BY created_at DESC`
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting all users:', error);
            throw error;
        }
    },

    // ============================================
    // DELETE USER (ADMIN ONLY)
    // ============================================
    delete: async (id) => {
        try {
            const result = await db.pool.query(
                'DELETE FROM users WHERE id = $1 RETURNING id',
                [id]
            );
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    // ============================================
    // GET USER STATISTICS (ADMIN ONLY)
    // ============================================
    getStats: async () => {
        try {
            const result = await db.pool.query(`
                SELECT 
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
                    COUNT(CASE WHEN auth_provider = 'google' THEN 1 END) as google_users,
                    COUNT(CASE WHEN auth_provider = 'local' THEN 1 END) as local_users,
                    COUNT(CASE WHEN auth_provider = 'both' THEN 1 END) as both_users,
                    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30days
                FROM users
            `);
            return result.rows[0];
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    },

    // ============================================
    // UPDATE USER ROLE (ADMIN ONLY)
    // ============================================
    updateRole: async (id, role) => {
        try {
            const result = await db.pool.query(
                'UPDATE users SET role = $1 WHERE id = $2 RETURNING id',
                [role, id]
            );
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error updating user role:', error);
            throw error;
        }
    },

    // ============================================
    // SAVE CART FOR USER
    // ============================================
    saveCart: async (userId, cartItems) => {
        try {
            // Check if cart exists
            const existing = await db.pool.query(
                'SELECT id FROM carts WHERE user_id = $1',
                [userId]
            );
            
            if (existing.rows.length > 0) {
                // Update existing cart
                await db.pool.query(
                    'UPDATE carts SET items = $1 WHERE user_id = $2',
                    [JSON.stringify(cartItems), userId]
                );
            } else {
                // Create new cart
                await db.pool.query(
                    'INSERT INTO carts (user_id, items) VALUES ($1, $2)',
                    [userId, JSON.stringify(cartItems)]
                );
            }
            return true;
        } catch (error) {
            console.error('Error saving cart:', error);
            throw error;
        }
    },

    // ============================================
    // GET USER'S CART
    // ============================================
    getCart: async (userId) => {
        try {
            const result = await db.pool.query(
                'SELECT items FROM carts WHERE user_id = $1',
                [userId]
            );
            return result.rows.length > 0 ? result.rows[0].items : [];
        } catch (error) {
            console.error('Error getting cart:', error);
            throw error;
        }
    },

    // ============================================
    // FIND OR CREATE USER FROM GOOGLE (UTILITY)
    // ============================================
    findOrCreateGoogleUser: async (profile) => {
        try {
            // Check by Google ID first
            let user = await User.findByGoogleId(profile.id);
            
            if (!user) {
                // Check by email
                user = await User.findByEmail(profile.emails[0].value);
                
                if (user) {
                    // Link Google account to existing user
                    await User.linkGoogleAccount(
                        user.id, 
                        profile.id, 
                        profile.photos[0]?.value
                    );
                    user = await User.findById(user.id);
                } else {
                    // Create new user from Google profile
                    const userId = await User.createGoogleUser({
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        googleId: profile.id,
                        avatar: profile.photos[0]?.value,
                        authProvider: 'google'
                    });
                    user = await User.findById(userId);
                }
            }
            
            return user;
        } catch (error) {
            console.error('Error in findOrCreateGoogleUser:', error);
            throw error;
        }
    }
};

module.exports = User;