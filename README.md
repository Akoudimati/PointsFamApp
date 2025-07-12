# PointsFamApp

A web-based family points application where children earn points for good behavior and completing household tasks.


link 
https://pointsfamapp.onrender.com/
## 🚀 Features

- 👨‍👩‍👧‍👦 **Family Management**: Multiple families with parents and children
- 📊 **Points System**: Earn points for tasks and good behavior
- ✅ **Task Management**: Standard and custom tasks with approval system
- 🏆 **Rewards System**: Configurable prize list for point redemption
- 🔐 **Role-Based Access**: Separate interfaces for parents and children
- 🌓 **Dual Themes**: Light and dark mode support
- 📱 **Responsive Design**: Bootstrap-powered responsive UI

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **Database**: MySQL
- **Frontend**: HTML + CSS + JavaScript + Bootstrap 5
- **Authentication**: Session-based with bcrypt password hashing

## 📋 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)
- MySQL Server (v5.7 or higher)

### Installation

1. **Clone the repository** (or download files)
   ```bash
   cd PointsFamApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup MySQL Database**
   - Start your MySQL server
   - Create a database named `pointsfam`
   - Import the database schema:
     ```bash
     mysql -u root -p pointsfam < database/pointsfam.sql
     ```
   - Or use phpMyAdmin/MySQL Workbench to import `database/pointsfam.sql`

4. **Configure Database Connection**
   - Update `db.js` with your MySQL credentials if needed
   - Default connection: host=localhost, user=root, password='' (empty), database=pointsfam

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open browser and go to: `http://localhost:3000`

### Production Start
```bash
npm start
```

## 🏗️ Project Structure

```
PointsFamApp/
├── index.js                  # Main Express server
├── db.js                     # Database connection and operations
├── package.json              # Dependencies and scripts
├── database/
│   └── pointsfam.sql         # MySQL database schema and sample data
├── scripts/
│   └── init-database.js      # Database initialization script
├── public/
│   ├── css/
│   │   ├── style.css         # Custom styles
│   │   ├── light-theme.css   # Light mode theme
│   │   └── dark-theme.css    # Dark mode theme
│   ├── js/
│   │   ├── app.js            # Main frontend JavaScript
│   │   ├── dashboard.js      # Dashboard functionality
│   │   └── theme-switcher.js # Theme switching logic
│   └── assets/
│       └── logo.png          # App logo
├── views/
│   ├── layouts/
│   │   └── main.handlebars   # Main layout template
│   ├── login.handlebars      # Login page
│   ├── parent-dashboard.handlebars
│   ├── child-dashboard.handlebars
│   ├── tasks.handlebars      # Task management
│   ├── rewards.handlebars    # Rewards/prizes page
│   └── profile.handlebars    # User profile
└── routes/
    ├── auth.js               # Authentication routes
    ├── dashboard.js          # Dashboard routes
    ├── tasks.js              # Task management routes
    └── rewards.js            # Rewards system routes
```

## 🎯 Usage

### For Parents:
- Add and manage tasks for children
- Approve completed tasks
- Give bonus points for good behavior
- Manage the rewards/prizes list
- View family overview and progress

### For Children:
- View available tasks and their point values
- Mark tasks as completed
- Check their current points total
- View available rewards
- See other family members' points

## 🔐 Default Login Credentials

After running `npm run init-db`, you can use these test accounts:

**Parent Account:**
- Username: `parent1`
- Password: `password123`

**Child Account:**
- Username: `child1`
- Password: `password123`

## 🌟 Key Features Implementation

- ✅ **MUST HAVE**: Points system, task management, authentication, family management
- ⏳ **WANNA HAVE**: Communication center (design phase)
- 💭 **WISH**: Inter-family communication

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🤝 Contributing

This project is part of a development internship application for SamenICT Team.

## 📄 License

MIT License 
