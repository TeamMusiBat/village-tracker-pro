-- Track4Health Database Schema
-- This file contains the SQL schema for the Track4Health application database
-- Import this file in phpMyAdmin to set up the database schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('developer', 'master', 'fmt', 'sm') NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  is_online BOOLEAN DEFAULT FALSE,
  last_active DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User locations table
CREATE TABLE IF NOT EXISTS user_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Awareness sessions table
CREATE TABLE IF NOT EXISTS awareness_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  session_date DATE NOT NULL,
  session_number VARCHAR(50),
  target_group VARCHAR(100),
  created_by INT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  images TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Attendees table
CREATE TABLE IF NOT EXISTS attendees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  father_or_husband_name VARCHAR(100) NOT NULL,
  gender ENUM('Male', 'Female') NOT NULL,
  age_years INT,
  date_of_birth DATE,
  children_under_five INT,
  vaccination_status VARCHAR(50),
  vaccine_due BOOLEAN,
  vaccine_card_image TEXT,
  contact_number VARCHAR(20),
  remarks TEXT,
  images TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES awareness_sessions(id) ON DELETE CASCADE
);

-- Child screening table
CREATE TABLE IF NOT EXISTS child_screenings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  screening_date DATE NOT NULL,
  created_by INT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  images TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Screened children table
CREATE TABLE IF NOT EXISTS screened_children (
  id INT AUTO_INCREMENT PRIMARY KEY,
  screening_id INT NOT NULL,
  child_name VARCHAR(100) NOT NULL,
  father_name VARCHAR(100) NOT NULL,
  gender ENUM('Male', 'Female') NOT NULL,
  date_of_birth DATE,
  age_months INT,
  height DECIMAL(5, 2),
  weight DECIMAL(5, 2),
  muac DECIMAL(5, 2),
  nutrition_status ENUM('Normal', 'MAM', 'SAM') NOT NULL,
  referred BOOLEAN DEFAULT FALSE,
  images TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (screening_id) REFERENCES child_screenings(id) ON DELETE CASCADE
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id INT NOT NULL,
  image_url TEXT,
  published BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Offline sync items table
CREATE TABLE IF NOT EXISTS pending_sync_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_data JSON NOT NULL,
  synced BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add a default developer user (password: admin123)
INSERT INTO users (username, password, role, name, email, is_online) 
VALUES ('admin', '$2a$10$qrTYcuUUJqgQAXc6ERT07.4f8JFP9u2XNY/TAOBQmUhPW0Vg.xNsi', 'developer', 'System Admin', 'admin@track4health.com', false);