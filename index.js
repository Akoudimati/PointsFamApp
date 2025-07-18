const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const cors = require('cors');
const compression = require('compression');
const multer = require('multer');
const fs = require('fs');
const Database = require('./db');

// Initialize database
const db = new Database();

// Add in-memory message storage at the top
const messageStore = new Map(); // conversationId -> messages[]
const activeUsers = new Map(); // userId -> user info

// Initialize sample messages after database connection
setTimeout(async () => {
    try {
        // Get existing conversations from database
        const conversations = await db.getConversationsForUser(1); // User ID 1 (John)
        console.log('Available conversations:', conversations.map(c => ({ id: c.id, title: c.title })));
        
        if (conversations.length > 0) {
            const firstConversation = conversations[0];
            console.log('Using conversation ID:', firstConversation.id);
            
            // Add sample messages for the first available conversation
            messageStore.set(String(firstConversation.id), [
                {
                    id: 1,
                    conversation_id: String(firstConversation.id),
                    sender_id: 1,
                    sender_name: 'John Johnson',
                    sender_first_name: 'John',
                    sender_last_name: 'Johnson',
                    sender_role: 'parent',
                    content: 'Welkom in de familie chat! 👨‍👩‍👧‍👦',
                    created_at: '2025-07-07T20:00:00.000Z'
                },
                {
                    id: 2,
                    conversation_id: String(firstConversation.id),
                    sender_id: 2,
                    sender_name: 'Jane Johnson',
                    sender_first_name: 'Jane',
                    sender_last_name: 'Johnson',
                    sender_role: 'parent',
                    content: 'Hoi allemaal! Hoe gaat het vandaag? 😊',
                    created_at: '2025-07-07T20:05:00.000Z'
                },
                {
                    id: 3,
                    conversation_id: String(firstConversation.id),
                    sender_id: 3,
                    sender_name: 'Emma Johnson',
                    sender_first_name: 'Emma',
                    sender_last_name: 'Johnson',
                    sender_role: 'child',
                    content: 'Hoi mama en papa! School was leuk vandaag! 📚',
                    created_at: '2025-07-07T20:10:00.000Z'
                }
            ]);
            
            console.log('💾 Initialized sample messages for conversation ID:', firstConversation.id);
            console.log('💾 Message store now has:', Array.from(messageStore.keys()));
        } else {
            console.log('⚠️ No conversations found in database');
        }
    } catch (error) {
        console.error('Error initializing sample messages:', error);
        // Fallback to hardcoded conversation IDs
        messageStore.set('1', [
            {
                id: 1,
                conversation_id: '1',
                sender_id: 1,
                sender_name: 'John Johnson',
                sender_first_name: 'John',
                sender_last_name: 'Johnson',
                sender_role: 'parent',
                content: 'Test bericht - dit laden is nu super snel! ⚡',
                created_at: '2025-07-07T21:00:00.000Z'
            }
        ]);
        console.log('💾 Initialized fallback sample messages');
    }
}, 3000); // Wait 3 seconds for database to be ready

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'public', 'uploads', 'profiles');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'profile-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Check if file is an image
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
    }
});

// Middleware with performance optimizations
app.use(compression()); // Enable gzip compression
app.use(cors());
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '0', // Disable caching for dynamic development
    etag: false,
    lastModified: false,
    setHeaders: (res, path) => {
        // Disable caching for CSS and JS files to prevent old styling issues
        if (path.endsWith('.css') || path.endsWith('.js')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'pointsfam-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true', // Only secure in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000, // 24 hours (extended for better UX)
        httpOnly: true, // Prevent XSS attacks
        sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax' // More permissive for better compatibility
    },
    rolling: true, // Reset expiration on each request
    name: 'pointsfam.session' // Custom session name
}));

// Cache busting middleware for HTML files
const preventCacheMiddleware = (req, res, next) => {
    if (req.path.endsWith('.html') || req.path === '/' || req.path.includes('/dashboard') || req.path.includes('/login')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
};

// Apply cache prevention middleware
app.use(preventCacheMiddleware);

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ 
            error: 'Authentication required',
            sessionExpired: true 
        });
    }
    
    // Refresh session data if user exists
    if (req.session.user) {
        req.session.touch(); // Keep session alive
    }
    
    next();
};

const requireParent = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'parent') {
        return res.status(403).json({ error: 'Parent access required' });
    }
    next();
};

// API Routes

// Authentication endpoints
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const user = await db.getUserByUsername(username);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Create session
        req.session.user = {
            id: user.id,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            familyId: user.family_id,
            familyName: user.family_name,
            points: user.points
        };

        res.json({
            success: true,
            user: req.session.user,
            message: `Welcome back, ${user.first_name}!`
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Error during logout' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

app.get('/api/user', requireAuth, (req, res) => {
    res.json({ user: req.session.user });
});

// Messaging endpoints
app.get('/api/conversations', requireAuth, async (req, res) => {
    try {
        const user = req.session.user;
        const { family_only } = req.query;
        
        let conversations;
        if (family_only === 'true') {
            conversations = await db.getFamilyConversationsForUser(user.id);
        } else {
            conversations = await db.getConversationsForUser(user.id);
        }
        
        res.json({ success: true, conversations });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Error loading conversations' });
    }
});

app.get('/api/conversations/:id', requireAuth, async (req, res) => {
    try {
        const conversation = await db.getConversationById(req.params.id, req.session.user.id);
        if (!conversation) {
            return res.status(404).json({ error: 'Gesprek niet gevonden.' });
        }
        
        const participants = await db.getConversationParticipants(req.params.id);
        res.json({ conversation, participants });
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ error: 'Er is een fout opgetreden bij het laden van het gesprek.' });
    }
});

app.get('/api/conversations/:conversationId/messages', requireAuth, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const offset = parseInt(req.query.offset) || 0;
        const user = req.session.user;

        console.log('📨 Loading messages for conversation:', conversationId, 'User:', user.id);

        // Get messages from memory
        const messages = messageStore.get(String(conversationId)) || [];
        
        // Apply pagination
        const paginatedMessages = messages.slice(-limit - offset, messages.length - offset).reverse();
        
        console.log(`📨 Loaded ${paginatedMessages.length} messages for conversation ${conversationId}`);
        
        res.json({ 
            messages: paginatedMessages,
            pagination: {
                limit,
                offset,
                total: messages.length
            }
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ 
            error: 'Er is een fout opgetreden bij het laden van berichten',
            code: 'LOAD_ERROR',
            details: error.message
        });
    }
});

app.post('/api/conversations/:conversationId/messages', requireAuth, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { content } = req.body;
        const user = req.session.user;
        
        // Create message object
        const message = {
            id: Date.now() + Math.random(), // Unique ID
            conversation_id: conversationId,
            sender_id: user.id,
            sender_name: `${user.first_name} ${user.last_name}`,
            sender_first_name: user.first_name,
            sender_last_name: user.last_name,
            sender_role: user.role,
            content: content,
            created_at: new Date().toISOString()
        };
        
        // Store in memory
        if (!messageStore.has(conversationId)) {
            messageStore.set(conversationId, []);
        }
        
        const messages = messageStore.get(conversationId);
        messages.push(message);
        
        // Keep only last 100 messages per conversation to save memory
        if (messages.length > 100) {
            messages.splice(0, messages.length - 100);
        }
        
        console.log(`💬 Message sent to conversation ${conversationId}: "${content.substring(0, 50)}..."`);
        
        res.json({ success: true, message });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Error sending message' });
    }
});

// Session debug endpoint (remove in production)
app.get('/api/debug/session', (req, res) => {
    res.json({
        hasSession: !!req.session,
        sessionId: req.session?.id,
        user: req.session?.user || null,
        cookie: req.session?.cookie || null,
        headers: {
            'user-agent': req.get('User-Agent'),
            'cookie': req.get('Cookie')?.substring(0, 100) + '...'
        }
    });
});

// Registration endpoints
app.post('/api/register', async (req, res) => {
    try {
        const { 
            familyName, 
            parentUsername, 
            parentPassword, 
            parentFirstName, 
            parentLastName,
            joinExistingFamily,
            existingFamilyId 
        } = req.body;

        // Validate required fields
        if (!parentUsername || !parentPassword || !parentFirstName || !parentLastName) {
            return res.status(400).json({ error: 'All parent fields are required' });
        }

        if (!joinExistingFamily && !familyName) {
            return res.status(400).json({ error: 'Family name is required for new families' });
        }

        if (joinExistingFamily && !existingFamilyId) {
            return res.status(400).json({ error: 'Family ID is required to join existing family' });
        }

        // Check if username already exists
        const usernameExists = await db.checkUsernameExists(parentUsername);
        if (usernameExists) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        let familyId;

        if (joinExistingFamily) {
            // Verify family exists
            const family = await db.getFamilyById(existingFamilyId);
            if (!family) {
                return res.status(400).json({ error: 'Family not found' });
            }
            familyId = existingFamilyId;
        } else {
            // Create new family
            familyId = await db.createFamily(familyName);
        }

        // Create parent user
        const parentId = await db.createUser({
            username: parentUsername,
            password: parentPassword,
            firstName: parentFirstName,
            lastName: parentLastName,
            role: 'parent',
            familyId: familyId
        });

        res.json({ 
            success: true, 
            message: 'Registration successful',
            familyId: familyId,
            userId: parentId
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// User management endpoints
app.post('/api/users', requireParent, async (req, res) => {
    try {
        const { username, password, firstName, lastName, role } = req.body;
        const currentUser = req.session.user;

        // Validate required fields
        if (!username || !password || !firstName || !lastName || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate role
        if (!['parent', 'child'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Check if username already exists
        const usernameExists = await db.checkUsernameExists(username);
        if (usernameExists) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Create user in same family as current user
        const userId = await db.createUser({
            username,
            password,
            firstName,
            lastName,
            role,
            familyId: currentUser.familyId
        });

        res.json({ 
            success: true, 
            message: `${role === 'parent' ? 'Parent' : 'Child'} created successfully`,
            userId: userId
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Error creating user' });
    }
});

app.put('/api/users/:userId', requireParent, async (req, res) => {
    try {
        const { userId } = req.params;
        const { username, firstName, lastName, role } = req.body;
        const currentUser = req.session.user;

        // Validate required fields
        if (!username || !firstName || !lastName || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate role
        if (!['parent', 'child'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Get user to verify they're in the same family
        const userToUpdate = await db.getUserById(userId);
        if (!userToUpdate || userToUpdate.family_id !== currentUser.familyId) {
            return res.status(403).json({ error: 'You can only edit users in your family' });
        }

        // Check if username already exists (excluding current user)
        const usernameExists = await db.checkUsernameExists(username, userId);
        if (usernameExists) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Update user
        await db.updateUser(userId, { username, firstName, lastName, role });

        // Update session if user is updating themselves
        if (currentUser.id == userId) {
            req.session.user.username = username;
            req.session.user.firstName = firstName;
            req.session.user.lastName = lastName;
            req.session.user.role = role;
        }

        res.json({ 
            success: true, 
            message: 'User updated successfully'
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Error updating user' });
    }
});

app.put('/api/users/:userId/password', requireParent, async (req, res) => {
    try {
        const { userId } = req.params;
        const { newPassword } = req.body;
        const currentUser = req.session.user;

        if (!newPassword) {
            return res.status(400).json({ error: 'New password is required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Get user to verify they're in the same family
        const userToUpdate = await db.getUserById(userId);
        if (!userToUpdate || userToUpdate.family_id !== currentUser.familyId) {
            return res.status(403).json({ error: 'You can only edit users in your family' });
        }

        // Update password
        await db.updateUserPassword(userId, newPassword);

        res.json({ 
            success: true, 
            message: 'Password updated successfully'
        });

    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ error: 'Error updating password' });
    }
});

app.delete('/api/users/:userId', requireParent, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUser = req.session.user;

        // Prevent deleting yourself
        if (currentUser.id == userId) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }

        // Get user to verify they're in the same family
        const userToDelete = await db.getUserById(userId);
        if (!userToDelete || userToDelete.family_id !== currentUser.familyId) {
            return res.status(403).json({ error: 'You can only delete users in your family' });
        }

        // Delete user
        await db.deleteUser(userId);

        res.json({ 
            success: true, 
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Error deleting user' });
    }
});

app.get('/api/families/:familyId', requireAuth, async (req, res) => {
    try {
        const { familyId } = req.params;
        const currentUser = req.session.user;

        // Verify user has access to this family
        if (currentUser.familyId != familyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const family = await db.getFamilyById(familyId);
        if (!family) {
            return res.status(404).json({ error: 'Family not found' });
        }

        res.json({ family });

    } catch (error) {
        console.error('Get family error:', error);
        res.status(500).json({ error: 'Error loading family information' });
    }
});

app.put('/api/families/:familyId', requireParent, async (req, res) => {
    try {
        const { familyId } = req.params;
        const { familyName } = req.body;
        const currentUser = req.session.user;

        if (!familyName) {
            return res.status(400).json({ error: 'Family name is required' });
        }

        // Verify user has access to this family
        if (currentUser.familyId != familyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Update family name
        await db.updateFamily(familyId, familyName);

        // Update session
        req.session.user.familyName = familyName;

        res.json({ 
            success: true, 
            message: 'Family name updated successfully'
        });

    } catch (error) {
        console.error('Update family error:', error);
        res.status(500).json({ error: 'Error updating family name' });
    }
});

// Dashboard endpoints
app.get('/api/dashboard', requireAuth, async (req, res) => {
    try {
        const user = req.session.user;
        
        if (user.role === 'parent') {
            // Parent dashboard data
            const familyMembers = await db.getFamilyMembers(user.familyId);
            const pendingTasks = await db.getPendingTasksForFamily(user.familyId);
            const allTaskAssignments = await db.getAllTaskAssignmentsForFamily(user.familyId);
            const standardTasks = await db.getStandardTasks();
            const rewards = await db.getRewards(user.familyId);
            
            // Get all tasks for the family to show open tasks
            const allTasks = await db.getTasksForFamily(user.familyId);
            
            res.json({
                type: 'parent',
                user: user,
                familyMembers: familyMembers,
                pendingTasks: pendingTasks,
                allTaskAssignments: allTaskAssignments,
                standardTasks: standardTasks,
                allTasks: allTasks,
                rewards: rewards
            });
        } else {
            // Child dashboard data
            const tasks = await db.getTasksForUser(user.id);
            const familyMembers = await db.getFamilyMembers(user.familyId);
            const pointsHistory = await db.getPointsHistory(user.id);
            const rewards = await db.getRewards(user.familyId);
            
            res.json({
                type: 'child',
                user: user,
                tasks: tasks,
                familyMembers: familyMembers,
                pointsHistory: pointsHistory,
                rewards: rewards
            });
        }
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Error loading dashboard data' });
    }
});

// Task endpoints
app.post('/api/tasks', requireParent, async (req, res) => {
    try {
        const { name, description, points, category } = req.body;
        const user = req.session.user;
        
        if (!name || !points) {
            return res.status(400).json({ error: 'Task name and points are required' });
        }
        
        const taskId = await db.createTask({
            familyId: user.familyId,
            name: name,
            description: description || null,
            points: parseInt(points),
            category: category || 'household',
            isCustom: true,
            createdBy: user.id
        });
        
        res.json({ success: true, taskId, message: 'Task created successfully' });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Error creating task' });
    }
});

app.post('/api/tasks/:taskId/assign', requireParent, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { userId } = req.body;
        const user = req.session.user;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        const assignmentId = await db.assignTask(taskId, userId, user.id);
        res.json({ success: true, assignmentId, message: 'Task assigned successfully' });
    } catch (error) {
        console.error('Assign task error:', error);
        res.status(500).json({ error: 'Error assigning task' });
    }
});

app.post('/api/tasks/:taskId/assign-all', requireParent, async (req, res) => {
    try {
        const { taskId } = req.params;
        const user = req.session.user;
        
        // Get all children in the family
        const familyMembers = await db.getFamilyMembers(user.familyId);
        const children = familyMembers.filter(member => member.role === 'child');
        
        if (children.length === 0) {
            return res.status(400).json({ error: 'No children found in family' });
        }
        
        // Assign task to all children
        const assignmentIds = [];
        for (const child of children) {
            const assignmentId = await db.assignTask(taskId, child.id, user.id);
            assignmentIds.push(assignmentId);
        }
        
        res.json({ 
            success: true, 
            assignmentIds, 
            message: `Task assigned to ${children.length} children successfully` 
        });
    } catch (error) {
        console.error('Assign task to all error:', error);
        res.status(500).json({ error: 'Error assigning task to all children' });
    }
});

app.post('/api/tasks/:taskId/assign-first', requireParent, async (req, res) => {
    try {
        const { taskId } = req.params;
        const user = req.session.user;
        
        // Get all children in the family
        const familyMembers = await db.getFamilyMembers(user.familyId);
        const children = familyMembers.filter(member => member.role === 'child');
        
        if (children.length === 0) {
            return res.status(400).json({ error: 'No children found in family' });
        }
        
        // Assign task to first child only
        const firstChild = children[0];
        const assignmentId = await db.assignTask(taskId, firstChild.id, user.id);
        
        res.json({ 
            success: true, 
            assignmentId, 
            message: `Task assigned to ${firstChild.first_name} ${firstChild.last_name} successfully` 
        });
    } catch (error) {
        console.error('Assign task to first error:', error);
        res.status(500).json({ error: 'Error assigning task to first child' });
    }
});

app.post('/api/tasks/:taskId/assign-rest', requireParent, async (req, res) => {
    try {
        const { taskId } = req.params;
        const user = req.session.user;
        
        // Get all children in the family
        const familyMembers = await db.getFamilyMembers(user.familyId);
        const children = familyMembers.filter(member => member.role === 'child');
        
        if (children.length <= 1) {
            return res.status(400).json({ error: 'Not enough children to assign to rest' });
        }
        
        // Assign task to all children except the first one
        const restChildren = children.slice(1); // Skip first child
        const assignmentIds = [];
        for (const child of restChildren) {
            const assignmentId = await db.assignTask(taskId, child.id, user.id);
            assignmentIds.push(assignmentId);
        }
        
        res.json({ 
            success: true, 
            assignmentIds, 
            message: `Task assigned to ${restChildren.length} children successfully` 
        });
    } catch (error) {
        console.error('Assign task to rest error:', error);
        res.status(500).json({ error: 'Error assigning task to rest of children' });
    }
});

app.delete('/api/tasks/:taskId', requireParent, async (req, res) => {
    try {
        const { taskId } = req.params;
        const user = req.session.user;
        
        // First check if task belongs to the user's family
        const task = await db.getTaskById(taskId);
        if (!task || task.family_id !== user.familyId) {
            return res.status(403).json({ error: 'Task not found or access denied' });
        }
        
        // Delete the task (this will also cascade delete assignments)
        await db.deleteTask(taskId);
        
        res.json({ success: true, message: 'Task cancelled successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Error cancelling task' });
    }
});

app.post('/api/assignments/:assignmentId/accept', requireAuth, async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const user = req.session.user;
        
        // Only allow children to accept their own tasks
        if (user.role === 'child') {
            const tasks = await db.getTasksForUser(user.id);
            const task = tasks.find(t => t.assignment_id == assignmentId);
            
            if (!task) {
                return res.status(403).json({ error: 'You can only accept your own tasks' });
            }
            
            // Immediately complete the task and award points
            const pointsAwarded = task.points;
            
            // Mark task as completed first, then approve
            await db.completeTask(assignmentId);
            await db.approveTask(assignmentId, user.id, pointsAwarded);
            
            // Update user points and add transaction
            const currentUser = await db.getUserById(user.id);
            const newPoints = currentUser.points + pointsAwarded;
            
            await db.updateUserPoints(user.id, newPoints);
            await db.addPointsTransaction(
                user.id, 
                pointsAwarded, 
                `Task completed: ${task.name}`, 
                'earned',
                user.id
            );
            
            res.json({ 
                success: true, 
                message: `Task completed! You earned ${pointsAwarded} points.`,
                points_earned: pointsAwarded,
                new_total: newPoints
            });
        } else {
            // For parents, just accept the task (old behavior)
            await db.acceptTask(assignmentId);
            res.json({ success: true, message: 'Task accepted successfully' });
        }
    } catch (error) {
        console.error('Accept task error:', error);
        res.status(500).json({ error: 'Error accepting task' });
    }
});

// Retry task assignment (for rejected tasks)
app.post('/api/assignments/:assignmentId/retry', requireAuth, async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const user = req.session.user;
        
        // Get assignment details
        const [rows] = await db.pool.execute(
            'SELECT ta.*, t.points, t.name FROM task_assignments ta JOIN tasks t ON ta.task_id = t.id WHERE ta.id = ?',
            [assignmentId]
        );
        const assignment = rows[0];
        
        if (!assignment) {
            return res.status(404).json({ error: 'Taak niet gevonden' });
        }
        
        // Check if user owns this assignment
        if (assignment.assigned_to !== user.id) {
            return res.status(403).json({ error: 'Je kunt alleen je eigen taken opnieuw proberen' });
        }
        
        // Check if task is rejected
        if (assignment.status !== 'rejected') {
            return res.status(400).json({ error: 'Alleen afgewezen taken kunnen opnieuw geprobeerd worden' });
        }
        
        // Reset task status to assigned
        await db.pool.execute(
            'UPDATE task_assignments SET status = ?, completed_at = NULL WHERE id = ?',
            ['assigned', assignmentId]
        );
        
        res.json({ 
            success: true,
            message: `Je kunt de taak "${assignment.name}" nu opnieuw proberen!`,
            status: 'assigned'
        });
        
    } catch (error) {
        console.error('Retry task error:', error);
        res.status(500).json({ error: 'Er is een fout opgetreden bij het opnieuw proberen van de taak' });
    }
});

app.post('/api/assignments/:assignmentId/decline', requireAuth, async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { reason } = req.body;
        const user = req.session.user;
        
        // Validate reason
        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({ error: 'Reason is required when declining a task' });
        }
        
        // Only allow children to decline their own tasks
        if (user.role === 'child') {
            const tasks = await db.getTasksForUser(user.id);
            const task = tasks.find(t => t.assignment_id == assignmentId);
            
            if (!task) {
                return res.status(403).json({ error: 'You can only decline your own tasks' });
            }
        }
        
        await db.declineTask(assignmentId, reason.trim());
        res.json({ success: true, message: 'Task declined with reason provided' });
    } catch (error) {
        console.error('Decline task error:', error);
        res.status(500).json({ error: 'Error declining task' });
    }
});

app.post('/api/assignments/:assignmentId/complete', requireAuth, async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const user = req.session.user;
        
        // Only allow children to complete their own tasks
        if (user.role === 'child') {
            const tasks = await db.getTasksForUser(user.id);
            const task = tasks.find(t => t.assignment_id == assignmentId);
            
            if (!task) {
                return res.status(403).json({ error: 'You can only complete your own tasks' });
            }
        }
        
        await db.completeTask(assignmentId);
        res.json({ success: true, message: 'Task marked as completed' });
    } catch (error) {
        console.error('Complete task error:', error);
        res.status(500).json({ error: 'Error completing task' });
    }
});

app.post('/api/assignments/:assignmentId/approve', requireParent, async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { points } = req.body;
        const user = req.session.user;
        
        const pointsAwarded = points ? parseInt(points) : null;
        
        await db.approveTask(assignmentId, user.id, pointsAwarded);
        
        // Update user points and add transaction
        if (pointsAwarded) {
            // Get task details to find the user
            const pendingTasks = await db.getPendingTasksForFamily(user.familyId);
            const task = pendingTasks.find(t => t.assignment_id == assignmentId);
            
            if (task) {
                const currentUser = await db.getUserById(task.assigned_to);
                const newPoints = currentUser.points + pointsAwarded;
                
                await db.updateUserPoints(task.assigned_to, newPoints);
                await db.addPointsTransaction(
                    task.assigned_to, 
                    pointsAwarded, 
                    `Task approved: ${task.name}`, 
                    'earned',
                    user.id
                );
            }
        }
        
        res.json({ success: true, message: 'Task approved successfully' });
    } catch (error) {
        console.error('Approve task error:', error);
        res.status(500).json({ error: 'Error approving task' });
    }
});

app.post('/api/assignments/:assignmentId/reject', requireParent, async (req, res) => {
    try {
        const { assignmentId } = req.params;
        
        await db.rejectTask(assignmentId);
        res.json({ success: true, message: 'Task rejected' });
    } catch (error) {
        console.error('Reject task error:', error);
        res.status(500).json({ error: 'Error rejecting task' });
    }
});

app.delete('/api/assignments/:assignmentId/delete', requireAuth, async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const user = req.session.user;
        
        console.log(`Delete request for assignment ${assignmentId} by user ${user.id} (${user.role})`);
        
        if (!assignmentId || isNaN(assignmentId)) {
            console.error('Invalid assignment ID:', assignmentId);
            return res.status(400).json({ error: 'Invalid assignment ID' });
        }
        
        // Only allow children to delete their own tasks, parents can delete any
        if (user.role === 'child') {
            const tasks = await db.getTasksForUser(user.id);
            const task = tasks.find(t => t.assignment_id == assignmentId);
            
            if (!task) {
                console.error(`Child ${user.id} tried to delete assignment ${assignmentId} but it's not theirs`);
                return res.status(403).json({ error: 'Je kunt alleen je eigen taken verwijderen' });
            }
            
            console.log(`Child ${user.id} deleting their own assignment ${assignmentId}`);
        } else if (user.role === 'parent') {
            // Parents can delete any assignment in their family
            console.log(`Parent ${user.id} deleting assignment ${assignmentId}`);
        } else {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const result = await db.deleteTaskAssignment(assignmentId);
        
        if (result === 0) {
            console.error(`No assignment found with ID ${assignmentId}`);
            return res.status(404).json({ error: 'Taak niet gevonden' });
        }
        
        console.log(`Successfully deleted assignment ${assignmentId}`);
        res.json({ success: true, message: 'Taak succesvol verwijderd' });
    } catch (error) {
        console.error('Delete task assignment error:', error);
        res.status(500).json({ error: 'Fout bij het verwijderen van de taak: ' + error.message });
    }
});

// Points endpoints
app.post('/api/users/:userId/bonus-points', requireParent, async (req, res) => {
    try {
        const { userId } = req.params;
        const { points, reason } = req.body;
        
        if (!points || !reason) {
            return res.status(400).json({ error: 'Points and reason are required' });
        }
        
        const pointsToAdd = parseInt(points);
        const user = await db.getUserById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const newPoints = user.points + pointsToAdd;
        await db.updateUserPoints(userId, newPoints);
        await db.addPointsTransaction(userId, pointsToAdd, reason, 'bonus', req.session.user.id);
        
        res.json({ success: true, message: 'Bonus points added successfully' });
    } catch (error) {
        console.error('Add bonus points error:', error);
        res.status(500).json({ error: 'Error adding bonus points' });
    }
});

// Rewards endpoints
app.get('/api/rewards', requireAuth, async (req, res) => {
    try {
        const user = req.session.user;
        const rewards = await db.getRewards(user.familyId);
        res.json({ rewards });
    } catch (error) {
        console.error('Get rewards error:', error);
        res.status(500).json({ error: 'Error loading rewards' });
    }
});

app.post('/api/rewards/:rewardId/redeem', requireAuth, async (req, res) => {
    try {
        const { rewardId } = req.params;
        const user = req.session.user;
        
        const rewards = await db.getRewards(user.familyId);
        const reward = rewards.find(r => r.id == rewardId);
        
        if (!reward) {
            return res.status(404).json({ error: 'Reward not found' });
        }
        
        if (user.points < reward.points_required) {
            return res.status(400).json({ error: 'Insufficient points' });
        }
        
        const newPoints = user.points - reward.points_required;
        await db.updateUserPoints(user.id, newPoints);
        await db.redeemReward(user.id, rewardId, reward.points_required);
        await db.addPointsTransaction(
            user.id, 
            -reward.points_required, 
            `Reward redeemed: ${reward.name}`, 
            'redeemed',
            user.id
        );
        
        // Update session
        req.session.user.points = newPoints;
        
        res.json({ success: true, message: 'Reward redeemed successfully' });
    } catch (error) {
        console.error('Redeem reward error:', error);
        res.status(500).json({ error: 'Error redeeming reward' });
    }
});

app.post('/api/rewards', requireParent, async (req, res) => {
    try {
        const { name, description, points_required, category } = req.body;
        const user = req.session.user;
        
        if (!name || !points_required) {
            return res.status(400).json({ error: 'Name and points required are required' });
        }
        
        const rewardData = {
            name: name.trim(),
            description: description ? description.trim() : null,
            points_required: parseInt(points_required),
            category: category || 'other',
            family_id: user.familyId,
            created_by: user.id
        };
        
        const rewardId = await db.createReward(rewardData);
        res.json({ success: true, rewardId, message: 'Reward created successfully' });
    } catch (error) {
        console.error('Create reward error:', error);
        res.status(500).json({ error: 'Error creating reward' });
    }
});

app.put('/api/rewards/:rewardId', requireParent, async (req, res) => {
    try {
        const { rewardId } = req.params;
        const { name, description, points_required, category } = req.body;
        const user = req.session.user;
        
        if (!name || !points_required) {
            return res.status(400).json({ error: 'Name and points required are required' });
        }
        
        // Check if reward belongs to user's family
        const rewards = await db.getRewards(user.familyId);
        const reward = rewards.find(r => r.id == rewardId);
        
        if (!reward) {
            return res.status(403).json({ error: 'Reward not found or access denied' });
        }
        
        const rewardData = {
            name: name.trim(),
            description: description ? description.trim() : null,
            points_required: parseInt(points_required),
            category: category || 'other'
        };
        
        await db.updateReward(rewardId, rewardData);
        res.json({ success: true, message: 'Reward updated successfully' });
    } catch (error) {
        console.error('Update reward error:', error);
        res.status(500).json({ error: 'Error updating reward' });
    }
});

app.delete('/api/rewards/:rewardId', requireParent, async (req, res) => {
    try {
        const { rewardId } = req.params;
        const user = req.session.user;
        
        // Check if reward belongs to user's family
        const rewards = await db.getRewards(user.familyId);
        const reward = rewards.find(r => r.id == rewardId);
        
        if (!reward) {
            return res.status(403).json({ error: 'Reward not found or access denied' });
        }
        
        await db.deleteReward(rewardId);
        res.json({ success: true, message: 'Reward deleted successfully' });
    } catch (error) {
        console.error('Delete reward error:', error);
        res.status(500).json({ error: 'Error deleting reward' });
    }
});

app.get('/api/rewards/history', requireParent, async (req, res) => {
    try {
        const user = req.session.user;
        const redemptions = await db.getRewardRedemptions(user.familyId);
        res.json({ success: true, redemptions });
    } catch (error) {
        console.error('Get reward history error:', error);
        res.status(500).json({ error: 'Error loading reward history' });
    }
});

// Image upload endpoints
app.post('/api/upload-image', requireParent, upload.single('image'), async (req, res) => {
    try {
        const { userId } = req.body;
        const user = req.session.user;
        
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        // Check if the target user is in the same family
        const familyMembers = await db.getFamilyMembers(user.familyId);
        const targetUser = familyMembers.find(member => member.id == userId);
        
        if (!targetUser) {
            return res.status(403).json({ error: 'User not found in your family' });
        }
        
        // Create the image path relative to public folder
        const imagePath = `/uploads/profiles/${req.file.filename}`;
        
        // Save image info to database (without description)
        const imageData = {
            user_id: userId,
            image_path: imagePath,
            description: null,
            uploaded_by: user.id,
            family_id: user.familyId
        };
        
        const imageId = await db.createProfileImage(imageData);
        
        res.json({ 
            success: true, 
            imageId,
            imagePath,
            message: 'Image uploaded successfully' 
        });
    } catch (error) {
        console.error('Upload image error:', error);
        
        // Delete uploaded file if database operation failed
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }
        
        res.status(500).json({ error: 'Error uploading image' });
    }
});

app.get('/api/profile-images', requireParent, async (req, res) => {
    try {
        const user = req.session.user;
        const images = await db.getProfileImages(user.familyId);
        res.json({ success: true, images });
    } catch (error) {
        console.error('Get profile images error:', error);
        res.status(500).json({ error: 'Error loading profile images' });
    }
});

app.get('/api/profile-images/user/:userId', requireParent, async (req, res) => {
    try {
        const { userId } = req.params;
        const user = req.session.user;
        
        // Check if the target user is in the same family
        const familyMembers = await db.getFamilyMembers(user.familyId);
        const targetUser = familyMembers.find(member => member.id == userId);
        
        if (!targetUser) {
            return res.status(403).json({ error: 'User not found in your family' });
        }
        
        const image = await db.getUserProfileImage(userId);
        res.json({ success: true, image });
    } catch (error) {
        console.error('Get user profile image error:', error);
        res.status(500).json({ error: 'Error loading user profile image' });
    }
});

app.delete('/api/profile-images/:imageId', requireParent, async (req, res) => {
    try {
        const { imageId } = req.params;
        const user = req.session.user;
        
        // Get image info to check family and get file path
        const image = await db.getProfileImageById(imageId);
        
        if (!image || image.family_id !== user.familyId) {
            return res.status(403).json({ error: 'Image not found or access denied' });
        }
        
        // Delete from database
        await db.deleteProfileImage(imageId);
        
        // Delete physical file
        const filePath = path.join(__dirname, 'public', image.image_path);
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file:', err);
        });
        
        res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({ error: 'Error deleting image' });
    }
});

// Standard tasks endpoints
app.get('/api/standard-tasks', requireParent, async (req, res) => {
    try {
        const standardTasks = await db.getStandardTasks();
        res.json({ standardTasks });
    } catch (error) {
        console.error('Get standard tasks error:', error);
        res.status(500).json({ error: 'Error loading standard tasks' });
    }
});

// ==============================================
// MESSAGING API ENDPOINTS
// ==============================================

// Get all conversations for the current user
app.get('/api/conversations', requireAuth, async (req, res) => {
    try {
        const user = req.session.user;
        const { family_only } = req.query;
        
        let conversations;
        if (family_only === 'true') {
            conversations = await db.getFamilyConversationsForUser(user.id);
        } else {
            conversations = await db.getConversationsForUser(user.id);
        }
        
        res.json({ success: true, conversations });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Error loading conversations' });
    }
});

// Get family members for messaging
app.get('/api/family/members', requireAuth, async (req, res) => {
    try {
        const user = req.session.user;
        
        console.log('👨‍👩‍👧‍👦 Getting family members for user:', user.firstName, 'Family ID:', user.familyId);
        
        const familyMembers = await db.getFamilyMembers(user.familyId);
        
        console.log('✅ Retrieved family members:', familyMembers.length);
        
        res.json({
            success: true,
            members: familyMembers
        });
        
    } catch (error) {
        console.error('Error getting family members:', error);
        res.status(500).json({
            success: false,
            message: 'Kon familie leden niet laden'
        });
    }
});

// Get a specific conversation
app.get('/api/conversations/:conversationId', requireAuth, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const user = req.session.user;
        
        const conversation = await db.getConversationById(conversationId, user.id);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        
        const participants = await db.getConversationParticipants(conversationId);
        res.json({ success: true, conversation, participants });
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({ error: 'Error loading conversation' });
    }
});

// Message check endpoint
app.get('/api/conversations/:conversationId/messages/check', requireAuth, async (req, res) => {
    try {
        const conversationId = req.params.conversationId;
        const userId = req.session.user.id;

        // Verify user has access to this conversation
        const conversation = await db.getConversationById(conversationId, userId);
        if (!conversation) {
            return res.status(403).json({ 
                error: 'Je hebt geen toegang tot dit gesprek',
                code: 'ACCESS_DENIED'
            });
        }

        // Get message count and last message timestamp
        const messageInfo = await db.getMessageInfo(conversationId);
        
        res.json({
            messageCount: messageInfo.count,
            lastMessageTimestamp: messageInfo.lastTimestamp
        });
    } catch (error) {
        console.error('Error checking messages:', error);
        res.status(500).json({ error: 'Er is een fout opgetreden bij het controleren van berichten.' });
    }
});

// Send a message
app.post('/api/conversations/:conversationId/messages', requireAuth, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { content } = req.body;
        const user = req.session.user;
        
        // Create message object
        const message = {
            id: Date.now() + Math.random(), // Unique ID
            conversation_id: conversationId,
            sender_id: user.id,
            sender_name: `${user.first_name} ${user.last_name}`,
            sender_first_name: user.first_name,
            sender_last_name: user.last_name,
            sender_role: user.role,
            content: content,
            created_at: new Date().toISOString()
        };
        
        // Store in memory
        if (!messageStore.has(conversationId)) {
            messageStore.set(conversationId, []);
        }
        
        const messages = messageStore.get(conversationId);
        messages.push(message);
        
        // Keep only last 100 messages per conversation to save memory
        if (messages.length > 100) {
            messages.splice(0, messages.length - 100);
        }
        
        console.log(`💬 Message sent to conversation ${conversationId}: "${content.substring(0, 50)}..."`);
        
        res.json({ success: true, message });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Error sending message' });
    }
});

// Mark message as read
app.post('/api/messages/:messageId/read', requireAuth, async (req, res) => {
    try {
        const { messageId } = req.params;
        const user = req.session.user;
        
        await db.markMessageAsRead(messageId, user.id);
        res.json({ success: true, message: 'Message marked as read' });
    } catch (error) {
        console.error('Mark message as read error:', error);
        res.status(500).json({ error: 'Error marking message as read' });
    }
});

// Get unread messages count
app.get('/api/messages/unread-count', requireAuth, async (req, res) => {
    try {
        const user = req.session.user;
        const unreadCount = await db.getUnreadMessagesCount(user.id);
        res.json({ success: true, unreadCount });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Error getting unread count' });
    }
});

// Create a new conversation
app.post('/api/conversations', requireAuth, async (req, res) => {
    try {
        const { type, title, description, participants } = req.body;
        const user = req.session.user;
        
        console.log('Creating conversation:', { type, title, user: user.firstName });
        console.log('User details:', { id: user.id, familyId: user.familyId, family_id: user.family_id });
        
        // Get the user's family ID from the database to ensure we have the correct value
        const userFromDb = await db.getUserById(user.id);
        console.log('User from database:', userFromDb);
        
        if (!userFromDb) {
            return res.status(400).json({ error: 'User not found in database' });
        }
        
        const familyId = userFromDb.family_id;
        console.log('Family ID resolved:', familyId);
        
        const conversationData = {
            type: type || 'direct',
            title: title || null,
            description: description || null,
            family_id: type === 'family' ? familyId : null,
            created_by: user.id
        };
        
        console.log('Conversation data before creation:', conversationData);
        console.log('All values defined?', {
            type: conversationData.type !== undefined,
            title: conversationData.title !== undefined,
            description: conversationData.description !== undefined,
            family_id: conversationData.family_id !== undefined,
            created_by: conversationData.created_by !== undefined
        });
        
        const conversationId = await db.createConversation(conversationData);
        console.log('Conversation created with ID:', conversationId);
        
        // Handle different conversation types
        if (type === 'family') {
            // For family chats, add all family members automatically
            console.log('Getting family members for family ID:', familyId);
            
            const familyMembers = await db.getFamilyMembers(familyId);
            console.log('Adding family members to conversation:', familyMembers.length);
            
            for (const member of familyMembers) {
                const role = member.role === 'parent' ? 'admin' : 'member';
                console.log(`Adding member ${member.first_name} ${member.last_name} as ${role}`);
                await db.addParticipantToConversation(conversationId, member.id, role);
            }
        } else {
            // Add creator as admin
            await db.addParticipantToConversation(conversationId, user.id, 'admin');
            
            // Add other participants
            if (participants && participants.length > 0) {
                for (const participantId of participants) {
                    await db.addParticipantToConversation(conversationId, participantId, 'member');
                }
            }
        }
        
        res.json({ success: true, conversationId, message: 'Conversation created successfully' });
    } catch (error) {
        console.error('Create conversation error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Error creating conversation' });
    }
});

// Delete a conversation
app.delete('/api/conversations/:id', requireAuth, async (req, res) => {
    try {
        const conversationId = req.params.id;
        const user = req.session.user;
        
        console.log('Delete conversation request:', { conversationId, userId: user.id });
        
        // Check if conversation exists and user has access
        const conversation = await db.getConversationById(conversationId, user.id);
        if (!conversation) {
            console.log('Conversation not found or no access:', { conversationId, userId: user.id });
            return res.status(404).json({ error: 'Gesprek niet gevonden of geen toegang' });
        }
        
        console.log('Conversation found:', conversation);
        
        // Check if user has permission to delete (creator or admin)
        const participants = await db.getConversationParticipants(conversationId);
        const userParticipant = participants.find(p => p.id === user.id);
        
        console.log('User participant info:', userParticipant);
        console.log('Conversation creator:', conversation.created_by);
        
        if (!userParticipant || (userParticipant.conversation_role !== 'admin' && conversation.created_by !== user.id)) {
            console.log('Permission denied for deletion:', { 
                userRole: userParticipant?.conversation_role, 
                isCreator: conversation.created_by === user.id 
            });
            return res.status(403).json({ error: 'Geen toestemming om dit gesprek te verwijderen' });
        }
        
        // Delete the conversation
        console.log('Attempting to delete conversation...');
        const deleted = await db.deleteConversation(conversationId);
        
        if (deleted) {
            console.log('Conversation deleted successfully');
            res.json({ success: true, message: 'Gesprek succesvol verwijderd' });
        } else {
            console.log('Failed to delete conversation - no rows affected');
            res.status(500).json({ error: 'Gesprek kon niet worden verwijderd' });
        }
    } catch (error) {
        console.error('Delete conversation error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Er is een fout opgetreden bij het verwijderen van het gesprek',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Find or create direct conversation
app.post('/api/conversations/direct', requireAuth, async (req, res) => {
    try {
        const { otherUserId } = req.body;
        const user = req.session.user;
        
        if (!otherUserId) {
            return res.status(400).json({ error: 'Other user ID is required' });
        }
        
        const conversationId = await db.findOrCreateDirectConversation(user.id, otherUserId);
        res.json({ success: true, conversationId });
    } catch (error) {
        console.error('Find or create direct conversation error:', error);
        res.status(500).json({ error: 'Error creating direct conversation' });
    }
});

// Search users for messaging
app.get('/api/users/search', requireAuth, async (req, res) => {
    try {
        const { q } = req.query;
        const user = req.session.user;
        
        if (!q || q.length < 2) {
            return res.json({ success: true, users: [] });
        }
        
        const users = await db.searchUsers(q, user.id, user.familyId);
        res.json({ success: true, users });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Error searching users' });
    }
});

// Delete a message
app.delete('/api/messages/:messageId', requireAuth, async (req, res) => {
    try {
        const { messageId } = req.params;
        const user = req.session.user;
        
        const affectedRows = await db.deleteMessage(messageId, user.id);
        if (affectedRows === 0) {
            return res.status(404).json({ error: 'Message not found or not authorized' });
        }
        
        res.json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: 'Error deleting message' });
    }
});

// Edit a message
app.put('/api/messages/:messageId', requireAuth, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const user = req.session.user;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Message content is required' });
        }
        
        const affectedRows = await db.editMessage(messageId, content.trim(), user.id);
        if (affectedRows === 0) {
            return res.status(404).json({ error: 'Message not found or not authorized' });
        }
        
        res.json({ success: true, message: 'Message updated successfully' });
    } catch (error) {
        console.error('Edit message error:', error);
        res.status(500).json({ error: 'Error updating message' });
    }
});

// Simple Direct Messaging Endpoints
app.get('/api/messages/direct/:userId', requireAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUser = req.session.user;
        
        console.log(`📨 Loading direct messages between ${currentUser.id} and ${userId}`);
        
        // Get messages between current user and target user
        const messages = await db.getDirectMessages(currentUser.id, parseInt(userId));
        
        console.log(`📨 Found ${messages.length} direct messages`);
        
        res.json({
            success: true,
            messages: messages
        });
        
    } catch (error) {
        console.error('Error loading direct messages:', error);
        res.status(500).json({
            success: false,
            message: 'Kon berichten niet laden'
        });
    }
});

app.post('/api/messages/direct', requireAuth, async (req, res) => {
    try {
        const { recipient_id, content } = req.body;
        const sender = req.session.user;
        
        if (!recipient_id || !content) {
            return res.status(400).json({
                success: false,
                message: 'Ontbrekende gegevens'
            });
        }
        
        console.log(`💬 Sending direct message from ${sender.id} to ${recipient_id}`);
        
        // Save message directly
        const messageId = await db.saveDirectMessage({
            sender_id: sender.id,
            recipient_id: parseInt(recipient_id),
            content: content.trim()
        });
        
        console.log(`✅ Direct message saved with ID: ${messageId}`);
        
        res.json({
            success: true,
            message_id: messageId
        });
        
    } catch (error) {
        console.error('Error sending direct message:', error);
        res.status(500).json({
            success: false,
            message: 'Kon bericht niet versturen'
        });
    }
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/messages', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'messages.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Start server with proper error handling
const server = app.listen(PORT, async () => {
    console.log(` PointsFam server running on http://localhost:${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Database: MySQL (${process.env.DB_NAME || 'pointsfam'})`);
    console.log(` Test Parent Login: username=parent1, password=password123`);
    console.log(` Test Child Login: username=child1, password=password123`);
});

// Handle server errors
server.on('error', (error) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
    }
    process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('\n🛑 Shutting down server...');
    
    // Close server
    server.close(() => {
        console.log('✅ Server closed');
        
        // Close database connection
        db.close().then(() => {
            console.log('✅ Database connection closed');
            process.exit(0);
        }).catch((err) => {
            console.error('❌ Error closing database:', err);
            process.exit(1);
        });
    });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Database connection
(async () => {
    try {
        await db.connect();
        console.log('🔧 Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
})();