import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, BookOpen, Users, Award, CheckCircle, PlayCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { courseService, quizService, progressService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const ytApiLoadedRef = useRef(false);
  const playersRef = useRef({});
  const [unavailableMap, setUnavailableMap] = useState({});

  const formatTotalMinutes = (minutes) => {
    const hrs = Math.floor((minutes || 0) / 60);
    const mins = Math.max(0, Math.round((minutes || 0) % 60));
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const loadYouTubeAPI = () => {
    if (ytApiLoadedRef.current || window.YT?.Player) return Promise.resolve();
    return new Promise((resolve) => {
      const existing = document.getElementById('youtube-iframe-api');
      if (existing) {
        if (window.YT?.Player) {
          ytApiLoadedRef.current = true;
          resolve();
        } else {
          window.onYouTubeIframeAPIReady = () => {
            ytApiLoadedRef.current = true;
            resolve();
          };
        }
        return;
      }
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      window.onYouTubeIframeAPIReady = () => {
        ytApiLoadedRef.current = true;
        resolve();
      };
      document.body.appendChild(tag);
    });
  };

  const fetchCourseData = useCallback(async () => {
    try {
      const [courseRes, quizzesRes] = await Promise.all([
        courseService.getCourse(id),
        quizService.getCourseQuizzes(id)
      ]);
      
      const courseData = courseRes.data.data.course;
      setCourse(courseData);
      setQuizzes(quizzesRes.data.data.quizzes);

      // Use isEnrolled flag and embedded progress from course response
      if (courseData.isEnrolled && courseData.progress) {
        setProgress(courseData.progress);
      } else if (courseData.isEnrolled) {
        const progressRes = await progressService.getCourseProgress(id);
        setProgress(progressRes.data.data.progress);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  // Initialize YouTube players on lessons tab to capture durations + auto-complete
  useEffect(() => {
    const initPlayers = async () => {
      if (!course || activeTab !== 'lessons' || !course.isEnrolled) return;
      const lessonsWithVideo = course.lessons.filter(l => l.videoUrl);
      if (lessonsWithVideo.length === 0) return;

      await loadYouTubeAPI();

      lessonsWithVideo.forEach((lesson) => {
        const videoId = (lesson.videoUrl || '').match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)?.[2];
        if (!videoId) return;
        const elementId = `player-${lesson._id}`;
        if (playersRef.current[elementId]) return; // already initialized

        const player = new window.YT.Player(elementId, {
          videoId,
          events: {
            onReady: async (event) => {
              try {
                const seconds = Math.round(event.target.getDuration() || 0);
                if (seconds > 0) {
                  const currentMinutes = lesson.duration || 0;
                  const newMinutes = Math.max(0, Math.round(seconds / 60));
                  if (currentMinutes !== newMinutes) {
                    await courseService.updateLessonDuration(course.id, lesson._id, { durationSeconds: seconds });
                    setCourse(prev => ({
                      ...prev,
                      lessons: prev.lessons.map(l => l._id === lesson._id ? { ...l, duration: newMinutes } : l)
                    }));
                  }
                }
              } catch (e) { /* ignore */ }
            },
            onStateChange: (event) => {
              // YT.PlayerState.ENDED = 0 — auto-mark lesson complete when video finishes
              if (event.data === 0) {
                const duration = Math.round(event.target.getDuration() || 0);
                handleLessonComplete(lesson._id, duration);
              }
            },
            onError: () => {
              setUnavailableMap(prev => ({ ...prev, [lesson._id]: true }));
            }
          }
        });
        playersRef.current[elementId] = player;
      });
    };

    initPlayers();

    return () => {
      // optional cleanup not strictly necessary for page lifetime
    };
  }, [course, activeTab, progress]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      const response = await courseService.enrollCourse(id);
      console.log('Enrollment response:', response);
      
      // Refresh course data to get updated enrollment status
      await fetchCourseData();
      
      // Show success message
      alert('Successfully enrolled in course! You can now access all lessons and quizzes.');
    } catch (error) {
      console.error('Error enrolling:', error);
      
      // More detailed error handling
      if (error.response) {
        console.error('Backend error response:', error.response.data);
        const errorMessage = error.response.data?.message || 'Unknown server error';
        alert(`Error enrolling in course: ${errorMessage}`);
      } else if (error.request) {
        console.error('Network error:', error.request);
        alert('Error enrolling in course: Unable to connect to server. Please check your internet connection.');
      } else {
        console.error('Error setting up request:', error.message);
        alert('Error enrolling in course: Please try again.');
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleLessonClick = async (lessonId) => {
    if (!user || !progress) return;
    
    try {
      // Track lesson access (time only, no completion)
      await progressService.updateLessonProgress({
        course_id: id,
        lesson_id: lessonId,
        time_spent_minutes: 0
      });

      // Refresh progress data
      const progressRes = await progressService.getCourseProgress(id);
      setProgress(progressRes.data.data.progress);
    } catch (error) {
      console.error('Error updating lesson progress:', error);
    }
  };

  const handleLessonComplete = async (lessonId, timeSpent = 0) => {
    if (!user || !progress) return;
    
    try {
      // Track lesson completion
      await progressService.updateLessonProgress({
        course_id: id,
        lesson_id: lessonId,
        completed: true,
        time_spent_seconds: timeSpent
      });

      // Refresh progress data
      const progressRes = await progressService.getCourseProgress(id);
      setProgress(progressRes.data.data.progress);
    } catch (error) {
      console.error('Error updating lesson progress:', error);
    }
  };

  const isEnrolled = !!(progress !== null || course?.isEnrolled);

  if (loading) {
    return <LoadingSpinner message="Loading course..." />;
  }

  if (!course) {
    return <div className="container" style={{padding: '60px 0'}}>Course not found</div>;
  }

  return (
    <div className="course-detail-page">
      {/* Course Header */}
      <div className="course-header">
        <div className="container">
          <div className="course-header-content">
            <div className="course-header-info">
              <div className="badge badge-primary">{course.category}</div>
              <h1>{course.title}</h1>
              <p>{course.description}</p>
              
              <div className="course-meta-list">
                <div className="meta-item">
                  <BookOpen size={20} />
                  <span>{course.lessons.length} lessons</span>
                </div>
                <div className="meta-item">
                  <Users size={20} />
                  <span>{course.totalEnrollments} students</span>
                </div>
                <div className="meta-item">
                  <Clock size={20} />
                  <span>{formatTotalMinutes(course.lessons.reduce((sum, l) => sum + (l.duration || 0), 0))} total</span>
                </div>
                <div className="meta-item">
                  <Award size={20} />
                  <span className={`badge badge-${course.level === 'beginner' ? 'success' : course.level === 'intermediate' ? 'warning' : 'danger'}`}>
                    {course.level}
                  </span>
                </div>
              </div>

              <div className="instructor-info">
                <div className="instructor-avatar">
                  {course.instructor?.avatar_url ? (
                    <img src={course.instructor.avatar_url} alt={course.instructor.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {(course.instructor?.name || 'IN').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="instructor-label">Instructor</div>
                  <div className="instructor-name">
                    {course.instructor?.name || 'Instructor'}
                  </div>
                </div>
              </div>

              {!isEnrolled && (
                <button
                  onClick={handleEnroll}
                  className="btn btn-primary btn-large btn-shimmer hover-lift"
                  style={{minHeight: '48px'}}
                  disabled={enrolling}
                >
                  {enrolling ? 'Enrolling...' : 'Enroll in Course — Free'}
                </button>
              )}

              {isEnrolled && (
                <div className="enrollment-status">
                  <CheckCircle size={20} color="#10b981" />
                  <span>You are enrolled in this course</span>
                  <div className="course-progress-bar">
                    <div className="progress-fill" style={{width: `${progress.completion_percentage || 0}%`}}></div>
                  </div>
                  <span className="progress-text">{progress.completion_percentage || 0}% Complete</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="container">
        <div className="course-content-section">
          <div className="content-tabs">
            <button 
              className={activeTab === 'overview' ? 'active' : ''}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={activeTab === 'lessons' ? 'active' : ''}
              onClick={() => setActiveTab('lessons')}
            >
              Lessons
            </button>
            <button 
              className={activeTab === 'quizzes' ? 'active' : ''}
              onClick={() => setActiveTab('quizzes')}
            >
              Quizzes ({quizzes.length})
            </button>
          </div>

          <div className="content-body">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                {course.learningObjectives && course.learningObjectives.length > 0 && (
                  <div className="content-section">
                    <h3>What you'll learn</h3>
                    <ul className="objectives-list">
                      {course.learningObjectives.map((obj, index) => (
                        <li key={index}>
                          <CheckCircle size={20} color="#10b981" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {course.prerequisites && course.prerequisites.length > 0 && (
                  <div className="content-section">
                    <h3>Prerequisites</h3>
                    <ul className="prerequisites-list">
                      {course.prerequisites.map((pre, index) => (
                        <li key={index}>{pre}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'lessons' && (
              <div className="lessons-tab" style={{maxHeight: '70vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch'}}>
                {course.lessons.map((lesson, index) => {
                  const isCompleted = !!(progress?.completed_lessons || []).includes(lesson._id?.toString());

                  // Extract YouTube video ID from URL
                  const getYouTubeId = (url) => {
                    if (!url) return null;
                    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                    const match = url.match(regExp);
                    return (match && match[2].length === 11) ? match[2] : null;
                  };

                  const videoId = lesson.videoUrl ? getYouTubeId(lesson.videoUrl) : null;

                  return (
                    <div key={lesson._id} className="lesson-item" onClick={() => handleLessonClick(lesson._id)}>
                      <div className="lesson-number">{index + 1}</div>
                      <div className="lesson-content">
                        <h4>{lesson.title}</h4>
                        <p>{(lesson.content || lesson.description || '').substring(0, 150)}{(lesson.content || lesson.description || '').length > 0 ? '...' : ''}</p>
                        
                        {isEnrolled && videoId && (
                          <div className="lesson-video" style={{marginTop: '16px'}}>
                            {unavailableMap[lesson._id] && (
                              <div className="alert-error" style={{marginBottom: '8px'}}>
                                Video unavailable. We'll replace this link soon.
                              </div>
                            )}
                            {/* 16:9 aspect ratio container */}
                            <div style={{position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px'}}>
                              <iframe
                                id={`player-${lesson._id}`}
                                src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
                                title={lesson.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px'}}
                              ></iframe>
                            </div>
                          </div>
                        )}
                        
                        {!isEnrolled && lesson.videoUrl && (
                          <div style={{marginTop: '12px', padding: '12px', background: '#f3f4f6', borderRadius: '8px', fontSize: '14px', color: '#6b7280'}}>
                            🎥 Video lesson available after enrollment
                          </div>
                        )}
                        
                        <div className="lesson-meta" style={{marginTop: '12px'}}>
                          <span><Clock size={14} /> {lesson.duration} min</span>
                          <span className="badge badge-primary">{lesson.content_type || lesson.contentType || 'video'}</span>
                        </div>
                        
                        {isEnrolled && !isCompleted && (
                          <div style={{marginTop: '12px'}}>
                            <button 
                              className="btn btn-sm btn-success"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLessonComplete(lesson._id, lesson.duration * 60); // Convert minutes to seconds
                              }}
                            >
                              <CheckCircle size={16} />
                              Mark as Complete
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="lesson-status">
                        {isCompleted ? (
                          <CheckCircle size={24} color="#10b981" />
                        ) : isEnrolled ? (
                          <PlayCircle size={24} color="#4f46e5" />
                        ) : (
                          <span className="badge badge-secondary">Enroll to access</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'quizzes' && (
              <div className="quizzes-tab">
                {quizzes.length > 0 ? (
                  quizzes.map((quiz) => (
                    <div key={quiz._id} className="quiz-item card">
                      <div className="quiz-header">
                        <h4>{quiz.title}</h4>
                        <span className={`badge badge-${quiz.difficulty === 'easy' ? 'success' : quiz.difficulty === 'medium' ? 'warning' : 'danger'}`}>
                          {quiz.difficulty}
                        </span>
                      </div>
                      <p>{quiz.description}</p>
                      <div className="quiz-meta">
                        <span><BookOpen size={16} /> {quiz.questions.length} questions</span>
                        <span><Clock size={16} /> {quiz.duration} min</span>
                        <span><Award size={16} /> {quiz.passingScore}% to pass</span>
                      </div>
                      {isEnrolled && (
                        <button 
                          onClick={() => navigate(`/quiz/${quiz._id}`)}
                          className="btn btn-primary"
                        >
                          Start Quiz
                        </button>
                      )}
                      {!isEnrolled && (
                        <span className="badge badge-secondary">Enroll to take quiz</span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-data">No quizzes available for this course yet</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
