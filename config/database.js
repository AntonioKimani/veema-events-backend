const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Use DATABASE_URL if available
let poolConfig;
if (process.env.DATABASE_URL) {
    poolConfig = {
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
} else {
    poolConfig = {
        host: process.env.DB_HOST || 'mysql.railway.internal',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'railway',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
}

const pool = mysql.createPool(poolConfig);

const testConnection = async () => {
    let connection;
    try {
        console.log('🔌 Attempting MySQL connection...');
        console.log('Using DATABASE_URL:', process.env.DATABASE_URL ? 'Yes' : 'No');
        connection = await pool.getConnection();
        console.log('✅ MySQL connected successfully!');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

module.exports = {
    pool,
    testConnection
};