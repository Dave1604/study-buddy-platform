const router = require('express').Router();
const supabase = require('../config/supabase');
const { protect, authorize } = require('../middleware/auth');

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

router.use(protect);

// ──────────────────────────────────────────────
// POST /api/quizzes  (instructor/admin)
// ──────────────────────────────────────────────
router.post('/', authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { course_id, title, description, duration, passing_score, shuffle_questions, difficulty } = req.body;
    if (!course_id || !title) {
      return res.status(400).json({ status: 'error', message: 'course_id and title are required.' });
    }
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert({
        course_id,
        title,
        description: description || '',
        duration: duration || 30,
        passing_score: passing_score || 70,
        shuffle_questions: shuffle_questions !== undefined ? shuffle_questions : true,
        difficulty: difficulty || 'medium',
        is_active: true
      })
      .select('*')
      .single();
    if (error) throw error;
    res.status(201).json({ status: 'success', data: { quiz } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/quizzes/course/:courseId
// ──────────────────────────────────────────────
router.get('/course/:courseId', async (req, res) => {
  try {
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('id, title, description, duration, passing_score, total_points, difficulty, is_active, attempts_allowed, created_at')
      .eq('course_id', req.params.courseId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.status(200).json({ status: 'success', results: quizzes.length, data: { quizzes } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/quizzes/:id
// ──────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error || !quiz) return res.status(404).json({ status: 'error', message: 'Quiz not found.' });

    let { data: questions } = await supabase
      .from('questions')
      .select('id, question_text, question_type, options, explanation, points, "order"')
      .eq('quiz_id', quiz.id)
      .order('"order"', { ascending: true });

    questions = (questions || []);

    // Shuffle questions and options if enabled
    if (quiz.shuffle_questions) {
      questions = shuffle(questions);
    }

    // For each question, strip is_correct from options before sending to client
    questions = questions.map(q => {
      const opts = q.options || [];
      const sanitisedOptions = opts.map(o => ({
        id: o.id,
        text: o.text || o
      }));
      return {
        ...q,
        options: quiz.shuffle_questions && q.question_type === 'multiple-choice'
          ? shuffle(sanitisedOptions)
          : sanitisedOptions
      };
    });

    res.status(200).json({
      status: 'success',
      data: { quiz: { ...quiz, questions, time_limit_minutes: quiz.duration } }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// PUT /api/quizzes/:id  (instructor/admin)
// ──────────────────────────────────────────────
router.put('/:id', authorize('instructor', 'admin'), async (req, res) => {
  try {
    const allowed = ['title', 'description', 'duration', 'passing_score', 'shuffle_questions', 'difficulty', 'is_active', 'attempts_allowed'];
    const updates = { updated_at: new Date().toISOString() };
    Object.entries(req.body).forEach(([key, val]) => {
      if (allowed.includes(key)) updates[key] = val;
    });

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .update(updates)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) throw error;
    res.status(200).json({ status: 'success', data: { quiz } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// DELETE /api/quizzes/:id  (instructor/admin)
// ──────────────────────────────────────────────
router.delete('/:id', authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { error } = await supabase.from('quizzes').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(200).json({ status: 'success', data: {} });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/quizzes/:id/submit
// ──────────────────────────────────────────────
router.post('/:id/submit', async (req, res) => {
  try {
    const { answers } = req.body; // { questionId: answerText, ... }

    const { data: quiz, error: quizErr } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (quizErr || !quiz) return res.status(404).json({ status: 'error', message: 'Quiz not found.' });

    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quiz.id);

    let correct = 0;
    const results = (questions || []).map(q => {
      const submitted = (answers[q.id] || '').toString().trim();
      let isCorrect = false;

      if (q.question_type === 'multiple-choice') {
        const correctOpt = (q.options || []).find(o => o.is_correct);
        const correctText = correctOpt ? (correctOpt.text || '') : (q.correct_answer || '');
        isCorrect = submitted.toLowerCase() === correctText.toLowerCase();
      } else if (q.question_type === 'true-false') {
        isCorrect = submitted.toLowerCase() === (q.correct_answer || '').toLowerCase();
      } else if (q.question_type === 'fill-in-blank') {
        isCorrect = submitted.toLowerCase() === (q.correct_answer || '').toLowerCase();
      }

      if (isCorrect) correct++;

      const correctOpt = (q.options || []).find(o => o.is_correct);
      return {
        question_id: q.id,
        question_text: q.question_text,
        submitted_answer: submitted,
        correct_answer: q.correct_answer || (correctOpt ? correctOpt.text : ''),
        is_correct: isCorrect,
        explanation: q.explanation || '',
        points: q.points || 1
      };
    });

    const total = (questions || []).length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = score >= (quiz.passing_score || 70);

    // Save attempt
    await supabase.from('quiz_attempts').insert({
      user_id: req.user.id,
      quiz_id: quiz.id,
      course_id: quiz.course_id,
      score: correct,
      total_points: total,
      percentage: score,
      passed,
      answers: results
    });

    res.status(200).json({
      status: 'success',
      data: {
        score,
        correct,
        total,
        passed,
        quiz_title: quiz.title,
        passing_score: quiz.passing_score || 70,
        results
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/quizzes/:id/questions  (instructor/admin)
// ──────────────────────────────────────────────
router.post('/:id/questions', authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { question_text, question_type, options, correct_answer, explanation, points, order } = req.body;
    if (!question_text) return res.status(400).json({ status: 'error', message: 'question_text is required.' });

    const { data: question, error } = await supabase
      .from('questions')
      .insert({
        quiz_id: req.params.id,
        question_text,
        question_type: question_type || 'multiple-choice',
        options: options || [],
        correct_answer: correct_answer || '',
        explanation: explanation || '',
        points: points || 1,
        order: order || 0
      })
      .select('*')
      .single();
    if (error) throw error;
    res.status(201).json({ status: 'success', data: { question } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
