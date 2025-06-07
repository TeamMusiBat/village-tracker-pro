import { db } from '../server/db';
import * as schema from '../shared/schema';
import { log } from '../server/vite';
import { sql } from 'drizzle-orm';

async function migrate() {
  try {
    log('Starting database migration...', 'database');

    // Create tables - MySQL Version
    log('Creating users table...', 'database');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role ENUM('developer', 'master', 'fmt', 'sm') NOT NULL,
        email VARCHAR(100),
        is_online BOOLEAN DEFAULT FALSE,
        last_active DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    log('Creating user_locations table...', 'database');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    log('Creating awareness_sessions table...', 'database');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS awareness_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        session_date DATETIME NOT NULL,
        session_number VARCHAR(50),
        target_group VARCHAR(100),
        created_by INT NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        images TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    log('Creating attendees table...', 'database');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS attendees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        father_or_husband_name VARCHAR(100) NOT NULL,
        gender ENUM('Male', 'Female'),
        age_years INT,
        date_of_birth DATETIME,
        children_under_five INT,
        vaccination_status VARCHAR(50),
        vaccine_due BOOLEAN,
        vaccine_card_image TEXT,
        contact_number VARCHAR(20),
        remarks TEXT,
        images TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    log('Creating child_screenings table...', 'database');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS child_screenings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        screening_date DATETIME NOT NULL,
        created_by INT NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        images TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    log('Creating screened_children table...', 'database');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS screened_children (
        id INT AUTO_INCREMENT PRIMARY KEY,
        screening_id INT NOT NULL,
        child_name VARCHAR(100) NOT NULL,
        father_name VARCHAR(100) NOT NULL,
        gender ENUM('Male', 'Female') NOT NULL,
        date_of_birth DATETIME,
        age_months INT,
        height DECIMAL(5, 2),
        weight DECIMAL(5, 2),
        muac DECIMAL(5, 2),
        nutrition_status ENUM('Normal', 'MAM', 'SAM') NOT NULL,
        referred BOOLEAN DEFAULT FALSE,
        images TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    log('Creating blogs table...', 'database');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS blogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        author_id INT NOT NULL,
        image_url TEXT,
        published BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    log('Creating pending_sync_items table...', 'database');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pending_sync_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_data JSON NOT NULL,
        synced BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME
      );
    `);
    
    log('Creating default users...', 'database');
    // Create the specific developer account as requested by user
    // Username: asifjamali83, Password: Atifkhan83##
    try {
      await db.execute(sql`
        INSERT INTO users (username, password, name, role, email, is_online)
        SELECT 'asifjamali83', '$2a$10$DmY0yvFhvx4GS4wJAWq/7.F7G5nbsQH1cQSQDVJ3cnC3CW/vwrgzS', 'Asif Jamali', 'developer', '', false
        FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'asifjamali83');
      `);
    } catch (err) {
      log(`Developer user already exists or could not be created: ${(err as Error).message}`, 'database');
    }
    
    // Create a default admin user if none exists
    // Username: admin, Password: admin123
    try {
      await db.execute(sql`
        INSERT INTO users (username, password, name, role, email, is_online)
        SELECT 'admin', '$2a$10$1/2OxR.R/ouc/YmWLHrVPepfYTnp8U/BP9XvcR5J9VKFT2zV.yXTG', 'Administrator', 'developer', 'admin@track4health.org', false
        FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
      `);
    } catch (err) {
      log(`Admin user already exists or could not be created: ${(err as Error).message}`, 'database');
    }
    
    log('Database migration completed successfully', 'database');
  } catch (error) {
    log(`Database migration failed: ${(error as Error).message}`, 'database');
    throw error;
  }
}

// Export the migrate function
export { migrate };

// Run the migration if this script is executed directly
// ES module version of "if this is the main module"
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this is the entry point
if (process.argv[1] === __filename) {
  migrate()
    .then(() => {
      console.log('Migration complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}