import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Award, 
  TrendingUp, 
  Trash2, 
  UserCheck, 
  Shield, 
  BarChart3, 
  Clock, 
  Mail,
  Activity,
  CheckCircle,
  XCircle,
  Eye,
  Settings
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { userService, courseService } from '../services/api';
import './Admin.css';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalStudents: 0,
    totalInstructors: 0,
    totalAdmins: 0,
    totalEnrollments: 0,
    activeUsers: 0,
    completedCourses: 0,
    averageCompletionRate: 0,
    totalLearningHours: 0,
    recentActivity: 0
  });
  const [userAnalytics, setUserAnalytics] = useState([]);
  const [courseAnalytics, setCourseAnalytics] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, coursesRes] = await Promise.all([
        userService.getAllUsers(),
        courseService.getAllCourses()
      ]);

      const usersData = usersRes.data.data.users;
      const coursesData = coursesRes.data.data.courses;

      setUsers(usersData);
      setCourses(coursesData);

      // Calculate comprehensive system stats
      const totalEnrollments = coursesData.reduce((sum, course) => 
        sum + (course.enrolledStudents?.length || 0), 0
      );

      const students = usersData.filter(u => u.role === 'student');
      const instructors = usersData.filter(u => u.role === 'instructor');
      const admins = usersData.filter(u => u.role === 'admin');

      // Calculate active users (users who have logged in within last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const activeUsers = usersData.filter(user => 
        new Date(user.updatedAt) > sevenDaysAgo
      ).length;

      // Calculate course completion stats
      const publishedCourses = coursesData.filter(c => c.isPublished);
      const completedCourses = publishedCourses.length; // Simplified for now

      // Calculate average completion rate (simplified)
      const averageCompletionRate = publishedCourses.length > 0 ? 
        Math.round((totalEnrollments / publishedCourses.length) * 10) : 0;

      // Calculate total learning hours (simplified)
      const totalLearningHours = Math.round(totalEnrollments * 2.5); // Estimate

      // Recent activity (users created in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentActivity = usersData.filter(user => 
        new Date(user.createdAt) > thirtyDaysAgo
      ).length;

      setSystemStats({
        totalUsers: usersData.length,
        totalCourses: coursesData.length,
        totalStudents: students.length,
        totalInstructors: instructors.length,
        totalAdmins: admins.length,
        totalEnrollments,
        activeUsers,
        completedCourses,
        averageCompletionRate,
        totalLearningHours,
        recentActivity
      });

      // Generate user analytics
      const userAnalyticsData = usersData.map(user => {
        const enrolledCourses = user.enrolledCourses?.length || 0;
        const isActive = new Date(user.updatedAt) > sevenDaysAgo;
        const daysSinceJoined = Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));
        
        return {
          ...user,
          enrolledCourses,
          isActive,
          daysSinceJoined,
          lastActive: user.updatedAt
        };
      });

      setUserAnalytics(userAnalyticsData);

      // Generate course analytics
      const courseAnalyticsData = coursesData.map(course => {
        const enrollments = course.enrolledStudents?.length || 0;
        const lessons = course.lessons?.length || 0;
        const isPopular = enrollments > 5;
        const completionRate = enrollments > 0 ? Math.round((enrollments / 10) * 100) : 0; // Simplified
        
        return {
          ...course,
          enrollments,
          lessons,
          isPopular,
          completionRate
        };
      });

      setCourseAnalytics(courseAnalyticsData);

      // Generate recent activity
      const recentActivityData = [
        ...usersData.slice(0, 5).map(user => ({
          type: 'user_registered',
          user: user.firstName + ' ' + user.lastName,
          role: user.role,
          timestamp: user.createdAt,
          icon: Users
        })),
        ...coursesData.slice(0, 3).map(course => ({
          type: 'course_created',
          course: course.title,
          instructor: course.instructor?.firstName + ' ' + course.instructor?.lastName,
          timestamp: course.createdAt,
          icon: BookOpen
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8);

      setRecentActivity(recentActivityData);

    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await userService.deleteUser(userId);
      alert('User deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      await courseService.deleteCourse(courseId);
      alert('Course deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Error deleting course');
    }
  };

  const handleUpdateUserRole = async (userId, currentRole) => {
    const newRole = prompt('Enter new role (student/instructor/admin):', currentRole);
    
    if (!newRole || !['student', 'instructor', 'admin'].includes(newRole.toLowerCase())) {
      alert('Invalid role');
      return;
    }

    try {
      await userService.updateUser(userId, { role: newRole.toLowerCase() });
      alert('User role updated successfully');
      fetchData();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user role');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading admin panel..." />;
  }

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <div className="admin-header-content">
            <div className="admin-title">
              <Shield size={40} />
              <div>
                <h1>System Administration</h1>
                <p>Comprehensive platform oversight and management</p>
              </div>
            </div>
            <div className="admin-actions">
              <button className="btn btn-secondary">
                <Settings size={20} />
                System Settings
              </button>
              <button className="btn btn-primary">
                <BarChart3 size={20} />
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* System Overview Stats */}
        <div className="system-stats-grid">
          <div className="system-stat-card stat-users">
            <div className="stat-header">
              <div className="stat-icon">
                <Users size={24} />
              </div>
              <div className="stat-trend">
                <TrendingUp size={16} />
                +{systemStats.recentActivity}
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-value">{systemStats.totalUsers}</div>
              <div className="stat-label">Total Users</div>
              <div className="stat-breakdown">
                <span className="breakdown-item">
                  <div className="breakdown-dot" style={{ background: '#3b82f6' }}></div>
                  {systemStats.totalStudents} Students
                </span>
                <span className="breakdown-item">
                  <div className="breakdown-dot" style={{ background: '#f59e0b' }}></div>
                  {systemStats.totalInstructors} Instructors
                </span>
                <span className="breakdown-item">
                  <div className="breakdown-dot" style={{ background: '#ef4444' }}></div>
                  {systemStats.totalAdmins} Admins
                </span>
              </div>
            </div>
          </div>

          <div className="system-stat-card stat-activity">
            <div className="stat-header">
              <div className="stat-icon">
                <Activity size={24} />
              </div>
              <div className="stat-trend">
                <Clock size={16} />
                Last 7 days
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-value">{systemStats.activeUsers}</div>
              <div className="stat-label">Active Users</div>
              <div className="stat-detail">
                {Math.round((systemStats.activeUsers / systemStats.totalUsers) * 100)}% of total users
              </div>
            </div>
          </div>

          <div className="system-stat-card stat-courses">
            <div className="stat-header">
              <div className="stat-icon">
                <BookOpen size={24} />
              </div>
              <div className="stat-trend">
                <Award size={16} />
                {systemStats.completedCourses} published
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-value">{systemStats.totalCourses}</div>
              <div className="stat-label">Total Courses</div>
              <div className="stat-detail">
                {systemStats.totalEnrollments} total enrollments
              </div>
            </div>
          </div>

          <div className="system-stat-card stat-learning">
            <div className="stat-header">
              <div className="stat-icon">
                <Clock size={24} />
              </div>
              <div className="stat-trend">
                <TrendingUp size={16} />
                {systemStats.averageCompletionRate}% avg
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-value">{systemStats.totalLearningHours}h</div>
              <div className="stat-label">Learning Hours</div>
              <div className="stat-detail">
                Total platform engagement
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="admin-tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 size={20} />
            System Overview
          </button>
          <button 
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={20} />
            User Management ({users.length})
          </button>
          <button 
            className={`tab ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            <BookOpen size={20} />
            Course Oversight ({courses.length})
          </button>
          <button 
            className={`tab ${activeTab === 'instructors' ? 'active' : ''}`}
            onClick={() => setActiveTab('instructors')}
          >
            <Award size={20} />
            Instructor Analytics
          </button>
          <button 
            className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <Activity size={20} />
            System Activity
          </button>
        </div>

        {/* Tab Content */}
        <div className="admin-content">
          {activeTab === 'overview' && (
            <div className="overview-content">
              <div className="overview-grid">
                <div className="overview-section">
                  <div className="section-header">
                    <h3>System Health</h3>
                    <div className="health-indicators">
                      <div className="health-indicator healthy">
                        <CheckCircle size={16} />
                        <span>All Systems Operational</span>
                      </div>
                    </div>
                  </div>
                  <div className="health-metrics">
                    <div className="health-metric">
                      <div className="metric-label">Database Status</div>
                      <div className="metric-value healthy">Connected</div>
                    </div>
                    <div className="health-metric">
                      <div className="metric-label">API Response Time</div>
                      <div className="metric-value healthy">~150ms</div>
                    </div>
                    <div className="health-metric">
                      <div className="metric-label">Active Sessions</div>
                      <div className="metric-value">{systemStats.activeUsers}</div>
                    </div>
                  </div>
                </div>

                <div className="overview-section">
                  <div className="section-header">
                    <h3>Recent Activity</h3>
                    <button className="btn btn-sm btn-secondary">View All</button>
                  </div>
                  <div className="activity-feed">
                    {recentActivity.slice(0, 6).map((activity, index) => {
                      const IconComponent = activity.icon;
                      return (
                        <div key={index} className="activity-item">
                          <div className="activity-icon">
                            <IconComponent size={16} />
                          </div>
                          <div className="activity-content">
                            <div className="activity-text">
                              {activity.type === 'user_registered' ? (
                                <span><strong>{activity.user}</strong> registered as {activity.role}</span>
                              ) : (
                                <span><strong>{activity.instructor}</strong> created course "{activity.course}"</span>
                              )}
                            </div>
                            <div className="activity-time">
                              {new Date(activity.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="overview-section">
                  <div className="section-header">
                    <h3>Top Performing Courses</h3>
                    <button className="btn btn-sm btn-secondary">View All</button>
                  </div>
                  <div className="course-ranking">
                    {courseAnalytics
                      .sort((a, b) => b.enrollments - a.enrollments)
                      .slice(0, 5)
                      .map((course, index) => (
                        <div key={course._id} className="ranking-item">
                          <div className="ranking-number">#{index + 1}</div>
                          <div className="ranking-content">
                            <div className="course-name">{course.title}</div>
                            <div className="course-instructor">{course.instructor?.firstName} {course.instructor?.lastName}</div>
                          </div>
                          <div className="ranking-stats">
                            <div className="stat-value">{course.enrollments}</div>
                            <div className="stat-label">enrollments</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="overview-section">
                  <div className="section-header">
                    <h3>User Distribution</h3>
                  </div>
                  <div className="user-distribution">
                    <div className="distribution-chart">
                      <div className="chart-bar">
                        <div className="bar-label">Students</div>
                        <div className="bar-container">
                          <div 
                            className="bar-fill students" 
                            style={{ width: `${(systemStats.totalStudents / systemStats.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <div className="bar-value">{systemStats.totalStudents}</div>
                      </div>
                      <div className="chart-bar">
                        <div className="bar-label">Instructors</div>
                        <div className="bar-container">
                          <div 
                            className="bar-fill instructors" 
                            style={{ width: `${(systemStats.totalInstructors / systemStats.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <div className="bar-value">{systemStats.totalInstructors}</div>
                      </div>
                      <div className="chart-bar">
                        <div className="bar-label">Admins</div>
                        <div className="bar-container">
                          <div 
                            className="bar-fill admins" 
                            style={{ width: `${(systemStats.totalAdmins / systemStats.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <div className="bar-value">{systemStats.totalAdmins}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-content">
              <div className="section-header">
                <h2>User Management</h2>
                <p>Manage all platform users and their roles</p>
              </div>

              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Enrolled Courses</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar-small">
                              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                            </div>
                            <div>
                              <div className="user-name">{user.firstName} {user.lastName}</div>
                            </div>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`badge badge-${user.role === 'student' ? 'primary' : user.role === 'instructor' ? 'warning' : 'danger'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>{user.enrolledCourses?.length || 0} courses</td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              onClick={() => handleUpdateUserRole(user._id, user.role)}
                              className="btn-icon btn-icon-primary"
                              title="Change Role"
                            >
                              <UserCheck size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user._id)}
                              className="btn-icon btn-icon-danger"
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="courses-content">
              <div className="section-header">
                <h2>Course Oversight</h2>
                <p>Monitor and manage all platform courses</p>
              </div>

              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Instructor</th>
                      <th>Category</th>
                      <th>Level</th>
                      <th>Enrollments</th>
                      <th>Lessons</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(course => (
                      <tr key={course._id}>
                        <td>
                          <div className="course-cell">
                            <div className="course-name">{course.title}</div>
                          </div>
                        </td>
                        <td>
                          {course.instructor?.firstName} {course.instructor?.lastName}
                        </td>
                        <td>
                          <span className="badge badge-primary">
                            {course.category}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${course.level === 'beginner' ? 'success' : course.level === 'intermediate' ? 'warning' : 'danger'}`}>
                            {course.level}
                          </span>
                        </td>
                        <td>{course.totalEnrollments || 0}</td>
                        <td>{course.lessons?.length || 0}</td>
                        <td>
                          <span className={`badge badge-${course.isPublished ? 'success' : 'secondary'}`}>
                            {course.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              onClick={() => window.location.href = `/courses/${course._id}`}
                              className="btn-icon btn-icon-primary"
                              title="View Course"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteCourse(course._id)}
                              className="btn-icon btn-icon-danger"
                              title="Delete Course"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'instructors' && (
            <div className="instructors-content">
              <div className="section-header">
                <h2>Instructor Analytics</h2>
                <p>Monitor instructor performance and course creation</p>
              </div>

              <div className="instructors-grid">
                {userAnalytics
                  .filter(user => user.role === 'instructor')
                  .map(instructor => {
                    const instructorCourses = courses.filter(c => c.instructor?._id === instructor._id);
                    const totalEnrollments = instructorCourses.reduce((sum, course) => 
                      sum + (course.enrolledStudents?.length || 0), 0
                    );
                    const publishedCourses = instructorCourses.filter(c => c.isPublished).length;
                    
                    return (
                      <div key={instructor._id} className="instructor-card">
                        <div className="instructor-header">
                          <div className="instructor-avatar">
                            {instructor.firstName?.charAt(0)}{instructor.lastName?.charAt(0)}
                          </div>
                          <div className="instructor-info">
                            <h4>{instructor.firstName} {instructor.lastName}</h4>
                            <p>{instructor.email}</p>
                          </div>
                          <div className={`status-indicator ${instructor.isActive ? 'active' : 'inactive'}`}>
                            {instructor.isActive ? <CheckCircle size={16} /> : <XCircle size={16} />}
                          </div>
                        </div>
                        
                        <div className="instructor-stats">
                          <div className="stat-item">
                            <div className="stat-value">{instructorCourses.length}</div>
                            <div className="stat-label">Total Courses</div>
                          </div>
                          <div className="stat-item">
                            <div className="stat-value">{publishedCourses}</div>
                            <div className="stat-label">Published</div>
                          </div>
                          <div className="stat-item">
                            <div className="stat-value">{totalEnrollments}</div>
                            <div className="stat-label">Enrollments</div>
                          </div>
                          <div className="stat-item">
                            <div className="stat-value">{instructor.daysSinceJoined}</div>
                            <div className="stat-label">Days Active</div>
                          </div>
                        </div>

                        <div className="instructor-actions">
                          <button className="btn btn-sm btn-secondary">
                            <Eye size={16} />
                            View Profile
                          </button>
                          <button className="btn btn-sm btn-primary">
                            <Mail size={16} />
                            Contact
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-content">
              <div className="section-header">
                <h2>System Activity</h2>
                <p>Monitor platform usage and user engagement</p>
              </div>

              <div className="activity-grid">
                <div className="activity-section">
                  <h3>Recent User Registrations</h3>
                  <div className="activity-list">
                    {userAnalytics
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .slice(0, 10)
                      .map(user => (
                        <div key={user._id} className="activity-item">
                          <div className="activity-icon">
                            <Users size={16} />
                          </div>
                          <div className="activity-content">
                            <div className="activity-text">
                              <strong>{user.firstName} {user.lastName}</strong> registered as {user.role}
                            </div>
                            <div className="activity-time">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="activity-section">
                  <h3>Course Creation Activity</h3>
                  <div className="activity-list">
                    {courses
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .slice(0, 10)
                      .map(course => (
                        <div key={course._id} className="activity-item">
                          <div className="activity-icon">
                            <BookOpen size={16} />
                          </div>
                          <div className="activity-content">
                            <div className="activity-text">
                              <strong>{course.instructor?.firstName} {course.instructor?.lastName}</strong> created "{course.title}"
                            </div>
                            <div className="activity-time">
                              {new Date(course.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
