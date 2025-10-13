import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, BookOpen, TrendingUp } from 'lucide-react';
import './CourseCard.css';

const CourseCard = ({ course }) => {
  const getCategoryColor = (category) => {
    const colors = {
      programming: '#3b82f6',
      design: '#8b5cf6',
      business: '#10b981',
      science: '#f59e0b',
      mathematics: '#ef4444',
      language: '#06b6d4',
      other: '#6b7280'
    };
    return colors[category] || colors.other;
  };

  const getLevelBadge = (level) => {
    const badges = {
      beginner: 'badge-success',
      intermediate: 'badge-warning',
      advanced: 'badge-danger'
    };
    return badges[level] || 'badge-primary';
  };

  return (
    <Link to={`/courses/${course._id}`} className="course-card-link">
      <div className="course-card">
        <div 
          className="course-thumbnail"
          style={{
            background: course.thumbnail 
              ? `url(${course.thumbnail})` 
              : `linear-gradient(135deg, ${getCategoryColor(course.category)} 0%, ${getCategoryColor(course.category)}dd 100%)`
          }}
        >
          <span 
            className={`badge ${getLevelBadge(course.level)}`}
            style={{ position: 'absolute', top: '12px', right: '12px' }}
          >
            {course.level}
          </span>
        </div>
        
        <div className="course-content">
          <div className="course-category" style={{ color: getCategoryColor(course.category) }}>
            {course.category.charAt(0).toUpperCase() + course.category.slice(1)}
          </div>
          
          <h3 className="course-title">{course.title}</h3>
          
          <p className="course-description">
            {course.shortDescription || course.description.substring(0, 100) + '...'}
          </p>
          
          <div className="course-instructor">
            <div className="instructor-avatar">
              {course.instructor?.avatar ? (
                <img src={course.instructor.avatar} alt={course.instructor.firstName} />
              ) : (
                <div className="avatar-placeholder">
                  {course.instructor?.firstName?.charAt(0)}{course.instructor?.lastName?.charAt(0)}
                </div>
              )}
            </div>
            <span>{course.instructor?.firstName} {course.instructor?.lastName}</span>
          </div>
          
          <div className="course-meta">
            <div className="meta-item">
              <BookOpen size={16} />
              <span>{course.lessons?.length || 0} lessons</span>
            </div>
            <div className="meta-item">
              <Users size={16} />
              <span>{course.totalEnrollments || 0} students</span>
            </div>
            {course.estimatedDuration > 0 && (
              <div className="meta-item">
                <Clock size={16} />
                <span>{course.estimatedDuration}h</span>
              </div>
            )}
          </div>
          
          {course.averageRating > 0 && (
            <div className="course-rating">
              <TrendingUp size={16} />
              <span>{course.averageRating.toFixed(1)} rating</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
