const express = require('express');
const router = express.Router();
const {
  getUserProgress,
  getCourseProgress,
  updateLessonProgress,
  getDashboard,
  getInstructorAnalytics
} = require('../controllers/progressController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/user/:userId', getUserProgress);
router.get('/course/:courseId', getCourseProgress);
router.put('/lesson', updateLessonProgress);
router.get('/instructor/analytics', authorize('instructor', 'admin'), getInstructorAnalytics);

module.exports = router;
