const Database = require('../db');

const initializeMessagingTables = async () => {
    const db = new Database();
    let connection;
    
    try {
        console.log('🔄 Initializing messaging tables...');
        connection = await db.pool.getConnection();
        
        // Create conversations table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`conversations\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`type\` enum('direct','group','family','cross_family') NOT NULL DEFAULT 'direct',
                \`title\` varchar(255) DEFAULT NULL,
                \`description\` text DEFAULT NULL,
                \`family_id\` int(11) DEFAULT NULL,
                \`created_by\` int(11) NOT NULL,
                \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                KEY \`idx_conversations_family_id\` (\`family_id\`),
                KEY \`idx_conversations_created_by\` (\`created_by\`),
                CONSTRAINT \`conversations_ibfk_1\` FOREIGN KEY (\`family_id\`) REFERENCES \`families\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`conversations_ibfk_2\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Create conversation participants table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`conversation_participants\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`conversation_id\` int(11) NOT NULL,
                \`user_id\` int(11) NOT NULL,
                \`role\` enum('admin','member') NOT NULL DEFAULT 'member',
                \`joined_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`left_at\` timestamp NULL DEFAULT NULL,
                \`is_active\` tinyint(1) DEFAULT 1,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`unique_conversation_user\` (\`conversation_id\`, \`user_id\`),
                KEY \`idx_participants_conversation_id\` (\`conversation_id\`),
                KEY \`idx_participants_user_id\` (\`user_id\`),
                CONSTRAINT \`conversation_participants_ibfk_1\` FOREIGN KEY (\`conversation_id\`) REFERENCES \`conversations\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`conversation_participants_ibfk_2\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Create messages table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`messages\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`conversation_id\` int(11) NOT NULL,
                \`sender_id\` int(11) NOT NULL,
                \`message_type\` enum('text','image','file','system') NOT NULL DEFAULT 'text',
                \`content\` text NOT NULL,
                \`file_path\` varchar(500) DEFAULT NULL,
                \`file_name\` varchar(255) DEFAULT NULL,
                \`file_size\` int(11) DEFAULT NULL,
                \`reply_to_message_id\` int(11) DEFAULT NULL,
                \`edited_at\` timestamp NULL DEFAULT NULL,
                \`is_deleted\` tinyint(1) DEFAULT 0,
                \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                KEY \`idx_messages_conversation_id\` (\`conversation_id\`),
                KEY \`idx_messages_sender_id\` (\`sender_id\`),
                KEY \`idx_messages_created_at\` (\`created_at\`),
                KEY \`idx_messages_reply_to\` (\`reply_to_message_id\`),
                CONSTRAINT \`messages_ibfk_1\` FOREIGN KEY (\`conversation_id\`) REFERENCES \`conversations\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`messages_ibfk_2\` FOREIGN KEY (\`sender_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`messages_ibfk_3\` FOREIGN KEY (\`reply_to_message_id\`) REFERENCES \`messages\` (\`id\`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Create message status table (for read receipts)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`message_status\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`message_id\` int(11) NOT NULL,
                \`user_id\` int(11) NOT NULL,
                \`status\` enum('sent','delivered','read') NOT NULL DEFAULT 'sent',
                \`status_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`unique_message_user_status\` (\`message_id\`, \`user_id\`),
                KEY \`idx_message_status_message_id\` (\`message_id\`),
                KEY \`idx_message_status_user_id\` (\`user_id\`),
                CONSTRAINT \`message_status_ibfk_1\` FOREIGN KEY (\`message_id\`) REFERENCES \`messages\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`message_status_ibfk_2\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Create message attachments table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`message_attachments\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`message_id\` int(11) NOT NULL,
                \`file_path\` varchar(500) NOT NULL,
                \`file_name\` varchar(255) NOT NULL,
                \`file_size\` int(11) NOT NULL,
                \`mime_type\` varchar(100) NOT NULL,
                \`uploaded_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                KEY \`idx_attachments_message_id\` (\`message_id\`),
                CONSTRAINT \`message_attachments_ibfk_1\` FOREIGN KEY (\`message_id\`) REFERENCES \`messages\` (\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✅ Messaging tables created successfully!');
        
        // Insert some sample conversations for testing
        console.log('🔄 Creating sample conversations...');
        
        // Sample family group conversation
        const familyConversation = await connection.query(`
            INSERT INTO conversations (type, title, description, family_id, created_by) 
            VALUES ('family', 'Familie Chat', 'Hoofdchat voor het hele gezin', 1, 1)
        `);
        
        const familyConvId = familyConversation[0].insertId;
        
        // Add family members to conversation
        await connection.query(`
            INSERT INTO conversation_participants (conversation_id, user_id, role) 
            VALUES 
                (${familyConvId}, 1, 'admin'),
                (${familyConvId}, 2, 'admin'),
                (${familyConvId}, 3, 'member'),
                (${familyConvId}, 4, 'member')
        `);
        
        // Sample welcome message
        await connection.query(`
            INSERT INTO messages (conversation_id, sender_id, message_type, content) 
            VALUES (${familyConvId}, 1, 'system', 'Welkom in de familie chat! Hier kunnen we allemaal samen berichten sturen.')
        `);
        
        console.log('✅ Sample conversations created!');
        
    } catch (error) {
        console.error('❌ Error initializing messaging tables:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Run if called directly
if (require.main === module) {
    initializeMessagingTables()
        .then(() => {
            console.log('🎉 Messaging tables initialization completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Failed to initialize messaging tables:', error);
            process.exit(1);
        });
}

module.exports = initializeMessagingTables; 