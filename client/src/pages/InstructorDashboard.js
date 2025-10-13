import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, BookOpen, Clock, TrendingUp, Award, BarChart3, Edit, Trash2 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import InstructorAnalytics from '../components/InstructorAnalytics';
import { courseService, progressService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './InstructorDashboard.css';

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalHours: 0,
    avgScore: 0
  });
  const [courses, setCourses] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const fetchInstructorData = useCallback(async () => {
    try {
      // Fetch instructor's courses
      const coursesRes = await courseService.getAllCourses();
      const instructorCourses = coursesRes.data.data.courses.filter(
        course => course.instructor._id === user.id || course.instructor === user.id
      );
      
      setCourses(instructorCourses);

      // Calculate statistics
      let totalStudents = 0;
      let totalHours = 0;
      let totalScore = 0;
      let scoreCount = 0;

      for (const course of instructorCourses) {
        totalStudents += course.enrolledStudents?.length || 0;
        
        // Fetch progress data for this course
        try {
          const progressRes = await progressService.getCourseProgress(course._id);
          const progressData = progressRes.data.data.progress;
          
          if (progressData) {
            // Calculate hours from time spent (convert minutes to hours)
            totalHours += (progressData.timeSpent || 0) / 60;
            
            // Add quiz scores
            if (progressData.quizScores && progressData.quizScores.length > 0) {
              for (const quiz of progressData.quizScores) {
                totalScore += quiz.score;
                scoreCount += 1;
              }
            }
          }
        } catch (err) {
          console.log('No progress data for course:', course._id);
        }
      }

      setStats({
        totalCourses: instructorCourses.length,
        totalStudents,
        totalHours: Math.round(totalHours),
        avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0
      });

    } catch (error) {
      console.error('Error fetching instructor data:', error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchInstructorData();
  }, [fetchInstructorData]);

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (window.confirm(`Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`)) {
      try {
        await courseService.deleteCourse(courseId);
        alert('Course deleted successfully!');
        // Refresh the courses list
        fetchInstructorData();
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Error deleting course');
      }
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading instructor dashboard..." />;
  }

  return (
    <div className="instructor-dashboard">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Instructor Dashboard</h1>
            <p>Welcome back, {user.firstName}! Here's your teaching overview.</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              <BarChart3 size={20} />
              {showAnalytics ? 'Hide Analytics' : 'View Analytics'}
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/instructor/create-course')}
            >
              <Plus size={20} />
              Create New Course
            </button>
          </div>
        </div>

        {/* Analytics Section */}
        {showAnalytics && (
          <div className="analytics-section">
            <InstructorAnalytics />
          </div>
        )}

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card stat-courses">
            <div className="stat-icon">
              <BookOpen size={32} />
            </div>
            <div className="stat-content">
              <h3>{stats.totalCourses}</h3>
              <p>Active Courses</p>
            </div>
          </div>

          <div className="stat-card stat-students">
            <div className="stat-icon">
              <Users size={32} />
            </div>
            <div className="stat-content">
              <h3>{stats.totalStudents}</h3>
              <p>Total Students</p>
            </div>
          </div>

          <div className="stat-card stat-hours">
            <div className="stat-icon">
              <Clock size={32} />
            </div>
            <div className="stat-content">
              <h3>{stats.totalHours}h</h3>
              <p>Learning Hours</p>
            </div>
          </div>

          <div className="stat-card stat-score">
            <div className="stat-icon">
              <Award size={32} />
            </div>
            <div className="stat-content">
              <h3>{stats.avgScore}%</h3>
              <p>Avg Quiz Score</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="dashboard-grid">
          {/* My Courses */}
          <div className="dashboard-section courses-section">
            <div className="section-header">
              <h2>My Courses</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/instructor/courses')}>
                View All
              </button>
            </div>

            {courses.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={48} />
                <h3>No courses yet</h3>
                <p>Create your first course to get started</p>
                <button className="btn btn-primary" onClick={() => navigate('/instructor/create-course')}>
                  <Plus size={20} />
                  Create Course
                </button>
              </div>
            ) : (
              <div className="courses-list">
                {courses.map(course => (
                  <div key={course._id} className="course-item">
                    {course.thumbnail && (
                      <img src={course.thumbnail} alt={course.title} className="course-thumbnail" />
                    )}
                    <div className="course-info">
                      <h4>{course.title}</h4>
                      <div className="course-meta">
                        <span><Users size={14} /> {course.enrolledStudents?.length || 0} students</span>
                        <span><BookOpen size={14} /> {course.lessons?.length || 0} lessons</span>
                      </div>
                    </div>
                    <div className="course-actions">
                      <button 
                        className="btn-icon btn-edit"
                        onClick={() => navigate(`/instructor/edit-course/${course._id}`)}
                        title="Edit course"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        className="btn-icon btn-view"
                        onClick={() => navigate(`/courses/${course._id}`)}
                        title="View course"
                      >
                        <BarChart3 size={18} />
                      </button>
                      <button 
                        className="btn-icon btn-delete"
                        onClick={() => handleDeleteCourse(course._id, course.title)}
                        title="Delete course"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="dashboard-section quick-actions">
            <h2>Quick Actions</h2>
            <div className="action-cards">
              <button className="action-card" onClick={() => navigate('/instructor/create-course')}>
                <Plus size={24} />
                <span>Create Course</span>
              </button>
              <button className="action-card" onClick={() => navigate('/instructor/students')}>
                <Users size={24} />
                <span>View Students</span>
              </button>
              <button className="action-card" onClick={() => navigate('/instructor/analytics')}>
                <TrendingUp size={24} />
                <span>Analytics</span>
              </button>
              <button className="action-card" onClick={() => navigate('/courses')}>
                <BookOpen size={24} />
                <span>Manage Courses</span>
              </button>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-icon">
                    <Users size={18} />
                  </div>
                  <div className="activity-content">
                    <p>New student enrolled in JavaScript course</p>
                    <span className="activity-time">2 hours ago</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">
                    <Award size={18} />
                  </div>
                  <div className="activity-content">
                    <p>Student completed React quiz</p>
                    <span className="activity-time">5 hours ago</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">
                    <BookOpen size={18} />
                  </div>
                  <div className="activity-content">
                    <p>Course updated: UI/UX Design</p>
                    <span className="activity-time">1 day ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;

