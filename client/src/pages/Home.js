import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import useCountUp from '../hooks/useCountUp';
import useInView from '../hooks/useInView';
import {
  ArrowRight, BookOpen, BarChart2, CheckCircle, Zap,
  Award, Users, Clock, Play, TrendingUp, Shield, ChevronLeft, ChevronRight
} from 'lucide-react';

const API = '/api';

const CATEGORY_COLOURS = {
  Technology:         'from-cyan-500 to-blue-600',
  'Computer Science': 'from-violet-500 to-purple-700',
  Mathematics:        'from-orange-400 to-rose-500',
  Science:            'from-emerald-400 to-teal-600',
  Business:           'from-amber-400 to-orange-500',
  General:            'from-slate-400 to-slate-600',
};

const HeroStat = ({ end, suffix = '', label, delay = 0 }) => {
  const { count, trigger } = useCountUp(end, 1600);
  const [ref, inView] = useInView(0.1);
  useEffect(() => { if (inView) trigger(); }, [inView]); // eslint-disable-line
  return (
    <div ref={ref} className="text-center will-animate animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">{count}{suffix}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
};

const CourseCard = ({ course }) => {
  const gradient = CATEGORY_COLOURS[course.category] || CATEGORY_COLOURS.General;
  const courseId = course._id || course.id;
  return (
    <Link to={`/courses/${courseId}`} className="card-hover group overflow-hidden flex flex-col flex-shrink-0 w-72 sm:w-80">
      <div className={`h-44 bg-gradient-to-br ${gradient} flex items-end p-4 relative overflow-hidden`}>
        <div className="absolute top-4 right-4 opacity-20 transition-transform duration-500 group-hover:scale-110">
          <BookOpen style={{ width: 56, height: 56, color: 'white' }} />
        </div>
        <span className="relative z-10 px-2.5 py-1 bg-white/25 backdrop-blur-sm text-white text-xs font-semibold rounded-full">{course.category || 'General'}</span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 mb-1.5 group-hover:text-cyan-600 transition-colors line-clamp-2 leading-snug text-sm">{course.title}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed flex-1">{course.description}</p>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Users className="h-3.5 w-3.5" />
            <span>{course.enrolledStudents?.length || course.enrolled_count || 0} students</span>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Free</span>
        </div>
      </div>
    </Link>
  );
};

const FeatureItem = ({ icon, title, description, delay = 0 }) => {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={`flex gap-4 will-animate ${inView ? 'animate-fade-up' : ''}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex-shrink-0 w-11 h-11 bg-cyan-100 rounded-2xl flex items-center justify-center mt-0.5 shadow-sm">{icon}</div>
      <div>
        <h3 className="font-bold text-gray-900 mb-1 text-sm">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
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
    axios.get(`${API}/courses`).then(res => {
      const data = res.data;
      const list = data.courses || data.data?.courses || [];
      setCourses(list);
    }).catch(() => {});
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
    const el = carouselRef.current;
    if (!el || courses.length === 0) return;
    const card = el.children[carouselIdx];
    if (card) card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [carouselIdx, courses.length]);

  const [heroRef, heroInView] = useInView(0.05);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
        </div>
        <div ref={heroRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="max-w-3xl">
            <div className={`will-animate ${heroInView ? 'animate-fade-up' : ''}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 border border-cyan-400/30 rounded-full text-cyan-300 text-xs font-semibold mb-6">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                Free e-learning · Arden University Final Year Project
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6 tracking-tight text-white">
                Learn without limits.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300">Track every step.</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl">
                Interactive quizzes, instant explanatory feedback, and visual progress dashboards — built on educational psychology for real results.
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                {user ? (
                  <Link to="/dashboard" className="btn-primary-lg group">
                    Go to Dashboard <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="btn-primary-lg group">
                      Start learning free <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                    <Link to="/courses" className="btn-outline-white group">
                      <Play className="h-4 w-4" /> Browse courses
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-6 sm:gap-10 mt-12 pt-8 border-t border-white/10 flex-wrap">
              <HeroStat end={500} suffix="+" label="Learners" delay={0} />
              <div className="w-px h-10 bg-white/10" />
              <HeroStat end={30} suffix="+" label="Courses" delay={100} />
              <div className="w-px h-10 bg-white/10" />
              <HeroStat end={4} suffix=".8★" label="Rating" delay={200} />
              <div className="w-px h-10 bg-white/10" />
              <HeroStat end={95} suffix="%" label="Satisfaction" delay={300} />
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm text-gray-500 font-medium">
            <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /><span>No credit card required</span></div>
            <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-cyan-500" /><span>WCAG 2.1 AA accessible</span></div>
            <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-orange-500" /><span>Evidence-based learning</span></div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-violet-500" /><span>Learn at your own pace</span></div>
          </div>
        </div>
      </section>

      {/* Course carousel */}
      {courses.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold text-cyan-600 uppercase tracking-wider mb-2">Explore</p>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Top courses right now</h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={prev} className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all duration-200 active:scale-95" aria-label="Previous">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={next} className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all duration-200 active:scale-95" aria-label="Next">
                <ChevronRight className="h-5 w-5" />
              </button>
              <Link to="/courses" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-cyan-600 hover:text-cyan-700 transition-colors">
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
              <button key={i} onClick={() => goTo(i)} className={`rounded-full transition-all duration-300 ${i === carouselIdx ? 'w-6 h-2 bg-cyan-600' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'}`} aria-label={`Course ${i + 1}`} />
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-bold text-cyan-600 uppercase tracking-wider mb-3">Why Study Buddy</p>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">Designed around the science of learning</h2>
              <p className="text-gray-500 leading-relaxed mb-8">Every feature is grounded in educational psychology — from the testing effect (Roediger &amp; Karpicke, 2006) to metacognitive self-monitoring.</p>
              {!user && <Link to="/register" className="btn-primary group">Get started free <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" /></Link>}
            </div>
            <div className="grid gap-7">
              <FeatureItem delay={0} icon={<CheckCircle className="h-5 w-5 text-cyan-600" />} title="3 question types with shuffled answers" description="MCQ, true/false, and fill-in-the-blank. Questions and options are reshuffled every attempt." />
              <FeatureItem delay={100} icon={<Zap className="h-5 w-5 text-cyan-600" />} title="Instant explanatory feedback" description="Every wrong answer shows why — not just what. Reinforces understanding rather than blind guessing." />
              <FeatureItem delay={200} icon={<BarChart2 className="h-5 w-5 text-cyan-600" />} title="Visual progress dashboards" description="Score trends over time, completion percentage, and learning hours — your whole journey in one view." />
              <FeatureItem delay={300} icon={<Award className="h-5 w-5 text-cyan-600" />} title="Personal milestones, no leaderboards" description="Celebrate your own growth. No peer comparison — competitive leaderboards are known to demotivate learners." />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="bg-gradient-to-r from-cyan-600 to-cyan-700 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-white">
            <h2 className="text-3xl font-extrabold mb-4 tracking-tight">Ready to study smarter?</h2>
            <p className="text-cyan-100 mb-8 text-base max-w-xl mx-auto">Join hundreds of students already using Study Buddy to revise more effectively.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/register" className="inline-flex items-center gap-2 bg-white text-cyan-700 font-bold px-8 py-4 rounded-xl hover:bg-cyan-50 active:scale-[0.97] transition-all shadow-lg text-sm group">
                Create your free account <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link to="/courses" className="btn-outline-white"><BookOpen className="h-4 w-4" /> Browse courses first</Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-cyan-600 rounded-md flex items-center justify-center">
              <BookOpen style={{ width: 13, height: 13, color: 'white' }} />
            </div>
            <span className="font-extrabold text-gray-900 text-sm">Study<span className="text-cyan-600">Buddy</span></span>
          </div>
          <p className="text-sm text-gray-400">Final Year Project — Arden University © {new Date().getFullYear()}</p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
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
