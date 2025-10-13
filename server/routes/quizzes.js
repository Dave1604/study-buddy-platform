const express = require('express');
const router = express.Router();
const {
  getCourseQuizzes,
  getQuiz,
  createQuiz,
  submitQuiz,
  updateQuiz,
  deleteQuiz
} = require('../controllers/quizController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .post(authorize('instructor', 'admin'), createQuiz);

router.get('/course/:courseId', getCourseQuizzes);

router.route('/:id')
  .get(getQuiz)
  .put(authorize('instructor', 'admin'), updateQuiz)
  .delete(authorize('instructor', 'admin'), deleteQuiz);

router.post('/:id/submit', submitQuiz);

module.exports = router;
