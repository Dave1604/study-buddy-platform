const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Lesson content is required']
  },
  contentType: {
    type: String,
    enum: ['text', 'video', 'mixed'],
    default: 'text'
  },
  videoUrl: {
    type: String,
    default: ''
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  order: {
    type: Number,
    required: true
  },
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['pdf', 'link', 'document', 'other']
    }
  }]
}, {
  timestamps: true
});

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Course category is required'],
    enum: ['programming', 'design', 'business', 'science', 'mathematics', 'language', 'other']
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  thumbnail: {
    type: String,
    default: ''
  },
  lessons: [LessonSchema],
  learningObjectives: [{
    type: String
  }],
  prerequisites: [{
    type: String
  }],
  tags: [{
    type: String,
    trim: true
  }],
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  totalEnrollments: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  estimatedDuration: {
    type: Number, // in hours
    default: 0
  }
}, {
  timestamps: true
});

// Index for search
CourseSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Update total enrollments
CourseSchema.methods.updateEnrollmentCount = function() {
  this.totalEnrollments = this.enrolledStudents.length;
  return this.save();
};

module.exports = mongoose.model('Course', CourseSchema);
