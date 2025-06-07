import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '@shared/schema';
import { log } from './vite';
import { sql } from 'drizzle-orm';

// Create a MySQL connection pool
const poolConnection = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 20,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize Drizzle with the connection
export const db = drizzle(poolConnection, { schema, mode: 'default' });

// Test the database connection
export async function testDrizzleConnection() {
  try {
    // Simple query to test the connection
    await poolConnection.query('SELECT 1');
    log('Drizzle database connection successful', 'database');
    return true;
  } catch (error) {
    log(`Drizzle database connection failed: ${(error as Error).message}`, 'database');
    return false;
  }
}