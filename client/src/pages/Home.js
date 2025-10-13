import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, TrendingUp, Award, Target, ArrowRight, Settings } from 'lucide-react';
import './Home.css';

const Home = () => {
  const { isAuthenticated, enableAutoLogin, disableAutoLogin } = useAuth();

  const features = [
    {
      icon: <BookOpen size={40} />,
      title: 'Interactive Courses',
      description: 'Access a wide range of courses with engaging content, videos, and resources designed for effective learning.'
    },
    {
      icon: <Target size={40} />,
      title: 'Smart Quizzes',
      description: 'Test your knowledge with interactive quizzes featuring multiple question types and instant feedback.'
    },
    {
      icon: <TrendingUp size={40} />,
      title: 'Progress Tracking',
      description: 'Monitor your learning journey with detailed analytics, performance charts, and completion metrics.'
    },
    {
      icon: <Award size={40} />,
      title: 'Achievements',
      description: 'Earn badges and track your learning streaks as you complete courses and excel in quizzes.'
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Your Interactive Learning Companion
            </h1>
            <p className="hero-subtitle">
              Master new skills with Study Buddy - an intelligent e-learning platform 
              featuring interactive quizzes, real-time progress tracking, and personalized dashboards.
            </p>
            <div className="hero-actions">
              {isAuthenticated ? (
                <>
                  <Link to="/courses" className="btn btn-primary btn-large">
                    Browse Courses
                    <ArrowRight size={20} />
                  </Link>
                  <Link to="/dashboard" className="btn btn-outline btn-large">
                    Go to Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-large">
                    Get Started Free
                    <ArrowRight size={20} />
                  </Link>
                  <Link to="/login" className="btn btn-outline btn-large">
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hero-image">
            <div className="floating-card card-1">
              <BookOpen size={24} color="#4f46e5" />
              <div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Active Courses</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>12+</div>
              </div>
            </div>
            <div className="floating-card card-2">
              <Award size={24} color="#10b981" />
              <div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Students</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>500+</div>
              </div>
            </div>
            <div className="floating-card card-3">
              <TrendingUp size={24} color="#f59e0b" />
              <div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Success Rate</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>94%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose Study Buddy?</h2>
            <p>Everything you need for effective online learning</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Courses Available</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">1000+</div>
              <div className="stat-label">Quiz Questions</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Active Learners</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">95%</div>
              <div className="stat-label">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="cta-section">
          <div className="container">
            <div className="cta-content">
              <h2>Ready to Start Learning?</h2>
              <p>Join thousands of learners achieving their goals with Study Buddy</p>
              <Link to="/register" className="btn btn-primary btn-large">
                Create Free Account
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Development Panel - Only show in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <div className="dev-panel">
          <div className="container">
            <div className="dev-panel-content">
              <div className="dev-panel-header">
                <Settings size={20} />
                <h3>Development Tools</h3>
              </div>
              <div className="dev-panel-actions">
                <button 
                  onClick={disableAutoLogin}
                  className="btn btn-secondary btn-sm"
                >
                  Disable Auto-Login
                </button>
                <button 
                  onClick={enableAutoLogin}
                  className="btn btn-primary btn-sm"
                >
                  Enable Auto-Login
                </button>
                <button 
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="btn btn-danger btn-sm"
                >
                  Clear All Data
                </button>
              </div>
              <p className="dev-panel-note">
                Use these tools to control authentication behavior during development.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
