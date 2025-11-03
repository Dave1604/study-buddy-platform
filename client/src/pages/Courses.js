import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CourseCard from '../components/CourseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { courseService } from '../services/api';
import './Courses.css';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    level: ''
  });
  const { user } = useAuth();

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await courseService.getAllCourses(filters);
      const allCourses = response.data.data.courses;
      
      // Separate enrolled and non-enrolled courses
      // Use both user.enrolledCourses (ids) and course.enrolledStudents (ids) as sources
      if (user) {
        // Instructors: only show their own courses
        if (user.role === 'instructor') {
          const myCourses = allCourses.filter(c => ((c.instructor && (c.instructor._id || c.instructor)) + '') === ((user._id || user.id) + ''));
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

        const enrolled = allCourses.filter(isUserInCourse);
        const notEnrolled = allCourses.filter(c => !isUserInCourse(c));

        setEnrolledCourses(enrolled);
        setCourses(notEnrolled);
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

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <div className="courses-page">
      <div className="container">
        <div className="page-header">
          <h1>Explore Courses</h1>
          <p>Discover your next learning adventure</p>
        </div>

        <div className="courses-filters">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search courses..."
              value={filters.search}
              onChange={handleSearch}
            />
          </div>

          <div className="filter-group">
            <Filter size={20} />
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
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
            {/* Enrolled Courses Section (students only) */}
            {user?.role !== 'instructor' && enrolledCourses.length > 0 && (
              <div className="courses-section">
                <h2 className="section-title">My Enrolled Courses</h2>
                <div className="courses-count">
                  {enrolledCourses.length} enrolled {enrolledCourses.length === 1 ? 'course' : 'courses'}
                </div>
                <div className="courses-grid">
                  {enrolledCourses.map((course) => (
                    <CourseCard key={course._id} course={course} isEnrolled={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Available Courses Section (shows instructor's own list or available for students) */}
            {courses.length > 0 ? (
              <div className="courses-section">
                <h2 className="section-title">{user?.role === 'instructor' ? 'My Courses' : 'Available Courses'}</h2>
                <div className="courses-count">
                  {courses.length} {courses.length === 1 ? 'course' : 'courses'}
                </div>
                <div className="courses-grid">
                  {courses.map((course) => (
                    <CourseCard key={course._id} course={course} isEnrolled={false} />
                  ))}
                </div>
              </div>
            ) : (!enrolledCourses.length && (
              <div className="no-courses">
                <BookOpen size={64} />
                <h3>No courses found</h3>
                <p>No courses match your current search criteria. Try adjusting your filters.</p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default Courses;
