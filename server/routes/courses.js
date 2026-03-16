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
      .select('id, title, total_enrollments, lessons(id, title, video_url, duration)');

    if (error) throw error;

    const youTubeIdRegex = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const sixHoursMin = 6 * 60 - 60;
    const sixHoursMax = 6 * 60 + 60;

    const report = courses.map(course => {
      const lessons = course.lessons || [];
      const totalMinutes = lessons.reduce((sum, l) => sum + (Number(l.duration) || 0), 0);
      const invalidVideos = lessons
        .filter(l => !l.video_url || !youTubeIdRegex.test(l.video_url))
        .map(l => ({ id: l.id, title: l.title, videoUrl: l.video_url || null }));

      const flags = [];
      if (totalMinutes < sixHoursMin || totalMinutes > sixHoursMax) {
        flags.push('totalDurationOutside6h±1h');
      }
      if (invalidVideos.length > 0) {
        flags.push('missingOrInvalidVideos');
      }

      return {
        courseId: course.id,
        title: course.title,
        lessonsCount: lessons.length,
        studentsCount: course.total_enrollments || 0,
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
    const { category, level, search } = req.query;

    let query = supabase
      .from('courses')
      .select(`
        id, title, description, short_description, category, level,
        thumbnail, total_enrollments, average_rating, estimated_duration,
        is_published, created_at,
        instructor:users!courses_instructor_id_fkey(id, name, avatar_url)
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);
    if (level) query = query.eq('level', level);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data: courses, error } = await query;
    if (error) throw error;

    res.status(200).json({
      status: 'success',
      results: courses.length,
      data: { courses }
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
      .select(`
        enrolled_at,
        course:courses(
          id, title, description, category, level, thumbnail,
          total_enrollments, estimated_duration,
          instructor:users!courses_instructor_id_fkey(id, name, avatar_url)
        )
      `)
      .eq('user_id', req.user.id);

    if (error) throw error;

    const courses = enrollments.map(e => ({
      ...e.course,
      enrolled_at: e.enrolled_at
    }));

    res.status(200).json({
      status: 'success',
      results: courses.length,
      data: { courses }
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
        id, title, description, short_description, category, level,
        thumbnail, learning_objectives, prerequisites, tags,
        total_enrollments, average_rating, total_ratings,
        estimated_duration, is_published, created_at, updated_at,
        instructor:users!courses_instructor_id_fkey(id, name, avatar_url, bio),
        lessons(id, title, content, content_type, video_url, duration, "order", resources),
        quizzes(id, title, description, duration, passing_score, total_points, difficulty, is_active, attempts_allowed)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !course) {
      return res.status(404).json({ status: 'error', message: 'Course not found' });
    }

    // Sort lessons by order
    if (course.lessons) {
      course.lessons.sort((a, b) => a.order - b.order);
    }

    // Check enrollment status if user is authenticated
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
          .eq('user_id', decoded.id)
          .eq('course_id', req.params.id)
          .maybeSingle();

        isEnrolled = !!enrollment;

        if (isEnrolled) {
          const { data: prog } = await supabase
            .from('progress')
            .select('completion_percentage, is_completed, current_lesson_id, lessons_progress')
            .eq('user_id', decoded.id)
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
      data: { course: { ...course, isEnrolled, userProgress } }
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
    const {
      title, description, short_description, shortDescription,
      category, level, thumbnail,
      learning_objectives, learningObjectives,
      prerequisites, tags, estimated_duration, estimatedDuration,
      is_published, isPublished
    } = req.body;

    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        title,
        description,
        short_description: short_description || shortDescription || '',
        instructor_id: req.user.id,
        category: category || 'other',
        level: level || 'beginner',
        thumbnail: thumbnail || '',
        learning_objectives: learning_objectives || learningObjectives || [],
        prerequisites: prerequisites || [],
        tags: tags || [],
        estimated_duration: estimated_duration || estimatedDuration || 0,
        is_published: is_published !== undefined ? is_published : (isPublished || false)
      })
      .select(`
        id, title, description, short_description, category, level,
        thumbnail, total_enrollments, estimated_duration, is_published, created_at,
        instructor:users!courses_instructor_id_fkey(id, name, avatar_url)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({ status: 'success', data: { course } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// PUT /api/courses/:id  (instructor/admin)
// ──────────────────────────────────────────────
router.put('/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    // Fetch to verify ownership
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

    const allowed = [
      'title', 'description', 'short_description', 'category', 'level',
      'thumbnail', 'learning_objectives', 'prerequisites', 'tags',
      'estimated_duration', 'is_published'
    ];

    // Also support camelCase keys from the client
    const fieldMap = {
      shortDescription: 'short_description',
      learningObjectives: 'learning_objectives',
      estimatedDuration: 'estimated_duration',
      isPublished: 'is_published'
    };

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
        id, title, description, short_description, category, level,
        thumbnail, total_enrollments, estimated_duration, is_published,
        instructor:users!courses_instructor_id_fkey(id, name, avatar_url)
      `)
      .single();

    if (error) throw error;

    res.status(200).json({ status: 'success', data: { course } });
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

    // Check course exists
    const { data: course, error: courseErr } = await supabase
      .from('courses')
      .select('id, title, total_enrollments')
      .eq('id', courseId)
      .single();

    if (courseErr || !course) {
      return res.status(404).json({ status: 'error', message: 'Course not found' });
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ status: 'error', message: 'Already enrolled in this course' });
    }

    // Create enrollment
    const { error: enrollErr } = await supabase
      .from('enrollments')
      .insert({ user_id: userId, course_id: courseId });

    if (enrollErr) throw enrollErr;

    // Create progress record
    await supabase
      .from('progress')
      .insert({ user_id: userId, course_id: courseId });

    // Increment enrollment count
    await supabase
      .from('courses')
      .update({ total_enrollments: (course.total_enrollments || 0) + 1 })
      .eq('id', courseId);

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

    // Verify ownership
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

    const { title, content, content_type, contentType, video_url, videoUrl, duration, order, resources } = req.body;

    // Get max existing order
    const { data: existingLessons } = await supabase
      .from('lessons')
      .select('"order"')
      .eq('course_id', courseId)
      .order('"order"', { ascending: false })
      .limit(1);

    const nextOrder = order !== undefined ? order : ((existingLessons?.[0]?.order || 0) + 1);

    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert({
        course_id: courseId,
        title,
        content: content || '',
        content_type: content_type || contentType || 'text',
        video_url: video_url || videoUrl || '',
        duration: duration || 0,
        order: nextOrder,
        resources: resources || []
      })
      .select()
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

    // Verify enrolled
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!enrollment) {
      return res.status(403).json({ status: 'error', message: 'Not enrolled in this course' });
    }

    // Get or create progress
    let { data: prog } = await supabase
      .from('progress')
      .select('id, lessons_progress, total_time_spent, completion_percentage')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!prog) {
      const { data: newProg } = await supabase
        .from('progress')
        .insert({ user_id: userId, course_id: courseId })
        .select()
        .single();
      prog = newProg;
    }

    const lessonsProgress = prog.lessons_progress || [];
    const existing = lessonsProgress.find(lp => lp.lesson_id === lessonId);

    if (!existing) {
      lessonsProgress.push({
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
        time_spent: 0
      });
    } else {
      existing.completed = true;
      existing.completed_at = existing.completed_at || new Date().toISOString();
    }

    // Recalculate completion %
    const { count: totalLessons } = await supabase
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId);

    const completedCount = lessonsProgress.filter(lp => lp.completed).length;
    const completionPercentage = totalLessons > 0
      ? Math.round((completedCount / totalLessons) * 100)
      : 0;
    const isCompleted = completionPercentage === 100;

    const { data: updated, error } = await supabase
      .from('progress')
      .update({
        lessons_progress: lessonsProgress,
        completion_percentage: completionPercentage,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
        current_lesson_id: lessonId,
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
// PUT /api/courses/:courseId/lessons/:lessonId/duration
// ──────────────────────────────────────────────
router.put('/:courseId/lessons/:lessonId/duration', protect, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { durationSeconds, durationMinutes } = req.body;

    // Check course and ownership/enrollment
    const { data: course, error: courseErr } = await supabase
      .from('courses')
      .select('id, instructor_id')
      .eq('id', courseId)
      .single();

    if (courseErr || !course) {
      return res.status(404).json({ status: 'error', message: 'Course not found' });
    }

    const isInstructorOrAdmin =
      course.instructor_id === req.user.id || req.user.role === 'admin';

    if (!isInstructorOrAdmin) {
      // Students must be enrolled
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (!enrollment) {
        return res.status(403).json({ status: 'error', message: 'Only enrolled students can set lesson duration' });
      }

      // Students can only set if not already set
      const { data: currentLesson } = await supabase
        .from('lessons')
        .select('id, duration')
        .eq('id', lessonId)
        .eq('course_id', courseId)
        .single();

      if (currentLesson && Number(currentLesson.duration || 0) > 0) {
        return res.status(200).json({
          status: 'success',
          data: { lesson: currentLesson },
          message: 'Duration already set'
        });
      }
    }

    let newDuration;
    if (typeof durationSeconds === 'number' && !isNaN(durationSeconds)) {
      newDuration = Math.max(0, Math.round(durationSeconds / 60));
    } else if (typeof durationMinutes === 'number' && !isNaN(durationMinutes)) {
      newDuration = Math.max(0, Math.round(durationMinutes));
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Provide durationSeconds or durationMinutes as a number'
      });
    }

    const { data: lesson, error } = await supabase
      .from('lessons')
      .update({ duration: newDuration, updated_at: new Date().toISOString() })
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
