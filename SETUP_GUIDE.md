# Study Buddy - Complete Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/downloads)
- **Code Editor** (VS Code recommended) - [Download](https://code.microsoft.com/)

---

## Quick Start (5 Minutes)

```bash
# 1. Navigate to project directory
cd "/Users/mac/Documents/Arden/Final Year Project/Study Buddy"

# 2. Install all dependencies
npm run install-all

# 3. Start MongoDB (if not running)
# macOS with Homebrew:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod

# Windows:
# Start MongoDB service from Services panel

# 4. Seed the database with sample data
npm run seed

# 5. Start the application
npm run dev
```

The application will open at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

---

## Detailed Setup Instructions

### Step 1: Install Dependencies

#### Root Dependencies (Backend)
```bash
npm install
```

This installs:
- express (web framework)
- mongoose (MongoDB ODM)
- bcryptjs (password hashing)
- jsonwebtoken (authentication)
- cors (cross-origin resource sharing)
- dotenv (environment variables)
- morgan (logging)

#### Client Dependencies (Frontend)
```bash
cd client
npm install
cd ..
```

Or use the convenience script:
```bash
npm run install-all
```

### Step 2: Configure Environment Variables

The `.env` file is already created with development defaults. For production or custom setup:

```bash
# Copy the example file
cp .env.example .env

# Edit with your values
nano .env  # or use your preferred editor
```

#### Environment Variables Explained:

```env
# Server Configuration
PORT=5000                                    # Backend server port
NODE_ENV=development                         # Environment (development/production)

# Database
MONGODB_URI=mongodb://localhost:27017/study-buddy   # MongoDB connection string

# JWT Authentication
JWT_SECRET=your_secret_key_here             # Secret for signing tokens (CHANGE IN PRODUCTION!)
JWT_EXPIRE=7d                               # Token expiration time

# Frontend URL
CLIENT_URL=http://localhost:3000            # Frontend URL for CORS
```

**⚠️ IMPORTANT**: In production, use a strong JWT_SECRET:
```bash
# Generate a secure random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Database Setup

#### Option A: Local MongoDB

1. **Install MongoDB**:
   ```bash
   # macOS with Homebrew
   brew tap mongodb/brew
   brew install mongodb-community
   
   # Ubuntu
   sudo apt-get install mongodb
   
   # Windows - Download installer from mongodb.com
   ```

2. **Start MongoDB**:
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   # Use Services panel or run mongod.exe
   ```

3. **Verify MongoDB is running**:
   ```bash
   mongosh
   # If connected successfully, MongoDB is running
   ```

#### Option B: MongoDB Atlas (Cloud)

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string
4. Update `.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/study-buddy?retryWrites=true&w=majority
   ```

### Step 4: Seed Database with Sample Data

The seed script populates the database with:
- 3 demo users (student, instructor, admin)
- 5 sample courses with lessons
- 3 quizzes with questions
- Progress data for demonstration

```bash
npm run seed
```

**Demo Accounts Created**:
```
Student:
  Email: student@example.com
  Password: password123

Instructor:
  Email: instructor@example.com
  Password: password123

Admin:
  Email: admin@example.com
  Password: password123
```

### Step 5: Start the Application

#### Development Mode (Recommended)

Runs both frontend and backend concurrently:
```bash
npm run dev
```

This will:
- Start backend on http://localhost:5000
- Start frontend on http://localhost:3000
- Enable hot-reloading for both

#### Production Mode

1. **Build frontend**:
   ```bash
   cd client
   npm run build
   ```

2. **Serve production build**:
   Configure Express to serve the built files:
   ```javascript
   // In server/index.js
   app.use(express.static(path.join(__dirname, '../client/build')));
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, '../client/build/index.html'));
   });
   ```

3. **Start server**:
   ```bash
   NODE_ENV=production npm start
   ```

---

## Testing the Application

### 1. Access the Application
Open browser and navigate to http://localhost:3000

### 2. Login with Demo Account
```
Email: student@example.com
Password: password123
```

### 3. Test Key Features

#### As a Student:
1. **Dashboard**: View your learning progress and statistics
2. **Courses**: Browse and enroll in available courses
3. **Course Detail**: View lessons and quizzes
4. **Take Quiz**: Complete an interactive quiz
5. **Profile**: Update your profile information

#### As an Instructor:
1. Login with `instructor@example.com / password123`
2. Create new courses
3. Add lessons to courses
4. Create quizzes for your courses
5. View student enrollment

#### As an Admin:
1. Login with `admin@example.com / password123`
2. Access all courses and users
3. Manage platform content
4. View system-wide statistics

---

## Project Structure

```
study-buddy/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React Context (state)
│   │   ├── services/      # API services
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── server/                # Node.js backend
│   ├── config/           # Configuration files
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routes
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── utils/            # Helper functions
│   ├── seed.js           # Database seeder
│   └── index.js          # Server entry point
├── .env                  # Environment variables
├── .gitignore
├── package.json          # Root dependencies
└── README.md
```

---

## Available Scripts

### Root Scripts
```bash
npm run dev          # Start both frontend and backend
npm run server       # Start backend only
npm run client       # Start frontend only
npm run build        # Build frontend for production
npm run install-all  # Install all dependencies
npm run seed         # Seed database with sample data
```

### Client Scripts (in client/ directory)
```bash
npm start            # Start development server
npm run build        # Build for production
npm test             # Run tests
npm run eject        # Eject from Create React App
```

---

## Troubleshooting

### MongoDB Connection Issues

**Problem**: Cannot connect to MongoDB
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions**:
1. Check if MongoDB is running:
   ```bash
   # macOS
   brew services list | grep mongodb
   
   # Linux
   sudo systemctl status mongod
   ```

2. Start MongoDB:
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

3. Verify connection string in `.env`

### Port Already in Use

**Problem**: Port 3000 or 5000 already in use

**Solution**:
```bash
# Find process using the port
lsof -i :3000  # or :5000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=5001
```

### JWT Authentication Errors

**Problem**: Token errors or authentication failing

**Solutions**:
1. Clear browser localStorage
2. Verify JWT_SECRET is set in `.env`
3. Check token expiration (JWT_EXPIRE)
4. Re-login to get fresh token

### Frontend Not Loading

**Problem**: Blank screen or console errors

**Solutions**:
1. Check browser console for errors
2. Verify backend is running (http://localhost:5000/api/health)
3. Clear browser cache
4. Delete `node_modules` and reinstall:
   ```bash
   cd client
   rm -rf node_modules package-lock.json
   npm install
   ```

### Database Seed Fails

**Problem**: Seed script errors

**Solutions**:
1. Ensure MongoDB is running
2. Check connection string
3. Clear existing data:
   ```bash
   mongosh
   use study-buddy
   db.dropDatabase()
   exit
   npm run seed
   ```

---

## API Endpoints Reference

### Authentication
```
POST   /api/auth/register        Register new user
POST   /api/auth/login           Login user
GET    /api/auth/me              Get current user
PUT    /api/auth/profile         Update profile
```

### Courses
```
GET    /api/courses              Get all courses
GET    /api/courses/:id          Get course by ID
POST   /api/courses              Create course (instructor)
PUT    /api/courses/:id          Update course
DELETE /api/courses/:id          Delete course
POST   /api/courses/:id/enroll   Enroll in course
```

### Quizzes
```
GET    /api/quizzes/course/:id   Get course quizzes
GET    /api/quizzes/:id          Get quiz by ID
POST   /api/quizzes              Create quiz (instructor)
PUT    /api/quizzes/:id          Update quiz
DELETE /api/quizzes/:id          Delete quiz
POST   /api/quizzes/:id/submit   Submit quiz answers
```

### Progress
```
GET    /api/progress/dashboard           Get dashboard data
GET    /api/progress/user/:userId        Get user progress
GET    /api/progress/course/:courseId    Get course progress
PUT    /api/progress/lesson              Update lesson progress
```

### Users (Admin)
```
GET    /api/users                Get all users
GET    /api/users/:id            Get user by ID
PUT    /api/users/:id            Update user
DELETE /api/users/:id            Delete user
```

---

## Performance Optimization

### Frontend
- Code splitting with React.lazy()
- Image optimization
- Minimize re-renders with React.memo()
- Use production build for deployment

### Backend
- Add database indexes
- Implement caching (Redis)
- Rate limiting for APIs
- Gzip compression

### Database
```javascript
// Add indexes for better query performance
userSchema.index({ email: 1 });
courseSchema.index({ title: 'text', description: 'text' });
progressSchema.index({ user: 1, course: 1 });
```

---

## Security Best Practices

1. **Environment Variables**: Never commit `.env` to version control
2. **JWT Secret**: Use strong, random secrets in production
3. **Password Hashing**: Already implemented with bcrypt
4. **Input Validation**: Validate all user inputs
5. **HTTPS**: Use HTTPS in production
6. **Rate Limiting**: Implement API rate limiting
7. **CORS**: Configure proper CORS policies

---

## Deployment

### Deploying to Heroku

1. **Install Heroku CLI**
2. **Create Heroku app**:
   ```bash
   heroku create study-buddy-app
   ```

3. **Add MongoDB Atlas**:
   ```bash
   heroku config:set MONGODB_URI="your-atlas-connection-string"
   ```

4. **Set environment variables**:
   ```bash
   heroku config:set JWT_SECRET="your-secret"
   heroku config:set NODE_ENV="production"
   ```

5. **Deploy**:
   ```bash
   git push heroku main
   ```

### Deploying to Vercel (Frontend) + Heroku (Backend)

1. **Deploy backend to Heroku** (see above)
2. **Deploy frontend to Vercel**:
   ```bash
   cd client
   vercel
   ```
3. **Update API URL**:
   Add `REACT_APP_API_URL` environment variable in Vercel

---

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [JWT Introduction](https://jwt.io/introduction)
- [REST API Best Practices](https://restfulapi.net/)

---

## Support

For issues or questions:
1. Check the [README.md](./README.md)
2. Review [DISSERTATION_NOTES.md](./DISSERTATION_NOTES.md)
3. Check console logs for errors
4. Verify environment configuration

---

**Happy Learning! 🎓**
