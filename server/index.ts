import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import bcrypt from "bcryptjs";
import { db, testDrizzleConnection } from "./db";
import { storage } from "./storage";
import { migrate } from "../migrations/migrate";
import { initializeDefaultData } from "./routes/initData";
import MySQLStore from "express-mysql-session";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Test database connection and run migrations
(async () => {
  try {
    const isConnected = await testDrizzleConnection();
    if (isConnected) {
      log("MySQL database connection successful", "database");
      
      // Run database migrations
      log("Running database migrations...", "database");
      await migrate();
      log("Database migrations completed successfully", "database");
      
      // We're already using DatabaseStorage implementation which connects to MySQL
      log("Using MySQL database storage", "database");
      
      // Initialize default data (create developer account if it doesn't exist)
      log("Creating default users...", "database");
      await initializeDefaultData();
    } else {
      log("MySQL database connection failed - falling back to in-memory storage", "database");
      // We'll continue with the default DatabaseStorage, but it won't be able to connect
    }
  } catch (error) {
    console.error("MySQL database initialization error:", error);
    log("MySQL database initialization error - falling back to in-memory storage", "database");
  }
})();

// Create MySQL session store
const MySQLStoreInstance = MySQLStore(session);

// Parse the DATABASE_URL to get individual components
const dbUrl = new URL(process.env.DATABASE_URL!);
const dbName = dbUrl.pathname.substring(1); // Remove leading '/'

// Session configuration
app.use(session({
  store: new MySQLStoreInstance({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port || '3306'),
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbName,
    ssl: {
      rejectUnauthorized: false
    },
    createDatabaseTable: true, // Create the session table if it doesn't exist
    schema: {
      tableName: 'sessions',
      columnNames: {
        session_id: 'session_id',
        expires: 'expires',
        data: 'data'
      }
    }
  }),
  secret: process.env.SESSION_SECRET || "track4health_secure_session_key",
  resave: false,
  saveUninitialized: false,
  name: 'track4health_session',
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Only use secure in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
