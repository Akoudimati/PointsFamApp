const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const cors = require('cors');
const Database = require('./db');

// Initialize database
const db = new Database();

// Initialize Express app
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session configuration
app.use(session({
    secret: 'pointsfam-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Authentication required' });
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
            const standardTasks = await db.getStandardTasks();
            
            // Get all tasks for the family to show open tasks
            const allTasks = await db.getTasksForFamily(user.familyId);
            
            res.json({
                type: 'parent',
                user: user,
                familyMembers: familyMembers,
                pendingTasks: pendingTasks,
                standardTasks: standardTasks,
                allTasks: allTasks
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
        }
        
        await db.acceptTask(assignmentId);
        res.json({ success: true, message: 'Task accepted successfully' });
    } catch (error) {
        console.error('Accept task error:', error);
        res.status(500).json({ error: 'Error accepting task' });
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

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 PointsFam server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${path.join(__dirname, 'database', 'pointsfam.db')}`);
    console.log(`👨‍💼 Test Parent Login: username=parent1, password=password123`);
    console.log(`👧 Test Child Login: username=child1, password=password123`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    db.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    db.close();
    process.exit(0);
});