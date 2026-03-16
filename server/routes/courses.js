const router = require('express').Router();
const supabase = require('../config/supabase');
const { protect, authorize } = require('../middleware/auth');

// ──────────────────────────────────────────────
// GET /api/courses/audit  (must be before /:id)
// ──────────────────────────────────────────────
router.get('/audit', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { data: courses, error } = await supabase
      .from('courses')
      .select('id, title');
    if (error) throw error;

    const courseIds = courses.map(c => c.id);
    const { data: lessons } = courseIds.length
      ? await supabase.from('lessons').select('id, course_id, title, video_url, duration_minutes').in('course_id', courseIds)
      : { data: [] };

    const youTubeIdRegex = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const sixHoursMin = 6 * 60 - 60;
    const sixHoursMax = 6 * 60 + 60;

    const lessonsByCourse = {};
    (lessons || []).forEach(l => {
      if (!lessonsByCourse[l.course_id]) lessonsByCourse[l.course_id] = [];
      lessonsByCourse[l.course_id].push(l);
    });

    const report = courses.map(course => {
      const courseLessons = lessonsByCourse[course.id] || [];
      const totalMinutes = courseLessons.reduce((sum, l) => sum + (Number(l.duration_minutes) || 0), 0);
      const invalidVideos = courseLessons
        .filter(l => !l.video_url || !youTubeIdRegex.test(l.video_url))
        .map(l => ({ id: l.id, title: l.title, videoUrl: l.video_url || null }));

      const flags = [];
      if (totalMinutes < sixHoursMin || totalMinutes > sixHoursMax) flags.push('totalDurationOutside6h±1h');
      if (invalidVideos.length > 0) flags.push('missingOrInvalidVideos');

      return {
        courseId: course.id,
        title: course.title,
        lessonsCount: courseLessons.length,
        totalMinutes,
        totalFormatted: `${Math.floor(totalMinutes / 60)}h ${Math.round(totalMinutes % 60)}m`,
        invalidVideos,
        flags
      };
    });

    res.status(200).json({ status: 'success', data: { report } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/courses
// ──────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = supabase
      .from('courses')
      .select(`
        id, title, description, category, instructor_id,
        thumbnail_url, is_published, created_at,
        instructor:users!courses_instructor_id_fkey(id, name, avatar_url)
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data: courses, error } = await query;
    if (error) throw error;

    // Attach lesson and enrollment counts
    const courseIds = (courses || []).map(c => c.id);
    const [{ data: lessons }, { data: enrollments }] = await Promise.all([
      courseIds.length
        ? supabase.from('lessons').select('course_id').in('course_id', courseIds)
        : Promise.resolve({ data: [] }),
      courseIds.length
        ? supabase.from('enrollments').select('course_id').in('course_id', courseIds)
        : Promise.resolve({ data: [] })
    ]);

    const lessonCount = {};
    (lessons || []).forEach(l => { lessonCount[l.course_id] = (lessonCount[l.course_id] || 0) + 1; });
    const enrollCount = {};
    (enrollments || []).forEach(e => { enrollCount[e.course_id] = (enrollCount[e.course_id] || 0) + 1; });

    const result = (courses || []).map(c => ({
      ...c,
      thumbnail: c.thumbnail_url,
      lesson_count: lessonCount[c.id] || 0,
      enrolled_count: enrollCount[c.id] || 0
    }));

    res.status(200).json({
      status: 'success',
      results: result.length,
      data: { courses: result }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/courses/instructor  (instructor/admin — own courses)
// ──────────────────────────────────────────────
router.get('/instructor', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        id, title, description, category, instructor_id,
        thumbnail_url, is_published, created_at, updated_at,
        instructor:users!courses_instructor_id_fkey(id, name, avatar_url)
      `)
      .eq('instructor_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const courseIds = (courses || []).map(c => c.id);
    const [{ data: lessons }, { data: enrollments }] = await Promise.all([
      courseIds.length
        ? supabase.from('lessons').select('course_id').in('course_id', courseIds)
        : Promise.resolve({ data: [] }),
      courseIds.length
        ? supabase.from('enrollments').select('course_id').in('course_id', courseIds)
        : Promise.resolve({ data: [] })
    ]);

    const lessonCount = {};
    (lessons || []).forEach(l => { lessonCount[l.course_id] = (lessonCount[l.course_id] || 0) + 1; });
    const enrollCount = {};
    (enrollments || []).forEach(e => { enrollCount[e.course_id] = (enrollCount[e.course_id] || 0) + 1; });

    const result = (courses || []).map(c => ({
      ...c,
      thumbnail: c.thumbnail_url,
      lesson_count: lessonCount[c.id] || 0,
      enrolled_count: enrollCount[c.id] || 0
    }));

    res.status(200).json({
      status: 'success',
      results: result.length,
      data: { courses: result }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/courses/enrolled  (auth required)
// ──────────────────────────────────────────────
router.get('/enrolled', protect, async (req, res) => {
  try {
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select('enrolled_at, course_id')
      .eq('student_id', req.user.id);

    if (error) throw error;

    const courseIds = (enrollments || []).map(e => e.course_id);
    if (!courseIds.length) {
      return res.status(200).json({ status: 'success', results: 0, data: { courses: [] } });
    }

    const { data: courses, error: cErr } = await supabase
      .from('courses')
      .select(`
        id, title, description, category, thumbnail_url, is_published, created_at,
        instructor:users!courses_instructor_id_fkey(id, name, avatar_url)
      `)
      .in('id', courseIds);
    if (cErr) throw cErr;

    // Get progress
    const { data: progressRows } = await supabase
      .from('progress')
      .select('course_id, completion_percentage')
      .eq('student_id', req.user.id)
      .in('course_id', courseIds);

    const progressMap = {};
    (progressRows || []).forEach(p => { progressMap[p.course_id] = p.completion_percentage; });

    const enrolledAtMap = {};
    (enrollments || []).forEach(e => { enrolledAtMap[e.course_id] = e.enrolled_at; });

    const result = (courses || []).map(c => ({
      ...c,
      thumbnail: c.thumbnail_url,
      enrolled_at: enrolledAtMap[c.id],
      completion_percentage: progressMap[c.id] || 0
    }));

    res.status(200).json({
      status: 'success',
      results: result.length,
      data: { courses: result }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/courses/:id
// ──────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        id, title, description, category, instructor_id,
        thumbnail_url, is_published, created_at, updated_at,
        instructor:users!courses_instructor_id_fkey(id, name, avatar_url)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !course) {
      return res.status(404).json({ status: 'error', message: 'Course not found' });
    }

    // Get lessons
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, course_id, title, description, video_url, order_num, duration_minutes')
      .eq('course_id', course.id)
      .order('order_num', { ascending: true });

    // Get quizzes
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id, title, description, time_limit_minutes, passing_score, created_at')
      .eq('course_id', course.id);

    // Enrollment + progress if authenticated
    let isEnrolled = false;
    let userProgress = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);

        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('enrolled_at')
          .eq('student_id', decoded.id)
          .eq('course_id', req.params.id)
          .maybeSingle();

        isEnrolled = !!enrollment;

        if (isEnrolled) {
          const { data: prog } = await supabase
            .from('progress')
            .select('completion_percentage, completed_lessons, total_time_spent_minutes, last_accessed')
            .eq('student_id', decoded.id)
            .eq('course_id', req.params.id)
            .maybeSingle();
          userProgress = prog;
        }
      } catch (_) {
        // token invalid – treat as unauthenticated
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        course: {
          ...course,
          thumbnail: course.thumbnail_url,
          lessons: (lessons || []).map(l => ({
            ...l,
            _id: l.id,
            videoUrl: l.video_url,
            order: l.order_num,
            duration: l.duration_minutes
          })),
          quizzes: (quizzes || []).map(q => ({
            ...q,
            _id: q.id,
            duration: q.time_limit_minutes,
            passingScore: q.passing_score
          })),
          isEnrolled,
          userProgress,
          progress: {
            completion_percentage: userProgress?.completion_percentage || 0,
            completed_lessons: userProgress?.completed_lessons || []
          }
        }
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/courses  (instructor/admin)
// ──────────────────────────────────────────────
router.post('/', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { title, description, category, thumbnail_url, thumbnail, is_published, isPublished } = req.body;
    if (!title) return res.status(400).json({ status: 'error', message: 'Title is required.' });

    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        title,
        description: description || '',
        instructor_id: req.user.id,
        category: category || 'other',
        thumbnail_url: thumbnail_url || thumbnail || '',
        is_published: is_published !== undefined ? is_published : (isPublished || false)
      })
      .select(`
        id, title, description, category, instructor_id, thumbnail_url, is_published, created_at,
        instructor:users!courses_instructor_id_fkey(id, name, avatar_url)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({ status: 'success', data: { course: { ...course, thumbnail: course.thumbnail_url } } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// PUT /api/courses/:id  (instructor/admin)
// ──────────────────────────────────────────────
router.put('/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('courses')
      .select('id, instructor_id')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ status: 'error', message: 'Course not found' });
    }

    if (existing.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Not authorized to update this course' });
    }

    const allowed = ['title', 'description', 'category', 'thumbnail_url', 'is_published'];
    const fieldMap = { thumbnail: 'thumbnail_url', isPublished: 'is_published' };

    const updates = { updated_at: new Date().toISOString() };
    Object.entries(req.body).forEach(([key, val]) => {
      const mappedKey = fieldMap[key] || key;
      if (allowed.includes(mappedKey)) updates[mappedKey] = val;
    });

    const { data: course, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', req.params.id)
      .select(`
        id, title, description, category, instructor_id, thumbnail_url, is_published,
        instructor:users!courses_instructor_id_fkey(id, name, avatar_url)
      `)
      .single();

    if (error) throw error;

    res.status(200).json({ status: 'success', data: { course: { ...course, thumbnail: course.thumbnail_url } } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// DELETE /api/courses/:id  (instructor/admin)
// ──────────────────────────────────────────────
router.delete('/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('courses')
      .select('id, instructor_id')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ status: 'error', message: 'Course not found' });
    }

    if (existing.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Not authorized to delete this course' });
    }

    const { error } = await supabase.from('courses').delete().eq('id', req.params.id);
    if (error) throw error;

    res.status(200).json({ status: 'success', data: {} });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/courses/:id/enroll
// ──────────────────────────────────────────────
router.post('/:id/enroll', protect, async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;

    const { data: course, error: courseErr } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .single();

    if (courseErr || !course) {
      return res.status(404).json({ status: 'error', message: 'Course not found' });
    }

    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ status: 'error', message: 'Already enrolled in this course' });
    }

    const { error: enrollErr } = await supabase
      .from('enrollments')
      .insert({ student_id: userId, course_id: courseId });
    if (enrollErr) throw enrollErr;

    // Create progress record
    await supabase.from('progress').insert({
      student_id: userId,
      course_id: courseId,
      completed_lessons: [],
      completion_percentage: 0,
      total_time_spent_minutes: 0
    });

    res.status(200).json({
      status: 'success',
      message: 'Successfully enrolled in course',
      data: { course }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/courses/:id/lessons  (instructor/admin)
// ──────────────────────────────────────────────
router.post('/:id/lessons', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const courseId = req.params.id;

    const { data: course, error: courseErr } = await supabase
      .from('courses')
      .select('id, instructor_id')
      .eq('id', courseId)
      .single();

    if (courseErr || !course) {
      return res.status(404).json({ status: 'error', message: 'Course not found' });
    }

    if (course.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Not authorized to add lessons to this course' });
    }

    const { title, description, content, video_url, videoUrl, duration_minutes, duration, order_num, order } = req.body;
    if (!title) return res.status(400).json({ status: 'error', message: 'Title required.' });

    // Get next order number
    const { data: existingLessons } = await supabase
      .from('lessons')
      .select('order_num')
      .eq('course_id', courseId)
      .order('order_num', { ascending: false })
      .limit(1);

    const nextOrder = order_num !== undefined ? order_num : (order !== undefined ? order : ((existingLessons?.[0]?.order_num || 0) + 1));

    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert({
        course_id: courseId,
        title,
        description: description || content || '',
        video_url: video_url || videoUrl || '',
        duration_minutes: duration_minutes || duration || 0,
        order_num: nextOrder
      })
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json({ status: 'success', data: { lesson } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/courses/:id/lessons/:lessonId/complete
// ──────────────────────────────────────────────
router.post('/:id/lessons/:lessonId/complete', protect, async (req, res) => {
  try {
    const { id: courseId, lessonId } = req.params;
    const userId = req.user.id;

    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!enrollment) {
      return res.status(403).json({ status: 'error', message: 'Not enrolled in this course' });
    }

    let { data: prog } = await supabase
      .from('progress')
      .select('*')
      .eq('student_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!prog) {
      const { data: newProg } = await supabase
        .from('progress')
        .insert({ student_id: userId, course_id: courseId, completed_lessons: [], completion_percentage: 0, total_time_spent_minutes: 0 })
        .select()
        .single();
      prog = newProg;
    }

    const completedLessons = prog.completed_lessons || [];
    if (!completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId);
    }

    // Recalculate completion %
    const { count: totalLessons } = await supabase
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId);

    const completionPercentage = totalLessons > 0
      ? Math.round((completedLessons.length / totalLessons) * 100)
      : 0;

    const { data: updated, error } = await supabase
      .from('progress')
      .update({
        completed_lessons: completedLessons,
        completion_percentage: completionPercentage,
        last_accessed: new Date().toISOString()
      })
      .eq('student_id', userId)
      .eq('course_id', courseId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ status: 'success', data: { progress: updated } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// PUT /api/courses/:courseId/lessons/:lessonId/duration
// ──────────────────────────────────────────────
router.put('/:courseId/lessons/:lessonId/duration', protect, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { durationSeconds, durationMinutes } = req.body;

    const { data: course, error: courseErr } = await supabase
      .from('courses')
      .select('id, instructor_id')
      .eq('id', courseId)
      .single();

    if (courseErr || !course) {
      return res.status(404).json({ status: 'error', message: 'Course not found' });
    }

    const isInstructorOrAdmin = course.instructor_id === req.user.id || req.user.role === 'admin';

    if (!isInstructorOrAdmin) {
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', req.user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (!enrollment) {
        return res.status(403).json({ status: 'error', message: 'Only enrolled students can set lesson duration' });
      }
    }

    let newDurationMinutes;
    if (typeof durationSeconds === 'number' && !isNaN(durationSeconds)) {
      newDurationMinutes = Math.max(0, Math.round(durationSeconds / 60));
    } else if (typeof durationMinutes === 'number' && !isNaN(durationMinutes)) {
      newDurationMinutes = Math.max(0, Math.round(durationMinutes));
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Provide durationSeconds or durationMinutes as a number'
      });
    }

    const { data: lesson, error } = await supabase
      .from('lessons')
      .update({ duration_minutes: newDurationMinutes })
      .eq('id', lessonId)
      .eq('course_id', courseId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ status: 'success', data: { lesson } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
