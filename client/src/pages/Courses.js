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
      if (user && user.enrolledCourses) {
        const enrolledIds = user.enrolledCourses.map(course => course._id || course);
        const enrolled = allCourses.filter(course => enrolledIds.includes(course._id));
        const notEnrolled = allCourses.filter(course => !enrolledIds.includes(course._id));
        
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
            {/* Enrolled Courses Section */}
            {enrolledCourses.length > 0 && (
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

            {/* Available Courses Section */}
            {courses.length > 0 ? (
              <div className="courses-section">
                <h2 className="section-title">Available Courses</h2>
                <div className="courses-count">
                  {courses.length} available {courses.length === 1 ? 'course' : 'courses'}
                </div>
                <div className="courses-grid">
                  {courses.map((course) => (
                    <CourseCard key={course._id} course={course} isEnrolled={false} />
                  ))}
                </div>
              </div>
            ) : enrolledCourses.length === 0 && (
              <div className="no-courses">
                <BookOpen size={64} />
                <h3>No courses found</h3>
                <p>No courses match your current search criteria. Try adjusting your filters.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Courses;
