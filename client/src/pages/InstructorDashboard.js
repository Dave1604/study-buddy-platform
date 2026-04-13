import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, BookOpen, Clock, Award, BarChart3, Edit, Trash2, TrendingUp } from 'lucide-react';
import InstructorAnalytics from '../components/InstructorAnalytics';
import { courseService, progressService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import useCountUp from '../hooks/useCountUp';
import useInView from '../hooks/useInView';

const StatCard = ({ icon, value, label, iconBg, delay = 0 }) => {
  const numVal = parseFloat(value) || 0;
  const isFloat = String(value).includes('.');
  const suffix = String(value).replace(/[\d.]/g, '');
  const { count, trigger } = useCountUp(numVal, 1200);
  const [ref, inView] = useInView(0.1);
  useEffect(() => { if (inView) trigger(); }, [inView]); // eslint-disable-line

  return (
    <div
      ref={ref}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 will-animate animate-fade-up hover-lift"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-900 tracking-tight tabular-nums">
          {isFloat ? count.toFixed(1) : count}{suffix}
        </p>
        <p className="text-sm font-semibold text-gray-600">{label}</p>
      </div>
    </div>
  );
};

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCourses: 0, totalStudents: 0, totalHours: 0, avgScore: 0 });
  const [courses, setCourses] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const displayName = user?.name
    ? user.name.split(' ')[0]
    : user?.firstName || 'Instructor';

  const fetchInstructorData = useCallback(async () => {
    try {
      const coursesRes = await courseService.getInstructorCourses();
      const instructorCourses = coursesRes.data?.data?.courses || [];
      setCourses(instructorCourses);

      let totalStudents = 0;
      let totalHours = 0;
      let totalScore = 0;
      let scoreCount = 0;

      for (const course of instructorCourses) {
        const cid = course.id || course._id;
        totalStudents += course.enrolled_count || 0;
        try {
          const progressRes = await progressService.getCourseProgress(cid);
          const progressData = progressRes.data.data.progress;
          if (progressData) {
            totalHours += (progressData.timeSpent || 0) / 60;
            if (progressData.quizScores && progressData.quizScores.length > 0) {
              for (const quiz of progressData.quizScores) {
                totalScore += quiz.score;
                scoreCount += 1;
              }
            }
          }
        } catch (err) {
          // No progress data for this course
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
  }, []);

  useEffect(() => { fetchInstructorData(); }, [fetchInstructorData]);

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (window.confirm(`Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`)) {
      try {
        await courseService.deleteCourse(courseId);
        fetchInstructorData();
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Error deleting course');
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="skeleton h-3 w-32 mb-2 rounded-full" />
          <div className="skeleton h-7 w-52 rounded-lg" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="skeleton w-12 h-12 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-6 w-14 rounded" />
                <div className="skeleton h-3 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="card space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3.5 w-52 rounded-full" />
                <div className="skeleton h-3 w-36 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Clean white header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-gray-500 text-sm mb-1">Instructor Dashboard</p>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Welcome back, {displayName}!</h1>
              <p className="text-gray-500 text-sm mt-1">Here's your teaching overview.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                className="btn-outline-blue"
                onClick={() => setShowAnalytics(!showAnalytics)}
              >
                <BarChart3 className="h-4 w-4" />
                {showAnalytics ? 'Hide Analytics' : 'View Analytics'}
              </button>
              <button
                className="btn-primary"
                onClick={() => navigate('/instructor/create-course')}
              >
                <Plus className="h-4 w-4" /> Create Course
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard delay={0} icon={<BookOpen className="h-6 w-6 text-blue-600" />} value={stats.totalCourses} label="Active Courses" iconBg="bg-blue-100" />
          <StatCard delay={80} icon={<Users className="h-6 w-6 text-violet-600" />} value={stats.totalStudents} label="Total Students" iconBg="bg-violet-100" />
          <StatCard delay={160} icon={<Clock className="h-6 w-6 text-amber-600" />} value={`${stats.totalHours}h`} label="Learning Hours" iconBg="bg-amber-100" />
          <StatCard delay={240} icon={<Award className="h-6 w-6 text-emerald-600" />} value={`${stats.avgScore}%`} label="Avg Quiz Score" iconBg="bg-emerald-100" />
        </div>

        {/* Analytics panel */}
        {showAnalytics && (
          <div className="card mb-8 animate-fade-up">
            <InstructorAnalytics />
          </div>
        )}

        {/* Main content grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* My Courses — takes 2 cols */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">My Courses</h2>
              <button
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                onClick={() => navigate('/courses')}
              >
                View all
              </button>
            </div>

            {courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen className="h-7 w-7 text-gray-400" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">No courses yet</h3>
                <p className="text-xs text-gray-400 mb-4">Create your first course to get started</p>
                <button className="btn-primary text-xs" onClick={() => navigate('/instructor/create-course')}>
                  <Plus className="h-3.5 w-3.5" /> Create Course
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map(course => {
                  const courseId = course.id || course._id;
                  return (
                  <div key={courseId} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group hover-lift">
                    {course.thumbnail && (
                      <img src={course.thumbnail} alt={course.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">{course.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Users className="h-3 w-3" /> {course.enrolled_count || 0} students
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <BookOpen className="h-3 w-3" /> {course.lesson_count || 0} lessons
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                        onClick={() => navigate(`/instructor/edit-course/${courseId}`)}
                        title="Edit course"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                        onClick={() => navigate(`/courses/${courseId}`)}
                        title="View course"
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors"
                        onClick={() => handleDeleteCourse(courseId, course.title)}
                        title="Delete course"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Plus className="h-5 w-5" />, label: 'Create Course', action: () => navigate('/instructor/create-course') },
                  { icon: <Users className="h-5 w-5" />, label: 'View Students', action: () => navigate('/courses') },
                  { icon: <TrendingUp className="h-5 w-5" />, label: 'Analytics', action: () => setShowAnalytics(true) },
                  { icon: <BookOpen className="h-5 w-5" />, label: 'Courses', action: () => navigate('/courses') },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 text-gray-600 hover:text-blue-700 transition-all text-xs font-semibold"
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h3 className="text-base font-bold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {[
                  { icon: <Users className="h-4 w-4 text-blue-600" />, bg: 'bg-blue-100', text: 'New student enrolled in JavaScript course', time: '2 hours ago' },
                  { icon: <Award className="h-4 w-4 text-emerald-600" />, bg: 'bg-emerald-100', text: 'Student completed React quiz', time: '5 hours ago' },
                  { icon: <BookOpen className="h-4 w-4 text-violet-600" />, bg: 'bg-violet-100', text: 'Course updated: UI/UX Design', time: '1 day ago' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-8 h-8 ${item.bg} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-700 leading-snug">{item.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
