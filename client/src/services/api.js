import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses globally (no hard redirect to avoid refresh flicker)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Do not redirect here; let calling code (AuthContext / routes) handle UI flow
    }
    return Promise.reject(error);
  }
);

// Course Services
export const courseService = {
  getAllCourses: (params) => api.get('/courses', { params }),
  getCourse: (id) => api.get(`/courses/${id}`),
  createCourse: (data) => api.post('/courses', data),
  updateCourse: (id, data) => api.put(`/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  enrollCourse: (id) => api.post(`/courses/${id}/enroll`),
  updateLessonDuration: (courseId, lessonId, payload) =>
    api.put(`/courses/${courseId}/lessons/${lessonId}/duration`, payload),
  getAuditReport: () => api.get('/courses/audit')
};

// Quiz Services
export const quizService = {
  getCourseQuizzes: (courseId) => api.get(`/quizzes/course/${courseId}`),
  getQuiz: (id) => api.get(`/quizzes/${id}`),
  createQuiz: (data) => api.post('/quizzes', data),
  updateQuiz: (id, data) => api.put(`/quizzes/${id}`, data),
  deleteQuiz: (id) => api.delete(`/quizzes/${id}`),
  submitQuiz: (id, data) => api.post(`/quizzes/${id}/submit`, data)
};

// Progress Services
export const progressService = {
  getDashboard: () => api.get('/progress/dashboard'),
  getUserProgress: (userId) => api.get(`/progress/user/${userId}`),
  getCourseProgress: (courseId) => api.get(`/progress/course/${courseId}`),
  updateLessonProgress: (data) => api.put('/progress/lesson', data),
  getInstructorAnalytics: () => api.get('/progress/instructor/analytics')
};

// User Services
export const userService = {
  getAllUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`)
};

// System Services
export const systemService = {
  getSettings: () => api.get('/system/settings'),
  updateSettings: (data) => api.put('/system/settings', data)
};

export default api;
