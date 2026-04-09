import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, ArrowLeft, ArrowRight, Trophy } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { quizService } from '../services/api';

/* Animated SVG score ring */
const ScoreRing = ({ percentage }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (percentage / 100) * circumference;
  const colour = percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
        <circle cx="72" cy="72" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke={colour}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          className="score-ring-fill"
          style={{ '--target-offset': targetOffset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-gray-900">{percentage}%</span>
        <span className="text-xs text-gray-400 font-medium">score</span>
      </div>
    </div>
  );
};

const Quiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [, setSlideDir] = useState('right');

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchQuiz = useCallback(async () => {
    try {
      const response = await quizService.getQuiz(id);
      const quizData = response.data.data.quiz;
      // Normalise snake_case DB fields → camelCase used in this component
      quizData.questions = shuffleArray(quizData.questions || []).map(question => {
        const opts = (question.options || []).map(o => ({
          ...o,
          _id: o._id || o.id || String(o.text),
        }));
        return {
          ...question,
          _id: question._id || question.id,
          questionText: question.questionText || question.question_text,
          questionType: question.questionType || question.question_type,
          options: (question.questionType || question.question_type) === 'mcq' ? shuffleArray(opts) : opts,
        };
      });
      setQuiz(quizData);
      setTimeLeft((quizData.time_limit_minutes || quizData.duration || 10) * 60);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      alert('Error loading quiz');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchQuiz(); }, [fetchQuiz]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    const unanswered = quiz.questions.length - Object.keys(answers).length;
    if (unanswered > 0) {
      if (!window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
    }
    setIsSubmitting(true);
    try {
      // Backend expects answers as { [questionId]: answerValue }
      const timeSpent = ((quiz.time_limit_minutes || quiz.duration || 10) * 60) - timeLeft;
      const response = await quizService.submitQuiz(id, { answers, timeSpent });
      // Backend may return result in data.data.result, data.data, or data directly
      const resultData = response.data?.data?.result || response.data?.data || response.data || {};
      setResult(resultData);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert(error.response?.data?.message || 'Error submitting quiz');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, quiz, answers, id, timeLeft]);

  useEffect(() => {
    if (timeLeft > 0 && !result) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && quiz && !result) {
      handleSubmit();
    }
  }, [timeLeft, result, handleSubmit, quiz]);

  const handleAnswer = (questionId, answer) => setAnswers(prev => ({ ...prev, [questionId]: answer }));

  const goToQuestion = (idx, dir = 'right') => {
    setSlideDir(dir);
    setCurrentQuestion(idx);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <LoadingSpinner message="Loading quiz..." />;
  if (!quiz) return null;

  /* ---- Results View ---- */
  if (result) {
    const passed = result.passed;
    return (
      <div className="min-h-screen bg-gray-50 pt-16 py-12">
        <div className="max-w-2xl mx-auto px-4">
          {/* Result card */}
          <div className="card animate-scale-in text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {passed
                ? <Trophy className="h-8 w-8 text-emerald-600" />
                : <XCircle className="h-8 w-8 text-red-500" />}
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
              {passed ? 'Congratulations!' : 'Keep Practising'}
            </h1>
            <p className="text-sm text-gray-500 mb-8">
              {passed ? 'You passed the quiz!' : "You didn't pass this time — review the feedback below and try again."}
            </p>

            {/* Score ring */}
            <div className="flex flex-col items-center mb-8">
              <ScoreRing percentage={result.percentage} />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { value: `${result.percentage}%`, label: 'Your Score' },
                { value: `${result.score}/${result.totalPoints}`, label: 'Points Earned' },
                { value: `${quiz.passingScore}%`, label: 'Passing Score' },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xl font-extrabold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate(`/courses/${quiz.course_id || quiz.course?._id || quiz.course}`)}
                className="btn-primary"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Course
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn-outline">
                Dashboard
              </button>
            </div>
          </div>

          {/* Question review */}
          {quiz.showCorrectAnswers && (
            <div className="mt-6 space-y-4">
              <h3 className="text-base font-bold text-gray-900">Question Review</h3>
              {quiz.questions.map((question, index) => {
                const userAnswer = result.gradedAnswers?.find(a => a.questionId === question._id);
                const correctAnswer = result.correctAnswers?.find(a => a.questionId === question._id);
                const isCorrect = userAnswer?.isCorrect;

                return (
                  <div
                    key={question._id}
                    className={`card border-l-4 ${isCorrect ? 'border-l-emerald-500' : 'border-l-red-400'}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Question {index + 1}</span>
                      {isCorrect
                        ? <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        : <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />}
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mb-3">{question.questionText}</p>
                    {correctAnswer?.explanation && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                        <p className="text-xs font-bold text-blue-700 mb-1">Explanation</p>
                        <p className="text-sm text-blue-800 leading-relaxed">{correctAnswer.explanation}</p>
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
  }

  /* ---- Quiz Taking View ---- */
  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const isWarning = timeLeft < 60;

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-24 sm:pb-8">
      {/* Thin top progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-8">
        {/* Header card */}
        <div className="card mb-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900">{quiz.title}</h1>
              {quiz.description && <p className="text-sm text-gray-500 mt-0.5">{quiz.description}</p>}
            </div>
            {/* Timer pill — red + pulse when < 60s */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full flex-shrink-0 font-bold text-sm tabular-nums ${isWarning ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="progress-bar flex-1 progress-glow">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-semibold text-gray-500 tabular-nums whitespace-nowrap">
              {currentQuestion + 1} / {quiz.questions.length}
            </span>
          </div>
        </div>

        {/* Question card */}
        <div className="card mb-4 animate-fade-in" key={currentQuestion}>
          <div className="flex items-center gap-2 mb-4">
            <span className="badge-blue">Question {currentQuestion + 1}</span>
            <span className="text-xs text-gray-400 ml-auto">
              {answers[question._id] ? 'Answered' : 'Not answered'}
            </span>
          </div>
          <p className="text-base font-semibold text-gray-900 mb-6 leading-relaxed">{question.questionText}</p>

          <div className="space-y-3">
            {question.questionType === 'mcq' && question.options.map((option) => (
              <label
                key={option._id}
                className={`quiz-option ${answers[question._id] === option._id ? 'selected' : ''}`}
                style={{ minHeight: '48px' }}
                onClick={() => handleAnswer(question._id, option._id)}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${answers[question._id] === option._id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                  {answers[question._id] === option._id && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="text-sm text-gray-800">{option.text}</span>
                <input type="radio" name={`q-${question._id}`} className="sr-only" checked={answers[question._id] === option._id} onChange={() => {}} />
              </label>
            ))}

            {question.questionType === 'true_false' && ['True', 'False'].map(val => (
              <label
                key={val}
                className={`quiz-option ${answers[question._id] === val ? 'selected' : ''}`}
                style={{ minHeight: '48px' }}
                onClick={() => handleAnswer(question._id, val)}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${answers[question._id] === val ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                  {answers[question._id] === val && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="text-sm font-medium text-gray-800 capitalize">{val}</span>
                <input type="radio" name={`q-${question._id}`} className="sr-only" checked={answers[question._id] === val} onChange={() => {}} />
              </label>
            ))}

            {question.questionType === 'fill_blank' && (
              <div className="mt-2">
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Type your answer here…"
                  value={answers[question._id] || ''}
                  onChange={e => handleAnswer(question._id, e.target.value)}
                />
              </div>
            )}

            {question.questionType === 'multi' && question.options.map((option) => {
              const selected = answers[question._id] || [];
              const isChecked = selected.includes(option._id);
              return (
                <label
                  key={option._id}
                  className={`quiz-option ${isChecked ? 'selected' : ''}`}
                  style={{ minHeight: '48px' }}
                  onClick={() => {
                    const newAnswers = isChecked
                      ? selected.filter(id => id !== option._id)
                      : [...selected, option._id];
                    handleAnswer(question._id, newAnswers);
                  }}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isChecked ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                    {isChecked && <CheckCircle className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-sm text-gray-800">{option.text}</span>
                  <input type="checkbox" className="sr-only" checked={isChecked} onChange={() => {}} />
                </label>
              );
            })}
          </div>
        </div>

        {/* Dot navigation (desktop only) */}
        <div className="hidden sm:flex items-center justify-center gap-1.5 flex-wrap mb-4">
          {quiz.questions.map((_, index) => (
            <button
              key={index}
              className={`rounded-full transition-all duration-200 font-bold text-xs ${
                index === currentQuestion
                  ? 'w-8 h-7 bg-blue-600 text-white'
                  : answers[quiz.questions[index]._id]
                  ? 'w-7 h-7 bg-emerald-500 text-white'
                  : 'w-7 h-7 bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              onClick={() => goToQuestion(index, index > currentQuestion ? 'right' : 'left')}
              aria-label={`Question ${index + 1}`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {/* Desktop navigation */}
        <div className="hidden sm:flex items-center justify-between gap-4">
          <button
            onClick={() => goToQuestion(Math.max(0, currentQuestion - 1), 'left')}
            disabled={currentQuestion === 0}
            className="btn-outline disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </button>

          {currentQuestion < quiz.questions.length - 1 ? (
            <button
              onClick={() => goToQuestion(currentQuestion + 1, 'right')}
              className="btn-primary"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? (
                <><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Submitting…</>
              ) : (
                <><CheckCircle className="h-4 w-4" /> Submit Quiz</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile sticky bottom nav bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg px-4 py-3 z-40 flex items-center gap-3">
        <button
          onClick={() => goToQuestion(Math.max(0, currentQuestion - 1), 'left')}
          disabled={currentQuestion === 0}
          className="btn-outline flex-1 disabled:opacity-40"
          style={{ minHeight: '48px' }}
        >
          <ArrowLeft className="h-4 w-4" /> Prev
        </button>
        <span className="text-xs font-semibold text-gray-500 tabular-nums whitespace-nowrap px-2">
          {currentQuestion + 1}/{quiz.questions.length}
        </span>
        {currentQuestion < quiz.questions.length - 1 ? (
          <button
            onClick={() => goToQuestion(currentQuestion + 1, 'right')}
            className="btn-primary flex-1"
            style={{ minHeight: '48px' }}
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 transition-all disabled:opacity-50"
            style={{ minHeight: '48px' }}
          >
            {isSubmitting ? (
              <><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Submitting…</>
            ) : (
              <><CheckCircle className="h-4 w-4" /> Submit</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;
