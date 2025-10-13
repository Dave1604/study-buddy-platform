import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { quizService } from '../services/api';
import './Quiz.css';

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

  // Shuffle array function (Fisher-Yates algorithm)
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
      
      // Shuffle questions each time the quiz is loaded
      quizData.questions = shuffleArray(quizData.questions);
      
      // Also shuffle options for multiple-choice and multiple-answer questions
      quizData.questions = quizData.questions.map(question => {
        if (question.options && question.options.length > 0) {
          return {
            ...question,
            options: shuffleArray(question.options)
          };
        }
        return question;
      });
      
      setQuiz(quizData);
      setTimeLeft(quizData.duration * 60); // Convert to seconds
    } catch (error) {
      console.error('Error fetching quiz:', error);
      alert('Error loading quiz');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  useEffect(() => {
    if (timeLeft > 0 && !result) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && quiz && !result) {
      handleSubmit();
    }
  }, [timeLeft, result]);

  const handleAnswer = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    const unanswered = quiz.questions.length - Object.keys(answers).length;
    if (unanswered > 0) {
      if (!window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer
      }));

      const timeSpent = (quiz.duration * 60) - timeLeft;
      
      const response = await quizService.submitQuiz(id, {
        answers: formattedAnswers,
        timeSpent
      });
      
      setResult(response.data.data.result);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert(error.response?.data?.message || 'Error submitting quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <LoadingSpinner message="Loading quiz..." />;
  }

  if (!quiz) {
    return null;
  }

  // Result View
  if (result) {
    return (
      <div className="quiz-page">
        <div className="container">
          <div className="quiz-result">
            <div className={`result-header ${result.passed ? 'passed' : 'failed'}`}>
              {result.passed ? (
                <>
                  <CheckCircle size={64} />
                  <h1>Congratulations!</h1>
                  <p>You passed the quiz!</p>
                </>
              ) : (
                <>
                  <XCircle size={64} />
                  <h1>Keep Practicing</h1>
                  <p>You didn't pass this time</p>
                </>
              )}
            </div>

            <div className="result-stats">
              <div className="stat-box">
                <div className="stat-value">{result.percentage}%</div>
                <div className="stat-label">Your Score</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{result.score}/{result.totalPoints}</div>
                <div className="stat-label">Points Earned</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{quiz.passingScore}%</div>
                <div className="stat-label">Passing Score</div>
              </div>
            </div>

            {quiz.showCorrectAnswers && (
              <div className="answers-review">
                <h3>Question Review</h3>
                {quiz.questions.map((question, index) => {
                  const userAnswer = result.gradedAnswers.find(
                    a => a.questionId === question._id
                  );
                  const correctAnswer = result.correctAnswers?.find(
                    a => a.questionId === question._id
                  );

                  return (
                    <div key={question._id} className={`question-review ${userAnswer?.isCorrect ? 'correct' : 'incorrect'}`}>
                      <div className="question-header">
                        <span className="question-number">Question {index + 1}</span>
                        {userAnswer?.isCorrect ? (
                          <CheckCircle size={20} color="#10b981" />
                        ) : (
                          <XCircle size={20} color="#ef4444" />
                        )}
                      </div>
                      <p className="question-text">{question.questionText}</p>
                      {correctAnswer?.explanation && (
                        <div className="explanation">
                          <strong>Explanation:</strong> {correctAnswer.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="result-actions">
              <button onClick={() => navigate(`/courses/${quiz.course._id || quiz.course}`)} className="btn btn-primary">
                Back to Course
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Taking View
  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="quiz-page">
      <div className="container">
        <div className="quiz-container">
          {/* Quiz Header */}
          <div className="quiz-header">
            <div>
              <h1>{quiz.title}</h1>
              <p>{quiz.description}</p>
            </div>
            <div className="quiz-timer">
              <Clock size={24} />
              <span className={timeLeft < 60 ? 'time-warning' : ''}>{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="quiz-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
          </div>

          {/* Question */}
          <div className="question-card">
            <h3>Question {currentQuestion + 1}</h3>
            <p className="question-text">{question.questionText}</p>

            <div className="answer-options">
              {question.questionType === 'multiple-choice' && (
                question.options.map((option) => (
                  <label key={option._id} className="option-label">
                    <input
                      type="radio"
                      name={`question-${question._id}`}
                      checked={answers[question._id] === option._id}
                      onChange={() => handleAnswer(question._id, option._id)}
                    />
                    <span className="option-text">{option.text}</span>
                  </label>
                ))
              )}

              {question.questionType === 'true-false' && (
                <>
                  <label className="option-label">
                    <input
                      type="radio"
                      name={`question-${question._id}`}
                      checked={answers[question._id] === 'true'}
                      onChange={() => handleAnswer(question._id, 'true')}
                    />
                    <span className="option-text">True</span>
                  </label>
                  <label className="option-label">
                    <input
                      type="radio"
                      name={`question-${question._id}`}
                      checked={answers[question._id] === 'false'}
                      onChange={() => handleAnswer(question._id, 'false')}
                    />
                    <span className="option-text">False</span>
                  </label>
                </>
              )}

              {question.questionType === 'multiple-answer' && (
                question.options.map((option) => {
                  const selectedAnswers = answers[question._id] || [];
                  return (
                    <label key={option._id} className="option-label">
                      <input
                        type="checkbox"
                        checked={selectedAnswers.includes(option._id)}
                        onChange={(e) => {
                          const newAnswers = e.target.checked
                            ? [...selectedAnswers, option._id]
                            : selectedAnswers.filter(id => id !== option._id);
                          handleAnswer(question._id, newAnswers);
                        }}
                      />
                      <span className="option-text">{option.text}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="quiz-navigation">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="btn btn-secondary"
            >
              Previous
            </button>

            <div className="question-dots">
              {quiz.questions.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentQuestion ? 'active' : ''} ${answers[quiz.questions[index]._id] ? 'answered' : ''}`}
                  onClick={() => setCurrentQuestion(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {currentQuestion < quiz.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                className="btn btn-primary"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn btn-success"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
