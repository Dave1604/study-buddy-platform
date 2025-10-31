const express = require('express');
const router = express.Router();
const {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  updateLessonDuration,
  auditCourses
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getAllCourses)
  .post(protect, authorize('instructor', 'admin'), createCourse);

// Audit endpoint for instructors/admins
router.get('/audit', protect, authorize('instructor', 'admin'), auditCourses);

router.route('/:id')
  .get(getCourse)
  .put(protect, authorize('instructor', 'admin'), updateCourse)
  .delete(protect, authorize('instructor', 'admin'), deleteCourse);

router.post('/:id/enroll', protect, enrollCourse);
// Allow any authenticated user; controller enforces role-specific rules
router.put('/:courseId/lessons/:lessonId/duration', protect, updateLessonDuration);

module.exports = router;
