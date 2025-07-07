# PointsFam Deployment Guide

## Render Deployment

### Prerequisites
- MySQL database (e.g., from PlanetScale, MySQL.com, or other cloud providers)
- Render account

### Step 1: Set up Database
1. Create a MySQL database on your preferred cloud provider
2. Note down the connection details:
   - Host
   - User
   - Password
   - Database name
   - Port (usually 3306)

### Step 2: Deploy to Render
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Configure the following environment variables:
   ```
   NODE_ENV=production
   DB_HOST=your-mysql-host
   DB_USER=your-mysql-user
   DB_PASSWORD=your-mysql-password
   DB_NAME=pointsfam
   DB_PORT=3306
   ```

### Step 3: Database Setup
1. Import the database schema from `database/pointsfam.sql`
2. Create initial test accounts or use the registration system

### Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| NODE_ENV | Environment mode | production |
| DB_HOST | MySQL host | dpg-xyz.oregon-postgres.render.com |
| DB_USER | MySQL username | pointsfam_user |
| DB_PASSWORD | MySQL password | your-secure-password |
| DB_NAME | Database name | pointsfam |
| DB_PORT | MySQL port | 3306 |

### Build Commands
- Build Command: `npm install`
- Start Command: `npm start`

### Common Issues

1. **Database Connection Error**: Make sure all environment variables are set correctly
2. **Port Issues**: Render automatically assigns the PORT environment variable
3. **File Uploads**: Profile images will be stored in the container (temporary)

### Local Development
1. Install dependencies: `npm install`
2. Set up local MySQL database
3. Import schema: `mysql -u root -p pointsfam < database/pointsfam.sql`
4. Start server: `npm start`
5. Access at: `http://localhost:3000`

### Test Accounts
- Parent: username=parent1, password=password123
- Child: username=child1, password=password123 