const Course = require('../models/Course');
const User = require('../models/User');
const Progress = require('../models/Progress');

// @desc    Audit courses for content health
// @route   GET /api/courses/audit
// @access  Private (Instructor/Admin)
exports.auditCourses = async (req, res) => {
  try {
    const courses = await Course.find({}).select('title lessons enrolledStudents');

    const sixHoursMin = 6 * 60 - 60; // allow -1h tolerance
    const sixHoursMax = 6 * 60 + 60; // allow +1h tolerance

    const youTubeIdRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;

    const report = courses.map(course => {
      const lessons = course.lessons || [];
      const totalMinutes = lessons.reduce((sum, l) => sum + (Number(l.duration) || 0), 0);
      const invalidVideos = lessons
        .filter(l => !l.videoUrl || !youTubeIdRegex.test(l.videoUrl))
        .map(l => ({ id: l._id, title: l.title, videoUrl: l.videoUrl || null }));

      const flags = [];
      if (totalMinutes < sixHoursMin || totalMinutes > sixHoursMax) {
        flags.push('totalDurationOutside6h±1h');
      }
      if (invalidVideos.length > 0) {
        flags.push('missingOrInvalidVideos');
      }

      return {
        courseId: course._id,
        title: course.title,
        lessonsCount: lessons.length,
        studentsCount: Array.isArray(course.enrolledStudents) ? course.enrolledStudents.length : 0,
        totalMinutes,
        totalFormatted: `${Math.floor(totalMinutes / 60)}h ${Math.round(totalMinutes % 60)}m`,
        invalidVideos,
        flags
      };
    });

    res.status(200).json({ status: 'success', data: { report } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
exports.getAllCourses = async (req, res) => {
  try {
    const { category, level, search } = req.query;

    // Build query
    let query = { isPublished: true };

    if (category) {
      query.category = category;
    }

    if (level) {
      query.level = level;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const courses = await Course.find(query)
      .populate('instructor', 'firstName lastName avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: courses.length,
      data: { courses }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'firstName lastName avatar bio');

    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { course }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Instructor/Admin)
exports.createCourse = async (req, res) => {
  try {
    // Add instructor from logged in user
    req.body.instructor = req.user.id;

    const course = await Course.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { course }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Instructor/Admin)
exports.updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

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
        message: 'Not authorized to update this course'
      });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: { course }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Instructor/Admin)
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

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
        message: 'Not authorized to delete this course'
      });
    }

    await course.deleteOne();

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

// @desc    Enroll in course
// @route   POST /api/courses/:id/enroll
// @access  Private (Student)
exports.enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found'
      });
    }

    // Check if already enrolled
    if (course.enrolledStudents.includes(req.user.id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Already enrolled in this course'
      });
    }

    // Add student to course
    course.enrolledStudents.push(req.user.id);
    await course.updateEnrollmentCount();

    // Add course to user's enrolled courses
    const user = await User.findById(req.user.id);
    user.enrolledCourses.push(course._id);
    await user.save();

    // Create progress entry
    await Progress.create({
      user: req.user.id,
      course: course._id
    });

    res.status(200).json({
      status: 'success',
      message: 'Successfully enrolled in course',
      data: { course }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update a lesson's duration
// @route   PUT /api/courses/:courseId/lessons/:lessonId/duration
// @access  Private (Students can set once if enrolled; instructors/admins unrestricted)
exports.updateLessonDuration = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { durationSeconds, durationMinutes } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found'
      });
    }

    const isInstructorOrAdmin = (course.instructor && course.instructor.toString && course.instructor.toString() === req.user.id) || req.user.role === 'admin';

    const lesson = course.lessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({
        status: 'error',
        message: 'Lesson not found'
      });
    }

    // Authorization logic:
    // - Instructors/Admins: may always set
    // - Students: must be enrolled and only allowed if duration is not set yet (0 or undefined)
    if (!isInstructorOrAdmin) {
      const userId = req.user.id;
      const isEnrolled = Array.isArray(course.enrolledStudents) && course.enrolledStudents.some(s => (s && s.toString) ? s.toString() === userId : s === userId);
      const currentMinutes = Number(lesson.duration || 0);
      if (!isEnrolled) {
        return res.status(403).json({
          status: 'error',
          message: 'Only enrolled students can set lesson duration'
        });
      }
      if (currentMinutes > 0) {
        return res.status(200).json({
          status: 'success',
          data: { lesson },
          message: 'Duration already set'
        });
      }
    }

    if (typeof durationSeconds === 'number' && !Number.isNaN(durationSeconds)) {
      lesson.duration = Math.max(0, Math.round(durationSeconds / 60));
    } else if (typeof durationMinutes === 'number' && !Number.isNaN(durationMinutes)) {
      lesson.duration = Math.max(0, Math.round(durationMinutes));
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Provide durationSeconds or durationMinutes as a number'
      });
    }

    await course.save();

    res.status(200).json({
      status: 'success',
      data: { lesson }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
