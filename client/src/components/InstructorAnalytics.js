import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  Clock, 
  TrendingUp, 
  Award, 
  Target,
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { progressService } from '../services/api';
import './InstructorAnalytics.css';

const InstructorAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await progressService.getInstructorAnalytics();
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };


  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const getCompletionStatus = (percentage) => {
    if (percentage === 100) return { status: 'completed', icon: CheckCircle, color: '#10b981' };
    if (percentage > 0) return { status: 'in-progress', icon: AlertCircle, color: '#f59e0b' };
    return { status: 'not-started', icon: XCircle, color: '#ef4444' };
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="analytics-error">
        <AlertCircle size={48} />
        <h3>Unable to load analytics</h3>
        <p>Please try again later</p>
      </div>
    );
  }

  return (
    <div className="instructor-analytics">
      <div className="analytics-header">
        <h2>Student Analytics</h2>
        <p>Comprehensive insights into student performance and engagement</p>
      </div>

      {/* Tab Navigation */}
      <div className="analytics-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={20} />
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <BookOpen size={20} />
          Course Performance
        </button>
        <button 
          className={`tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <Users size={20} />
          Student Details
        </button>
        <button 
          className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <Calendar size={20} />
          Recent Activity
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="analytics-content">
          {/* Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">
                <BookOpen size={24} />
              </div>
              <div className="metric-content">
                <h3>{analytics.overview.totalCourses}</h3>
                <p>Total Courses</p>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">
                <Users size={24} />
              </div>
              <div className="metric-content">
                <h3>{analytics.overview.totalStudents}</h3>
                <p>Unique Students</p>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">
                <Target size={24} />
              </div>
              <div className="metric-content">
                <h3>{analytics.overview.averageCompletionRate}%</h3>
                <p>Avg Completion Rate</p>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">
                <Award size={24} />
              </div>
              <div className="metric-content">
                <h3>{analytics.overview.averageQuizScore}%</h3>
                <p>Avg Quiz Score</p>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">
                <Clock size={24} />
              </div>
              <div className="metric-content">
                <h3>{analytics.overview.totalLearningHours}h</h3>
                <p>Total Learning Hours</p>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">
                <TrendingUp size={24} />
              </div>
              <div className="metric-content">
                <h3>{analytics.overview.totalEnrollments}</h3>
                <p>Total Enrollments</p>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="category-breakdown">
            <h3>Performance by Category</h3>
            <div className="category-grid">
              {Object.entries(analytics.categoryBreakdown).map(([category, data]) => (
                <div key={category} className="category-card">
                  <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                  <div className="category-stats">
                    <div className="stat">
                      <span className="label">Courses:</span>
                      <span className="value">{data.totalCourses}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Students:</span>
                      <span className="value">{data.totalStudents}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Completion:</span>
                      <span className="value">{data.averageCompletionRate}%</span>
                    </div>
                    <div className="stat">
                      <span className="label">Hours:</span>
                      <span className="value">{data.totalLearningHours}h</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Course Performance Tab */}
      {activeTab === 'courses' && (
        <div className="analytics-content">
          <h3>Course Performance Analysis</h3>
          <div className="course-analytics-table">
            <div className="table-header">
              <div className="col">Course</div>
              <div className="col">Category</div>
              <div className="col">Students</div>
              <div className="col">Completed</div>
              <div className="col">Completion Rate</div>
              <div className="col">Avg Score</div>
              <div className="col">Learning Hours</div>
            </div>
            {analytics.courseAnalytics.map((course) => (
              <div key={course.courseId} className="table-row">
                <div className="col course-title">
                  <h4>{course.courseTitle}</h4>
                  <span className="level-badge">{course.level}</span>
                </div>
                <div className="col">
                  <span className="category-badge">{course.category}</span>
                </div>
                <div className="col">
                  <Users size={16} />
                  {course.enrolledStudents}
                </div>
                <div className="col">
                  <CheckCircle size={16} />
                  {course.completedStudents}
                </div>
                <div className="col">
                  <div className="completion-bar">
                    <div 
                      className="completion-fill" 
                      style={{ width: `${course.completionRate}%` }}
                    ></div>
                    <span>{course.completionRate}%</span>
                  </div>
                </div>
                <div className="col">
                  <Award size={16} />
                  {course.averageQuizScore}%
                </div>
                <div className="col">
                  <Clock size={16} />
                  {course.totalLearningHours}h
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Details Tab */}
      {activeTab === 'students' && (
        <div className="analytics-content">
          <h3>Individual Student Performance</h3>
          <div className="student-analytics-table">
            <div className="table-header">
              <div className="col">Student</div>
              <div className="col">Course</div>
              <div className="col">Progress</div>
              <div className="col">Quiz Score</div>
              <div className="col">Learning Hours</div>
              <div className="col">Last Activity</div>
              <div className="col">Status</div>
            </div>
            {analytics.studentPerformance.map((student, index) => {
              const status = getCompletionStatus(student.completionPercentage);
              const StatusIcon = status.icon;
              
              return (
                <div key={`${student.studentId}-${student.courseId}-${index}`} className="table-row">
                  <div className="col student-info">
                    <div className="student-avatar">
                      {student.studentName.charAt(0)}
                    </div>
                    <div>
                      <h4>{student.studentName}</h4>
                      <p className="student-email">{student.studentEmail}</p>
                    </div>
                  </div>
                  <div className="col">
                    <h4>{student.courseTitle}</h4>
                  </div>
                  <div className="col">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${student.completionPercentage}%` }}
                      ></div>
                      <span>{student.completionPercentage}%</span>
                    </div>
                  </div>
                  <div className="col">
                    <Award size={16} />
                    {student.averageQuizScore}%
                    <span className="quiz-count">({student.totalQuizzesTaken} quizzes)</span>
                  </div>
                  <div className="col">
                    <Clock size={16} />
                    {student.totalLearningHours}h
                  </div>
                  <div className="col">
                    <Calendar size={16} />
                    {formatTimeAgo(student.lastActivity)}
                  </div>
                  <div className="col">
                    <div className={`status-badge ${status.status}`}>
                      <StatusIcon size={16} />
                      {status.status === 'completed' ? 'Completed' : 
                       status.status === 'in-progress' ? 'In Progress' : 'Not Started'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity Tab */}
      {activeTab === 'activity' && (
        <div className="analytics-content">
          <h3>Recent Student Activity</h3>
          <div className="activity-list">
            {analytics.recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {activity.activity === 'Completed course' ? <CheckCircle size={20} /> :
                   activity.activity === 'Made progress' ? <TrendingUp size={20} /> :
                   <Users size={20} />}
                </div>
                <div className="activity-content">
                  <h4>{activity.studentName}</h4>
                  <p>{activity.activity} in <strong>{activity.courseTitle}</strong></p>
                  <div className="activity-meta">
                    <span className="completion">{activity.completionPercentage}% complete</span>
                    <span className="time">{formatTimeAgo(activity.lastAccessed)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorAnalytics;
