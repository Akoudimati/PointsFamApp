const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

class Database {
    constructor() {
        this.connection = null;
        this.pool = null;
        this.init();
    }

    init() {
        // Determine database configuration based on environment
        const dbConfig = this.getDatabaseConfig();
        
        // Create connection pool for better performance
        this.pool = mysql.createPool(dbConfig);

        // Test connection with retries
        this.testConnectionWithRetry();
    }

    getDatabaseConfig() {
        // If environment variables are set, use them (highest priority)
        if (process.env.DB_HOST && process.env.DB_HOST !== 'localhost') {
            console.log('🔧 Using environment variables for database configuration');
            return {
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME || 'pointsfam',
                port: parseInt(process.env.DB_PORT) || 3306,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                charset: 'utf8mb4',
                ssl: {
                    rejectUnauthorized: false
                },
                acquireTimeout: 60000,
                timeout: 60000,
                reconnect: true,
                connectTimeout: 60000
            };
        }

        // Primary database: Aiven MySQL (works for all environments)
        console.log('🔧 Using Aiven MySQL database');
        return {
            host: 'mysql-3dfa6410-student-b14a.h.aivencloud.com',
            user: 'avnadmin',
            password: 'AVNS_YybduGVk3kmayJuZByo',
            database: 'pointsfam',
            port: 15421,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            charset: 'utf8mb4',
            ssl: {
                rejectUnauthorized: false
            },
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true,
            connectTimeout: 60000
        };
    }

    async testConnectionWithRetry(maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Database connection attempt ${attempt}/${maxRetries}`);
                const connection = await this.pool.getConnection();
                const dbConfig = this.getDatabaseConfig();
                console.log(`✅ Connected to MySQL database (${dbConfig.host}:${dbConfig.port})`);
                connection.release();
                return; // Success - exit retry loop
            } catch (err) {
                lastError = err;
                console.error(`❌ Database connection attempt ${attempt} failed:`, err.message);
                
                if (attempt < maxRetries) {
                    console.log(`⏳ Retrying in ${attempt * 2} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, attempt * 2000));
                }
            }
        }
        
        // All retry attempts failed
        console.error('❌ All database connection attempts failed. Trying alternative configurations...');
        
        // Try alternative database configurations
        await this.tryAlternativeConfigurations();
    }

    async tryAlternativeConfigurations() {
        const alternativeConfigs = [
            {
                name: 'Railway Alternative 1',
                config: {
                    host: 'autorack.proxy.rlwy.net',
                    user: 'root',
                    password: 'WGQRLdYiSYbWRhHzPQTdoFpBtCKKIBUBc',
                    database: 'pointsfam',
                    port: 21478,
                    waitForConnections: true,
                    connectionLimit: 5,
                    queueLimit: 0,
                    charset: 'utf8mb4',
                    ssl: { rejectUnauthorized: false },
                    acquireTimeout: 60000,
                    timeout: 60000,
                    reconnect: true,
                    connectTimeout: 60000
                }
            },
            {
                name: 'Railway Alternative 2',
                config: {
                    host: 'roundhouse.proxy.rlwy.net',
                    user: 'root',
                    password: 'GQRLdYiSYbWRhHzPQTdoFpBtCKKIBUBc',
                    database: 'pointsfam',
                    port: 21478,
                    waitForConnections: true,
                    connectionLimit: 5,
                    queueLimit: 0,
                    charset: 'utf8mb4',
                    ssl: { rejectUnauthorized: false },
                    acquireTimeout: 60000,
                    timeout: 60000,
                    reconnect: true,
                    connectTimeout: 60000
                }
            },
            {
                name: 'Railway Alternative 3',
                config: {
                    host: 'viaduct.proxy.rlwy.net',
                    user: 'root',
                    password: 'GQRLdYiSYbWRhHzPQTdoFpBtCKKIBUBc',
                    database: 'pointsfam',
                    port: 21478,
                    waitForConnections: true,
                    connectionLimit: 5,
                    queueLimit: 0,
                    charset: 'utf8mb4',
                    ssl: { rejectUnauthorized: false },
                    acquireTimeout: 60000,
                    timeout: 60000,
                    reconnect: true,
                    connectTimeout: 60000
                }
            },
            {
                name: 'Localhost Fallback',
                config: {
                    host: 'localhost',
                    user: 'root',
                    password: '',
                    database: 'pointsfam',
                    port: 3306,
                    waitForConnections: true,
                    connectionLimit: 10,
                    queueLimit: 0,
                    charset: 'utf8mb4',
                    ssl: false,
                    acquireTimeout: 60000,
                    timeout: 60000,
                    reconnect: true,
                    connectTimeout: 60000
                }
            }
        ];

        for (const { name, config } of alternativeConfigs) {
            try {
                console.log(`🔄 Trying ${name}...`);
                const testPool = mysql.createPool(config);
                const connection = await testPool.getConnection();
                
                console.log(`✅ Connected with ${name} (${config.host}:${config.port})`);
                connection.release();
                
                // Replace the main pool with the working configuration
                if (this.pool) {
                    await this.pool.end();
                }
                this.pool = testPool;
                return;
            } catch (err) {
                console.error(`❌ ${name} failed:`, err.message);
            }
        }
        
        // If we get here, no database connection worked
        console.error('❌ All database configurations failed. Application will continue but database operations will fail.');
        console.error('💡 Please set the correct database environment variables:');
        console.error('   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT');
        
        // Don't throw an error to prevent app crash - let it start without database
        // Database operations will fail gracefully
    }

    async testConnection() {
        try {
            const connection = await this.pool.getConnection();
            const dbConfig = this.getDatabaseConfig();
            console.log(`✅ Connected to MySQL database (${dbConfig.host}:${dbConfig.port})`);
            connection.release();
        } catch (err) {
            console.error('❌ Database connection error:', err.message);
            throw err;
        }
    }



    // ==============================================
    // CONNECTION METHODS
    // ==============================================

    getConnection() {
        return this.pool;
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('✅ Database connection closed');
        }
    }

    // ==============================================
    // USER OPERATIONS
    // ==============================================

    async getUserByUsername(username) {
        try {
            const [rows] = await this.pool.execute(
                `SELECT u.*, f.name as family_name FROM users u 
                 LEFT JOIN families f ON u.family_id = f.id 
                 WHERE u.username = ?`,
                [username]
            );
            return rows[0] || null;
        } catch (err) {
            console.error('Error getting user by username:', err);
            throw err;
        }
    }

    async getUserById(id) {
        try {
            const [rows] = await this.pool.execute(
                `SELECT u.*, f.name as family_name FROM users u 
                 LEFT JOIN families f ON u.family_id = f.id 
                 WHERE u.id = ?`,
                [id]
            );
            return rows[0] || null;
        } catch (err) {
            console.error('Error getting user by ID:', err);
            throw err;
        }
    }

    async createUser(userData) {
        const { username, password, firstName, lastName, role, familyId } = userData;
        const passwordHash = await bcrypt.hash(password, 10);
        
        try {
            const [result] = await this.pool.execute(
                `INSERT INTO users (username, password_hash, first_name, last_name, role, family_id, points, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`,
                [username, passwordHash, firstName, lastName, role, familyId]
            );
            return result.insertId;
        } catch (err) {
            console.error('Error creating user:', err);
            throw err;
        }
    }

    async updateUser(userId, userData) {
        const { username, firstName, lastName, role } = userData;
        
        try {
            const [result] = await this.pool.execute(
                `UPDATE users SET username = ?, first_name = ?, last_name = ?, role = ? WHERE id = ?`,
                [username, firstName, lastName, role, userId]
            );
            return result.affectedRows;
        } catch (err) {
            console.error('Error updating user:', err);
            throw err;
        }
    }

    async updateUserPassword(userId, newPassword) {
        const passwordHash = await bcrypt.hash(newPassword, 10);
        
        try {
            const [result] = await this.pool.execute(
                `UPDATE users SET password_hash = ? WHERE id = ?`,
                [passwordHash, userId]
            );
            return result.affectedRows;
        } catch (err) {
            console.error('Error updating user password:', err);
            throw err;
        }
    }

    async updateUserPoints(userId, points) {
        try {
            const [result] = await this.pool.execute(
                `UPDATE users SET points = ? WHERE id = ?`,
                [points, userId]
            );
            return result.affectedRows;
        } catch (err) {
            console.error('Error updating user points:', err);
            throw err;
        }
    }

    async deleteUser(userId) {
        try {
            const [result] = await this.pool.execute(
                `DELETE FROM users WHERE id = ?`,
                [userId]
            );
            return result.affectedRows;
        } catch (err) {
            console.error('Error deleting user:', err);
            throw err;
        }
    }

    async checkUsernameExists(username, excludeUserId = null) {
        try {
            let query = `SELECT COUNT(*) as count FROM users WHERE username = ?`;
            let params = [username];
            
            if (excludeUserId) {
                query += ` AND id != ?`;
                params.push(excludeUserId);
            }
            
            const [rows] = await this.pool.execute(query, params);
            return rows[0].count > 0;
        } catch (err) {
            console.error('Error checking username exists:', err);
            throw err;
        }
    }

    // ==============================================
    // FAMILY OPERATIONS
    // ==============================================

    async createFamily(familyName) {
        try {
            const [result] = await this.pool.execute(
                `INSERT INTO families (name, created_at) VALUES (?, NOW())`,
                [familyName]
            );
            return result.insertId;
        } catch (err) {
            console.error('Error creating family:', err);
            throw err;
        }
    }

    async getFamilyById(familyId) {
        try {
            const [rows] = await this.pool.execute(
                `SELECT * FROM families WHERE id = ?`,
                [familyId]
            );
            return rows[0] || null;
        } catch (err) {
            console.error('Error getting family by ID:', err);
            throw err;
        }
    }

    async getFamilyMembers(familyId) {
        try {
            const [rows] = await this.pool.execute(
                `SELECT * FROM users WHERE family_id = ? ORDER BY role DESC, first_name ASC`,
                [familyId]
            );
            return rows;
        } catch (err) {
            console.error('Error getting family members:', err);
            throw err;
        }
    }

    async updateFamily(familyId, familyName) {
        try {
            const [result] = await this.pool.execute(
                `UPDATE families SET name = ? WHERE id = ?`,
                [familyName, familyId]
            );
            return result.affectedRows;
        } catch (err) {
            console.error('Error updating family:', err);
            throw err;
        }
    }

    // ==============================================
    // QUERY HELPERS
    // ==============================================

    async query(sql, params = []) {
        try {
            if (!this.pool) {
                throw new Error('Database connection not available');
            }
            const [rows] = await this.pool.execute(sql, params);
            return rows;
        } catch (err) {
            console.error('Query error:', err);
            
            // If connection is lost, try to reconnect
            if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
                console.log('🔄 Attempting to reconnect to database...');
                await this.handleConnectionLoss();
                // Retry the query once
                try {
                    const [rows] = await this.pool.execute(sql, params);
                    return rows;
                } catch (retryErr) {
                    console.error('Database query retry failed:', retryErr);
                    throw retryErr;
                }
            }
            throw err;
        }
    }

    async queryOne(sql, params = []) {
        try {
            if (!this.pool) {
                throw new Error('Database connection not available');
            }
            const [rows] = await this.pool.execute(sql, params);
            return rows[0] || null;
        } catch (err) {
            console.error('QueryOne error:', err);
            
            // If connection is lost, try to reconnect
            if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
                console.log('🔄 Attempting to reconnect to database...');
                await this.handleConnectionLoss();
                // Retry the query once
                try {
                    const [rows] = await this.pool.execute(sql, params);
                    return rows[0] || null;
                } catch (retryErr) {
                    console.error('Database query retry failed:', retryErr);
                    throw retryErr;
                }
            }
            throw err;
        }
    }

    async execute(sql, params = []) {
        try {
            if (!this.pool) {
                throw new Error('Database connection not available');
            }
            const [result] = await this.pool.execute(sql, params);
            return result;
        } catch (err) {
            console.error('Execute error:', err);
            
            // If connection is lost, try to reconnect
            if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
                console.log('🔄 Attempting to reconnect to database...');
                await this.handleConnectionLoss();
                // Retry the query once
                try {
                    const [result] = await this.pool.execute(sql, params);
                    return result;
                } catch (retryErr) {
                    console.error('Database execute retry failed:', retryErr);
                    throw retryErr;
                }
            }
            throw err;
        }
    }

    async handleConnectionLoss() {
        try {
            // Close existing pool
            if (this.pool) {
                await this.pool.end();
            }
            
            // Recreate connection pool
            const dbConfig = this.getDatabaseConfig();
            this.pool = mysql.createPool(dbConfig);
            
            // Test the new connection
            const connection = await this.pool.getConnection();
            connection.release();
            console.log('✅ Database reconnection successful');
        } catch (err) {
            console.error('❌ Database reconnection failed:', err.message);
            // Try alternative configurations
            await this.tryAlternativeConfigurations();
        }
    }

    // ==============================================
    // TASK OPERATIONS
    // ==============================================

    async getTasksForUser(userId) {
        try {
            const [rows] = await this.pool.execute(
                `SELECT t.*, 
                        ta.id as assignment_id,
                        ta.status,
                        ta.completed_at,
                        ta.created_at as assigned_at,
                        ta.points_awarded,
                        'assigned' as user_status
                 FROM tasks t
                 INNER JOIN task_assignments ta ON t.id = ta.task_id
                 WHERE ta.assigned_to = ? AND t.is_active = 1
                 ORDER BY ta.created_at DESC, t.points DESC`,
                [userId]
            );
            return rows;
        } catch (err) {
            console.error('Error getting tasks for user:', err);
            throw err;
        }
    }

    async getTasksForFamily(familyId) {
        try {
            const [rows] = await this.pool.execute(
                `SELECT t.*, 
                        ta.id as assignment_id,
                        ta.status,
                        ta.completed_at,
                        ta.created_at as assigned_at,
                        ta.assigned_to,
                        CASE 
                            WHEN ta.assigned_to IS NULL THEN 'available'
                            ELSE 'assigned'
                        END as user_status
                 FROM tasks t
                 LEFT JOIN task_assignments ta ON t.id = ta.task_id
                 WHERE t.family_id = ? AND t.is_active = 1
                 ORDER BY t.points DESC, t.name ASC`,
                [familyId]
            );
            return rows;
        } catch (err) {
            console.error('Error getting tasks for family:', err);
            throw err;
        }
    }

    async getPendingTasksForFamily(familyId) {
        try {
            const [rows] = await this.pool.execute(
                `SELECT t.*, ta.id as assignment_id, ta.status, ta.completed_at,
                        u.first_name, u.last_name, t.name as task_name
                 FROM tasks t
                 JOIN task_assignments ta ON t.id = ta.task_id
                 JOIN users u ON ta.assigned_to = u.id
                 WHERE t.family_id = ? AND ta.status = 'completed'
                 ORDER BY ta.completed_at ASC`,
                [familyId]
            );
            return rows;
        } catch (err) {
            console.error('Error getting pending tasks for family:', err);
            throw err;
        }
    }

    async getAllTaskAssignmentsForFamily(familyId) {
        try {
            const [rows] = await this.pool.execute(
                `SELECT t.*, ta.id as assignment_id, ta.status, ta.completed_at, ta.created_at as assigned_at,
                        u.first_name, u.last_name, t.name as task_name, ta.points_awarded
                 FROM tasks t
                 JOIN task_assignments ta ON t.id = ta.task_id
                 JOIN users u ON ta.assigned_to = u.id
                 WHERE t.family_id = ? AND t.is_active = 1
                 ORDER BY ta.created_at DESC`,
                [familyId]
            );
            return rows;
        } catch (err) {
            console.error('Error getting all task assignments for family:', err);
            throw err;
        }
    }

    async createTask(taskData) {
        const { familyId, name, description, points, category, isCustom, createdBy } = taskData;
        
        try {
            // Ensure all required fields have proper values (handle undefined)
            const taskFamilyId = familyId || null;
            const taskName = name || '';
            const taskDescription = description || null;
            const taskPoints = points ? parseInt(points) : 0;
            const taskCategory = category || 'household';
            const taskIsCustom = isCustom ? 1 : 0;
            const taskCreatedBy = createdBy || null;

            const [result] = await this.pool.execute(
                `INSERT INTO tasks (family_id, name, description, points, category, is_custom, created_by, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                [taskFamilyId, taskName, taskDescription, taskPoints, taskCategory, taskIsCustom, taskCreatedBy]
            );
            return result.insertId;
        } catch (err) {
            console.error('Error creating task:', err);
            throw err;
        }
    }

    async getTaskById(taskId) {
        try {
            const [rows] = await this.pool.execute(
                `SELECT * FROM tasks WHERE id = ?`,
                [taskId]
            );
            return rows[0] || null;
        } catch (err) {
            console.error('Error getting task by ID:', err);
            throw err;
        }
    }

    async deleteTask(taskId) {
        try {
            const [result] = await this.pool.execute(
                `DELETE FROM tasks WHERE id = ?`,
                [taskId]
            );
            return result.affectedRows;
        } catch (err) {
            console.error('Error deleting task:', err);
            throw err;
        }
    }

    async assignTask(taskId, userId, assignedBy) {
        try {
            // Ensure all parameters have proper values
            const taskIdValue = taskId || null;
            const userIdValue = userId || null;
            const assignedByValue = assignedBy || null;
            
            const [result] = await this.pool.execute(
                `INSERT INTO task_assignments (task_id, assigned_to, assigned_by, created_at)
                 VALUES (?, ?, ?, NOW())`,
                [taskIdValue, userIdValue, assignedByValue]
            );
            return result.insertId;
        } catch (err) {
            console.error('Error assigning task:', err);
            throw err;
        }
    }

    async acceptTask(assignmentId) {
        try {
            const [result] = await this.pool.execute(
                `UPDATE task_assignments SET status = 'pending' WHERE id = ?`,
                [assignmentId]
            );
            return result.affectedRows;
        } catch (err) {
            console.error('Error accepting task:', err);
            throw err;
        }
    }

    async declineTask(assignmentId, reason = null) {
        try {
            const [result] = await this.pool.execute(
                `UPDATE task_assignments SET status = 'rejected' WHERE id = ?`,
                [assignmentId]
            );
            return result.affectedRows;
        } catch (err) {
            console.error('Error declining task:', err);
            throw err;
        }
    }

    async completeTask(assignmentId) {
        try {
            const [result] = await this.pool.execute(
                `UPDATE task_assignments SET status = 'completed', completed_at = NOW() WHERE id = ?`,
                [assignmentId]
            );
            return result.affectedRows;
        } catch (err) {
            console.error('Error completing task:', err);
            throw err;
        }
    }

    async approveTask(assignmentId, approvedBy, pointsAwarded) {
        try {
            const [result] = await this.pool.execute(
                `UPDATE task_assignments SET status = 'approved', approved_at = NOW(), approved_by = ?, points_awarded = ? WHERE id = ?`,
                [approvedBy, pointsAwarded, assignmentId]
            );
            return result.affectedRows;
        } catch (err) {
            console.error('Error approving task:', err);
            throw err;
        }
    }

    async rejectTask(assignmentId) {
        try {
            const [result] = await this.pool.execute(
                `UPDATE task_assignments SET status = 'rejected' WHERE id = ?`,
                [assignmentId]
            );
            return result.affectedRows;
        } catch (err) {
            console.error('Error rejecting task:', err);
            throw err;
        }
    }

    async deleteTaskAssignment(assignmentId) {
        try {
            const [result] = await this.pool.execute(
                `DELETE FROM task_assignments WHERE id = ?`,
                [assignmentId]
            );
            return result.affectedRows;
        } catch (err) {
            console.error('Error deleting task assignment:', err);
            throw err;
        }
    }

    // ==============================================
    // POINTS OPERATIONS
    // ==============================================

    async addPointsTransaction(userId, points, description, type = 'earned', createdBy = null) {
        try {
            // Ensure all parameters have proper values
            const userIdValue = userId || null;
            const pointsValue = points ? parseInt(points) : 0;
            const descriptionValue = description || '';
            const typeValue = type || 'earned';
            const createdByValue = createdBy || null;
            
            const [result] = await this.pool.execute(
                `INSERT INTO points_transactions (user_id, points, transaction_type, description, created_by, created_at)
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [userIdValue, pointsValue, typeValue, descriptionValue, createdByValue]
            );
            return result.insertId;
        } catch (err) {
            console.error('Error adding points transaction:', err);
            throw err;
        }
    }

    async getPointsHistory(userId) {
        try {
            const [rows] = await this.pool.execute(
                `SELECT pt.*, u.first_name as created_by_name 
                 FROM points_transactions pt
                 LEFT JOIN users u ON pt.created_by = u.id
                 WHERE pt.user_id = ? 
                 ORDER BY pt.created_at DESC
                 LIMIT 50`,
                [userId]
            );
            return rows;
        } catch (err) {
            console.error('Error getting points history:', err);
            throw err;
        }
    }

    // ==============================================
    // REWARDS OPERATIONS
    // ==============================================

    async getRewards(familyId) {
        try {
            const [rows] = await this.pool.execute(
                `SELECT * FROM rewards WHERE family_id = ? AND is_active = 1 ORDER BY points_required ASC`,
                [familyId]
            );
            return rows;
        } catch (err) {
            console.error('Error getting rewards:', err);
            throw err;
        }
    }

    async redeemReward(userId, rewardId, pointsSpent) {
        try {
            // Ensure all parameters have proper values
            const userIdValue = userId || null;
            const rewardIdValue = rewardId || null;
            const pointsSpentValue = pointsSpent ? parseInt(pointsSpent) : 0;
            
            const [result] = await this.pool.execute(
                `INSERT INTO reward_redemptions (reward_id, redeemed_by, points_spent, created_at)
                 VALUES (?, ?, ?, NOW())`,
                [rewardIdValue, userIdValue, pointsSpentValue]
            );
            return result.insertId;
        } catch (err) {
            console.error('Error redeeming reward:', err);
            throw err;
        }
    }

    async createReward(rewardData) {
        try {
            const [result] = await this.pool.execute(
                `INSERT INTO rewards (family_id, name, description, points_required, category, created_by, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [
                    rewardData.family_id,
                    rewardData.name,
                    rewardData.description,
                    rewardData.points_required,
                    rewardData.category,
                    rewardData.created_by
                ]
            );
            return result.insertId;
        } catch (err) {
            console.error('Error creating reward:', err);
            throw err;
        }
    }

    async updateReward(rewardId, rewardData) {
        try {
            const [result] = await this.pool.execute(
                `UPDATE rewards SET name = ?, description = ?, points_required = ?, category = ? WHERE id = ?`,
                [
                    rewardData.name,
                    rewardData.description,
                    rewardData.points_required,
                    rewardData.category,
                    rewardId
                ]
            );
            return result.affectedRows;
        } catch (err) {
            console.error('Error updating reward:', err);
            throw err;
        }
    }

    async deleteReward(rewardId) {
        try {
            const [result] = await this.pool.execute(
                `UPDATE rewards SET is_active = 0 WHERE id = ?`,
                [rewardId]
            );
            return result.affectedRows;
        } catch (err) {
            console.error('Error deleting reward:', err);
            throw err;
        }
    }

    async getRewardRedemptions(familyId) {
        try {
            const [rows] = await this.pool.execute(
                `SELECT rr.*, r.name as reward_name, r.description as reward_description, 
                        r.category as reward_category, u.first_name, u.last_name
                 FROM reward_redemptions rr
                 JOIN rewards r ON rr.reward_id = r.id
                 JOIN users u ON rr.redeemed_by = u.id
                 WHERE u.family_id = ? AND r.family_id = ?
                 ORDER BY rr.created_at DESC
                 LIMIT 50`,
                [familyId, familyId]
            );
            return rows;
        } catch (err) {
            console.error('Error getting reward redemptions:', err);
            throw err;
        }
    }

    // ==============================================
    // STANDARD TASKS
    // ==============================================

    async getStandardTasks() {
        try {
            const [rows] = await this.pool.execute(
                `SELECT * FROM standard_tasks ORDER BY category ASC, name ASC`
            );
            return rows;
        } catch (err) {
            console.error('Error getting standard tasks:', err);
            throw err;
        }
    }

    // ==============================================
    // PROFILE IMAGES OPERATIONS
    // ==============================================

    async createProfileImage(imageData) {
        try {
            const [result] = await this.pool.execute(
                `INSERT INTO profile_images (user_id, image_path, description, uploaded_by, family_id, created_at)
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [
                    imageData.user_id,
                    imageData.image_path,
                    imageData.description,
                    imageData.uploaded_by,
                    imageData.family_id
                ]
            );
            return result.insertId;
        } catch (err) {
            console.error('Error creating profile image:', err);
            throw err;
        }
    }

    async getProfileImages(familyId) {
        try {
            const [rows] = await this.pool.execute(
                `SELECT pi.*, u.first_name, u.last_name, u.role
                 FROM profile_images pi
                 JOIN users u ON pi.user_id = u.id
                 WHERE pi.family_id = ? AND pi.is_active = 1
                 ORDER BY pi.created_at DESC`,
                [familyId]
            );
            return rows;
        } catch (err) {
            console.error('Error getting profile images:', err);
            throw err;
        }
    }

    async getProfileImageById(imageId) {
        try {
            const [rows] = await this.pool.execute(
                `SELECT pi.*, u.first_name, u.last_name, u.role
                 FROM profile_images pi
                 JOIN users u ON pi.user_id = u.id
                 WHERE pi.id = ? AND pi.is_active = 1`,
                [imageId]
            );
            return rows[0] || null;
        } catch (err) {
            console.error('Error getting profile image by ID:', err);
            throw err;
        }
    }

    async deleteProfileImage(imageId) {
        try {
            const [result] = await this.pool.execute(
                `UPDATE profile_images SET is_active = 0 WHERE id = ?`,
                [imageId]
            );
            return result.affectedRows;
        } catch (err) {
            console.error('Error deleting profile image:', err);
            throw err;
        }
    }

    async getUserProfileImage(userId) {
        try {
            const [rows] = await this.pool.execute(
                `SELECT pi.*, u.first_name, u.last_name, u.role
                 FROM profile_images pi
                 JOIN users u ON pi.user_id = u.id
                 WHERE pi.user_id = ? AND pi.is_active = 1
                 ORDER BY pi.created_at DESC
                 LIMIT 1`,
                [userId]
            );
            return rows[0] || null;
        } catch (err) {
            console.error('Error getting user profile image:', err);
            throw err;
        }
    }
}

module.exports = Database; 