const router = require('express').Router();
const supabase = require('../config/supabase');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// ──────────────────────────────────────────────
// GET /api/progress/dashboard
// ──────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;

    // Enrollments (actual schema uses student_id)
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id, enrolled_at')
      .eq('student_id', userId);
    const courseIds = (enrollments || []).map(e => e.course_id);

    // Quiz attempts (actual schema)
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('id, quiz_id, score, completed_at')
      .eq('student_id', userId)
      .order('completed_at', { ascending: true });

    // Progress rows
    const { data: progressRows } = courseIds.length
      ? await supabase
          .from('progress')
          .select('course_id, completion_percentage, completed_lessons, total_time_spent_minutes')
          .eq('student_id', userId)
          .in('course_id', courseIds)
      : { data: [] };

    // Course info
    const { data: courses } = courseIds.length
      ? await supabase.from('courses').select('id, title, category').in('id', courseIds)
      : { data: [] };
    const courseMap = {};
    (courses || []).forEach(c => { courseMap[c.id] = c; });

    // Stats
    const totalCourses = courseIds.length;
    const completedCourses = (progressRows || []).filter(p => p.completion_percentage === 100).length;
    const avgScore = attempts && attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length)
      : 0;
    const totalHours = Math.round(
      (progressRows || []).reduce((sum, p) => sum + (p.total_time_spent_minutes || 0), 0) / 60 * 10
    ) / 10;

    // Quiz performance chart (last 10 attempts)
    const quizPerformance = (attempts || []).slice(-10).map(a => ({
      date: new Date(a.completed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      score: a.score || 0
    }));

    // Course progress list
    const courseProgress = (progressRows || []).map(p => ({
      course_id: p.course_id,
      course_title: courseMap[p.course_id]?.title || 'Unknown',
      completion_percentage: p.completion_percentage,
      total_time_spent_minutes: p.total_time_spent_minutes || 0,
      is_completed: p.completion_percentage === 100
    }));

    // Milestones (gamification — no leaderboards)
    const milestones = [];
    if (totalCourses >= 1) {
      milestones.push({ id: 'm1', label: 'First Enrolment', description: 'Enrolled in your first course!', icon: '🎯', unlocked: true });
    }
    if ((attempts || []).length >= 1) {
      milestones.push({ id: 'm2', label: 'First Quiz', description: 'Completed your first quiz!', icon: '✏️', unlocked: true });
    }
    if (completedCourses >= 1) {
      milestones.push({ id: 'm3', label: 'Course Complete', description: 'Finished an entire course!', icon: '🏆', unlocked: true });
    }
    if (avgScore >= 80) {
      milestones.push({ id: 'm4', label: 'High Achiever', description: 'Averaged 80%+ on quizzes!', icon: '⭐', unlocked: true });
    }
    if ((attempts || []).length >= 5) {
      milestones.push({ id: 'm5', label: 'Quiz Veteran', description: 'Completed 5 quiz attempts!', icon: '🔥', unlocked: true });
    }
    if (totalCourses >= 3) {
      milestones.push({ id: 'm6', label: 'Dedicated Learner', description: 'Enrolled in 3+ courses!', icon: '📚', unlocked: true });
    }

    // Build categoryProgress map { category: { total, completed } }
    const categoryProgress = {};
    (courses || []).forEach(c => {
      const cat = c.category || 'other';
      if (!categoryProgress[cat]) categoryProgress[cat] = { total: 0, completed: 0 };
      categoryProgress[cat].total++;
      const prog = (progressRows || []).find(p => p.course_id === c.id);
      if (prog && prog.completion_percentage === 100) categoryProgress[cat].completed++;
    });

    // recentActivity: last accessed courses
    const recentActivity = (courseProgress || [])
      .sort((a, b) => (b.last_accessed || 0) > (a.last_accessed || 0) ? 1 : -1)
      .slice(0, 5)
      .map(p => ({
        course: { _id: p.course_id, title: p.course_title },
        completionPercentage: p.completion_percentage,
        lastAccessed: new Date().toISOString()
      }));

    const data = {
      // Legacy fields (used by backend consumers)
      stats: {
        total_courses: totalCourses,
        completed_courses: completedCourses,
        avg_score: avgScore,
        total_hours: totalHours,
        total_attempts: (attempts || []).length
      },
      quiz_performance: quizPerformance,
      course_progress: courseProgress,
      milestones,
      // Dashboard.js expected fields
      overview: {
        totalCourses,
        completedCourses,
        inProgressCourses: totalCourses - completedCourses,
        averageScore: avgScore,
        totalTimeSpent: Math.round(totalHours * 60),
        totalQuizzes: (attempts || []).length
      },
      recentActivity,
      quizPerformance,
      categoryProgress
    };

    res.status(200).json({ status: 'success', data });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/progress/user/:userId
// ──────────────────────────────────────────────
router.get('/user/:userId', async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (targetId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Not authorised.' });
    }

    const { data: progressRows, error } = await supabase
      .from('progress')
      .select('*')
      .eq('student_id', targetId);
    if (error) throw error;

    res.status(200).json({ status: 'success', data: { progress: progressRows } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/progress/course/:courseId
// ──────────────────────────────────────────────
router.get('/course/:courseId', async (req, res) => {
  try {
    const { data: prog, error } = await supabase
      .from('progress')
      .select('*')
      .eq('student_id', req.user.id)
      .eq('course_id', req.params.courseId)
      .maybeSingle();
    if (error) throw error;

    res.status(200).json({ status: 'success', data: { progress: prog || null } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// PUT /api/progress/lesson
// ──────────────────────────────────────────────
router.put('/lesson', async (req, res) => {
  try {
    const { course_id, lesson_id, time_spent_seconds, time_spent_minutes } = req.body;
    if (!course_id || !lesson_id) {
      return res.status(400).json({ status: 'error', message: 'course_id and lesson_id are required.' });
    }

    const userId = req.user.id;
    const addedMinutes = time_spent_minutes || Math.round((time_spent_seconds || 0) / 60);

    let { data: prog } = await supabase
      .from('progress')
      .select('*')
      .eq('student_id', userId)
      .eq('course_id', course_id)
      .maybeSingle();

    if (!prog) {
      const { data: newProg } = await supabase
        .from('progress')
        .insert({ student_id: userId, course_id, completed_lessons: [], completion_percentage: 0, total_time_spent_minutes: 0 })
        .select()
        .single();
      prog = newProg;
    }

    const { data: updated, error } = await supabase
      .from('progress')
      .update({
        total_time_spent_minutes: (prog.total_time_spent_minutes || 0) + addedMinutes,
        last_accessed: new Date().toISOString()
      })
      .eq('student_id', userId)
      .eq('course_id', course_id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ status: 'success', data: { progress: updated } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/progress/instructor/analytics
// ──────────────────────────────────────────────
router.get('/instructor/analytics', authorize('instructor', 'admin'), async (req, res) => {
  try {
    const instructorId = req.user.id;

    const { data: courses, error: coursesErr } = await supabase
      .from('courses')
      .select('id, title')
      .eq('instructor_id', instructorId);
    if (coursesErr) throw coursesErr;

    const courseIds = (courses || []).map(c => c.id);
    if (!courseIds.length) {
      return res.status(200).json({
        status: 'success',
        data: { analytics: { courses: [], total_students: 0, avg_completion: 0, avg_score: 0 } }
      });
    }

    const { data: progressRows } = await supabase
      .from('progress')
      .select('course_id, completion_percentage, student_id')
      .in('course_id', courseIds);

    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('quiz_id, score, student_id')
      .in('student_id', [...new Set((progressRows || []).map(p => p.student_id))]);

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id, student_id')
      .in('course_id', courseIds);

    const totalStudents = new Set((enrollments || []).map(e => e.student_id)).size;
    const avgCompletion = progressRows && progressRows.length
      ? Math.round(progressRows.reduce((s, p) => s + (p.completion_percentage || 0), 0) / progressRows.length)
      : 0;
    const avgScore = attempts && attempts.length
      ? Math.round(attempts.reduce((s, a) => s + (a.score || 0), 0) / attempts.length)
      : 0;

    const enrollCountByCourse = {};
    (enrollments || []).forEach(e => {
      enrollCountByCourse[e.course_id] = (enrollCountByCourse[e.course_id] || 0) + 1;
    });

    const courseAnalytics = (courses || []).map(c => {
      const cp = (progressRows || []).filter(p => p.course_id === c.id);
      return {
        course_id: c.id,
        title: c.title,
        enrolled: enrollCountByCourse[c.id] || 0,
        avg_completion: cp.length ? Math.round(cp.reduce((s, p) => s + (p.completion_percentage || 0), 0) / cp.length) : 0,
        completed_count: cp.filter(p => p.completion_percentage === 100).length
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        analytics: {
          total_students: totalStudents,
          avg_completion: avgCompletion,
          avg_score: avgScore,
          courses: courseAnalytics
        }
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
