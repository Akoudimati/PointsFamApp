const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

console.log('🚀 Initializing PointsFam MySQL database...');

const initializeDatabase = async () => {
    let connection;
    
    try {
        // Create connection without specifying database first
        connection = await mysql.createConnection({
            host: 'mysql-3dfa6410-student-b14a.h.aivencloud.com',
            user: 'avnadmin',
            password: 'AVNS_YybduGVk3kmayJuZByo',
            port: 15421,
            charset: 'utf8mb4',
            ssl: {
                rejectUnauthorized: false
            }
        });

        console.log('✅ Connected to MySQL server');

        // Create database if it doesn't exist
        const dbName = 'pointsfam';
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ Database '${dbName}' created or already exists`);

        // Switch to the database
        await connection.query(`USE \`${dbName}\``);
        console.log(`✅ Using database '${dbName}'`);

        // Drop existing tables if they exist (to reset)
        // Disable foreign key checks to allow dropping tables with dependencies
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        
        const tablesToDrop = [
            'message_status', 'messages', 'conversation_participants', 'conversations',
            'reward_redemptions', 'points_transactions', 'task_assignments', 
            'rewards', 'tasks', 'standard_tasks', 'users', 'families', 'user_sessions'
        ];

        for (const table of tablesToDrop) {
            await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
        }
        
        // Re-enable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('📝 Creating database tables...');

        // Create tables in the correct order
        await connection.query(`
            CREATE TABLE \`families\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`name\` varchar(255) NOT NULL,
                \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await connection.query(`
            CREATE TABLE \`users\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`username\` varchar(100) NOT NULL,
                \`password_hash\` varchar(255) NOT NULL,
                \`first_name\` varchar(100) NOT NULL,
                \`last_name\` varchar(100) NOT NULL,
                \`role\` enum('parent','child') NOT NULL,
                \`family_id\` int(11) NOT NULL,
                \`points\` int(11) DEFAULT 0,
                \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`username\` (\`username\`),
                KEY \`idx_users_family_id\` (\`family_id\`),
                CONSTRAINT \`users_ibfk_1\` FOREIGN KEY (\`family_id\`) REFERENCES \`families\` (\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await connection.query(`
            CREATE TABLE \`tasks\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`family_id\` int(11) NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`description\` text DEFAULT NULL,
                \`points\` int(11) NOT NULL,
                \`category\` varchar(100) DEFAULT 'household',
                \`is_custom\` tinyint(1) DEFAULT 0,
                \`is_active\` tinyint(1) DEFAULT 1,
                \`created_by\` int(11) NOT NULL,
                \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                KEY \`idx_tasks_family_id\` (\`family_id\`),
                KEY \`created_by\` (\`created_by\`),
                CONSTRAINT \`tasks_ibfk_1\` FOREIGN KEY (\`family_id\`) REFERENCES \`families\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`tasks_ibfk_2\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await connection.query(`
            CREATE TABLE \`task_assignments\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`task_id\` int(11) NOT NULL,
                \`assigned_to\` int(11) NOT NULL,
                \`assigned_by\` int(11) NOT NULL,
                \`status\` enum('pending','completed','approved','rejected') DEFAULT 'pending',
                \`completed_at\` timestamp NULL DEFAULT NULL,
                \`approved_at\` timestamp NULL DEFAULT NULL,
                \`approved_by\` int(11) DEFAULT NULL,
                \`points_awarded\` int(11) DEFAULT NULL,
                \`notes\` text DEFAULT NULL,
                \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                KEY \`task_id\` (\`task_id\`),
                KEY \`assigned_by\` (\`assigned_by\`),
                KEY \`approved_by\` (\`approved_by\`),
                KEY \`idx_task_assignments_assigned_to\` (\`assigned_to\`),
                CONSTRAINT \`task_assignments_ibfk_1\` FOREIGN KEY (\`task_id\`) REFERENCES \`tasks\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`task_assignments_ibfk_2\` FOREIGN KEY (\`assigned_to\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`task_assignments_ibfk_3\` FOREIGN KEY (\`assigned_by\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`task_assignments_ibfk_4\` FOREIGN KEY (\`approved_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await connection.query(`
            CREATE TABLE \`points_transactions\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`user_id\` int(11) NOT NULL,
                \`points\` int(11) NOT NULL,
                \`transaction_type\` enum('earned','bonus','redeemed','penalty') NOT NULL,
                \`description\` varchar(500) NOT NULL,
                \`task_assignment_id\` int(11) DEFAULT NULL,
                \`reward_id\` int(11) DEFAULT NULL,
                \`created_by\` int(11) DEFAULT NULL,
                \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                KEY \`task_assignment_id\` (\`task_assignment_id\`),
                KEY \`created_by\` (\`created_by\`),
                KEY \`idx_points_transactions_user_id\` (\`user_id\`),
                CONSTRAINT \`points_transactions_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`points_transactions_ibfk_2\` FOREIGN KEY (\`task_assignment_id\`) REFERENCES \`task_assignments\` (\`id\`) ON DELETE SET NULL,
                CONSTRAINT \`points_transactions_ibfk_3\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await connection.query(`
            CREATE TABLE \`rewards\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`family_id\` int(11) NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`description\` text DEFAULT NULL,
                \`points_required\` int(11) NOT NULL,
                \`category\` varchar(100) DEFAULT 'privilege',
                \`is_active\` tinyint(1) DEFAULT 1,
                \`created_by\` int(11) NOT NULL,
                \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                KEY \`created_by\` (\`created_by\`),
                KEY \`idx_rewards_family_id\` (\`family_id\`),
                CONSTRAINT \`rewards_ibfk_1\` FOREIGN KEY (\`family_id\`) REFERENCES \`families\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`rewards_ibfk_2\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await connection.query(`
            CREATE TABLE \`reward_redemptions\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`reward_id\` int(11) NOT NULL,
                \`redeemed_by\` int(11) NOT NULL,
                \`points_spent\` int(11) NOT NULL,
                \`approved_by\` int(11) DEFAULT NULL,
                \`approved_at\` timestamp NULL DEFAULT NULL,
                \`notes\` text DEFAULT NULL,
                \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                KEY \`reward_id\` (\`reward_id\`),
                KEY \`redeemed_by\` (\`redeemed_by\`),
                KEY \`approved_by\` (\`approved_by\`),
                CONSTRAINT \`reward_redemptions_ibfk_1\` FOREIGN KEY (\`reward_id\`) REFERENCES \`rewards\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`reward_redemptions_ibfk_2\` FOREIGN KEY (\`redeemed_by\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`reward_redemptions_ibfk_3\` FOREIGN KEY (\`approved_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await connection.query(`
            CREATE TABLE \`standard_tasks\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`name\` varchar(255) NOT NULL,
                \`description\` text DEFAULT NULL,
                \`default_points\` int(11) NOT NULL,
                \`category\` varchar(100) DEFAULT 'household',
                \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await connection.query(`
            CREATE TABLE \`user_sessions\` (
                \`id\` varchar(255) NOT NULL,
                \`user_id\` int(11) NOT NULL,
                \`expires_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                KEY \`user_id\` (\`user_id\`),
                CONSTRAINT \`user_sessions_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Create conversations table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS conversations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                type ENUM('family', 'group', 'direct', 'cross_family') NOT NULL DEFAULT 'direct',
                title VARCHAR(255),
                description TEXT,
                family_id INT,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Create conversation_participants table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS conversation_participants (
                conversation_id INT NOT NULL,
                user_id INT NOT NULL,
                role ENUM('admin', 'moderator', 'member') NOT NULL DEFAULT 'member',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                PRIMARY KEY (conversation_id, user_id),
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Create messages table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT PRIMARY KEY AUTO_INCREMENT,
                conversation_id INT NOT NULL,
                sender_id INT NOT NULL,
                message_type ENUM('text', 'image', 'file', 'system') NOT NULL DEFAULT 'text',
                content TEXT NOT NULL,
                file_path VARCHAR(500),
                file_name VARCHAR(255),
                file_size BIGINT,
                reply_to_message_id INT,
                is_deleted TINYINT(1) NOT NULL DEFAULT 0,
                is_edited TINYINT(1) NOT NULL DEFAULT 0,
                edited_at TIMESTAMP NULL DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (reply_to_message_id) REFERENCES messages(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Create message_status table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS message_status (
                id INT PRIMARY KEY AUTO_INCREMENT,
                message_id INT NOT NULL,
                user_id INT NOT NULL,
                status ENUM('delivered', 'read') NOT NULL DEFAULT 'delivered',
                status_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_message_user_status (message_id, user_id),
                FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Create family conversation for each family
        await connection.query(`
            INSERT IGNORE INTO conversations (type, family_id, created_at)
            SELECT 'family', id, NOW()
            FROM families
            WHERE id NOT IN (SELECT family_id FROM conversations WHERE type = 'family' AND family_id IS NOT NULL);
        `);

        // Add all family members to their family conversation
        await connection.query(`
            INSERT IGNORE INTO conversation_participants (conversation_id, user_id, role)
            SELECT c.id, u.id, 'member'
            FROM conversations c
            JOIN users u ON u.family_id = c.family_id
            WHERE c.type = 'family'
            AND NOT EXISTS (
                SELECT 1 FROM conversation_participants cp 
                WHERE cp.conversation_id = c.id AND cp.user_id = u.id
            );
        `);

        console.log('✅ Database tables created successfully');

        // Insert sample data
        console.log('📝 Inserting sample data...');

        // Insert families
        await connection.query(`
            INSERT INTO \`families\` (\`id\`, \`name\`, \`created_at\`) VALUES
            (1, 'The Johnson Family', '2025-07-04 19:58:11'),
            (2, 'Familie van der Berg', '2025-07-04 19:58:11'),
            (3, 'The Smith Family', '2025-07-04 19:58:11')
        `);

        // Insert users with hashed passwords
        const passwordHash = await bcrypt.hash('password123', 10);
        await connection.query(`
            INSERT INTO \`users\` (\`id\`, \`username\`, \`password_hash\`, \`first_name\`, \`last_name\`, \`role\`, \`family_id\`, \`points\`, \`created_at\`) VALUES
            (1, 'parent1', ?, 'John', 'Johnson', 'parent', 1, 0, '2025-07-04 19:58:11'),
            (2, 'parent2', ?, 'Jane', 'Johnson', 'parent', 1, 0, '2025-07-04 19:58:11'),
            (3, 'child1', ?, 'Emma', 'Johnson', 'child', 1, 150, '2025-07-04 19:58:11'),
            (4, 'child2', ?, 'Liam', 'Johnson', 'child', 1, 75, '2025-07-04 19:58:11'),
            (5, 'papa_berg', ?, 'Piet', 'van der Berg', 'parent', 2, 0, '2025-07-04 19:58:11'),
            (6, 'mama_berg', ?, 'Maria', 'van der Berg', 'parent', 2, 0, '2025-07-04 19:58:11'),
            (7, 'lisa_berg', ?, 'Lisa', 'van der Berg', 'child', 2, 200, '2025-07-04 19:58:11'),
            (8, 'tom_berg', ?, 'Tom', 'van der Berg', 'child', 2, 120, '2025-07-04 19:58:11'),
            (9, 'dad_smith', ?, 'David', 'Smith', 'parent', 3, 0, '2025-07-04 19:58:11'),
            (10, 'sarah_smith', ?, 'Sarah', 'Smith', 'child', 3, 95, '2025-07-04 19:58:11')
        `, [passwordHash, passwordHash, passwordHash, passwordHash, passwordHash, passwordHash, passwordHash, passwordHash, passwordHash, passwordHash]);

        // Insert standard tasks
        await connection.query(`
            INSERT INTO \`standard_tasks\` (\`id\`, \`name\`, \`description\`, \`default_points\`, \`category\`, \`created_at\`) VALUES
            (1, 'Vaatwasser inruimen', 'Alle schone vaat uit de vaatwasser halen en op de juiste plek zetten', 10, 'keuken', '2025-07-04 19:58:11'),
            (2, 'Kamer opruimen', 'Eigen kamer netjes maken en speelgoed opruimen', 15, 'slaapkamer', '2025-07-04 19:58:11'),
            (3, 'Hond uitlaten', 'De hond een wandeling geven van minimaal 15 minuten', 20, 'huisdieren', '2025-07-04 19:58:11'),
            (4, 'Tafel dekken', 'De eettafel klaarmaken voor het avondeten', 8, 'keuken', '2025-07-04 19:58:11'),
            (5, 'Stofzuigen woonkamer', 'De woonkamer stofzuigen', 12, 'schoonmaak', '2025-07-04 19:58:11'),
            (6, 'Huiswerk maken', 'Alle huiswerk voor school afmaken', 25, 'school', '2025-07-04 19:58:11')
        `);

        // Insert sample tasks
        await connection.query(`
            INSERT INTO \`tasks\` (\`id\`, \`family_id\`, \`name\`, \`description\`, \`points\`, \`category\`, \`is_custom\`, \`is_active\`, \`created_by\`, \`created_at\`) VALUES
            (1, 1, 'Vaatwasser inruimen', 'Alle schone vaat uit de vaatwasser halen en op de juiste plek zetten', 10, 'keuken', 0, 1, 1, '2025-07-04 19:58:11'),
            (2, 1, 'Kamer opruimen', 'Eigen kamer netjes maken en speelgoed opruimen', 15, 'slaapkamer', 0, 1, 1, '2025-07-04 19:58:11'),
            (3, 1, 'Hond uitlaten', 'De hond een wandeling geven van minimaal 15 minuten', 20, 'huisdieren', 0, 1, 1, '2025-07-04 19:58:11'),
            (4, 1, 'Huiswerk maken', 'Alle huiswerk voor school afmaken', 25, 'school', 0, 1, 1, '2025-07-04 19:58:11')
        `);

        // Insert sample rewards
        await connection.query(`
            INSERT INTO \`rewards\` (\`id\`, \`family_id\`, \`name\`, \`description\`, \`points_required\`, \`category\`, \`is_active\`, \`created_by\`, \`created_at\`) VALUES
            (1, 1, 'Kiezen wat we eten', 'Jij mag kiezen wat we vanavond eten', 100, 'eten', 1, 1, '2025-07-04 19:58:11'),
            (2, 1, 'Extra schermtijd', '1 uur extra tijd op tablet/computer', 150, 'entertainment', 1, 1, '2025-07-04 19:58:11'),
            (3, 1, 'Later naar bed', 'Op vrijdag 1 uur later naar bed', 200, 'privileges', 1, 1, '2025-07-04 19:58:11'),
            (4, 1, 'Ijsje halen', 'Samen ijsje halen bij de ijssalon', 75, 'treats', 1, 1, '2025-07-04 19:58:11')
        `);

        // Insert sample points transactions
        await connection.query(`
            INSERT INTO \`points_transactions\` (\`id\`, \`user_id\`, \`points\`, \`transaction_type\`, \`description\`, \`task_assignment_id\`, \`reward_id\`, \`created_by\`, \`created_at\`) VALUES
            (1, 3, 50, 'bonus', 'Welkom bonus', NULL, NULL, 1, '2025-07-04 19:58:11'),
            (2, 3, 100, 'earned', 'Taken deze week voltooid', NULL, NULL, 1, '2025-07-04 19:58:11'),
            (3, 4, 75, 'earned', 'Goed gedrag', NULL, NULL, 1, '2025-07-04 19:58:11'),
            (4, 7, 200, 'earned', 'Uitstekende prestaties', NULL, NULL, 5, '2025-07-04 19:58:11'),
            (5, 8, 120, 'earned', 'Taken voltooid', NULL, NULL, 5, '2025-07-04 19:58:11')
        `);

        // Insert sample conversations
        await connection.query(`
            INSERT INTO \`conversations\` (\`id\`, \`type\`, \`title\`, \`description\`, \`family_id\`, \`created_by\`, \`created_at\`, \`updated_at\`) VALUES
            (1, 'family', 'Familie Johnson Chat', 'Algemene familie chat voor The Johnson Family', 1, 1, '2025-07-07 10:00:00', '2025-07-07 12:30:00'),
            (2, 'family', 'Familie van der Berg', 'Familie gesprek voor dagelijkse zaken', 2, 5, '2025-07-07 09:00:00', '2025-07-07 11:45:00'),
            (3, 'direct', 'John & Emma', 'Direct gesprek tussen vader en dochter', NULL, 1, '2025-07-07 08:00:00', '2025-07-07 10:15:00'),
            (4, 'group', 'Ouders Support Groep', 'Ondersteuning voor ouders', NULL, 1, '2025-07-07 07:00:00', '2025-07-07 14:20:00'),
            (5, 'cross_family', 'Cross-Familie Chat', 'Gesprek tussen verschillende families', NULL, 1, '2025-07-07 06:00:00', '2025-07-07 13:10:00')
        `);

        // Insert conversation participants
        await connection.query(`
            INSERT INTO \`conversation_participants\` (\`conversation_id\`, \`user_id\`, \`role\`, \`joined_at\`, \`is_active\`) VALUES
            (1, 1, 'admin', '2025-07-07 10:00:00', 1),
            (1, 2, 'admin', '2025-07-07 10:00:00', 1),
            (1, 3, 'member', '2025-07-07 10:00:00', 1),
            (1, 4, 'member', '2025-07-07 10:00:00', 1),
            (2, 5, 'admin', '2025-07-07 09:00:00', 1),
            (2, 6, 'admin', '2025-07-07 09:00:00', 1),
            (2, 7, 'member', '2025-07-07 09:00:00', 1),
            (2, 8, 'member', '2025-07-07 09:00:00', 1),
            (3, 1, 'admin', '2025-07-07 08:00:00', 1),
            (3, 3, 'member', '2025-07-07 08:00:00', 1),
            (4, 1, 'admin', '2025-07-07 07:00:00', 1),
            (4, 2, 'member', '2025-07-07 07:00:00', 1),
            (4, 5, 'member', '2025-07-07 07:00:00', 1),
            (4, 6, 'member', '2025-07-07 07:00:00', 1),
            (5, 1, 'admin', '2025-07-07 06:00:00', 1),
            (5, 5, 'member', '2025-07-07 06:00:00', 1),
            (5, 9, 'member', '2025-07-07 06:00:00', 1)
        `);

        // Insert sample messages
        await connection.query(`
            INSERT INTO \`messages\` (\`id\`, \`conversation_id\`, \`sender_id\`, \`message_type\`, \`content\`, \`file_path\`, \`file_name\`, \`file_size\`, \`reply_to_message_id\`, \`is_deleted\`, \`is_edited\`, \`edited_at\`, \`created_at\`) VALUES
            (1, 1, 1, 'text', 'Hallo allemaal! Welkom in onze familie chat 👋', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 10:00:00'),
            (2, 1, 3, 'text', 'Hoi papa! Leuk dat we nu kunnen chatten 😊', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 10:05:00'),
            (3, 1, 2, 'text', 'Dit is heel handig om afspraken te maken!', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 10:10:00'),
            (4, 1, 4, 'text', 'Wanneer eten we vanavond?', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 12:30:00'),
            (5, 2, 5, 'text', 'Goedemorgen familie! Hoe gaat het met iedereen?', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 09:00:00'),
            (6, 2, 7, 'text', 'Goed papa! Ik ga vandaag mijn kamer opruimen 🧹', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 09:15:00'),
            (7, 2, 6, 'text', 'Vergeet je huiswerk niet Lisa!', NULL, NULL, NULL, 3, 0, 0, NULL, '2025-07-07 09:30:00'),
            (8, 2, 8, 'text', 'Mam, mag ik vrienden uitnodigen dit weekend?', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 11:45:00'),
            (9, 3, 1, 'text', 'Hoi Emma, hoe ging het op school vandaag?', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 08:00:00'),
            (10, 3, 3, 'text', 'Heel goed papa! Ik heb een 8 gehaald voor wiskunde! 🎉', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 08:15:00'),
            (11, 3, 1, 'text', 'Wat geweldig! Daar ben ik heel trots op! 👏', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 10:15:00'),
            (12, 4, 1, 'text', 'Hallo ouders! Welkom in onze support groep', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 07:00:00'),
            (13, 4, 5, 'text', 'Fijn dat dit er is! Hoe gaan jullie om met schermtijd?', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 09:30:00'),
            (14, 4, 2, 'text', 'Wij hebben vaste tijden ingesteld, werkt heel goed!', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 14:20:00'),
            (15, 5, 1, 'text', 'Hallo families! Zullen we een gezamenlijke activiteit organiseren?', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 06:00:00'),
            (16, 5, 5, 'text', 'Goed idee! Misschien een picknick in het park?', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 08:30:00'),
            (17, 5, 9, 'text', 'Dat klinkt leuk! Wanneer hadden jullie gedacht?', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 13:10:00')
        `);

        // Insert message status (some messages read, some unread)
        await connection.query(`
            INSERT INTO \`message_status\` (\`message_id\`, \`user_id\`, \`status\`, \`status_at\`) VALUES
            (1, 2, 'read', '2025-07-07 10:01:00'),
            (1, 3, 'read', '2025-07-07 10:02:00'),
            (1, 4, 'read', '2025-07-07 10:03:00'),
            (2, 1, 'read', '2025-07-07 10:06:00'),
            (2, 2, 'read', '2025-07-07 10:07:00'),
            (2, 4, 'read', '2025-07-07 10:08:00'),
            (3, 1, 'read', '2025-07-07 10:11:00'),
            (3, 3, 'read', '2025-07-07 10:12:00'),
            (3, 4, 'read', '2025-07-07 10:13:00'),
            (4, 1, 'read', '2025-07-07 12:31:00'),
            (4, 2, 'read', '2025-07-07 12:32:00'),
            (4, 3, 'read', '2025-07-07 12:33:00'),
            (9, 3, 'read', '2025-07-07 08:01:00'),
            (10, 1, 'read', '2025-07-07 08:16:00'),
            (11, 3, 'read', '2025-07-07 10:16:00'),
            (12, 5, 'read', '2025-07-07 07:01:00'),
            (12, 6, 'read', '2025-07-07 07:02:00'),
            (13, 1, 'read', '2025-07-07 09:31:00'),
            (13, 2, 'read', '2025-07-07 09:32:00'),
            (13, 6, 'read', '2025-07-07 09:33:00'),
            (15, 5, 'read', '2025-07-07 06:01:00'),
            (15, 9, 'read', '2025-07-07 06:02:00'),
            (16, 1, 'read', '2025-07-07 08:31:00'),
            (16, 9, 'read', '2025-07-07 08:32:00')
        `);

        console.log('✅ Sample data inserted successfully');

        // Verify the setup by checking tables
        const [tables] = await connection.query('SHOW TABLES');
        console.log('📊 Created tables:', tables.map(t => Object.values(t)[0]).join(', '));

        // Check if we have sample data
        const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
        const userCount = users[0].count;
        console.log(`👥 Users in database: ${userCount}`);

        if (userCount > 0) {
            console.log('🎉 Database setup complete with sample data!');
            console.log('');
            console.log('🔐 Test Login Credentials:');
            console.log('   Parent: username=parent1, password=password123');
            console.log('   Child1: username=child1, password=password123');
            console.log('   Child2: username=child2, password=password123');
            console.log('');
            console.log('🚀 You can now start the server with: npm start');
        } else {
            console.log('⚠️  No sample data found. You may need to add users manually.');
        }

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.error('');
        console.error('💡 Make sure:');
        console.error('   1. MySQL server is running');
        console.error('   2. MySQL root user has no password (or update the script)');
        console.error('   3. The MySQL user has permission to create databases');
        console.error('');
        console.error('🔧 To fix database connection issues:');
        console.error('   - Make sure MySQL is running: `net start mysql` (Windows)');
        console.error('   - Verify MySQL server is accessible: `mysql -u root -p`');
        console.error('   - Update connection credentials in db.js and scripts/init-database.js if needed');
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

// Run initialization
initializeDatabase().catch(console.error); 