const mongoose = require('mongoose');

const QuizAttemptSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  totalPoints: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  passed: {
    type: Boolean,
    required: true
  },
  answers: [{
    questionId: mongoose.Schema.Types.ObjectId,
    selectedAnswer: mongoose.Schema.Types.Mixed, // Can be string or array
    isCorrect: Boolean,
    pointsEarned: Number
  }],
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  attemptedAt: {
    type: Date,
    default: Date.now
  }
});

const LessonProgressSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
});

const ProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lessonsProgress: [LessonProgressSchema],
  quizAttempts: [QuizAttemptSchema],
  totalTimeSpent: {
    type: Number, // in minutes
    default: 0
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  currentLesson: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  performance: {
    averageQuizScore: {
      type: Number,
      default: 0
    },
    totalQuizzesTaken: {
      type: Number,
      default: 0
    },
    totalQuizzesPassed: {
      type: Number,
      default: 0
    }
  },
  notes: [{
    lessonId: mongoose.Schema.Types.ObjectId,
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Ensure unique user-course combination
ProgressSchema.index({ user: 1, course: 1 }, { unique: true });

// Calculate completion percentage
ProgressSchema.methods.calculateCompletionPercentage = function(totalLessons) {
  if (!totalLessons || totalLessons === 0) {
    return 0;
  }
  
  const completedLessons = this.lessonsProgress.filter(lp => lp.completed).length;
  return Math.round((completedLessons / totalLessons) * 100);
};

// Update performance metrics
ProgressSchema.methods.updatePerformance = function() {
  if (this.quizAttempts.length > 0) {
    const totalScore = this.quizAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0);
    this.performance.averageQuizScore = Math.round(totalScore / this.quizAttempts.length);
    this.performance.totalQuizzesTaken = this.quizAttempts.length;
    this.performance.totalQuizzesPassed = this.quizAttempts.filter(attempt => attempt.passed).length;
  }
};

module.exports = mongoose.model('Progress', ProgressSchema);
