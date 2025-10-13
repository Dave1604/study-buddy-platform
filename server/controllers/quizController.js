const Quiz = require('../models/Quiz');
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Get all quizzes for a course
// @route   GET /api/quizzes/course/:courseId
// @access  Private
exports.getCourseQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ 
      course: req.params.courseId,
      isActive: true 
    }).select('-questions.correctAnswer -questions.options.isCorrect');

    res.status(200).json({
      status: 'success',
      results: quizzes.length,
      data: { quizzes }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get single quiz
// @route   GET /api/quizzes/:id
// @access  Private
exports.getQuiz = async (req, res) => {
  try {
    // Don't return correct answers in the initial fetch
    const quiz = await Quiz.findById(req.params.id)
      .select('-questions.correctAnswer -questions.options.isCorrect')
      .populate('course', 'title');

    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { quiz }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Create quiz
// @route   POST /api/quizzes
// @access  Private (Instructor/Admin)
exports.createQuiz = async (req, res) => {
  try {
    // Verify course exists
    const course = await Course.findById(req.body.course);
    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found'
      });
    }

    // Check if user is course instructor or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to create quiz for this course'
      });
    }

    const quiz = await Quiz.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { quiz }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Submit quiz answers
// @route   POST /api/quizzes/:id/submit
// @access  Private
exports.submitQuiz = async (req, res) => {
  try {
    const { answers, timeSpent } = req.body;

    // Get quiz with correct answers
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz not found'
      });
    }

    // Get user's progress for this course
    let progress = await Progress.findOne({
      user: req.user.id,
      course: quiz.course
    });

    if (!progress) {
      return res.status(400).json({
        status: 'error',
        message: 'You must be enrolled in the course to take this quiz'
      });
    }

    // Check attempt limit
    const previousAttempts = progress.quizAttempts.filter(
      attempt => attempt.quiz.toString() === quiz._id.toString()
    );

    if (quiz.attemptsAllowed > 0 && previousAttempts.length >= quiz.attemptsAllowed) {
      return res.status(400).json({
        status: 'error',
        message: `Maximum attempts (${quiz.attemptsAllowed}) reached for this quiz`
      });
    }

    // Grade the quiz
    let score = 0;
    const gradedAnswers = [];

    quiz.questions.forEach((question) => {
      const userAnswer = answers.find(a => a.questionId === question._id.toString());
      
      if (!userAnswer) {
        gradedAnswers.push({
          questionId: question._id,
          selectedAnswer: null,
          isCorrect: false,
          pointsEarned: 0
        });
        return;
      }

      let isCorrect = false;

      if (question.questionType === 'multiple-choice') {
        const correctOption = question.options.find(opt => opt.isCorrect);
        isCorrect = correctOption && correctOption._id.toString() === userAnswer.answer;
      } else if (question.questionType === 'true-false') {
        isCorrect = question.correctAnswer === userAnswer.answer;
      } else if (question.questionType === 'multiple-answer') {
        const correctOptions = question.options
          .filter(opt => opt.isCorrect)
          .map(opt => opt._id.toString())
          .sort();
        const userAnswers = Array.isArray(userAnswer.answer) 
          ? userAnswer.answer.sort() 
          : [userAnswer.answer];
        isCorrect = JSON.stringify(correctOptions) === JSON.stringify(userAnswers);
      }

      const pointsEarned = isCorrect ? question.points : 0;
      score += pointsEarned;

      gradedAnswers.push({
        questionId: question._id,
        selectedAnswer: userAnswer.answer,
        isCorrect,
        pointsEarned
      });
    });

    // Calculate percentage
    const percentage = Math.round((score / quiz.totalPoints) * 100);
    const passed = percentage >= quiz.passingScore;

    // Save attempt to progress
    const attempt = {
      quiz: quiz._id,
      score,
      totalPoints: quiz.totalPoints,
      percentage,
      passed,
      answers: gradedAnswers,
      timeSpent: timeSpent || 0
    };

    progress.quizAttempts.push(attempt);
    progress.updatePerformance();
    await progress.save();

    // Update user stats
    const user = await User.findById(req.user.id);
    user.stats.totalQuizzesTaken += 1;
    
    // Recalculate average score
    const allAttempts = await Progress.find({ user: req.user.id });
    const totalAttempts = allAttempts.reduce(
      (sum, p) => sum + p.quizAttempts.length, 
      0
    );
    const totalPercentage = allAttempts.reduce(
      (sum, p) => sum + p.quizAttempts.reduce((s, a) => s + a.percentage, 0),
      0
    );
    user.stats.averageScore = Math.round(totalPercentage / totalAttempts);
    await user.save();

    // Return results with correct answers if enabled
    let result = {
      score,
      totalPoints: quiz.totalPoints,
      percentage,
      passed,
      gradedAnswers
    };

    if (quiz.showCorrectAnswers) {
      result.correctAnswers = quiz.questions.map(q => ({
        questionId: q._id,
        correctAnswer: q.questionType === 'multiple-choice' || q.questionType === 'multiple-answer'
          ? q.options.filter(opt => opt.isCorrect).map(opt => opt._id)
          : q.correctAnswer,
        explanation: q.explanation
      }));
    }

    res.status(200).json({
      status: 'success',
      data: { result }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private (Instructor/Admin)
exports.updateQuiz = async (req, res) => {
  try {
    let quiz = await Quiz.findById(req.params.id).populate('course');

    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz not found'
      });
    }

    // Check authorization
    if (quiz.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this quiz'
      });
    }

    quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: { quiz }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private (Instructor/Admin)
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('course');

    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz not found'
      });
    }

    // Check authorization
    if (quiz.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this quiz'
      });
    }

    await quiz.deleteOne();

    res.status(200).json({
      status: 'success',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
