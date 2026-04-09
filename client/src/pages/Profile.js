import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Award, BookOpen, TrendingUp, Edit2, Check, X } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // DB returns a single `name` field — split it for the form
  const nameParts = (user?.name || '').trim().split(' ');
  const derivedFirst = user?.firstName || nameParts[0] || '';
  const derivedLast = user?.lastName || nameParts.slice(1).join(' ') || '';

  const [formData, setFormData] = useState({
    firstName: derivedFirst,
    lastName: derivedLast,
    bio: user?.bio || '',
    avatar: user?.avatar_url || user?.avatar || ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateProfile(formData);
    setSaving(false);
    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } else {
      setMessage({ type: 'error', text: result.error });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setFormData({
      firstName: derivedFirst,
      lastName: derivedLast,
      bio: user?.bio || '',
      avatar: user?.avatar_url || user?.avatar || ''
    });
  };

  const initials = (derivedFirst[0] || '') + (derivedLast[0] || '');
  const displayName = `${derivedFirst} ${derivedLast}`.trim() || user?.name || 'User';

  const roleColour = {
    student: 'badge-blue',
    instructor: 'badge-purple',
    admin: 'bg-red-100 text-red-700 badge',
  }[user?.role] || 'badge-gray';

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
              {user?.avatar ? (
                <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-2xl font-extrabold">
                  {initials.toUpperCase() || <User className="h-8 w-8" />}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{displayName}</h1>
              <div className="mt-1.5 flex items-center gap-2">
                <span className={`${roleColour} capitalize`}>{user?.role}</span>
                <span className="text-gray-500 text-sm">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: <BookOpen className="h-5 w-5 text-blue-600" />, value: user?.enrollmentCount || user?.enrolledCourses?.length || 0, label: 'Enrolled', bg: 'bg-blue-100' },
            { icon: <Award className="h-5 w-5 text-emerald-600" />, value: user?.completedCourses?.length || 0, label: 'Completed', bg: 'bg-emerald-100' },
            { icon: <TrendingUp className="h-5 w-5 text-amber-600" />, value: `${user?.stats?.averageScore || 0}%`, label: 'Avg Score', bg: 'bg-amber-100' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
              <div>
                <p className="text-xl font-extrabold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Profile info card */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">Profile Information</h2>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="btn-outline text-xs px-3 py-2">
                <Edit2 className="h-3.5 w-3.5" /> Edit Profile
              </button>
            )}
          </div>

          {message.text && (
            <div className={`mb-4 ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} role="alert">
              <span>{message.text}</span>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="label">First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    className="input"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="label">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    className="input"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="bio" className="label">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  className="input resize-none"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div>
                <label htmlFor="avatar" className="label">Avatar URL</label>
                <input
                  id="avatar"
                  type="url"
                  name="avatar"
                  className="input"
                  value={formData.avatar}
                  onChange={handleChange}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    <><Check className="h-4 w-4" /> Save Changes</>
                  )}
                </button>
                <button type="button" onClick={cancelEdit} className="btn-outline">
                  <X className="h-4 w-4" /> Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{displayName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{user?.email}</p>
                </div>
              </div>
              {user?.bio && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bio</p>
                    <p className="text-sm text-gray-800 mt-0.5 leading-relaxed">{user.bio}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Learning stats (students only) */}
        {user?.role === 'student' && (
          <div className="card">
            <h2 className="text-base font-bold text-gray-900 mb-5">Learning Statistics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { title: 'Quizzes Taken', value: user.stats?.totalQuizzesTaken || 0 },
                { title: 'Learning Streak', value: `${user.stats?.learningStreak || 0} days` },
                { title: 'Total Time', value: `${Math.round((user.stats?.totalTimeSpent || 0) / 60)}h` },
                { title: 'Achievements', value: user.achievements?.length || 0 },
              ].map(s => (
                <div key={s.title} className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xl font-extrabold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
