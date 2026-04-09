import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { BookOpen, Trophy, Clock, TrendingUp, PlayCircle, CheckCircle } from 'lucide-react';
import { progressService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import useCountUp from '../hooks/useCountUp';
import useInView from '../hooks/useInView';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];

const StatCard = ({ icon, value, label, detail, iconBg, delay = 0 }) => {
  const { count, trigger } = useCountUp(typeof value === 'number' ? value : 0, 1200);
  const [ref, inView] = useInView(0.1);
  useEffect(() => { if (inView) trigger(); }, [inView]); // eslint-disable-line
  const displayValue = typeof value === 'string' ? value : count + (typeof value === 'number' ? '' : '');

  return (
    <div
      ref={ref}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 will-animate animate-fade-up hover-lift"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-gray-900 tracking-tight tabular-nums">{displayValue}</p>
        <p className="text-sm font-semibold text-gray-600">{label}</p>
        {detail && <p className="text-xs text-gray-400 mt-0.5 truncate">{detail}</p>}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []); // eslint-disable-line

  const fetchDashboardData = async () => {
    try {
      const response = await progressService.getDashboard();
      if (response.data && response.data.data) {
        setDashboardData(response.data.data);
      } else {
        setDashboardData(null);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  const displayName = user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'there');

  if (loading) return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="skeleton h-3 w-24 mb-2 rounded-full" />
          <div className="skeleton h-7 w-48 rounded-lg" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="skeleton w-12 h-12 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-6 w-16 rounded" />
                <div className="skeleton h-3 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="card"><div className="skeleton h-[260px] rounded-xl" /></div>
          <div className="card"><div className="skeleton h-[260px] rounded-xl" /></div>
        </div>
        <div className="card space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3.5 w-48 rounded-full" />
                <div className="skeleton h-3 w-32 rounded-full" />
              </div>
              <div className="skeleton h-2 w-20 rounded-full hidden sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">My Dashboard</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="card max-w-md mx-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Unable to load dashboard</h3>
            <p className="text-sm text-gray-500 mb-5">There was an error loading your data. Please try refreshing.</p>
            <button onClick={() => window.location.reload()} className="btn-primary">Refresh Page</button>
          </div>
        </div>
      </div>
    );
  }

  const { overview, recentActivity, quizPerformance, categoryProgress, milestones } = dashboardData;

  const categoryData = Object.entries(categoryProgress || {}).map(([name, data]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: data.total
  }));

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Clean white header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-gray-500 text-sm mb-1">Welcome back,</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{displayName}</h1>
          <p className="text-gray-500 text-sm mt-1">Here's your learning overview</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            delay={0}
            icon={<BookOpen className="h-6 w-6 text-blue-600" />}
            value={overview?.totalCourses || 0}
            label="Total Courses"
            detail={`${overview?.completedCourses || 0} completed, ${overview?.inProgressCourses || 0} in progress`}
            iconBg="bg-blue-100"
          />
          <StatCard
            delay={80}
            icon={<Trophy className="h-6 w-6 text-emerald-600" />}
            value={`${overview?.averageScore || 0}%`}
            label="Average Score"
            detail={`${overview?.totalQuizzes || 0} quizzes taken`}
            iconBg="bg-emerald-100"
          />
          <StatCard
            delay={160}
            icon={<Clock className="h-6 w-6 text-amber-600" />}
            value={`${Math.round((overview?.totalTimeSpent || 0) / 60)}h`}
            label="Time Spent"
            detail="Total learning time"
            iconBg="bg-amber-100"
          />
          <StatCard
            delay={240}
            icon={<TrendingUp className="h-6 w-6 text-violet-600" />}
            value={overview?.completedCourses || 0}
            label="Completed"
            detail="Courses finished"
            iconBg="bg-violet-100"
          />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Quiz Performance */}
          <div className="card">
            <h3 className="text-base font-bold text-gray-900 mb-4">Quiz Performance Over Time</h3>
            {quizPerformance && quizPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={quizPerformance} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value) => [`${value}%`, 'Score']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fill="url(#scoreGradient)"
                    name="Quiz Score"
                    dot={{ fill: '#2563eb', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-52 text-center">
                <Trophy className="h-10 w-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">No quiz data available yet</p>
                <Link to="/courses" className="btn-primary mt-4 text-xs px-4 py-2">Take a quiz</Link>
              </div>
            )}
          </div>

          {/* Category Distribution */}
          <div className="card">
            <h3 className="text-base font-bold text-gray-900 mb-4">Courses by Category</h3>
            {categoryData && categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-52 text-center">
                <BookOpen className="h-10 w-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">No course data available yet</p>
                <Link to="/courses" className="btn-primary mt-4 text-xs px-4 py-2">Explore courses</Link>
              </div>
            )}
          </div>
        </div>

        {/* Milestones */}
        {milestones && milestones.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Achievements</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {milestones.map(m => (
                <div
                  key={m.id}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center ${m.unlocked ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-gray-50 opacity-40'}`}
                >
                  <span className="text-2xl">{m.icon}</span>
                  <p className="text-xs font-bold text-gray-800 leading-tight">{m.label}</p>
                  <p className="text-xs text-gray-500 leading-tight">{m.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-base font-bold text-gray-900 mb-5">Recent Activity</h2>
          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <Link
                  to={`/courses/${activity.course._id}`}
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex-shrink-0">
                    {activity.completionPercentage === 100 ? (
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <PlayCircle className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate">{activity.course.title}</p>
                    <p className="text-xs text-gray-400">Last accessed: {new Date(activity.lastAccessed).toLocaleDateString()}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-3">
                    <div className="hidden sm:block w-24">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${activity.completionPercentage}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-500 w-8 text-right">{activity.completionPercentage}%</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen className="h-7 w-7 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-4">No recent activity — start a course to see your progress here.</p>
              <Link to="/courses" className="btn-primary">Explore Courses</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
