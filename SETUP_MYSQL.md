# MySQL Setup Guide for PointsFam App

## Prerequisites

1. **MySQL Server**: Make sure MySQL is installed and running on your system
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Or install via package manager (e.g., Homebrew on Mac, Chocolatey on Windows)

2. **MySQL Root Access**: You'll need root access with no password (or update the configuration)

## Database Configuration

The application is configured to connect to MySQL using these settings (defined in `db.js`):

```javascript
host: 'localhost'
user: 'root'
password: ''
database: 'pointsfam'
port: 3306
```

**Note**: If your MySQL setup is different, update the connection settings in:
- `db.js` (line 11-16)
- `scripts/init-database.js` (line 9-13)

## Setup Steps

### 1. Verify MySQL Connection

Test your MySQL connection:
```bash
mysql -u root -p
```

If you have no password set, just press Enter when prompted.

### 2. Initialize Database

Run the database initialization script:
```bash
npm run init-db
```

This will:
- Create the `pointsfam` database
- Create all necessary tables
- Insert sample data with test users

### 3. Start the Application

```bash
npm start
```

The application will be running on http://localhost:3000

## Test Login Credentials

After successful database initialization, you can use these test accounts:

- **Parent Account**: 
  - Username: `parent1`
  - Password: `password123`

- **Child Account 1**: 
  - Username: `child1` 
  - Password: `password123`

- **Child Account 2**: 
  - Username: `child2`
  - Password: `password123`

## Troubleshooting

### Connection Issues

If you get connection errors:

1. **Check MySQL Service**: Make sure MySQL is running
   - Windows: Check Services or run `net start mysql`
   - Mac/Linux: `sudo systemctl start mysql` or `brew services start mysql`

2. **Check MySQL Configuration**: The app expects:
   - Host: localhost
   - User: root
   - Password: (empty)
   - Port: 3306

3. **Update Configuration**: If your MySQL setup is different, edit these files:
   - `db.js` - Update the connection pool configuration
   - `scripts/init-database.js` - Update the connection settings

### Database Initialization Errors

If the database initialization fails:

1. **Check Permissions**: Make sure your MySQL user has CREATE DATABASE privileges
2. **Check Existing Database**: If database exists, the script will recreate it
3. **Manual Setup**: You can also create the database manually:

```bash
mysql -u root -p
CREATE DATABASE pointsfam;
```

Then run `npm run init-db` again.

### Port Already in Use

If you get "EADDRINUSE" error:

1. **Stop existing processes**:
   ```bash
   # Windows
   taskkill /F /IM node.exe

   # Mac/Linux  
   killall node
   ```

2. **Or use a different port**: Edit `index.js` and change `const PORT = 3000;` to another port.

## Configuration Files

- **Database Class**: `db.js` - Main database connection and operations
- **Initialization**: `scripts/init-database.js` - Database setup script
- **Server**: `index.js` - Main application server

## Support

If you encounter issues:
1. Make sure MySQL server is running
2. Verify the connection settings match your MySQL setup
3. Check that the MySQL user has proper permissions
4. Look at the console output for specific error messages

The application uses connection pooling for better performance and handles all database operations through the `Database` class in `db.js`. 