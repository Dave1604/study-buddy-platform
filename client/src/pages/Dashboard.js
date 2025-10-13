import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BookOpen, Trophy, Clock, TrendingUp, PlayCircle, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { progressService } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await progressService.getDashboard();
      console.log('Dashboard response:', response);
      if (response.data && response.data.data) {
        setDashboardData(response.data.data);
      } else {
        console.error('Invalid response structure:', response);
        setDashboardData(null);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="page-header">
            <h1>My Dashboard</h1>
            <p>Track your learning progress and achievements</p>
          </div>
          <div className="no-data">
            <h3>Unable to load dashboard data</h3>
            <p>There was an error loading your dashboard. Please try refreshing the page.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { overview, recentActivity, quizPerformance, categoryProgress } = dashboardData;

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // Prepare category data for pie chart
  const categoryData = Object.entries(categoryProgress || {}).map(([name, data]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: data.total
  }));

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="page-header">
          <h1>My Dashboard</h1>
          <p>Track your learning progress and achievements</p>
        </div>

        {/* Stats Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dbeafe' }}>
              <BookOpen size={28} color="#2563eb" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{overview?.totalCourses || 0}</div>
              <div className="stat-label">Total Courses</div>
              <div className="stat-detail">
                {overview?.completedCourses || 0} completed, {overview?.inProgressCourses || 0} in progress
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#d1fae5' }}>
              <Trophy size={28} color="#059669" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{overview?.averageScore || 0}%</div>
              <div className="stat-label">Average Score</div>
              <div className="stat-detail">
                {overview?.totalQuizzes || 0} quizzes taken
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7' }}>
              <Clock size={28} color="#d97706" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{Math.round((overview?.totalTimeSpent || 0) / 60)}h</div>
              <div className="stat-label">Time Spent</div>
              <div className="stat-detail">
                Learning time
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ddd6fe' }}>
              <TrendingUp size={28} color="#7c3aed" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{overview?.completedCourses || 0}</div>
              <div className="stat-label">Completed</div>
              <div className="stat-detail">
                Courses finished
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          {/* Quiz Performance Chart */}
          <div className="chart-card">
            <h3>Quiz Performance Over Time</h3>
            {quizPerformance && quizPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={quizPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value) => [`${value}%`, 'Score']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#4f46e5" 
                    strokeWidth={2}
                    name="Quiz Score"
                    dot={{ fill: '#4f46e5', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No quiz data available yet</div>
            )}
          </div>

          {/* Category Distribution */}
          <div className="chart-card">
            <h3>Courses by Category</h3>
            {categoryData && categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No course data available yet</div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity-section">
          <h2>Recent Activity</h2>
          {recentActivity && recentActivity.length > 0 ? (
            <div className="activity-list">
              {recentActivity.map((activity, index) => (
                <Link 
                  to={`/courses/${activity.course._id}`} 
                  key={index}
                  className="activity-item"
                >
                  <div className="activity-icon">
                    {activity.completionPercentage === 100 ? (
                      <CheckCircle size={24} color="#10b981" />
                    ) : (
                      <PlayCircle size={24} color="#4f46e5" />
                    )}
                  </div>
                  <div className="activity-content">
                    <h4>{activity.course.title}</h4>
                    <p>Last accessed: {new Date(activity.lastAccessed).toLocaleDateString()}</p>
                  </div>
                  <div className="activity-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${activity.completionPercentage}%` }}
                      ></div>
                    </div>
                    <span>{activity.completionPercentage}%</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="no-data">
              <p>No recent activity</p>
              <Link to="/courses" className="btn btn-primary">
                Explore Courses
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
