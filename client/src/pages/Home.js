import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseService } from '../services/api';
import useCountUp from '../hooks/useCountUp';
import useInView from '../hooks/useInView';
import {
  ArrowRight, BookOpen, BarChart2, CheckCircle, Zap,
  Award, Users, Clock, Play, TrendingUp, Shield, ChevronLeft, ChevronRight,
  Code2, Palette, Atom, Calculator, Globe, Lightbulb
} from 'lucide-react';

const CATEGORY_THEME = {
  programming: { gradient: 'from-blue-600 to-indigo-700', icon: <Code2 className="h-14 w-14 text-white/30" />, badge: 'bg-blue-100 text-blue-700' },
  design:      { gradient: 'from-purple-500 to-pink-600',  icon: <Palette className="h-14 w-14 text-white/30" />, badge: 'bg-purple-100 text-purple-700' },
  business:    { gradient: 'from-emerald-500 to-teal-600', icon: <TrendingUp className="h-14 w-14 text-white/30" />, badge: 'bg-emerald-100 text-emerald-700' },
  science:     { gradient: 'from-orange-500 to-amber-500', icon: <Atom className="h-14 w-14 text-white/30" />, badge: 'bg-orange-100 text-orange-700' },
  mathematics: { gradient: 'from-cyan-500 to-blue-600',   icon: <Calculator className="h-14 w-14 text-white/30" />, badge: 'bg-cyan-100 text-cyan-700' },
  language:    { gradient: 'from-rose-500 to-pink-500',   icon: <Globe className="h-14 w-14 text-white/30" />, badge: 'bg-rose-100 text-rose-700' },
  other:       { gradient: 'from-gray-500 to-slate-600',  icon: <Lightbulb className="h-14 w-14 text-white/30" />, badge: 'bg-gray-100 text-gray-700' },
};
const getTheme = (cat) => CATEGORY_THEME[(cat || 'other').toLowerCase()] || CATEGORY_THEME.other;

const HeroStat = ({ end, suffix = '', label, delay = 0 }) => {
  const { count, trigger } = useCountUp(end, 1600);
  const [ref, inView] = useInView(0.1);
  useEffect(() => { if (inView) trigger(); }, [inView]); // eslint-disable-line
  return (
    <div ref={ref} className="text-center bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4 will-animate animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 tabular-nums">{count}{suffix}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
};

const CourseCard = ({ course }) => {
  const theme = getTheme(course.category);
  const courseId = course._id || course.id;
  return (
    <Link to={`/courses/${courseId}`} className="card-hover group overflow-hidden flex flex-col flex-shrink-0 w-72 sm:w-80 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className={`relative h-44 bg-gradient-to-br ${theme.gradient} flex items-center justify-center overflow-hidden`}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        <div className="relative z-10 group-hover:scale-110 transition-transform duration-500">{theme.icon}</div>
        <span className={`absolute top-4 left-4 z-10 ${theme.badge} px-3 py-1 text-xs font-semibold rounded-full capitalize`}>{course.category || 'other'}</span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug text-sm">{course.title}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed flex-1">{course.description}</p>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Users aria-hidden="true" className="h-3.5 w-3.5" />
            <span>{course.enrolled_count || 0} students</span>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Free</span>
        </div>
      </div>
    </Link>
  );
};

const FeatureCard = ({ icon, title, description, delay = 0 }) => {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`bg-white rounded-xl border border-gray-200 p-6 hover-lift will-animate ${inView ? 'animate-fade-up' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-gray-900 mb-2 text-sm">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
};

const Home = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const carouselRef = useRef(null);
  const autoRef = useRef(null);

  useEffect(() => {
    courseService
      .getAllCourses()
      .then((res) => {
        const list = res.data?.data?.courses || res.data?.courses || [];
        setCourses(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (courses.length <= 1) return;
    autoRef.current = setInterval(() => {
      setCarouselIdx(i => (i + 1) % courses.length);
    }, 4000);
    return () => clearInterval(autoRef.current);
  }, [courses.length]);

  const goTo = (i) => { clearInterval(autoRef.current); setCarouselIdx(i); };
  const prev = () => goTo((carouselIdx - 1 + courses.length) % courses.length);
  const next = () => goTo((carouselIdx + 1) % courses.length);

  useEffect(() => {
    const container = carouselRef.current;
    if (!container || courses.length === 0) return;
    const card = container.children[carouselIdx];
    if (!card) return;
    const cardLeft = card.offsetLeft;
    const cardWidth = card.offsetWidth;
    const w = container.clientWidth;
    const left = cardLeft - (w - cardWidth) / 2;
    container.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [carouselIdx, courses.length]);

  const [heroRef, heroInView] = useInView(0.05);
  const [featuresHeaderRef, featuresHeaderInView] = useInView(0.1);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section
        className="relative overflow-hidden bg-white"
        style={{
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        <div ref={heroRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 lg:pt-32 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div className={`will-animate ${heroInView ? 'animate-fade-up' : ''}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-blue-600 text-xs font-semibold mb-6">
                <span aria-hidden="true" className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                Free e-learning &middot; Arden University Final Year Project
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6 tracking-tight text-gray-900">
                Learn without limits.{' '}
                <span className="text-blue-600">Track every step.</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-500 mb-10 leading-relaxed max-w-2xl">
                Interactive quizzes, instant explanatory feedback, and visual progress dashboards — built on educational psychology for real results.
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                {user ? (
                  <Link to="/dashboard" className="btn-primary-lg group">
                    Go to Dashboard <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-700 active:scale-[0.97] transition-all shadow-sm text-sm group">
                      Start learning free <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                    <Link to="/courses" className="inline-flex items-center gap-2 border-2 border-blue-600 text-blue-600 font-bold px-6 py-3.5 rounded-xl hover:bg-blue-50 active:scale-[0.97] transition-all text-sm group">
                      <Play className="h-4 w-4" /> Browse courses
                    </Link>
                  </>
                )}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 sm:gap-6 mt-12 flex-wrap">
                <HeroStat end={500} suffix="+" label="Learners" delay={0} />
                <HeroStat end={30} suffix="+" label="Courses" delay={100} />
                <HeroStat end={4} suffix=".8★" label="Rating" delay={200} />
                <HeroStat end={95} suffix="%" label="Satisfaction" delay={300} />
              </div>
            </div>

            {/* Right side - Feature preview cards */}
            <div className="hidden lg:block relative" style={{ minHeight: '420px' }}>
              {/* Card 1 - Quiz preview */}
              <div className="absolute top-0 right-0 w-56 bg-white rounded-xl border border-gray-200 shadow-lg p-4 animate-fade-up" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">Quiz Question</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">What is the time complexity of binary search?</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    <span className="text-xs text-blue-700 font-medium">O(log n)</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg">
                    <div className="w-3 h-3 rounded-full border border-gray-300" />
                    <span className="text-xs text-gray-500">O(n)</span>
                  </div>
                </div>
              </div>

              {/* Card 2 - Progress chart preview */}
              <div className="absolute top-40 right-32 w-52 bg-white rounded-xl border border-gray-200 shadow-lg p-4 animate-fade-up" style={{ animationDelay: '400ms' }}>
                <span className="text-xs font-semibold text-gray-700">Quiz Performance</span>
                {/* Simple bar chart visualization */}
                <div className="flex items-end gap-1.5 mt-3 h-16">
                  {[40, 60, 75, 55, 85, 90, 80].map((h, i) => (
                    <div key={i} className="flex-1 bg-blue-100 rounded-t" style={{ height: `${h}%` }}>
                      <div className="w-full bg-blue-500 rounded-t" style={{ height: '60%' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3 - Achievement preview */}
              <div className="absolute top-72 right-8 w-48 bg-white rounded-xl border border-gray-200 shadow-lg p-4 animate-fade-up" style={{ animationDelay: '600ms' }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl" role="img" aria-label="trophy">&#127942;</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">High Achiever</p>
                    <p className="text-xs text-emerald-600 font-medium">Unlocked!</p>
                  </div>
                </div>
              </div>

              {/* Card 4 - Course progress preview */}
              <div className="absolute top-52 right-0 w-44 bg-white rounded-xl border border-gray-200 shadow-lg p-4 animate-fade-up" style={{ animationDelay: '800ms' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">Progress</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '72%' }} />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">72% complete</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm text-gray-500 font-medium">
            <div className="flex items-center gap-2"><CheckCircle aria-hidden="true" className="h-4 w-4 text-emerald-500" /><span>No credit card required</span></div>
            <div className="flex items-center gap-2"><Shield aria-hidden="true" className="h-4 w-4 text-blue-500" /><span>WCAG 2.1 AA accessible</span></div>
            <div className="flex items-center gap-2"><TrendingUp aria-hidden="true" className="h-4 w-4 text-orange-500" /><span>Evidence-based learning</span></div>
            <div className="flex items-center gap-2"><Clock aria-hidden="true" className="h-4 w-4 text-blue-600" /><span>Learn at your own pace</span></div>
          </div>
        </div>
      </section>

      {/* Course carousel */}
      {courses.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Explore</p>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Top courses right now</h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={prev} className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 active:scale-95" aria-label="Previous">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={next} className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 active:scale-95" aria-label="Next">
                <ChevronRight className="h-5 w-5" />
              </button>
              <Link to="/courses" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div ref={carouselRef} className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {courses.map((c) => (
              <div key={c._id || c.id} className="snap-start flex-shrink-0"><CourseCard course={c} /></div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mt-5">
            {courses.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} className={`rounded-full transition-all duration-300 ${i === carouselIdx ? 'w-6 h-2 bg-blue-600' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'}`} aria-label={`Course ${i + 1}`} />
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div
            ref={featuresHeaderRef}
            className={`text-center max-w-2xl mx-auto mb-12 will-animate ${featuresHeaderInView ? 'animate-fade-up' : ''}`}
          >
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Why Study Buddy</p>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">Designed around the science of learning</h2>
            <p className="text-gray-500 leading-relaxed">Every feature is grounded in educational psychology — from the testing effect (Roediger &amp; Karpicke, 2006) to metacognitive self-monitoring.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <FeatureCard
              delay={0}
              icon={<CheckCircle className="h-6 w-6 text-blue-600" />}
              title="3 question types with shuffled answers"
              description="MCQ, true/false, and fill-in-the-blank. Questions and options are reshuffled every attempt."
            />
            <FeatureCard
              delay={100}
              icon={<Zap className="h-6 w-6 text-blue-600" />}
              title="Instant explanatory feedback"
              description="Every wrong answer shows why — not just what. Reinforces understanding rather than blind guessing."
            />
            <FeatureCard
              delay={200}
              icon={<BarChart2 className="h-6 w-6 text-blue-600" />}
              title="Visual progress dashboards"
              description="Score trends over time, completion percentage, and learning hours — your whole journey in one view."
            />
            <FeatureCard
              delay={300}
              icon={<Award className="h-6 w-6 text-blue-600" />}
              title="Personal milestones, no leaderboards"
              description="Celebrate your own growth. No peer comparison — competitive leaderboards are known to demotivate learners."
            />
          </div>
          {!user && (
            <div className="text-center mt-10">
              <Link to="/register" className="btn-primary group">
                Get started free <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="bg-blue-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-white">
            <h2 className="text-3xl font-extrabold mb-4 tracking-tight">Ready to study smarter?</h2>
            <p className="text-blue-100 mb-8 text-base max-w-xl mx-auto">Join hundreds of students already using Study Buddy to revise more effectively.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/register" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 active:scale-[0.97] transition-all shadow-sm text-sm group">
                Create your free account <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link to="/courses" className="inline-flex items-center gap-2 border-2 border-white text-white font-bold px-6 py-3.5 rounded-xl hover:bg-blue-700 active:scale-[0.97] transition-all text-sm">
                <BookOpen className="h-4 w-4" /> Browse courses first
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <BookOpen aria-hidden="true" style={{ width: 13, height: 13, color: 'white' }} />
            </div>
            <span className="font-extrabold text-gray-900 text-sm">Study<span className="text-blue-600">Buddy</span></span>
          </div>
          <p className="text-sm text-gray-500">Final Year Project — Arden University &copy; {new Date().getFullYear()}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Link to="/courses" className="hover:text-gray-600 transition-colors">Courses</Link>
            <Link to="/login" className="hover:text-gray-600 transition-colors">Sign in</Link>
            <Link to="/register" className="hover:text-gray-600 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
