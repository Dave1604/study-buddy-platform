# Study Buddy - Quick Start Guide (2 Minutes) ⚡

## Prerequisites Check

Before starting, verify you have:
- ✅ Node.js installed: `node --version` (should show v16+)
- ✅ MongoDB installed: `mongod --version`

---

## 🚀 Launch in 4 Commands

```bash
# 1. Install all dependencies (takes 2-3 minutes)
npm run install-all

# 2. Start MongoDB (choose your OS)
# macOS:
brew services start mongodb-community
# Linux:
sudo systemctl start mongod
# Windows: Start from Services panel

# 3. Seed database with demo data
npm run seed

# 4. Start the application
npm run dev
```

---

## 🌐 Access the Application

Open your browser and go to:
**http://localhost:3000**

---

## 🔑 Demo Login Credentials

### Student Account
```
Email: student@example.com
Password: password123
```

### Instructor Account
```
Email: instructor@example.com
Password: password123
```

### Admin Account
```
Email: admin@example.com
Password: password123
```

---

## ✅ Quick Feature Test

### 1️⃣ Login (30 seconds)
- Use student account to login
- You'll be redirected to Dashboard

### 2️⃣ View Dashboard (1 minute)
- See your learning statistics
- View progress charts
- Check recent activity

### 3️⃣ Browse Courses (1 minute)
- Click "Courses" in navigation
- Browse 5 sample courses
- Click on "Introduction to JavaScript"

### 4️⃣ Take a Quiz (2 minutes)
- In course detail, go to "Quizzes" tab
- Click "Start Quiz" on JavaScript Basics Quiz
- Answer 5 questions
- Submit and see results with feedback

### 5️⃣ Check Progress (30 seconds)
- Return to Dashboard
- See updated quiz performance chart
- View completion percentage

---

## 🎯 What You'll See

### Homepage
- Modern landing page with features
- Call-to-action buttons
- Statistics showcase

### Dashboard
- 4 stat cards (courses, score, time, completed)
- Line chart showing quiz performance
- Pie chart showing course categories
- Recent activity list

### Courses Page
- Search and filter functionality
- Course cards with details
- Category and level badges

### Course Detail
- Course overview with instructor info
- Lessons list with completion status
- Interactive quizzes section
- Enrollment functionality

### Quiz Interface
- Timer countdown
- Question navigation
- Multiple question types
- Instant results with explanations

### Profile Page
- Personal information
- Learning statistics
- Edit profile functionality

---

## 🎨 Design Highlights

- **Modern UI**: Clean, gradient-based design
- **Responsive**: Works on all devices
- **Interactive**: Smooth animations and transitions
- **Intuitive**: Clear navigation and feedback
- **Professional**: Suitable for academic presentation

---

## 📊 Sample Data Included

✅ **5 Courses** in different categories
✅ **20+ Lessons** with content
✅ **3 Interactive Quizzes** with 10+ questions
✅ **Progress Data** showing various completion stages

---

## 🔧 Troubleshooting

### Can't connect to MongoDB?
```bash
# Check if MongoDB is running
mongosh

# If not, start it:
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

### Port already in use?
```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or port 5000
lsof -i :5000
kill -9 <PID>
```

### Authentication issues?
- Clear browser localStorage
- Re-login with demo credentials
- Check console for errors

---

## 📱 Browser Support

Works best on:
- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

---

## 🎓 For Dissertation Demonstration

### Key Points to Highlight:

1. **Literature-Informed Design**
   - Immediate quiz feedback (research-based)
   - Visual progress tracking
   - Gamification elements

2. **Technical Excellence**
   - Full-stack MERN implementation
   - RESTful API architecture
   - Secure authentication
   - Real-time data visualization

3. **User Experience**
   - Intuitive navigation
   - Responsive design
   - Interactive features
   - Clear feedback mechanisms

4. **Agile Methodology**
   - Iterative development
   - Feature-based sprints
   - Continuous refinement

---

## 📚 Next Steps

After testing:
1. ✅ Read `DISSERTATION_NOTES.md` for academic context
2. ✅ Review `SETUP_GUIDE.md` for detailed documentation
3. ✅ Check `README.md` for feature overview
4. ✅ Explore the codebase structure

---

## 🎉 You're Ready!

The application is **fully functional** and ready for:
- ✅ Demonstration
- ✅ Evaluation
- ✅ Presentation
- ✅ Further development

---

**Questions?** Check the comprehensive guides in:
- `README.md`
- `SETUP_GUIDE.md`
- `DISSERTATION_NOTES.md`

**Enjoy exploring Study Buddy! 🎓✨**
