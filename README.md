# Track4Health - Deployment Guide for Hostinger

This guide will help you deploy the Track4Health application on Hostinger using MySQL database.

## Prerequisites

- A Hostinger hosting account with:
  - PHP support
  - MySQL database
  - Node.js support (or use Node.js hosting)
  - SSH access (recommended but not required)

## Database Setup

1. **Import the database schema**:
   - Log in to your Hostinger control panel
   - Go to MySQL Databases
   - Create a new database or use your existing `u769157863_track4health` database
   - Open phpMyAdmin
   - Select your database
   - Go to the "Import" tab
   - Upload the `database_export.sql` file from this project
   - Click "Go" to import the schema and initial data

2. **Verify database installation**:
   - Check that the tables were created successfully
   - Verify the developer account was created (username: asifjamali83)

## Application Deployment

### Option 1: Using Git (Recommended)

1. Clone this repository to your Hostinger server using SSH:
   ```bash
   git clone https://github.com/yourusername/track4health.git
   cd track4health
   npm install
   npm run build
   ```

2. Configure the environment variables:
   - Create or edit the `.env` file with your database credentials:
   ```
   DB_HOST=srv1135.hstgr.io
   DB_USER=u769157863_track4health
   DB_PASSWORD=Atifkhan83##
   DB_DATABASE=u769157863_track4health
   DB_PORT=3306
   SESSION_SECRET=track4health_secure_session_key
   PORT=3000
   NODE_ENV=production
   DATABASE_URL=mysql://u769157863_track4health:Atifkhan83##@srv1135.hstgr.io:3306/u769157863_track4health
   ```

3. Start the application:
   ```bash
   npm start
   ```

### Option 2: Manual Upload

1. Download a ZIP of this repository
2. Upload the files to your Hostinger web hosting
3. Extract the ZIP file on the server
4. Install dependencies:
   ```bash
   npm install
   npm run build
   ```
5. Configure the `.env` file as described above
6. Set up a Node.js application through Hostinger's control panel pointing to your app's directory
7. Start the application

## Verifying the Installation

1. Visit your domain name in a browser
2. You should see the Track4Health login page
3. Log in with the default developer account:
   - Username: asifjamali83
   - Password: Atifkhan83##
4. You should now be able to access the dashboard

## Troubleshooting

- If you see a database connection error, check your database credentials in the `.env` file
- If the application doesn't start, check the server logs for any errors
- Make sure your Hostinger plan supports Node.js applications
- If you're having issues, contact Hostinger support or refer to their documentation

## Security Notes

- Change the `SESSION_SECRET` in the `.env` file to a random secure string
- Consider changing the default developer account password after first login
- Implement HTTPS for your domain

## Additional Information

This application is now configured to use the Hostinger MySQL database. The database schema and connection parameters have been optimized for Hostinger's environment.