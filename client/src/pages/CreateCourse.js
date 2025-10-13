import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, ArrowLeft } from 'lucide-react';
import { courseService } from '../services/api';
import './CreateCourse.css';

const CreateCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: 'programming',
    level: 'beginner',
    thumbnail: '',
    learningObjectives: [''],
    prerequisites: [''],
    tags: [''],
    lessons: [{
      title: '',
      content: '',
      contentType: 'video',
      videoUrl: '',
      duration: 0,
      order: 1
    }],
    isPublished: false,
    estimatedDuration: 0
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (field) => {
    setFormData({
      ...formData,
      [field]: [...formData[field], '']
    });
  };

  const removeArrayItem = (field, index) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray });
  };

  const handleLessonChange = (index, field, value) => {
    const newLessons = [...formData.lessons];
    newLessons[index][field] = value;
    setFormData({ ...formData, lessons: newLessons });
  };

  const addLesson = () => {
    setFormData({
      ...formData,
      lessons: [...formData.lessons, {
        title: '',
        content: '',
        contentType: 'video',
        videoUrl: '',
        duration: 0,
        order: formData.lessons.length + 1
      }]
    });
  };

  const removeLesson = (index) => {
    const newLessons = formData.lessons.filter((_, i) => i !== index);
    setFormData({ ...formData, lessons: newLessons });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Filter out empty values
      const cleanedData = {
        ...formData,
        learningObjectives: formData.learningObjectives.filter(obj => obj.trim()),
        prerequisites: formData.prerequisites.filter(pre => pre.trim()),
        tags: formData.tags.filter(tag => tag.trim()),
        lessons: formData.lessons.filter(lesson => lesson.title.trim())
      };

      await courseService.createCourse(cleanedData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-course-page">
      <div className="container">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <div className="page-header">
          <h1>Create New Course</h1>
          <p>Fill in the details to create your course</p>
        </div>

        {error && (
          <div className="error-alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="course-form">
          {/* Basic Information */}
          <div className="form-section">
            <h2>Basic Information</h2>
            
            <div className="form-group">
              <label>Course Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Introduction to JavaScript"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select name="category" value={formData.category} onChange={handleChange} required>
                  <option value="programming">Programming</option>
                  <option value="design">Design</option>
                  <option value="business">Business</option>
                  <option value="science">Science</option>
                  <option value="mathematics">Mathematics</option>
                  <option value="language">Language</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Level *</label>
                <select name="level" value={formData.level} onChange={handleChange} required>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="form-group">
                <label>Estimated Duration (hours)</label>
                <input
                  type="number"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Short Description *</label>
              <input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                required
                maxLength="200"
                placeholder="Brief description (max 200 characters)"
              />
            </div>

            <div className="form-group">
              <label>Full Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="5"
                placeholder="Detailed course description..."
              />
            </div>

            <div className="form-group">
              <label>Thumbnail URL</label>
              <input
                type="url"
                name="thumbnail"
                value={formData.thumbnail}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          {/* Learning Objectives */}
          <div className="form-section">
            <h2>Learning Objectives</h2>
            {formData.learningObjectives.map((obj, index) => (
              <div key={index} className="array-input-group">
                <input
                  type="text"
                  value={obj}
                  onChange={(e) => handleArrayChange('learningObjectives', index, e.target.value)}
                  placeholder="What will students learn?"
                />
                {formData.learningObjectives.length > 1 && (
                  <button type="button" onClick={() => removeArrayItem('learningObjectives', index)} className="remove-btn">
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addArrayItem('learningObjectives')} className="add-btn">
              <Plus size={18} /> Add Objective
            </button>
          </div>

          {/* Prerequisites */}
          <div className="form-section">
            <h2>Prerequisites</h2>
            {formData.prerequisites.map((pre, index) => (
              <div key={index} className="array-input-group">
                <input
                  type="text"
                  value={pre}
                  onChange={(e) => handleArrayChange('prerequisites', index, e.target.value)}
                  placeholder="Required knowledge or skills"
                />
                {formData.prerequisites.length > 1 && (
                  <button type="button" onClick={() => removeArrayItem('prerequisites', index)} className="remove-btn">
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addArrayItem('prerequisites')} className="add-btn">
              <Plus size={18} /> Add Prerequisite
            </button>
          </div>

          {/* Tags */}
          <div className="form-section">
            <h2>Tags</h2>
            {formData.tags.map((tag, index) => (
              <div key={index} className="array-input-group">
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => handleArrayChange('tags', index, e.target.value)}
                  placeholder="e.g., javascript, web development"
                />
                {formData.tags.length > 1 && (
                  <button type="button" onClick={() => removeArrayItem('tags', index)} className="remove-btn">
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addArrayItem('tags')} className="add-btn">
              <Plus size={18} /> Add Tag
            </button>
          </div>

          {/* Lessons */}
          <div className="form-section">
            <h2>Course Lessons</h2>
            {formData.lessons.map((lesson, index) => (
              <div key={index} className="lesson-card">
                <div className="lesson-header">
                  <h3>Lesson {index + 1}</h3>
                  {formData.lessons.length > 1 && (
                    <button type="button" onClick={() => removeLesson(index)} className="remove-btn">
                      <X size={18} /> Remove
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label>Lesson Title *</label>
                  <input
                    type="text"
                    value={lesson.title}
                    onChange={(e) => handleLessonChange(index, 'title', e.target.value)}
                    placeholder="Lesson title"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Content Description *</label>
                  <textarea
                    value={lesson.content}
                    onChange={(e) => handleLessonChange(index, 'content', e.target.value)}
                    placeholder="Describe what this lesson covers..."
                    rows="3"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Content Type</label>
                    <select
                      value={lesson.contentType}
                      onChange={(e) => handleLessonChange(index, 'contentType', e.target.value)}
                    >
                      <option value="video">Video</option>
                      <option value="text">Text</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Duration (minutes)</label>
                    <input
                      type="number"
                      value={lesson.duration}
                      onChange={(e) => handleLessonChange(index, 'duration', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>YouTube Video URL</label>
                  <input
                    type="url"
                    value={lesson.videoUrl}
                    onChange={(e) => handleLessonChange(index, 'videoUrl', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              </div>
            ))}
            <button type="button" onClick={addLesson} className="add-btn">
              <Plus size={18} /> Add Lesson
            </button>
          </div>

          {/* Publish Option */}
          <div className="form-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              />
              <span>Publish course immediately</span>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="form-actions">
            <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;

