-- Database Schema for Photo Sharing and Streaks App
-- Execute this script to create all necessary tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  avatar_url TEXT,
  push_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  invite_code VARCHAR(10) UNIQUE NOT NULL,
  created_by INT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_admin BOOLEAN DEFAULT FALSE,
  UNIQUE KEY unique_member (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages table - Enhanced for better image handling
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT,
  image_url TEXT,
  image_filename VARCHAR(255),
  image_size INT,
  message_type ENUM('text', 'image') NOT NULL,
  reply_to_message_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to_message_id) REFERENCES messages(id) ON DELETE SET NULL,
  INDEX idx_group_created (group_id, created_at),
  INDEX idx_message_type (message_type),
  INDEX idx_image_messages (group_id, message_type, created_at)
);

-- Wall photos table - For the photo collage feature
CREATE TABLE IF NOT EXISTS wall_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  message_id INT NOT NULL,
  user_id INT NOT NULL,
  image_url TEXT NOT NULL,
  image_filename VARCHAR(255),
  caption TEXT,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_wall_photo (group_id, message_id),
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_group_created (group_id, created_at DESC)
);

-- Wall photo likes table
CREATE TABLE IF NOT EXISTS wall_photo_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  wall_photo_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_like (wall_photo_id, user_id),
  FOREIGN KEY (wall_photo_id) REFERENCES wall_photos(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Streaks table
CREATE TABLE IF NOT EXISTS streaks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT UNIQUE NOT NULL,
  current_streak INT DEFAULT 0,
  best_streak INT DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Daily contributions table
CREATE TABLE IF NOT EXISTS daily_contributions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  contribution_date DATE NOT NULL,
  contribution_type ENUM('message', 'photo') DEFAULT 'message',
  message_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_daily_contribution (group_id, user_id, contribution_date),
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL,
  INDEX idx_contribution_date (contribution_date),
  INDEX idx_group_date (group_id, contribution_date)
);

-- Notifications table for persistence
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  group_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSON,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  INDEX idx_user_unread (user_id, read_at),
  INDEX idx_created (created_at DESC)
);

-- User sessions table for authentication
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (session_token),
  INDEX idx_expires (expires_at)
);

-- Insert sample data for testing (optional)
-- Uncomment the following lines if you want to add test data

/*
-- Sample users
INSERT INTO users (username, email) VALUES 
('admin', 'admin@example.com'),
('user1', 'user1@example.com'),
('user2', 'user2@example.com');

-- Sample group
INSERT INTO groups (name, invite_code, created_by) VALUES 
('Grupo de Prueba', 'TEST123', 1);

-- Add users to group
INSERT INTO group_members (group_id, user_id, is_admin) VALUES 
(1, 1, TRUE),
(1, 2, FALSE),
(1, 3, FALSE);

-- Initialize streak for the group
INSERT INTO streaks (group_id) VALUES (1);
*/