import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CourseCard from '../components/CourseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { courseService } from '../services/api';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: '', level: '' });
  const { user } = useAuth();

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await courseService.getAllCourses(filters);
      const allCourses = response.data.data.courses;

      if (user) {
        if (user.role === 'instructor') {
          const myCourses = allCourses.filter(c =>
            ((c.instructor && (c.instructor._id || c.instructor)) + '') === ((user._id || user.id) + '')
          );
          setCourses(myCourses);
          setEnrolledCourses([]);
          setLoading(false);
          return;
        }

        const userId = ((user._id || user.id) || '').toString();
        const enrolledIds = Array.isArray(user.enrolledCourses)
          ? user.enrolledCourses
              .map(c => (c && (c._id || c.id)) ? (c._id || c.id).toString() : (c ? String(c) : null))
              .filter(Boolean)
          : [];
        const enrolledIdSet = new Set(enrolledIds);

        const isUserInCourse = (course) => {
          const courseIdStr = ((course._id || course.id) || '').toString();
          const byIds = enrolledIdSet.has(courseIdStr);
          const byStudents = Array.isArray(course.enrolledStudents) && course.enrolledStudents.some(s => {
            const sid = (s && (s._id || s.id)) ? (s._id || s.id).toString() : (s ? String(s) : '');
            return sid === userId;
          });
          return byStudents || byIds;
        };

        setEnrolledCourses(allCourses.filter(isUserInCourse));
        setCourses(allCourses.filter(c => !isUserInCourse(c)));
      } else {
        setCourses(allCourses);
        setEnrolledCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, user]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleSearch = (e) => setFilters(f => ({ ...f, search: e.target.value }));
  const handleFilterChange = (key, value) => setFilters(f => ({ ...f, [key]: value }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            {user?.role === 'instructor' ? 'My Courses' : 'Explore Courses'}
          </h1>
          <p className="text-slate-400 text-sm">
            {user?.role === 'instructor'
              ? 'Manage and track your published courses'
              : 'Discover your next learning adventure'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={filters.search}
              onChange={handleSearch}
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="input w-auto min-w-[140px]"
            >
              <option value="">All Categories</option>
              <option value="programming">Programming</option>
              <option value="design">Design</option>
              <option value="business">Business</option>
              <option value="science">Science</option>
              <option value="mathematics">Mathematics</option>
              <option value="language">Language</option>
              <option value="other">Other</option>
            </select>
            <select
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="input w-auto min-w-[130px]"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading courses..." />
        ) : (
          <>
            {/* Enrolled Courses (students only) */}
            {user?.role !== 'instructor' && enrolledCourses.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">My Enrolled Courses</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{enrolledCourses.length} enrolled {enrolledCourses.length === 1 ? 'course' : 'courses'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {enrolledCourses.map((course) => (
                    <CourseCard key={course._id} course={course} isEnrolled={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Available / Instructor Courses */}
            {courses.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {user?.role === 'instructor' ? 'My Courses' : 'Available Courses'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">{courses.length} {courses.length === 1 ? 'course' : 'courses'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {courses.map((course) => (
                    <CourseCard key={course._id} course={course} isEnrolled={false} />
                  ))}
                </div>
              </div>
            ) : (!enrolledCourses.length && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No courses found</h3>
                <p className="text-sm text-gray-500 max-w-sm">No courses match your current search criteria. Try adjusting your filters.</p>
                {user?.role === 'instructor' && (
                  <button
                    onClick={() => window.location.href = '/instructor/create-course'}
                    className="btn-primary mt-6"
                  >
                    Create your first course
                  </button>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default Courses;
