import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, BookOpen, Users, Award, CheckCircle, PlayCircle, Lock, ChevronRight, ArrowLeft } from 'lucide-react';
import { courseService, quizService, progressService } from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ── helpers ── */
const fmt = (minutes) => {
  const h = Math.floor((minutes || 0) / 60);
  const m = Math.round((minutes || 0) % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/* ── skeleton ── */
const Skeleton = () => (
  <div className="min-h-screen bg-gray-50 pt-16">
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="skeleton h-5 w-24 rounded mb-4" />
        <div className="skeleton h-8 w-72 rounded-lg mb-3" />
        <div className="skeleton h-4 w-96 rounded mb-6" />
        <div className="flex gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-4 w-20 rounded" />)}
        </div>
      </div>
    </div>
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <div className="flex gap-2 mb-6">{[1, 2, 3].map(i => <div key={i} className="skeleton h-9 w-28 rounded-lg" />)}</div>
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
          <div className="skeleton w-9 h-9 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-48 rounded" />
            <div className="skeleton h-3 w-72 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ── main component ── */
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
  }, [id]);

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

  if (loading) return <Skeleton />;
  if (!course) return (
    <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center max-w-sm shadow-sm">
        <p className="text-gray-500 mb-4">Course not found.</p>
        <Link to="/courses" className="btn-primary">Back to Courses</Link>
      </div>
    </div>
  );

  const totalDuration = (course.lessons || []).reduce((sum, l) => sum + (l.duration || 0), 0);

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'lessons', label: `Lessons (${(course.lessons || []).length})` },
    { key: 'quizzes', label: `Quizzes (${quizzes.length})` },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16 animate-fade-in">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Back link */}
          <button onClick={() => navigate(-1)} className="opacity-0 animate-fade-up flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-5">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          {/* Badges */}
          <div className="opacity-0 animate-fade-up flex flex-wrap items-center gap-2 mb-4" style={{ animationDelay: '50ms' }}>
            <span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 capitalize">{course.category}</span>
            {course.level && (
              <span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 capitalize">{course.level}</span>
            )}
          </div>

          {/* Title + description */}
          <h1 className="opacity-0 animate-fade-up text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mb-2 leading-tight" style={{ animationDelay: '100ms' }}>{course.title}</h1>
          <p className="opacity-0 animate-fade-up text-sm text-gray-500 max-w-2xl leading-relaxed mb-6" style={{ animationDelay: '150ms' }}>{course.description}</p>

          {/* Meta */}
          <div className="opacity-0 animate-fade-up flex flex-wrap gap-5 text-sm text-gray-500 mb-6" style={{ animationDelay: '200ms' }}>
            <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />{(course.lessons || []).length} lessons</span>
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{fmt(totalDuration)}</span>
            <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{course.totalEnrollments || 0} students</span>
            <span className="flex items-center gap-1.5"><Award className="h-3.5 w-3.5" />{quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'}</span>
          </div>

          {/* Instructor */}
          <div className="opacity-0 animate-fade-up flex items-center gap-3 mb-6" style={{ animationDelay: '250ms' }}>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {(course.instructor?.name || 'I').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wide leading-none mb-0.5">Instructor</p>
              <p className="text-sm font-semibold text-gray-900">{course.instructor?.name || 'Instructor'}</p>
            </div>
          </div>

          {/* CTA */}
          <div className="opacity-0 animate-fade-up" style={{ animationDelay: '300ms' }}>
            {!isEnrolled && (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-[0.97] transition-all duration-150 disabled:opacity-50"
              >
                {enrolling ? (
                  <><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Enrolling...</>
                ) : 'Enrol for Free'}
              </button>
            )}
            {isEnrolled && (
              <div className="flex items-center gap-3 bg-blue-50 rounded-xl px-4 py-3 max-w-xs">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 mb-1">Enrolled — {completionPct}% complete</p>
                  <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-out" style={{ width: `${completionPct}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab bar */}
        <div className="opacity-0 animate-fade-up flex gap-1 mb-6 border-b border-gray-200" style={{ animationDelay: '350ms' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-semibold transition-colors duration-150 border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {course.learningObjectives?.length > 0 && (
              <div className="opacity-0 animate-fade-up bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-3">What you'll learn</h3>
                <ul className="grid sm:grid-cols-2 gap-2.5">
                  {course.learningObjectives.map((obj, i) => (
                    <li key={i} className="opacity-0 animate-slide-right flex items-start gap-2" style={{ animationDelay: `${i * 50}ms` }}>
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {course.prerequisites?.length > 0 && (
              <div className="opacity-0 animate-fade-up bg-white rounded-xl border border-gray-100 p-5 shadow-sm" style={{ animationDelay: '80ms' }}>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Prerequisites</h3>
                <ul className="space-y-2">
                  {course.prerequisites.map((pre, i) => (
                    <li key={i} className="opacity-0 animate-slide-right flex items-center gap-2 text-sm text-gray-600" style={{ animationDelay: `${i * 50}ms` }}>
                      <ChevronRight className="h-3.5 w-3.5 text-blue-500" />{pre}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!course.learningObjectives?.length && !course.prerequisites?.length && (
              <div className="opacity-0 animate-fade-up bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-2">About this course</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">{course.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Lessons', value: (course.lessons || []).length },
                    { label: 'Duration', value: fmt(totalDuration) },
                    { label: 'Level', value: course.level || 'All levels' },
                    { label: 'Quizzes', value: quizzes.length },
                  ].map((s, i) => (
                    <div key={s.label} className="opacity-0 animate-scale-up bg-gray-50 rounded-xl p-3 text-center" style={{ animationDelay: `${i * 70}ms` }}>
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
                  className="opacity-0 animate-fade-up bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-md transition-all duration-200 shadow-sm"
                  style={{ animationDelay: `${index * 60}ms` }}
                  onClick={() => handleLessonClick(lesson._id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                      {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4 className="text-sm font-semibold text-gray-900">{lesson.title}</h4>
                        <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                          <Clock className="h-3 w-3" />{lesson.duration || 0}m
                        </span>
                      </div>
                      {(lesson.content || lesson.description) && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                          {(lesson.content || lesson.description || '').substring(0, 140)}
                        </p>
                      )}

                      {isEnrolled && videoId && (
                        <div className="mt-2">
                          {unavailableMap[lesson._id] && (
                            <p className="text-xs text-red-500 mb-2">Video unavailable — we'll replace this soon.</p>
                          )}
                          <div className="relative pb-[56.25%] h-0 rounded-lg overflow-hidden bg-gray-100">
                            <iframe
                              id={`player-${lesson._id}`}
                              src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
                              title={lesson.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="absolute inset-0 w-full h-full"
                            />
                          </div>
                        </div>
                      )}

                      {!isEnrolled && lesson.videoUrl && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 w-fit mt-1">
                          <Lock className="h-3 w-3" /> Enrol to watch
                        </div>
                      )}

                      {isEnrolled && !isCompleted && (
                        <button
                          className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                          onClick={(e) => { e.stopPropagation(); handleLessonComplete(lesson._id, (lesson.duration || 0) * 60); }}
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Mark as complete
                        </button>
                      )}
                    </div>

                    <div className="flex-shrink-0 mt-0.5">
                      {isCompleted
                        ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                        : isEnrolled
                        ? <PlayCircle className="h-4 w-4 text-blue-400" />
                        : <Lock className="h-3.5 w-3.5 text-gray-300" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quizzes */}
        {activeTab === 'quizzes' && (
          <div className="space-y-3">
            {quizzes.length === 0 ? (
              <div className="opacity-0 animate-fade-up bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
                <Award className="h-8 w-8 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No quizzes for this course yet.</p>
              </div>
            ) : quizzes.map((quiz, qi) => (
              <div key={quiz._id || quiz.id} className="opacity-0 animate-fade-up bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:border-gray-200 hover:shadow-md transition-all duration-200" style={{ animationDelay: `${qi * 60}ms` }}>
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h4 className="text-sm font-bold text-gray-900">{quiz.title}</h4>
                  {quiz.difficulty && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg flex-shrink-0 capitalize ${
                      quiz.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600'
                        : quiz.difficulty === 'hard' ? 'bg-red-50 text-red-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}>
                      {quiz.difficulty}
                    </span>
                  )}
                </div>
                {quiz.description && <p className="text-sm text-gray-500 mb-3">{quiz.description}</p>}
                <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-4">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{quiz.time_limit_minutes || quiz.duration || 10} min</span>
                  <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" />{quiz.passing_score || quiz.passingScore || 70}% to pass</span>
                </div>
                {isEnrolled ? (
                  <button
                    onClick={() => navigate(`/quiz/${quiz._id || quiz.id}`)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-[0.97] transition-all duration-150"
                  >
                    Start Quiz
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Lock className="h-3.5 w-3.5" /> Enrol to take this quiz
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;
