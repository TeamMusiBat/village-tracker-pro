/**
 * Hostinger Deployment Configuration
 * 
 * This file contains specific configuration for Hostinger hosting deployment.
 * It should be included in the root directory of the project when deploying to Hostinger.
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file
const envResult = dotenv.config();
if (envResult.error) {
  console.error('Error loading .env file:', envResult.error);
}

// Database configuration
const databaseConfig = {
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  user: process.env.DB_USER || process.env.PGUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
  database: process.env.DB_DATABASE || process.env.PGDATABASE || 'track4health',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 
        (process.env.PGPORT ? parseInt(process.env.PGPORT) : 3306),
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0
};

// Server configuration
const serverConfig = {
  port: process.env.PORT || 5000,
  sessionSecret: process.env.SESSION_SECRET || 'track4health-secret-key',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
};

// Check if we have a valid database connection
function validateDatabaseConfig() {
  const { host, user, password, database } = databaseConfig;
  if (!host || !user || !database) {
    console.error('Missing required database configuration parameters');
    console.error('Please ensure the following environment variables are set:');
    console.error('DB_HOST, DB_USER, DB_DATABASE (or their PGXXX alternatives)');
    return false;
  }
  return true;
}

// Export the configuration
module.exports = {
  databaseConfig,
  serverConfig,
  validateDatabaseConfig
};

// Run validation if this file is executed directly
if (require.main === module) {
  console.log('Validating Hostinger deployment configuration...');
  
  // Validate environment file
  if (!fs.existsSync(path.join(__dirname, '.env'))) {
    console.warn('Warning: .env file not found. Using default configuration.');
  }
  
  // Validate database config
  if (validateDatabaseConfig()) {
    console.log('Database configuration valid.');
    console.log('Host:', databaseConfig.host);
    console.log('Database:', databaseConfig.database);
    console.log('Port:', databaseConfig.port);
  }
  
  console.log('Server configuration:');
  console.log('Port:', serverConfig.port);
  console.log('Secure:', serverConfig.secure);
}