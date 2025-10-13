import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Quiz from './pages/Quiz';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import CreateCourse from './pages/CreateCourse';
import EditCourse from './pages/EditCourse';

// Dashboard Router Component
import { useAuth } from './context/AuthContext';

const DashboardRouter = () => {
  const { user } = useAuth();
  
  if (user?.role === 'instructor') {
    return <InstructorDashboard />;
  }
  
  return <Dashboard />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <DashboardRouter />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/courses" 
              element={
                <PrivateRoute>
                  <Courses />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/courses/:id" 
              element={
                <PrivateRoute>
                  <CourseDetail />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/quiz/:id" 
              element={
                <PrivateRoute>
                  <Quiz />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <PrivateRoute roles={['admin']}>
                  <Admin />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/instructor/create-course" 
              element={
                <PrivateRoute roles={['instructor', 'admin']}>
                  <CreateCourse />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/instructor/edit-course/:id" 
              element={
                <PrivateRoute roles={['instructor', 'admin']}>
                  <EditCourse />
                </PrivateRoute>
              } 
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;