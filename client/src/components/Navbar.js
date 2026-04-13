import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, ChevronDown, Menu, X, LayoutDashboard, BookMarked, User, LogOut, ShieldCheck, PlusCircle } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.firstName ? (user.firstName[0] + (user.lastName?.[0] || '')).toUpperCase() : '??');

  const roleColour = {
    student: 'bg-blue-100 text-blue-700',
    instructor: 'bg-violet-100 text-violet-700',
    admin: 'bg-red-100 text-red-700',
  }[user?.role] || 'bg-gray-100 text-gray-700';

  const displayName = user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" aria-label="StudyBuddy home" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
            <BookOpen aria-hidden="true" style={{ width: 16, height: 16, color: 'white' }} />
          </div>
          <span className="font-extrabold text-gray-900 text-lg tracking-tight hidden sm:block">
            Study<span className="text-blue-600">Buddy</span>
          </span>
        </Link>

        {/* Center nav links (desktop) */}
        {isAuthenticated && (
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
            <Link to="/dashboard" className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>Dashboard</Link>
            {user?.role !== 'admin' && (
              <Link to="/courses" className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname.startsWith('/courses') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>Courses</Link>
            )}
            {(user?.role === 'instructor' || user?.role === 'admin') && (
              <Link to="/instructor/create-course" className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname.includes('create-course') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>Create course</Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/admin' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>Admin</Link>
            )}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Avatar dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  aria-controls="user-dropdown"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-800 leading-none">{displayName.split(' ')[0]}</p>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${roleColour} capitalize`}>{user?.role}</span>
                  </div>
                  <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div id="user-dropdown" role="menu" className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-scale-in">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <Link role="menuitem" to="/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <LayoutDashboard aria-hidden="true" className="h-4 w-4 text-gray-400" /> Dashboard
                    </Link>
                    {user?.role !== 'admin' && (
                      <Link role="menuitem" to="/courses" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <BookMarked aria-hidden="true" className="h-4 w-4 text-gray-400" /> Courses
                      </Link>
                    )}
                    {(user?.role === 'instructor' || user?.role === 'admin') && (
                      <Link role="menuitem" to="/instructor/create-course" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <PlusCircle aria-hidden="true" className="h-4 w-4 text-gray-400" /> Create course
                      </Link>
                    )}
                    <Link role="menuitem" to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <User aria-hidden="true" className="h-4 w-4 text-gray-400" /> Profile
                    </Link>
                    {user?.role === 'admin' && (
                      <Link role="menuitem" to="/admin" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <ShieldCheck aria-hidden="true" className="h-4 w-4 text-gray-400" /> Admin
                      </Link>
                    )}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button role="menuitem" onClick={handleLogout} className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors w-full">
                        <LogOut aria-hidden="true" className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ minWidth: '44px', minHeight: '44px' }}
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
              <Link to="/register" className="btn-primary text-sm">Get started</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && isAuthenticated && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-1">
          <Link to="/dashboard" className="px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
          {user?.role !== 'admin' && (
            <Link to="/courses" className="px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2"><BookMarked className="h-4 w-4" /> Courses</Link>
          )}
          <Link to="/profile" className="px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2"><User className="h-4 w-4" /> Profile</Link>
          {(user?.role === 'instructor' || user?.role === 'admin') && (
            <Link to="/instructor/create-course" className="px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100">Create course</Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" className="px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Admin</Link>
          )}
          <button onClick={handleLogout} className="mt-1 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 flex items-center gap-2 w-full"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
