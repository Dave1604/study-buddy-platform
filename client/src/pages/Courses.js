import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CourseCard from '../components/CourseCard';
import { courseService } from '../services/api';

/* ── Skeleton card ── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
    <div className="h-40 bg-gray-100 animate-pulse" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-100 rounded-full animate-pulse w-3/4" />
      <div className="h-3 bg-gray-50 rounded-full animate-pulse w-full" />
      <div className="h-3 bg-gray-50 rounded-full animate-pulse w-2/3" />
      <div className="pt-3 border-t border-gray-50 flex items-center gap-2">
        <div className="w-6 h-6 bg-gray-100 rounded-full animate-pulse" />
        <div className="h-3 bg-gray-100 rounded-full animate-pulse w-24" />
      </div>
      <div className="flex gap-3">
        <div className="h-3 bg-gray-50 rounded-full animate-pulse w-16" />
        <div className="h-3 bg-gray-50 rounded-full animate-pulse w-12" />
      </div>
    </div>
  </div>
);

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

      if (user && user.role === 'student') {
        let enrolledIds = new Set();
        try {
          const enrolledRes = await courseService.getEnrolledCourses();
          const enrolled = enrolledRes.data.data.courses || [];
          enrolled.forEach(c => enrolledIds.add(c.id));
          setEnrolledCourses(enrolled);
        } catch (_) {
          setEnrolledCourses([]);
        }
        setCourses(allCourses.filter(c => !enrolledIds.has(c.id)));
      } else {
        setCourses(allCourses);
        setEnrolledCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleSearch = (e) => setFilters(f => ({ ...f, search: e.target.value }));
  const handleFilterChange = (key, value) => setFilters(f => ({ ...f, [key]: value }));

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-1">
            {user?.role === 'instructor' ? 'My Courses' : 'Explore Courses'}
          </h1>
          <p className="text-gray-500 text-sm">
            {user?.role === 'instructor' ? 'Manage and track your published courses' : 'Discover your next learning adventure'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search courses..." value={filters.search} onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150 min-w-[130px]">
              <option value="">All Categories</option>
              <option value="programming">Programming</option>
              <option value="design">Design</option>
              <option value="business">Business</option>
              <option value="science">Science</option>
              <option value="mathematics">Mathematics</option>
              <option value="language">Language</option>
              <option value="other">Other</option>
            </select>
            <select value={filters.level} onChange={(e) => handleFilterChange('level', e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150 min-w-[120px]">
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
            {/* Enrolled Courses */}
            {user?.role !== 'instructor' && enrolledCourses.length > 0 && (
              <div className="mb-10">
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-gray-900">My Enrolled Courses</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{enrolledCourses.length} course{enrolledCourses.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {enrolledCourses.map((course, i) => (
                    <div key={course._id || course.id} className="opacity-0 animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
                      <CourseCard course={course} isEnrolled={true} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available / Instructor Courses */}
            {courses.length > 0 ? (
              <div>
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-gray-900">
                    {user?.role === 'instructor' ? 'My Courses' : 'Available Courses'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">{courses.length} course{courses.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {courses.map((course, i) => (
                    <div key={course._id || course.id} className="opacity-0 animate-fade-up" style={{ animationDelay: `${(enrolledCourses.length + i) * 70}ms` }}>
                      <CourseCard course={course} isEnrolled={false} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (!enrolledCourses.length && (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-0 animate-fade-up">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">No courses found</h3>
                <p className="text-sm text-gray-500 max-w-sm">Try adjusting your filters.</p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default Courses;
