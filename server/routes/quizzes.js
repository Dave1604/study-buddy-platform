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
    const { course_id, title, description, time_limit_minutes, duration, passing_score } = req.body;
    if (!course_id || !title) {
      return res.status(400).json({ status: 'error', message: 'course_id and title are required.' });
    }
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert({
        course_id,
        title,
        description: description || '',
        time_limit_minutes: time_limit_minutes || duration || 30,
        passing_score: passing_score || 70
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
      .select('id, title, description, time_limit_minutes, passing_score, created_at')
      .eq('course_id', req.params.courseId)
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
      .select('id, question_text, question_type, options, explanation, order_num')
      .eq('quiz_id', quiz.id)
      .order('order_num', { ascending: true });

    questions = shuffle(questions || []).map(q => {
      const opts = q.options || [];
      // Strip is_correct from options sent to client
      const sanitisedOptions = opts.map(o =>
        typeof o === 'object' ? { id: o.id, text: o.text } : { id: String(o), text: String(o) }
      );
      return {
        ...q,
        options: q.question_type === 'multiple-choice' ? shuffle(sanitisedOptions) : sanitisedOptions
      };
    });

    res.status(200).json({
      status: 'success',
      data: { quiz: { ...quiz, questions, duration: quiz.time_limit_minutes } }
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
    const allowed = ['title', 'description', 'time_limit_minutes', 'passing_score'];
    const updates = {};
    Object.entries(req.body).forEach(([key, val]) => {
      if (allowed.includes(key)) updates[key] = val;
      if (key === 'duration') updates.time_limit_minutes = val;
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
        explanation: q.explanation || ''
      };
    });

    const total = (questions || []).length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = score >= (quiz.passing_score || 70);

    // Save attempt — use the actual DB schema
    const answersPayload = {};
    results.forEach(r => {
      answersPayload[r.question_id] = r.submitted_answer;
    });

    await supabase.from('quiz_attempts').insert({
      student_id: req.user.id,
      quiz_id: quiz.id,
      score,
      answers: answersPayload
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
    const { question_text, question_type, options, correct_answer, explanation, order_num, order } = req.body;
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
        order_num: order_num || order || 0
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
