import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { courseService } from '../services/api';
import './EditCourse.css';

const EditCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [, setCourse] = useState(null);
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
      contentType: 'text',
      videoUrl: '',
      duration: 0,
      order: 1,
      resources: []
    }],
    estimatedDuration: 0,
    isPublished: false
  });

  const fetchCourse = useCallback(async () => {
    try {
      setLoading(true);
      const response = await courseService.getCourse(id);
      const courseData = response.data.data.course;
      
      setCourse(courseData);
      setFormData({
        title: courseData.title || '',
        description: courseData.description || '',
        shortDescription: courseData.shortDescription || '',
        category: courseData.category || 'programming',
        level: courseData.level || 'beginner',
        thumbnail: courseData.thumbnail || '',
        learningObjectives: courseData.learningObjectives?.length > 0 ? courseData.learningObjectives : [''],
        prerequisites: courseData.prerequisites?.length > 0 ? courseData.prerequisites : [''],
        tags: courseData.tags?.length > 0 ? courseData.tags : [''],
        lessons: courseData.lessons?.length > 0 ? courseData.lessons.map((lesson, index) => ({
          ...lesson,
          order: index + 1
        })) : [{
          title: '',
          content: '',
          contentType: 'text',
          videoUrl: '',
          duration: 0,
          order: 1,
          resources: []
        }],
        estimatedDuration: courseData.estimatedDuration || 0,
        isPublished: courseData.isPublished || false
      });
    } catch (error) {
      console.error('Error fetching course:', error);
      alert('Error loading course');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleLessonChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) => 
        i === index ? { ...lesson, [field]: value } : lesson
      )
    }));
  };

  const addLesson = () => {
    setFormData(prev => ({
      ...prev,
      lessons: [...prev.lessons, {
        title: '',
        content: '',
        contentType: 'text',
        videoUrl: '',
        duration: 0,
        order: prev.lessons.length + 1,
        resources: []
      }]
    }));
  };

  const removeLesson = (index) => {
    setFormData(prev => ({
      ...prev,
      lessons: prev.lessons.filter((_, i) => i !== index).map((lesson, i) => ({
        ...lesson,
        order: i + 1
      }))
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Clean up empty array items
      const cleanedData = {
        ...formData,
        learningObjectives: formData.learningObjectives.filter(obj => obj.trim() !== ''),
        prerequisites: formData.prerequisites.filter(obj => obj.trim() !== ''),
        tags: formData.tags.filter(obj => obj.trim() !== ''),
        lessons: formData.lessons.filter(lesson => lesson.title.trim() !== '')
      };

      await courseService.updateCourse(id, cleanedData);
      alert('Course updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Error updating course');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-course-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-course-page">
      <div className="edit-course-container">
        <div className="edit-course-header">
          <button 
            className="back-button"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <h1>Edit Course</h1>
          <p>Update your course information and content</p>
        </div>

        <form onSubmit={handleSubmit} className="edit-course-form">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Course Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter course title"
                />
              </div>
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="programming">Programming</option>
                  <option value="design">Design</option>
                  <option value="business">Business</option>
                  <option value="science">Science</option>
                  <option value="mathematics">Mathematics</option>
                  <option value="language">Language</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="level">Level *</label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  required
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="estimatedDuration">Estimated Duration (hours)</label>
                <input
                  type="number"
                  id="estimatedDuration"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleInputChange}
                  min="0"
                  step="0.5"
                  placeholder="e.g., 10"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows="4"
                placeholder="Describe what students will learn in this course"
              />
            </div>

            <div className="form-group">
              <label htmlFor="shortDescription">Short Description</label>
              <input
                type="text"
                id="shortDescription"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                placeholder="Brief one-line description"
                maxLength="200"
              />
            </div>

            <div className="form-group">
              <label htmlFor="thumbnail">Thumbnail URL</label>
              <input
                type="url"
                id="thumbnail"
                name="thumbnail"
                value={formData.thumbnail}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          {/* Learning Objectives */}
          <div className="form-section">
            <h3>Learning Objectives</h3>
            {formData.learningObjectives.map((objective, index) => (
              <div key={index} className="array-item">
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => handleArrayChange('learningObjectives', index, e.target.value)}
                  placeholder="What will students learn?"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('learningObjectives', index)}
                  className="remove-button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('learningObjectives')}
              className="add-button"
            >
              <Plus size={16} />
              Add Objective
            </button>
          </div>

          {/* Prerequisites */}
          <div className="form-section">
            <h3>Prerequisites</h3>
            {formData.prerequisites.map((prerequisite, index) => (
              <div key={index} className="array-item">
                <input
                  type="text"
                  value={prerequisite}
                  onChange={(e) => handleArrayChange('prerequisites', index, e.target.value)}
                  placeholder="What should students know before taking this course?"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('prerequisites', index)}
                  className="remove-button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('prerequisites')}
              className="add-button"
            >
              <Plus size={16} />
              Add Prerequisite
            </button>
          </div>

          {/* Tags */}
          <div className="form-section">
            <h3>Tags</h3>
            {formData.tags.map((tag, index) => (
              <div key={index} className="array-item">
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => handleArrayChange('tags', index, e.target.value)}
                  placeholder="e.g., javascript, react, web-development"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('tags', index)}
                  className="remove-button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('tags')}
              className="add-button"
            >
              <Plus size={16} />
              Add Tag
            </button>
          </div>

          {/* Lessons */}
          <div className="form-section">
            <h3>Lessons</h3>
            {formData.lessons.map((lesson, index) => (
              <div key={index} className="lesson-item">
                <div className="lesson-header">
                  <h4>Lesson {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeLesson(index)}
                    className="remove-button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="lesson-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Title *</label>
                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) => handleLessonChange(index, 'title', e.target.value)}
                        placeholder="Lesson title"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Duration (minutes)</label>
                      <input
                        type="number"
                        value={lesson.duration}
                        onChange={(e) => handleLessonChange(index, 'duration', parseInt(e.target.value) || 0)}
                        min="0"
                        placeholder="e.g., 15"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Content Type</label>
                    <select
                      value={lesson.contentType}
                      onChange={(e) => handleLessonChange(index, 'contentType', e.target.value)}
                    >
                      <option value="text">Text</option>
                      <option value="video">Video</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Content *</label>
                    <textarea
                      value={lesson.content}
                      onChange={(e) => handleLessonChange(index, 'content', e.target.value)}
                      rows="3"
                      placeholder="Lesson content or description"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Video URL (YouTube)</label>
                    <input
                      type="url"
                      value={lesson.videoUrl}
                      onChange={(e) => handleLessonChange(index, 'videoUrl', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addLesson}
              className="add-button"
            >
              <Plus size={16} />
              Add Lesson
            </button>
          </div>

          {/* Publish Status */}
          <div className="form-section">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="isPublished"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleInputChange}
              />
              <label htmlFor="isPublished">Publish this course</label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="submit-button"
            >
              {saving ? (
                <>
                  <div className="spinner"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Update Course
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCourse;
