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

    // Enrollments
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id, enrolled_at')
      .eq('user_id', userId);
    const courseIds = (enrollments || []).map(e => e.course_id);

    // Quiz attempts
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('attempted_at', { ascending: true });

    // Progress rows
    const { data: progressRows } = courseIds.length
      ? await supabase.from('progress').select('*').eq('user_id', userId).in('course_id', courseIds)
      : { data: [] };

    // Course titles
    const { data: courses } = courseIds.length
      ? await supabase.from('courses').select('id, title, category').in('id', courseIds)
      : { data: [] };
    const courseMap = {};
    (courses || []).forEach(c => { courseMap[c.id] = c; });

    // Stats
    const totalCourses = courseIds.length;
    const completedCourses = (progressRows || []).filter(p => p.is_completed).length;
    const avgScore = attempts && attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length)
      : 0;
    const totalHours = Math.round(
      (progressRows || []).reduce((sum, p) => sum + (p.total_time_spent || 0), 0) / 60 * 10
    ) / 10;

    // Quiz performance chart (last 10 attempts)
    const quizPerformance = (attempts || []).slice(-10).map(a => ({
      date: new Date(a.attempted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      score: a.percentage
    }));

    // Course progress
    const courseProgress = (progressRows || []).map(p => ({
      course_id: p.course_id,
      course_title: courseMap[p.course_id]?.title || 'Unknown',
      completion_percentage: p.completion_percentage,
      total_time_spent_minutes: p.total_time_spent || 0,
      is_completed: p.is_completed || false
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
      milestones.push({ id: 'm6', label: 'Dedicated Learner', description: 'Enrolled in 3 or more courses!', icon: '📚', unlocked: true });
    }

    const data = {
      stats: {
        total_courses: totalCourses,
        completed_courses: completedCourses,
        avg_score: avgScore,
        total_hours: totalHours,
        total_attempts: (attempts || []).length
      },
      quiz_performance: quizPerformance,
      course_progress: courseProgress,
      milestones
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
    // Allow own data or admin
    if (targetId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Not authorised.' });
    }

    const { data: progressRows, error } = await supabase
      .from('progress')
      .select('*, course:courses(id, title, category)')
      .eq('user_id', targetId);
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
      .eq('user_id', req.user.id)
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
    const { course_id, lesson_id, time_spent_seconds } = req.body;
    if (!course_id || !lesson_id) {
      return res.status(400).json({ status: 'error', message: 'course_id and lesson_id are required.' });
    }

    const userId = req.user.id;

    let { data: prog } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', course_id)
      .maybeSingle();

    if (!prog) {
      const { data: newProg } = await supabase
        .from('progress')
        .insert({ user_id: userId, course_id })
        .select()
        .single();
      prog = newProg;
    }

    const lessonsProgress = prog.lessons_progress || [];
    const existing = lessonsProgress.find(lp => lp.lesson_id === lesson_id);
    const timeSpentMinutes = Math.round((time_spent_seconds || 0) / 60);

    if (!existing) {
      lessonsProgress.push({
        lesson_id,
        completed: false,
        time_spent: timeSpentMinutes,
        last_visited_at: new Date().toISOString()
      });
    } else {
      existing.time_spent = (existing.time_spent || 0) + timeSpentMinutes;
      existing.last_visited_at = new Date().toISOString();
    }

    const totalTimeSpent = (prog.total_time_spent || 0) + timeSpentMinutes;

    const { data: updated, error } = await supabase
      .from('progress')
      .update({
        lessons_progress: lessonsProgress,
        total_time_spent: totalTimeSpent,
        current_lesson_id: lesson_id,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', prog.id)
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

    // Get courses taught by this instructor
    const { data: courses, error: coursesErr } = await supabase
      .from('courses')
      .select('id, title, total_enrollments')
      .eq('instructor_id', instructorId);
    if (coursesErr) throw coursesErr;

    const courseIds = (courses || []).map(c => c.id);
    if (!courseIds.length) {
      return res.status(200).json({ status: 'success', data: { analytics: { courses: [], total_students: 0, avg_completion: 0, avg_score: 0 } } });
    }

    // Progress across all courses
    const { data: progressRows } = await supabase
      .from('progress')
      .select('course_id, completion_percentage, is_completed, user_id')
      .in('course_id', courseIds);

    // Quiz attempts across all courses
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('course_id, percentage, user_id, passed')
      .in('course_id', courseIds);

    const totalStudents = new Set((progressRows || []).map(p => p.user_id)).size;
    const avgCompletion = progressRows && progressRows.length
      ? Math.round(progressRows.reduce((s, p) => s + (p.completion_percentage || 0), 0) / progressRows.length)
      : 0;
    const avgScore = attempts && attempts.length
      ? Math.round(attempts.reduce((s, a) => s + (a.percentage || 0), 0) / attempts.length)
      : 0;

    const courseAnalytics = (courses || []).map(c => {
      const cp = (progressRows || []).filter(p => p.course_id === c.id);
      const ca = (attempts || []).filter(a => a.course_id === c.id);
      return {
        course_id: c.id,
        title: c.title,
        enrolled: c.total_enrollments || 0,
        avg_completion: cp.length ? Math.round(cp.reduce((s, p) => s + (p.completion_percentage || 0), 0) / cp.length) : 0,
        avg_score: ca.length ? Math.round(ca.reduce((s, a) => s + (a.percentage || 0), 0) / ca.length) : 0,
        completed_count: cp.filter(p => p.is_completed).length,
        pass_rate: ca.length ? Math.round((ca.filter(a => a.passed).length / ca.length) * 100) : 0
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
