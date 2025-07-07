#!/usr/bin/env node

/**
 * PointsFam Startup Script
 * Handles database connection with fallback options
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting PointsFam Application...');
console.log('====================================');

// Check environment
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3000;

console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
console.log(`Port: ${port}`);

// Database configuration check
if (process.env.DB_HOST) {
    console.log(`Database: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
} else if (isProduction) {
    console.log('Database: Using fallback cloud database');
} else {
    console.log('Database: localhost:3306 (ensure MySQL is running)');
}

console.log('====================================');

// Start the application
const child = spawn('node', ['index.js'], {
    stdio: 'inherit',
    env: process.env
});

child.on('error', (err) => {
    console.error('❌ Failed to start application:', err.message);
    process.exit(1);
});

child.on('exit', (code) => {
    if (code !== 0) {
        console.error(`❌ Application exited with code ${code}`);
        
        if (!isProduction) {
            console.log('\n💡 Quick fixes:');
            console.log('1. Install MySQL: https://dev.mysql.com/downloads/mysql/');
            console.log('2. Or use XAMPP: https://www.apachefriends.org/download.html');
            console.log('3. Check QUICK_DATABASE_SETUP.md for detailed instructions');
        }
        
        process.exit(code);
    }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    child.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down gracefully...');
    child.kill('SIGTERM');
}); 