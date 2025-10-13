import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LayoutDashboard, GraduationCap, User, LogOut, Menu, X, Shield } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand" onClick={() => setIsMobileMenuOpen(false)}>
          <GraduationCap size={32} />
          <span>Study Buddy</span>
        </Link>

        <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`navbar-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          {isAuthenticated ? (
            <>
              <Link to="/courses" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                <BookOpen size={20} />
                <span>Courses</span>
              </Link>
              <Link to="/dashboard" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  <Shield size={20} />
                  <span>Admin</span>
                </Link>
              )}
              <Link to="/profile" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                <User size={20} />
                <span>{user?.firstName}</span>
              </Link>
              <button onClick={handleLogout} className="nav-link logout-btn">
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary" onClick={() => setIsMobileMenuOpen(false)}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
