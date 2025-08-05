import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.EXPO_PUBLIC_DB_HOST || 'localhost',
  user: process.env.EXPO_PUBLIC_DB_USER || 'root',
  password: process.env.EXPO_PUBLIC_DB_PASSWORD || '',
  database: process.env.EXPO_PUBLIC_DB_NAME || 'streak_app',
  port: parseInt(process.env.EXPO_PUBLIC_DB_PORT || '3306'),
  ssl: process.env.EXPO_PUBLIC_DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
};

let connection: mysql.Connection | null = null;

export async function getConnection() {
  if (!connection) {
    try {
      connection = await mysql.createConnection(dbConfig);
      console.log('Connected to MySQL database');
    } catch (error) {
      console.error('Error connecting to database:', error);
      throw error;
    }
  }
  return connection;
}

export async function closeConnection() {
  if (connection) {
    await connection.end();
    connection = null;
  }
}

// Initialize database tables
export async function initializeDatabase() {
  const conn = await getConnection();
  
  try {
    // Users table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Groups table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        invite_code VARCHAR(10) UNIQUE NOT NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Group members table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS group_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_admin BOOLEAN DEFAULT FALSE,
        UNIQUE KEY unique_member (group_id, user_id),
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Messages table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT,
        image_url TEXT,
        message_type ENUM('text', 'image') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Streaks table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS streaks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT UNIQUE NOT NULL,
        current_streak INT DEFAULT 0,
        best_streak INT DEFAULT 0,
        last_activity_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
      )
    `);

    // Daily contributions table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS daily_contributions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        contribution_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_daily_contribution (group_id, user_id, contribution_date),
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Notifications table for persistence
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
      )
    `);

    // Add push_token column to users table
    await conn.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS push_token VARCHAR(255)
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}