import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Eye, EyeOff, ArrowRight, GraduationCap, MonitorPlay } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);
    if (result && result.success) {
      navigate('/courses');
    } else {
      setError(result?.error || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  const strengthScore = formData.password.length === 0 ? 0 : formData.password.length < 6 ? 1 : formData.password.length < 10 ? 2 : 3;
  const strengthColour = ['bg-gray-200', 'bg-red-400', 'bg-amber-400', 'bg-emerald-500'][strengthScore];
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'][strengthScore];

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
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-4 tracking-tight">
            Start learning.<br /><span className="text-cyan-400">It's completely free.</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">Create your account and get immediate access to courses, quizzes, and your personal learning dashboard.</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '30+', label: 'Free courses' },
              { value: '100+', label: 'Quiz questions' },
              { value: '3', label: 'Question types' },
              { value: '∞', label: 'Retakes allowed' }
            ].map(s => (
              <div key={s.label} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-2xl font-extrabold text-white">{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
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
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create your account</h1>
            <p className="mt-1.5 text-sm text-gray-500">Free forever — no credit card needed</p>
          </div>
          {error && (
            <div className="alert-error mb-5" role="alert">
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="label">First name</label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  className="input"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  autoComplete="given-name"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="lastName" className="label">Last name</label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  className="input"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>
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
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                  onClick={() => setShowPw(!showPw)}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strengthScore ? strengthColour : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <span className={`text-xs font-semibold ${strengthScore === 1 ? 'text-red-500' : strengthScore === 2 ? 'text-amber-600' : 'text-emerald-600'}`}>{strengthLabel}</span>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="label">Confirm password</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPw ? 'text' : 'password'}
                  name="confirmPassword"
                  className="input pr-12"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  tabIndex={-1}
                >
                  {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">I am a…</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, role: 'student' }))}
                  className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${formData.role === 'student' ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'}`}
                  aria-pressed={formData.role === 'student'}
                >
                  <GraduationCap className="h-5 w-5" /> Student
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, role: 'instructor' }))}
                  className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${formData.role === 'instructor' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'}`}
                  aria-pressed={formData.role === 'instructor'}
                >
                  <MonitorPlay className="h-5 w-5" /> Instructor
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
                  Creating account…
                </span>
              ) : (
                <>Create free account <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-600 font-semibold hover:text-cyan-700 transition-colors">Sign in</Link>
          </p>
          <p className="mt-4 text-center text-xs text-gray-400">By creating an account you agree to our terms of use.</p>
        </div>
      </div>
    </div>
  );
};

export default Register;
