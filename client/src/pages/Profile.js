import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Award, BookOpen, TrendingUp } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: user?.bio || '',
    avatar: user?.avatar || ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await updateProfile(formData);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } else {
      setMessage({ type: 'error', text: result.error });
    }

    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <div className="profile-avatar-large">
            {user.avatar ? (
              <img src={user.avatar} alt={user.firstName} />
            ) : (
              <div className="avatar-placeholder-large">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h1>{user.firstName} {user.lastName}</h1>
            <p className="profile-role">
              <span className={`badge badge-${user.role === 'student' ? 'primary' : user.role === 'instructor' ? 'warning' : 'danger'}`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </p>
          </div>
        </div>

        <div className="profile-content">
          {/* Stats Section */}
          <div className="profile-stats">
            <div className="stat-card">
              <BookOpen size={32} color="#4f46e5" />
              <div>
                <div className="stat-value">{user.enrolledCourses?.length || 0}</div>
                <div className="stat-label">Enrolled Courses</div>
              </div>
            </div>
            <div className="stat-card">
              <Award size={32} color="#10b981" />
              <div>
                <div className="stat-value">{user.completedCourses?.length || 0}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>
            <div className="stat-card">
              <TrendingUp size={32} color="#f59e0b" />
              <div>
                <div className="stat-value">{user.stats?.averageScore || 0}%</div>
                <div className="stat-label">Average Score</div>
              </div>
            </div>
          </div>

          {/* Profile Info Section */}
          <div className="profile-info-section">
            <div className="section-header">
              <h2>Profile Information</h2>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                  Edit Profile
                </button>
              )}
            </div>

            {message.text && (
              <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
                {message.text}
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-row">
                  <div className="input-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="avatar">Avatar URL</label>
                  <input
                    type="url"
                    id="avatar"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleChange}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        firstName: user.firstName,
                        lastName: user.lastName,
                        bio: user.bio,
                        avatar: user.avatar
                      });
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-details">
                <div className="detail-item">
                  <User size={20} />
                  <div>
                    <div className="detail-label">Full Name</div>
                    <div className="detail-value">{user.firstName} {user.lastName}</div>
                  </div>
                </div>
                <div className="detail-item">
                  <Mail size={20} />
                  <div>
                    <div className="detail-label">Email</div>
                    <div className="detail-value">{user.email}</div>
                  </div>
                </div>
                {user.bio && (
                  <div className="detail-item">
                    <div>
                      <div className="detail-label">Bio</div>
                      <div className="detail-value">{user.bio}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Learning Stats */}
          {user.role === 'student' && (
            <div className="learning-stats-section">
              <h2>Learning Statistics</h2>
              <div className="stats-grid">
                <div className="stat-box">
                  <div className="stat-title">Quizzes Taken</div>
                  <div className="stat-number">{user.stats?.totalQuizzesTaken || 0}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-title">Learning Streak</div>
                  <div className="stat-number">{user.stats?.learningStreak || 0} days</div>
                </div>
                <div className="stat-box">
                  <div className="stat-title">Total Time</div>
                  <div className="stat-number">{Math.round((user.stats?.totalTimeSpent || 0) / 60)}h</div>
                </div>
                <div className="stat-box">
                  <div className="stat-title">Achievements</div>
                  <div className="stat-number">{user.achievements?.length || 0}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
