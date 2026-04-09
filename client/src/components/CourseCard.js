import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, BookOpen, Code2, Palette, TrendingUp, Atom, Calculator, Globe, Lightbulb } from 'lucide-react';

/* ── Per-category visual config ── */
const CATEGORY_THEME = {
  programming: {
    gradient: 'from-blue-600 to-indigo-700',
    icon: <Code2 className="h-14 w-14 text-white/30" />,
    badge: 'bg-blue-100 text-blue-700',
  },
  design: {
    gradient: 'from-purple-500 to-pink-600',
    icon: <Palette className="h-14 w-14 text-white/30" />,
    badge: 'bg-purple-100 text-purple-700',
  },
  business: {
    gradient: 'from-emerald-500 to-teal-600',
    icon: <TrendingUp className="h-14 w-14 text-white/30" />,
    badge: 'bg-emerald-100 text-emerald-700',
  },
  science: {
    gradient: 'from-orange-500 to-amber-500',
    icon: <Atom className="h-14 w-14 text-white/30" />,
    badge: 'bg-orange-100 text-orange-700',
  },
  mathematics: {
    gradient: 'from-cyan-500 to-blue-600',
    icon: <Calculator className="h-14 w-14 text-white/30" />,
    badge: 'bg-cyan-100 text-cyan-700',
  },
  language: {
    gradient: 'from-rose-500 to-pink-500',
    icon: <Globe className="h-14 w-14 text-white/30" />,
    badge: 'bg-rose-100 text-rose-700',
  },
  other: {
    gradient: 'from-gray-500 to-slate-600',
    icon: <Lightbulb className="h-14 w-14 text-white/30" />,
    badge: 'bg-gray-100 text-gray-700',
  },
};

const getTheme = (category) =>
  CATEGORY_THEME[(category || 'other').toLowerCase()] || CATEGORY_THEME.other;

const CourseCard = ({ course, isEnrolled }) => {
  const totalMinutes = Math.max(0, Math.round(
    course.total_duration_minutes || course.totalDuration ||
    (course.lessons || []).reduce((sum, l) => sum + (Number(l.duration) || 0), 0)
  ));
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const duration = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

  const theme = getTheme(course.category);
  const completionPct = course.completion_percentage || 0;

  return (
    <Link
      to={`/courses/${course._id || course.id}`}
      className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 flex flex-col h-full
                 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out"
    >
      {/* Thumbnail */}
      <div className={`relative h-40 bg-gradient-to-br ${theme.gradient} overflow-hidden flex items-center justify-center`}>
        {/* Dot texture overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />

        {/* Big subject icon */}
        <div className="relative z-10 group-hover:scale-110 transition-transform duration-500 ease-out">
          {theme.icon}
        </div>

        {/* Category pill — top left */}
        <span className={`absolute top-3 left-3 z-10 ${theme.badge} text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize`}>
          {course.category || 'other'}
        </span>

        {/* Duration pill — top right */}
        <span className="absolute top-3 right-3 z-10 bg-black/25 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1">
          <Clock aria-hidden="true" className="h-3 w-3" /> {duration}
        </span>

        {/* Level badge — bottom left */}
        {course.level && (
          <span className="absolute bottom-3 left-3 z-10 bg-white/20 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-0.5 rounded-full capitalize">
            {course.level}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1.5 group-hover:text-blue-600 transition-colors duration-200">
          {course.title}
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3 flex-1">
          {course.description?.substring(0, 100)}
        </p>

        {/* Instructor */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mb-2.5">
          <div aria-hidden="true" className={`w-6 h-6 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
            {(course.instructor?.name || 'I').charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-gray-600 truncate">{course.instructor?.name || 'Instructor'}</span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-1">
          <span className="flex items-center gap-1"><BookOpen aria-hidden="true" className="h-3 w-3" /> {course.lesson_count || course.lessons?.length || 0} lessons</span>
          <span className="flex items-center gap-1"><Users aria-hidden="true" className="h-3 w-3" /> {course.enrolled_count || course.totalEnrollments || 0} students</span>
        </div>

        {/* Enrolled progress bar */}
        {isEnrolled && (
          <div className="mt-3 pt-2.5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Enrolled
              </span>
              <span className="text-[11px] font-bold text-gray-500">{completionPct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${theme.gradient} transition-all duration-700`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default CourseCard;
