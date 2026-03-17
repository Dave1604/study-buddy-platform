import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, BookOpen, Users, Award, CheckCircle, PlayCircle, Lock, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { courseService, quizService, progressService } from '../services/api';
import { useAuth } from '../context/AuthContext';

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

  const formatMinutes = (minutes) => {
    const hrs = Math.floor((minutes || 0) / 60);
    const mins = Math.round((minutes || 0) % 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const loadYouTubeAPI = () => {
    if (ytApiLoadedRef.current || window.YT?.Player) return Promise.resolve();
    return new Promise((resolve) => {
      const existing = document.getElementById('youtube-iframe-api');
      if (existing) {
        if (window.YT?.Player) { ytApiLoadedRef.current = true; resolve(); }
        else { window.onYouTubeIframeAPIReady = () => { ytApiLoadedRef.current = true; resolve(); }; }
        return;
      }
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      window.onYouTubeIframeAPIReady = () => { ytApiLoadedRef.current = true; resolve(); };
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
      setQuizzes(quizzesRes.data.data.quizzes || []);
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

  useEffect(() => { fetchCourseData(); }, [fetchCourseData]);

  const handleLessonComplete = useCallback(async (lessonId, timeSpent = 0) => {
    if (!user) return;
    try {
      await progressService.updateLessonProgress({
        course_id: id, lesson_id: lessonId, completed: true, time_spent_seconds: timeSpent
      });
      const progressRes = await progressService.getCourseProgress(id);
      setProgress(progressRes.data.data.progress);
    } catch (error) {
      console.error('Error updating lesson progress:', error);
    }
  }, [id, user]);

  // YouTube player init — auto-complete lesson when video ends
  useEffect(() => {
    const initPlayers = async () => {
      if (!course || activeTab !== 'lessons' || !course.isEnrolled) return;
      const lessonsWithVideo = course.lessons.filter(l => l.videoUrl);
      if (!lessonsWithVideo.length) return;
      await loadYouTubeAPI();
      lessonsWithVideo.forEach((lesson) => {
        const videoId = (lesson.videoUrl || '').match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)?.[2];
        if (!videoId) return;
        const elementId = `player-${lesson._id}`;
        if (playersRef.current[elementId]) return;
        const player = new window.YT.Player(elementId, {
          videoId,
          events: {
            onReady: async (event) => {
              try {
                const seconds = Math.round(event.target.getDuration() || 0);
                if (seconds > 0) {
                  const newMinutes = Math.max(0, Math.round(seconds / 60));
                  if ((lesson.duration || 0) !== newMinutes) {
                    await courseService.updateLessonDuration(course.id, lesson._id, { durationSeconds: seconds });
                    setCourse(prev => ({ ...prev, lessons: prev.lessons.map(l => l._id === lesson._id ? { ...l, duration: newMinutes } : l) }));
                  }
                }
              } catch (e) { /* ignore */ }
            },
            onStateChange: (event) => {
              if (event.data === 0) handleLessonComplete(lesson._id, Math.round(event.target.getDuration() || 0));
            },
            onError: () => setUnavailableMap(prev => ({ ...prev, [lesson._id]: true }))
          }
        });
        playersRef.current[elementId] = player;
      });
    };
    initPlayers();
  }, [course, activeTab, progress]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      await courseService.enrollCourse(id);
      await fetchCourseData();
    } catch (error) {
      const msg = error.response?.data?.message || 'Please try again.';
      alert(`Error enrolling: ${msg}`);
    } finally {
      setEnrolling(false);
    }
  };

  const handleLessonClick = async (lessonId) => {
    if (!user || !course?.isEnrolled) return;
    try {
      await progressService.updateLessonProgress({ course_id: id, lesson_id: lessonId, time_spent_minutes: 0 });
    } catch (e) { /* ignore */ }
  };

  const isEnrolled = !!(progress !== null || course?.isEnrolled);
  const completionPct = progress?.completion_percentage || 0;
  const completedLessons = progress?.completed_lessons || [];

  if (loading) return <LoadingSpinner message="Loading course..." />;
  if (!course) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="card text-center max-w-sm">
        <p className="text-gray-500 mb-4">Course not found.</p>
        <Link to="/courses" className="btn-primary">Back to Courses</Link>
      </div>
    </div>
  );

  const totalDuration = (course.lessons || []).reduce((sum, l) => sum + (l.duration || 0), 0);
  const levelColor = course.level === 'beginner' ? 'bg-emerald-100 text-emerald-700' : course.level === 'intermediate' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'lessons', label: `Lessons (${(course.lessons || []).length})` },
    { key: 'quizzes', label: `Quizzes (${quizzes.length})` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dark header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 text-slate-300">{course.category}</span>
            {course.level && <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${levelColor}`}>{course.level}</span>}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">{course.title}</h1>
          <p className="text-slate-300 text-base max-w-2xl leading-relaxed mb-6">{course.description}</p>

          {/* Meta row */}
          <div className="flex flex-wrap gap-5 text-sm text-slate-300 mb-8">
            <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" />{(course.lessons || []).length} lessons</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{formatMinutes(totalDuration)} total</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{course.totalEnrollments || 0} students</span>
            <span className="flex items-center gap-1.5"><Award className="h-4 w-4" />{quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'}</span>
          </div>

          {/* Instructor */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(course.instructor?.name || 'I').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Instructor</p>
              <p className="text-sm font-semibold">{course.instructor?.name || 'Instructor'}</p>
            </div>
          </div>

          {/* Enroll / Progress */}
          {!isEnrolled && (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="btn-primary text-base px-8 py-3 btn-shimmer hover-lift disabled:opacity-60"
            >
              {enrolling ? 'Enrolling...' : 'Enrol for Free'}
            </button>
          )}
          {isEnrolled && (
            <div className="flex items-center gap-4 bg-white/10 rounded-2xl px-5 py-4 max-w-sm">
              <CheckCircle className="h-6 w-6 text-emerald-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white mb-1.5">Enrolled — {completionPct}% complete</p>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs + content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab bar */}
        <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1 mb-6 w-fit">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid gap-6">
            {course.learningObjectives?.length > 0 && (
              <div className="card">
                <h3 className="text-base font-bold text-gray-900 mb-4">What you'll learn</h3>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {course.learningObjectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {course.prerequisites?.length > 0 && (
              <div className="card">
                <h3 className="text-base font-bold text-gray-900 mb-4">Prerequisites</h3>
                <ul className="space-y-2">
                  {course.prerequisites.map((pre, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <ChevronRight className="h-4 w-4 text-cyan-500" />{pre}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Course summary card if no objectives */}
            {!course.learningObjectives?.length && !course.prerequisites?.length && (
              <div className="card">
                <h3 className="text-base font-bold text-gray-900 mb-3">About this course</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{course.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  {[
                    { label: 'Lessons', value: (course.lessons || []).length },
                    { label: 'Duration', value: formatMinutes(totalDuration) },
                    { label: 'Level', value: course.level || 'All levels' },
                    { label: 'Quizzes', value: quizzes.length },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-lg font-extrabold text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lessons */}
        {activeTab === 'lessons' && (
          <div className="space-y-3">
            {(course.lessons || []).map((lesson, index) => {
              const isCompleted = completedLessons.includes(lesson._id?.toString());
              const videoId = lesson.videoUrl
                ? (lesson.videoUrl.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/) || [])[2]
                : null;

              return (
                <div
                  key={lesson._id}
                  className="card cursor-pointer hover:border-cyan-200 transition-all"
                  onClick={() => handleLessonClick(lesson._id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Number / status */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-cyan-50 text-cyan-600'}`}>
                      {isCompleted ? <CheckCircle className="h-5 w-5" /> : index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">{lesson.title}</h4>
                        <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                          <Clock className="h-3 w-3" />{lesson.duration || 0}m
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                        {(lesson.content || lesson.description || '').substring(0, 140)}
                      </p>

                      {/* Video embed */}
                      {isEnrolled && videoId && (
                        <div className="mt-2">
                          {unavailableMap[lesson._id] && (
                            <p className="text-xs text-red-500 mb-2">Video unavailable — we'll replace this soon.</p>
                          )}
                          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '12px', overflow: 'hidden' }}>
                            <iframe
                              id={`player-${lesson._id}`}
                              src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
                              title={lesson.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px' }}
                            />
                          </div>
                        </div>
                      )}

                      {!isEnrolled && lesson.videoUrl && (
                        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 w-fit">
                          <Lock className="h-3 w-3" /> Video available after enrolment
                        </div>
                      )}

                      {/* Mark complete button */}
                      {isEnrolled && !isCompleted && (
                        <button
                          className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                          onClick={(e) => { e.stopPropagation(); handleLessonComplete(lesson._id, (lesson.duration || 0) * 60); }}
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Mark as complete
                        </button>
                      )}
                    </div>

                    {/* Right icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {isCompleted
                        ? <CheckCircle className="h-5 w-5 text-emerald-500" />
                        : isEnrolled
                        ? <PlayCircle className="h-5 w-5 text-cyan-400" />
                        : <Lock className="h-4 w-4 text-gray-300" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quizzes */}
        {activeTab === 'quizzes' && (
          <div className="space-y-4">
            {quizzes.length === 0 ? (
              <div className="card text-center py-12">
                <Award className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No quizzes for this course yet.</p>
              </div>
            ) : quizzes.map((quiz) => {
              const diffColor = quiz.difficulty === 'easy'
                ? 'bg-emerald-100 text-emerald-700'
                : quiz.difficulty === 'hard'
                ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-700';

              return (
                <div key={quiz._id || quiz.id} className="card">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h4 className="text-base font-bold text-gray-900">{quiz.title}</h4>
                    {quiz.difficulty && (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${diffColor}`}>
                        {quiz.difficulty}
                      </span>
                    )}
                  </div>
                  {quiz.description && <p className="text-sm text-gray-500 mb-4">{quiz.description}</p>}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{quiz.time_limit_minutes || quiz.duration || 10} min</span>
                    <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" />{quiz.passing_score || quiz.passingScore || 70}% to pass</span>
                  </div>
                  {isEnrolled ? (
                    <button
                      onClick={() => navigate(`/quiz/${quiz._id || quiz.id}`)}
                      className="btn-primary text-sm"
                    >
                      Start Quiz
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Lock className="h-3.5 w-3.5" /> Enrol to take this quiz
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;
