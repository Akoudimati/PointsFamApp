const Database = require('./db.js');
const fs = require('fs');
const path = require('path');

async function createBackup() {
    try {
        const db = new Database();
        
        // Wait a moment for the database to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('✅ Connected to database');
        
        // Get all tables data
        const tables = [
            'users', 
            'families', 
            'conversations', 
            'conversation_participants', 
            'messages', 
            'message_status', 
            'tasks', 
            'task_assignments', 
            'rewards', 
            'reward_redemptions', 
            'points_transactions', 
            'profile_images'
        ];
        
        let backupData = {};
        
        for (const table of tables) {
            try {
                const [rows] = await db.pool.query(`SELECT * FROM ${table}`);
                backupData[table] = rows;
                console.log(`✅ Backed up ${table}: ${rows.length} records`);
            } catch (error) {
                console.log(`⚠️  Table ${table} not found or error: ${error.message}`);
                backupData[table] = [];
            }
        }
        
        // Create backup directory if it doesn't exist
        const backupDir = path.join(__dirname, 'database_backup');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        // Save JSON backup
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const jsonFilename = path.join(backupDir, `pointsfam_backup_${timestamp}.json`);
        
        fs.writeFileSync(jsonFilename, JSON.stringify(backupData, null, 2));
        console.log(`✅ JSON backup saved to: ${jsonFilename}`);
        
        // Create SQL backup
        const sqlBackup = [];
        sqlBackup.push('-- PointsFam Database Backup');
        sqlBackup.push(`-- Created: ${new Date().toISOString()}`);
        sqlBackup.push('-- ========================================');
        sqlBackup.push('');
        
        for (const [tableName, rows] of Object.entries(backupData)) {
            if (rows.length > 0) {
                const columns = Object.keys(rows[0]);
                sqlBackup.push(`-- Table: ${tableName}`);
                sqlBackup.push(`DELETE FROM ${tableName};`);
                
                for (const row of rows) {
                    const values = columns.map(col => {
                        const val = row[col];
                        if (val === null) return 'NULL';
                        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                        if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                        return val;
                    });
                    sqlBackup.push(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`);
                }
                sqlBackup.push('');
            }
        }
        
        const sqlFilename = path.join(backupDir, `pointsfam_backup_${timestamp}.sql`);
        fs.writeFileSync(sqlFilename, sqlBackup.join('\n'));
        console.log(`✅ SQL backup saved to: ${sqlFilename}`);
        
        // Show summary
        console.log('\n📊 Backup Summary:');
        console.log('==================');
        let totalRecords = 0;
        for (const [tableName, rows] of Object.entries(backupData)) {
            if (rows.length > 0) {
                console.log(`${tableName}: ${rows.length} records`);
                totalRecords += rows.length;
            }
        }
        console.log(`Total records: ${totalRecords}`);
        
        // Show message data specifically
        if (backupData.messages && backupData.messages.length > 0) {
            console.log('\n💬 Message Data Sample:');
            console.log('=======================');
            backupData.messages.slice(0, 3).forEach((msg, i) => {
                console.log(`Message ${i + 1}: "${msg.content}" by user ${msg.sender_id}`);
            });
        }
        
        await db.close();
        console.log('\n🎉 Backup completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Backup failed:', error);
        process.exit(1);
    }
}

createBackup(); 