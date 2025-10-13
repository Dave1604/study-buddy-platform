# Study Buddy - Interactive E-Learning Platform

## 📚 Project Overview

**Study Buddy** is an interactive e-learning web application designed to enhance learner engagement through integrated quizzes and comprehensive performance tracking features. This project is developed as part of a final year dissertation, focusing on applying best practices from e-learning research to create a modern, interactive educational platform.

## 🎯 Project Objectives

1. **Literature-Informed Design**: Implement features based on best practices identified in e-learning research
2. **Interactive Learning**: Provide real-time quizzes with immediate feedback
3. **Progress Tracking**: Offer personalized dashboards with visual analytics
4. **User Engagement**: Create an intuitive, responsive interface that promotes active learning

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18 with Hooks
- React Router v6 for navigation
- Axios for API communication
- Tailwind CSS for styling
- Recharts for data visualization
- Context API for state management

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose
- JWT-based authentication
- RESTful API architecture

## 🚀 Features

### Core Features
- ✅ User authentication (registration, login, JWT tokens)
- ✅ Role-based access (Student, Instructor, Admin)
- ✅ Course management system
- ✅ Interactive quiz system with multiple question types
- ✅ Real-time progress tracking
- ✅ Performance analytics dashboard
- ✅ Personalized learning paths

### Quiz Features
- Multiple choice questions (MCQ)
- True/False questions
- Multiple correct answers
- Timed quizzes
- Instant feedback
- Score calculation
- Quiz history tracking

### Dashboard Features
- Course completion percentage
- Quiz performance metrics
- Visual progress charts
- Learning streaks
- Achievement badges
- Performance trends

## 📋 Development Methodology

This project follows an **Agile methodology** with iterative development cycles (sprints). Features are implemented incrementally, allowing for:
- Rapid prototyping
- Continuous testing and refinement
- Flexibility in design decisions
- Integration of literature findings throughout development

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Step 1: Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install all dependencies (root + client)
npm run install-all
```

### Step 2: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# Set your MongoDB URI and JWT secret
```

### Step 3: Start MongoDB

```bash
# Start MongoDB service (macOS with Homebrew)
brew services start mongodb-community

# Or start manually
mongod --config /usr/local/etc/mongod.conf
```

### Step 4: Run the Application

```bash
# Development mode (runs both frontend and backend)
npm run dev

# Or run separately:
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📁 Project Structure

```
study-buddy/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React Context (state management)
│   │   ├── services/      # API service layer
│   │   ├── utils/         # Helper functions
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
│   └── index.js          # Server entry point
├── .env.example          # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create course (instructor/admin)
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Quizzes
- `GET /api/quizzes/course/:courseId` - Get quizzes for a course
- `GET /api/quizzes/:id` - Get quiz by ID
- `POST /api/quizzes` - Create quiz
- `POST /api/quizzes/:id/submit` - Submit quiz answers

### Progress
- `GET /api/progress/user/:userId` - Get user progress
- `GET /api/progress/course/:courseId` - Get progress for a course
- `POST /api/progress` - Update progress

## 📊 Database Schema

### User Model
- Personal information (name, email)
- Authentication credentials
- Role (student, instructor, admin)
- Enrollment tracking
- Learning statistics

### Course Model
- Course details (title, description, category)
- Instructor information
- Lessons and content
- Enrollment count
- Creation/update timestamps

### Quiz Model
- Quiz metadata (title, duration, passing score)
- Questions array with multiple types
- Associated course
- Difficulty level

### Progress Model
- User-course relationship
- Completion percentage
- Quiz scores
- Time spent
- Achievements

## 🎨 Design Principles

Based on e-learning research best practices:

1. **Immediate Feedback**: Real-time quiz results and explanations
2. **Visual Progress**: Charts and graphs for motivation
3. **Personalization**: Customized dashboards based on user performance
4. **Accessibility**: Responsive design for all devices
5. **Engagement**: Interactive elements and gamification

## 📖 Research Foundation

This application implements findings from literature on:
- Interactive learning environments
- Quiz-based assessment effectiveness
- Progress visualization techniques
- User engagement strategies
- Dashboard design for learners

## 🔄 Development Sprints

**Sprint 1**: Project setup, authentication, database design
**Sprint 2**: Course management system
**Sprint 3**: Quiz system with multiple question types
**Sprint 4**: Progress tracking and analytics
**Sprint 5**: Dashboard implementation with visualizations
**Sprint 6**: UI/UX refinement, testing, documentation

## 🤝 Contributing

This is a dissertation project. For academic purposes, contributions are not currently accepted.

## 📄 License

MIT License - See LICENSE file for details

## 📧 Contact

For questions about this dissertation project, please contact [Your Email]

---

**Note**: This is an academic project developed for dissertation purposes. The implementation reflects research findings from e-learning literature and demonstrates practical application of theoretical concepts.
