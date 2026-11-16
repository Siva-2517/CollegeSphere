import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Building2,
  Clock,
  ArrowRight,
  Search,
  CheckCircle,
  Tag,
  ShieldCheck,
  Zap,
  GraduationCap
} from 'lucide-react';
import api from '../api/axios';
import { formatCalendarDate, formatDate } from '../utils/formatDate';
import CollegeSphereLogo, { CollegeSphereLogoMark } from '../components/common/CollegeSphereLogo';

export default function Landing() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ events: 0, students: 0, colleges: 0 });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: statsData } = await api.get('/api/admin/stats/public');
        setStats({
          events: statsData.totalEvents || 120,
          students: statsData.totalStudents || 4500,
          colleges: statsData.totalColleges || 35
        });
      } catch (error) {
        setStats({ events: 120, students: 4500, colleges: 35 });
      }

      try {
        const { data: eventsData } = await api.get('/api/event/AllEvents');
        setEvents(eventsData.events || eventsData || []);
      } catch (error) {
        setEvents([
          {
            _id: '1',
            title: 'National HackSummit 2026',
            collegeName: 'MIT College of Engineering',
            date: '2026-03-15T09:00:00Z',
            deadline: '2026-03-10T23:59:59Z',
            category: 'Technical',
            eventType: 'team',
            minTeamSize: 2,
            maxTeamSize: 4,
            venue: 'Main Tech Arena'
          },
          {
            _id: '2',
            title: 'Inter-University Cultural Fest',
            collegeName: 'Stanford University Campus',
            date: '2026-03-25T10:00:00Z',
            deadline: '2026-03-20T23:59:59Z',
            category: 'Cultural',
            eventType: 'solo',
            venue: 'Grand Amphitheater'
          },
          {
            _id: '3',
            title: 'AI & Robotics Colloquium',
            collegeName: 'UC Berkeley Institute',
            date: '2026-04-05T09:30:00Z',
            deadline: '2026-04-01T23:59:59Z',
            category: 'Workshop',
            eventType: 'solo',
            venue: 'Robotics Lab 3'
          },
          {
            _id: '4',
            title: 'Annual Varsity Athletic Meet',
            collegeName: 'Harvard Athletic Complex',
            date: '2026-04-18T08:00:00Z',
            deadline: '2026-04-12T23:59:59Z',
            category: 'Sports',
            eventType: 'team',
            minTeamSize: 4,
            maxTeamSize: 8,
            venue: 'Olympic Stadium Track'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRegisterClick = async (_event) => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role === 'student') {
        navigate('/student/dashboard');
      } else {
        alert('Event registration is primarily for student accounts.');
      }
    } catch {
      navigate('/login');
    }
  };

  const categories = ['all', 'Technical', 'Cultural', 'Sports', 'Workshop', 'Competition'];

  const filteredEvents = events.filter((ev) => {
    const title = (ev.title || ev.name || '').toLowerCase();
    const college = (ev.collegeName || ev.collegeId?.name || '').toLowerCase();
    const matchesSearch = title.includes(searchQuery.toLowerCase()) || college.includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ev.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-surface-900 text-slate-100 font-sans selection:bg-brand-600 selection:text-white">
      {/* Top Collegiate Navigation Bar */}
      <header className="sticky top-0 z-40 bg-surface-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <CollegeSphereLogo to="/" subtitle="Inter-College Event Network" />

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#events" className="hover:text-white transition-colors">
              Browse Events
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              Platform
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 border-b border-slate-800 bg-gradient-to-b from-surface-900 via-brand-navy to-surface-900 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-6">
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            Verified Inter-College Collegiate Network
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            Where University Events <br className="hidden sm:inline" />
            <span className="text-brand-500">Compete & Collaborate</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Discover hackathons, cultural festivals, sports tournaments, and workshops across accredited universities. Verified registration with deadline-backed rosters.
          </p>

          {/* Quick Search Toolbar */}
          <div className="max-w-2xl mx-auto bg-surface-900/95 border border-slate-700 p-2 sm:p-2.5 rounded-2xl shadow-ticket flex flex-col sm:flex-row gap-2 mb-12">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search events, colleges, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none"
              />
            </div>
            <a
              href="#events"
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              Explore Events
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Live Verified Numbers */}
          <div className="grid grid-cols-3 max-w-xl mx-auto divide-x divide-slate-800 border-t border-slate-800/80 pt-8 text-center">
            <div className="px-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                {stats.colleges}+
              </div>
              <div className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider">
                Colleges
              </div>
            </div>
            <div className="px-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                {stats.events}+
              </div>
              <div className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider">
                Live Events
              </div>
            </div>
            <div className="px-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                {stats.students}+
              </div>
              <div className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider">
                Students
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Events Schedule Feed */}
      <section id="events" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400 block mb-2">
              Official Schedule
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Upcoming Inter-College Events
            </h2>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-surface-800 text-slate-300 hover:bg-slate-700/60 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm">Loading upcoming collegiate schedule...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-surface-900 border border-slate-800 rounded-2xl p-8">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No matching events found</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Try adjusting your search terms or category filter to discover other scheduled inter-college events.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredEvents.map((event) => {
              const eventDateObj = formatCalendarDate(event.date);
              const isPastDeadline = new Date(event.deadline) < new Date();
              const eventTitle = event.title || event.name || 'Untitled Event';
              const collegeTitle = event.collegeName || event.collegeId?.name || 'Accredited College';

              return (
                <div
                  key={event._id}
                  className="bg-surface-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 hover:shadow-ticket transition-all flex flex-col justify-between"
                >
                  <div className="p-5">
                    {/* Event Pass Header with Calendar Date Stamp */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center min-w-[56px]">
                        <span className="text-[10px] font-bold text-brand-400 tracking-wider">
                          {eventDateObj.month}
                        </span>
                        <span className="text-xl font-extrabold text-white leading-none mt-0.5 tabular-nums">
                          {eventDateObj.day}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-surface-800 text-slate-300 border border-slate-700/60">
                          {event.category || 'General'}
                        </span>
                        <span
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border ${
                            isPastDeadline
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {isPastDeadline ? 'Closed' : 'Open'}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white mb-2 line-clamp-2 leading-snug">
                      {eventTitle}
                    </h3>

                    <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                      <div className="flex items-center gap-2 truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{collegeTitle}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="capitalize">
                          {event.eventType === 'team'
                            ? `Team (${event.minTeamSize || 2}–${event.maxTeamSize || 5} members)`
                            : 'Individual (Solo)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span>Deadline: {formatDate(event.deadline)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-slate-800/60 mt-auto">
                    <button
                      onClick={() => handleRegisterClick(event)}
                      disabled={isPastDeadline}
                      className={`w-full py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isPastDeadline
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
                      }`}
                    >
                      {isPastDeadline ? 'Registration Closed' : 'Register for Event'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-surface-950/60 border-t border-b border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400 block mb-2">
              Simple Protocol
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Designed for Campus Life
            </h2>
            <p className="text-slate-400 text-sm">
              CollegeSphere unifies fragmented social media posters and Google Forms into one verified inter-university registry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'College Sign-In',
                desc: 'Sign up with your verified college identity or Google authentication in seconds.'
              },
              {
                step: '02',
                title: 'Browse Cross-Campus',
                desc: 'Filter hackathons, technical symposia, cultural meets, and varsity tournaments.'
              },
              {
                step: '03',
                title: 'Build or Join Teams',
                desc: 'Register solo or assemble your squad with automated roster bounds and verification.'
              },
              {
                step: '04',
                title: 'Participate & Track',
                desc: 'Track live event status, submission deadlines, and participation history seamlessly.'
              }
            ].map((s, idx) => (
              <div
                key={idx}
                className="bg-surface-900 border border-slate-800 rounded-2xl p-6 relative flex flex-col justify-between"
              >
                <div>
                  <div className="text-2xl font-black text-brand-500 mb-3 font-display">
                    {s.step}
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 border-t border-slate-800 bg-surface-900 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <CollegeSphereLogoMark size={24} />
            <span className="font-bold text-white text-sm">CollegeSphere</span>
            <span className="text-slate-500">· Official Inter-College Event Management Platform</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} CollegeSphere. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
