import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    setLoading(true);
    try {
      const result = await login(formData);
      if (result && result.success) {
        navigate('/dashboard');
      } else {
        setError(result?.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => {
    setFormData({ email, password });
    setError('');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-cyan-600 rounded-xl flex items-center justify-center">
              <BookOpen style={{ width: 18, height: 18, color: 'white' }} />
            </div>
            <span className="font-extrabold text-xl text-white tracking-tight">Study<span className="text-cyan-400">Buddy</span></span>
          </Link>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-4 tracking-tight">Your learning journey<br />continues here.</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">Track your progress, retake quizzes, and keep building knowledge — one lesson at a time.</p>
          <div className="space-y-3">
            {['Instant feedback on every quiz answer', 'Visual progress charts and learning stats', 'Study at your own pace, any time'].map(point => (
              <div key={point} className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                <span className="text-sm text-slate-300">{point}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-xs text-slate-500">© {new Date().getFullYear()} StudyBuddy · Arden University FYP</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center">
              <BookOpen style={{ width: 17, height: 17, color: 'white' }} />
            </div>
            <span className="font-extrabold text-lg text-gray-900">Study<span className="text-cyan-600">Buddy</span></span>
          </div>
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-sm text-gray-500">Sign in to continue your learning journey</p>
          </div>
          {error && (
            <div className="alert-error mb-5" role="alert">
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email"
                type="email"
                name="email"
                className="input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  className="input pr-12"
                  placeholder="Your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary w-full py-3 text-sm mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in…
                </span>
              ) : (
                <>Sign in <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-cyan-600 font-semibold hover:text-cyan-700 transition-colors">Create one free</Link>
          </p>
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <p className="text-xs font-bold text-amber-800 mb-2 uppercase tracking-wide">Demo accounts</p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => fillDemo('student@studybuddy.com', 'password123')}
                className="w-full text-left p-2.5 bg-white rounded-xl border border-amber-100 hover:border-amber-300 transition-colors"
              >
                <p className="text-xs font-semibold text-gray-700">Student account</p>
                <p className="text-xs text-gray-400 font-mono">student@studybuddy.com</p>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('instructor@studybuddy.com', 'password123')}
                className="w-full text-left p-2.5 bg-white rounded-xl border border-amber-100 hover:border-amber-300 transition-colors"
              >
                <p className="text-xs font-semibold text-gray-700">Instructor account</p>
                <p className="text-xs text-gray-400 font-mono">instructor@studybuddy.com</p>
              </button>
            </div>
            <p className="text-xs text-amber-600 mt-2 text-center">Click an account to fill the form</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
