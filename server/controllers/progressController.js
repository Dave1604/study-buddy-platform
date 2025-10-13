const Progress = require('../models/Progress');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Get user's progress for all courses
// @route   GET /api/progress/user/:userId
// @access  Private
exports.getUserProgress = async (req, res) => {
  try {
    // Check if user is requesting their own progress or is admin
    if (req.params.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this progress'
      });
    }

    const progressData = await Progress.find({ user: req.params.userId })
      .populate('course', 'title thumbnail category level')
      .sort({ lastAccessedAt: -1 });

    res.status(200).json({
      status: 'success',
      results: progressData.length,
      data: { progress: progressData }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get progress for a specific course
// @route   GET /api/progress/course/:courseId
// @access  Private
exports.getCourseProgress = async (req, res) => {
  try {
    const progress = await Progress.findOne({
      user: req.user.id,
      course: req.params.courseId
    }).populate('course');

    if (!progress) {
      return res.status(404).json({
        status: 'error',
        message: 'Progress not found for this course'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { progress }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update lesson progress
// @route   PUT /api/progress/lesson
// @access  Private
exports.updateLessonProgress = async (req, res) => {
  try {
    const { courseId, lessonId, completed, timeSpent } = req.body;

    const progress = await Progress.findOne({
      user: req.user.id,
      course: courseId
    });

    if (!progress) {
      return res.status(404).json({
        status: 'error',
        message: 'Progress not found'
      });
    }

    // Find or create lesson progress
    let lessonProgress = progress.lessonsProgress.find(
      lp => lp.lessonId.toString() === lessonId
    );

    if (lessonProgress) {
      lessonProgress.completed = completed;
      lessonProgress.lastAccessedAt = Date.now();
      if (completed && !lessonProgress.completedAt) {
        lessonProgress.completedAt = Date.now();
      }
      if (timeSpent) {
        lessonProgress.timeSpent += timeSpent;
      }
    } else {
      progress.lessonsProgress.push({
        lessonId,
        completed,
        completedAt: completed ? Date.now() : null,
        timeSpent: timeSpent || 0,
        lastAccessedAt: Date.now()
      });
    }

    // Update current lesson
    progress.currentLesson = lessonId;
    progress.lastAccessedAt = Date.now();

    // Update total time spent
    if (timeSpent) {
      progress.totalTimeSpent += timeSpent;
    }

    // Get course to calculate completion percentage
    const course = await Course.findById(courseId);
    progress.completionPercentage = progress.calculateCompletionPercentage(
      course.lessons.length
    );

    // Check if course is completed
    if (progress.completionPercentage === 100 && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = Date.now();
    }

    await progress.save();

    res.status(200).json({
      status: 'success',
      data: { progress }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get dashboard analytics
// @route   GET /api/progress/dashboard
// @access  Private
exports.getDashboard = async (req, res) => {
  try {
    const progressData = await Progress.find({ user: req.user.id })
      .populate('course', 'title thumbnail category');

    // Calculate analytics
    const totalCourses = progressData.length;
    const completedCourses = progressData.filter(p => p.isCompleted).length;
    const inProgressCourses = totalCourses - completedCourses;
    
    const totalQuizzes = progressData.reduce(
      (sum, p) => sum + p.quizAttempts.length, 
      0
    );
    
    const averageScore = progressData.reduce((sum, p) => {
      return sum + (p.performance.averageQuizScore || 0);
    }, 0) / (totalCourses || 1);

    const totalTimeSpent = progressData.reduce(
      (sum, p) => sum + p.totalTimeSpent, 
      0
    );

    // Recent activity
    const recentActivity = progressData
      .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
      .slice(0, 5)
      .map(p => ({
        course: p.course,
        lastAccessed: p.lastAccessedAt,
        completionPercentage: p.completionPercentage
      }));

    // Quiz performance over time
    const allQuizAttempts = [];
    progressData.forEach(p => {
      p.quizAttempts.forEach(attempt => {
        allQuizAttempts.push({
          date: attempt.attemptedAt,
          score: attempt.percentage,
          passed: attempt.passed
        });
      });
    });
    
    const quizPerformance = allQuizAttempts
      .sort((a, b) => a.date - b.date)
      .slice(-10); // Last 10 attempts

    // Course progress by category
    const categoryProgress = {};
    progressData.forEach(p => {
      const category = p.course.category;
      if (!categoryProgress[category]) {
        categoryProgress[category] = {
          total: 0,
          completed: 0,
          inProgress: 0
        };
      }
      categoryProgress[category].total += 1;
      if (p.isCompleted) {
        categoryProgress[category].completed += 1;
      } else {
        categoryProgress[category].inProgress += 1;
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        overview: {
          totalCourses,
          completedCourses,
          inProgressCourses,
          totalQuizzes,
          averageScore: Math.round(averageScore),
          totalTimeSpent
        },
        recentActivity,
        quizPerformance,
        categoryProgress
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get instructor analytics for all their courses
// @route   GET /api/progress/instructor/analytics
// @access  Private (Instructor/Admin)
exports.getInstructorAnalytics = async (req, res) => {
  try {
    // Get all courses by this instructor
    const instructorCourses = await Course.find({ 
      instructor: req.user.id 
    }).select('_id title category level enrolledStudents lessons');

    if (instructorCourses.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          overview: {
            totalCourses: 0,
            totalStudents: 0,
            totalEnrollments: 0,
            averageCompletionRate: 0,
            averageQuizScore: 0,
            totalLearningHours: 0
          },
          courseAnalytics: [],
          studentPerformance: [],
          recentActivity: [],
          categoryBreakdown: {}
        }
      });
    }

    const courseIds = instructorCourses.map(course => course._id);
    
    // Get all progress data for these courses
    const allProgress = await Progress.find({ 
      course: { $in: courseIds } 
    })
    .populate('user', 'firstName lastName email avatar')
    .populate('course', 'title category level')
    .sort({ lastAccessedAt: -1 });

    // Calculate overview statistics
    const totalStudents = new Set(allProgress.map(p => p.user._id)).size;
    const totalEnrollments = allProgress.length;
    const completedCourses = allProgress.filter(p => p.isCompleted).length;
    const averageCompletionRate = totalEnrollments > 0 ? 
      Math.round((completedCourses / totalEnrollments) * 100) : 0;
    
    const allQuizScores = allProgress
      .flatMap(p => p.quizAttempts)
      .map(attempt => attempt.percentage)
      .filter(score => score !== undefined);
    
    const averageQuizScore = allQuizScores.length > 0 ? 
      Math.round(allQuizScores.reduce((sum, score) => sum + score, 0) / allQuizScores.length) : 0;
    
    const totalLearningHours = Math.round(
      allProgress.reduce((sum, p) => sum + (p.totalTimeSpent || 0), 0) / 60
    );

    // Course-specific analytics
    const courseAnalytics = instructorCourses.map(course => {
      const courseProgress = allProgress.filter(p => p.course._id.toString() === course._id.toString());
      const enrolledCount = courseProgress.length;
      const completedCount = courseProgress.filter(p => p.isCompleted).length;
      const completionRate = enrolledCount > 0 ? Math.round((completedCount / enrolledCount) * 100) : 0;
      
      const courseQuizScores = courseProgress
        .flatMap(p => p.quizAttempts)
        .map(attempt => attempt.percentage)
        .filter(score => score !== undefined);
      
      const avgQuizScore = courseQuizScores.length > 0 ? 
        Math.round(courseQuizScores.reduce((sum, score) => sum + score, 0) / courseQuizScores.length) : 0;
      
      const totalHours = Math.round(
        courseProgress.reduce((sum, p) => sum + (p.totalTimeSpent || 0), 0) / 60
      );

      return {
        courseId: course._id,
        courseTitle: course.title,
        category: course.category,
        level: course.level,
        enrolledStudents: enrolledCount,
        completedStudents: completedCount,
        completionRate,
        averageQuizScore: avgQuizScore,
        totalLearningHours: totalHours,
        lessonsCount: course.lessons?.length || 0
      };
    });

    // Student performance data
    const studentPerformance = allProgress.map(progress => {
      const quizScores = progress.quizAttempts.map(attempt => attempt.percentage);
      const avgScore = quizScores.length > 0 ? 
        Math.round(quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length) : 0;
      
      const lastActivity = progress.lastAccessedAt;
      const daysSinceLastActivity = Math.floor((Date.now() - lastActivity) / (1000 * 60 * 60 * 24));
      
      return {
        studentId: progress.user._id,
        studentName: `${progress.user.firstName} ${progress.user.lastName}`,
        studentEmail: progress.user.email,
        courseTitle: progress.course.title,
        courseId: progress.course._id,
        completionPercentage: progress.completionPercentage,
        isCompleted: progress.isCompleted,
        averageQuizScore: avgScore,
        totalQuizzesTaken: progress.quizAttempts.length,
        totalLearningHours: Math.round((progress.totalTimeSpent || 0) / 60),
        lastActivity: lastActivity,
        daysSinceLastActivity,
        enrolledAt: progress.enrolledAt
      };
    });

    // Recent activity (last 10 activities)
    const recentActivity = allProgress
      .slice(0, 10)
      .map(progress => ({
        studentName: `${progress.user.firstName} ${progress.user.lastName}`,
        courseTitle: progress.course.title,
        activity: progress.isCompleted ? 'Completed course' : 
                 progress.completionPercentage > 0 ? 'Made progress' : 'Enrolled',
        lastAccessed: progress.lastAccessedAt,
        completionPercentage: progress.completionPercentage
      }));

    // Category breakdown
    const categoryBreakdown = {};
    instructorCourses.forEach(course => {
      const category = course.category;
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          totalCourses: 0,
          totalStudents: 0,
          averageCompletionRate: 0,
          totalLearningHours: 0
        };
      }
      categoryBreakdown[category].totalCourses += 1;
      
      const categoryProgress = allProgress.filter(p => p.course.category === category);
      categoryBreakdown[category].totalStudents = new Set(categoryProgress.map(p => p.user._id)).size;
      
      const completedInCategory = categoryProgress.filter(p => p.isCompleted).length;
      categoryBreakdown[category].averageCompletionRate = categoryProgress.length > 0 ? 
        Math.round((completedInCategory / categoryProgress.length) * 100) : 0;
      
      categoryBreakdown[category].totalLearningHours = Math.round(
        categoryProgress.reduce((sum, p) => sum + (p.totalTimeSpent || 0), 0) / 60
      );
    });

    res.status(200).json({
      status: 'success',
      data: {
        overview: {
          totalCourses: instructorCourses.length,
          totalStudents,
          totalEnrollments,
          averageCompletionRate,
          averageQuizScore,
          totalLearningHours
        },
        courseAnalytics,
        studentPerformance,
        recentActivity,
        categoryBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
