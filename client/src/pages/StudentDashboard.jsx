import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Trophy,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  LogOut,
  User,
  GraduationCap,
  Menu,
  X as CloseIcon,
  AlertCircle,
  MapPin,
  Building2,
  BookmarkCheck,
  RefreshCw
} from 'lucide-react';
import api from '../api/axios';
import { formatDate } from '../utils/formatDate';
import PosterPreviewModal from '../components/common/PosterPreviewModal';
import ProfileEditModal from '../components/common/ProfileEditModal';
import ProfileSection from '../components/common/ProfileSection';
import StatCard from '../components/common/StatCard';
import TeamRegistrationModal from '../components/events/TeamRegistrationModal';
import EventCard from '../components/events/EventCard';
import AIChatWidget from '../components/ai/AIChatWidget';

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, deadlines: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingEvents, setProcessingEvents] = useState({});

  // Active navigation tab: 'events' | 'registrations'
  const [activeTab, setActiveTab] = useState('events');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showMyCollegeOnly, setShowMyCollegeOnly] = useState(false);

  // Modals state
  const [posterPreview, setPosterPreview] = useState({ isOpen: false, url: '', title: '' });
  const [profileEditModal, setProfileEditModal] = useState(false);
  const [teamRegModal, setTeamRegModal] = useState({ isOpen: false, event: null });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      window.location.href = '/login';
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchDashboardData();
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMyCollegeOnly]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Fetch colleges
      try {
        const { data: collegesData } = await api.get('/api/college/all');
        setColleges(collegesData.colleges || collegesData || []);
      } catch (err) {
        console.error('Error fetching colleges:', err);
      }

      // 2. Fetch events
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const collegeId = userData?.collegeId;

      let eventsUrl = '/api/event/AllEvents';
      if (showMyCollegeOnly && collegeId) {
        eventsUrl = `/api/event/college/${collegeId}`;
      }

      try {
        const { data: eventsData } = await api.get(eventsUrl);
        setUpcomingEvents(eventsData.events || eventsData || []);
      } catch (err) {
        console.error('Error fetching events:', err);
      }

      // 3. Fetch student registrations
      try {
        const { data: regData } = await api.get('/api/registration/my-registrations');
        const rawRegistrations = regData.registrations || regData || [];

        const mappedRegistrations = rawRegistrations.map((reg) => ({
          ...reg,
          eventName: reg.event?.title || reg.eventName || 'Event',
          collegeName: reg.event?.collegeId?.name || reg.collegeName || 'Accredited University',
          eventDate: reg.event?.date || reg.eventDate || reg.date,
          deadline: reg.event?.deadline || reg.deadline,
          status: reg.status || 'registered'
        }));

        setMyRegistrations(mappedRegistrations);

        // Stats calculation
        const now = new Date();
        const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

        setStats({
          total: mappedRegistrations.length,
          upcoming: mappedRegistrations.filter((r) => new Date(r.eventDate) > now).length,
          deadlines: mappedRegistrations.filter((r) => {
            const eventDate = new Date(r.eventDate);
            return eventDate > now && eventDate <= twoDaysFromNow;
          }).length
        });
      } catch (err) {
        console.error('Error fetching registrations:', err);
      }
    } catch (err) {
      setError('Unable to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    const event = upcomingEvents.find((e) => e._id === eventId);
    if (event && event.eventType === 'team') {
      setTeamRegModal({ isOpen: true, event });
      return;
    }

    const token = localStorage.getItem('token');
    setProcessingEvents((prev) => ({ ...prev, [eventId]: true }));

    try {
      await api.post(`/api/registration/register/${eventId}`);
      setUpcomingEvents((prev) =>
        prev.map((e) => (e._id === eventId ? { ...e, isRegistered: true } : e))
      );
      fetchDashboardData(token);
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Registration failed.');
    } finally {
      setProcessingEvents((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  const handleTeamRegister = async (eventId, teamData) => {
    const token = localStorage.getItem('token');
    setProcessingEvents((prev) => ({ ...prev, [eventId]: true }));

    try {
      await api.post(`/api/registration/register/${eventId}`, teamData);
      setUpcomingEvents((prev) =>
        prev.map((e) => (e._id === eventId ? { ...e, isRegistered: true } : e))
      );
      setTeamRegModal({ isOpen: false, event: null });
      fetchDashboardData(token);
      alert('Team registered successfully!');
    } catch (err) {
      throw new Error(err.response?.data?.message || err.response?.data?.error || 'Team registration failed');
    } finally {
      setProcessingEvents((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  const handleCancelRegistration = async (registrationId) => {
    if (!window.confirm('Are you sure you want to cancel this event registration?')) return;

    try {
      await api.delete(`/api/registration/cancel/${registrationId}`);
      setMyRegistrations((prev) => prev.filter((r) => r._id !== registrationId));
      setStats((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      const token = localStorage.getItem('token');
      fetchDashboardData(token);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel registration');
    }
  };

  const handleSaveProfile = async (data, type) => {
    const endpoint = type === 'profile' ? '/api/auth/profile' : '/api/auth/password';
    const { data: result } = await api.put(endpoint, data);

    if (type === 'profile') {
      const updatedUser = { ...user, name: result.user?.name || data.name };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setProfileEditModal(false);
      alert('Profile name updated successfully!');
    } else {
      setProfileEditModal(false);
      alert('Password updated successfully!');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  // Filter evaluation
  const registeredEventIds = new Set(myRegistrations.map((r) => r.event?._id || r.event));

  const filteredEvents = upcomingEvents.filter((event) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      (event.title || event.name || '').toLowerCase().includes(searchLower) ||
      (event.description || '').toLowerCase().includes(searchLower) ||
      (event.collegeName || event.collegeId?.name || '').toLowerCase().includes(searchLower) ||
      (event.venue || '').toLowerCase().includes(searchLower) ||
      (event.category || '').toLowerCase().includes(searchLower);

    const matchesCollege =
      selectedCollege === 'all' ||
      event.collegeId?._id === selectedCollege ||
      event.collegeId === selectedCollege;

    const matchesCategory =
      selectedCategory === 'all' || event.category === selectedCategory;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const now = new Date();
      const eventDate = new Date(event.date);
      if (dateFilter === 'upcoming') matchesDate = eventDate > now;
      else if (dateFilter === 'thisWeek') {
        const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        matchesDate = eventDate > now && eventDate <= week;
      } else if (dateFilter === 'thisMonth') {
        const month = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        matchesDate = eventDate > now && eventDate <= month;
      }
    }

    const isReg = registeredEventIds.has(event._id) || event.isRegistered;
    const isClosed = new Date(event.deadline || event.registrationDeadline) < new Date();
    let matchesStatus = true;
    if (filterStatus === 'open') matchesStatus = !isClosed && !isReg;
    else if (filterStatus === 'closed') matchesStatus = isClosed;
    else if (filterStatus === 'registered') matchesStatus = isReg;

    return matchesSearch && matchesCollege && matchesCategory && matchesDate && matchesStatus;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCollege('all');
    setSelectedCategory('all');
    setDateFilter('all');
    setFilterStatus('all');
  };

  const activeFiltersCount = [
    searchQuery !== '',
    selectedCollege !== 'all',
    selectedCategory !== 'all',
    dateFilter !== 'all',
    filterStatus !== 'all'
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-surface-900 text-slate-100 font-sans selection:bg-brand-600 selection:text-white pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-surface-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <Link to="/student/dashboard" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex-shrink-0 flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-extrabold text-lg text-white tracking-tight leading-tight">
                CollegeSphere
              </span>
              <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider leading-none mt-0.5">
                Student Portal
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'events'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              Discover Events
            </button>
            <button
              onClick={() => setActiveTab('registrations')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'registrations'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <span>My Registrations</span>
              {stats.total > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-950 font-bold tabular-nums">
                  {stats.total}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile & ID</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-brand-500 bg-brand-500/15 text-white shadow-sm'
                  : 'border-slate-800 bg-surface-800 hover:bg-slate-700/60 text-slate-200'
              }`}
              title="View Academic Profile"
            >
              <div className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-[11px]">
                {user?.name?.[0]?.toUpperCase() || 'S'}
              </div>
              <span className="hidden sm:inline">{user?.name || 'Student'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-500/20"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Personalized Welcome Row & Top Metrics (Shown on events / registrations tabs) */}
        {activeTab !== 'profile' && (
          <>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Welcome back, {user?.name || 'Student'} 👋
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Explore inter-college schedules, manage active event registrations, and track entry passes.
                </p>
              </div>

              <button
                onClick={() => fetchDashboardData(localStorage.getItem('token'))}
                className="self-start sm:self-auto px-3.5 py-2 bg-surface-800 hover:bg-slate-700/60 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Sync Data</span>
              </button>
            </div>

            {/* Stat Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
              <div className="bg-surface-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Event Registrations</span>
                  <div className="p-2 bg-brand-500/10 text-brand-400 rounded-xl">
                    <Trophy className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white tracking-tight font-mono">
                    {stats.total}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Active Event Entry Passes</p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{myRegistrations.filter((r) => r.isTeamRegistration).length} Team</span>
                  <span>{myRegistrations.filter((r) => !r.isTeamRegistration).length} Solo Passes</span>
                </div>
              </div>

              <div className="bg-surface-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Confirmed Participation</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white tracking-tight font-mono">
                    {stats.upcoming}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Upcoming Campus Dates</p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 font-semibold">Confirmed</span>
                  <span className="text-slate-500">Active Schedule</span>
                </div>
              </div>

              <div className="bg-surface-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Registration Deadlines</span>
                  <div className={`p-2 rounded-xl ${stats.deadlines > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-surface-800 text-slate-400'}`}>
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white tracking-tight font-mono">
                    {stats.deadlines}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Approaching Cutoffs</p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className={stats.deadlines > 0 ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                    {stats.deadlines > 0 ? 'Closing in ≤ 48 hours' : 'No Urgent Deadlines'}
                  </span>
                  <span className="text-slate-500">Live Entries</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tab 1: Discover Events */}
        {activeTab === 'events' && (
          <section className="space-y-6">
            {/* Filter & Search Toolbar */}
            <div className="bg-surface-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search events by title, description, or venue..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <select
                    value={selectedCollege}
                    onChange={(e) => setSelectedCollege(e.target.value)}
                    className="px-3 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
                  >
                    <option value="all">All Colleges</option>
                    {colleges.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
                  >
                    <option value="all">All Categories</option>
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Competition">Competition</option>
                  </select>

                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
                  >
                    <option value="all">All Dates</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="thisWeek">This Week</option>
                    <option value="thisMonth">This Month</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
                  >
                    <option value="all">All Statuses</option>
                    <option value="open">Open for Reg.</option>
                    <option value="registered">Registered</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={showMyCollegeOnly}
                      onChange={(e) => setShowMyCollegeOnly(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-600"
                    />
                    <span>My college only</span>
                  </label>

                  <span className="text-slate-500">
                    Showing <strong className="text-white tabular-nums">{filteredEvents.length}</strong> event pass(es)
                  </span>
                </div>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reset Filters ({activeFiltersCount})
                  </button>
                )}
              </div>
            </div>

            {/* Events Grid */}
            {loading ? (
              <div className="py-24 text-center text-slate-400">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs">Loading event schedule...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-20 bg-surface-900 border border-slate-800 rounded-2xl p-8">
                <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">No matching events</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  We could not find any events matching your selected filters. Try broadening your criteria.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-surface-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    onRegister={handleRegister}
                    onPreviewPoster={(url, title) => setPosterPreview({ isOpen: true, url, title })}
                    isRegistered={registeredEventIds.has(event._id) || event.isRegistered}
                    isProcessing={Boolean(processingEvents[event._id])}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 2: My Registrations View */}
        {activeTab === 'registrations' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">My Active Event Registrations</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your registered passes, team member details, and cancellation options.
                </p>
              </div>
            </div>

            {myRegistrations.length === 0 ? (
              <div className="text-center py-20 bg-surface-900 border border-slate-800 rounded-2xl p-8">
                <BookmarkCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">No event registrations found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  You haven't signed up for any inter-college events yet. Browse the schedule to get started.
                </p>
                <button
                  onClick={() => setActiveTab('events')}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Browse Available Events
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myRegistrations.map((reg) => {
                  const regId = reg._id || reg.id;
                  const eventObj = reg.event || {};
                  const eventName = reg.eventName || eventObj.title || eventObj.name || 'Event';
                  const collegeName = reg.collegeName || eventObj.collegeId?.name || 'Partner College';
                  const venue = eventObj.venue || reg.venue || 'Campus Venue';
                  const eventDate = reg.eventDate || eventObj.date;

                  return (
                    <div
                      key={regId}
                      className="bg-surface-900 border border-slate-800 rounded-2xl shadow-sm flex flex-col md:flex-row overflow-hidden hover:border-slate-700 transition-all group"
                    >
                      {/* Left Ticket Header Stub */}
                      <div className="bg-surface-950/70 p-5 sm:p-6 md:w-3/4 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-brand-500/15 text-brand-300 border border-brand-500/30">
                            Academic Entry Pass
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            PASS-{regId.slice(-6).toUpperCase()}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition-colors">
                          {eventName}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            {collegeName}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {formatDate(eventDate)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {venue}
                          </span>
                        </div>

                        {reg.isTeamRegistration && reg.teamName && (
                          <div className="text-xs text-brand-300 pt-1">
                            Team Roster: <strong className="text-white">{reg.teamName}</strong> ({reg.participants?.length || 0} members)
                          </div>
                        )}
                      </div>

                      {/* Perforated Stub Divider & Action Area */}
                      <div className="border-t md:border-t-0 md:border-l border-dashed border-slate-800 p-5 sm:p-6 md:w-1/4 flex flex-col justify-between items-start md:items-end bg-surface-900">
                        <div className="text-left md:text-right">
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
                            Participation Standing
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 mt-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Confirmed
                          </span>
                        </div>

                        <button
                          onClick={() => handleCancelRegistration(regId)}
                          className="mt-4 md:mt-0 w-full md:w-auto px-3.5 py-1.5 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                        >
                          Cancel Pass
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Collegiate Profile & Academic ID */}
        {activeTab === 'profile' && (
          <ProfileSection
            user={user}
            collegeName={
              colleges.find((c) => c._id === user?.collegeId || c._id === user?.collegeId?._id)?.name ||
              user?.collegeName ||
              user?.collegeId?.name ||
              'Accredited University'
            }
            roleTitle="Student Scholar"
            roleDescription="Verified Academic Member"
            stats={[
              { label: 'Event Entries', value: stats.total, icon: Trophy, subtext: 'Registered' },
              { label: 'Upcoming', value: stats.upcoming, icon: Calendar, subtext: 'Confirmed' },
              { label: 'Deadlines', value: stats.deadlines, icon: Clock, subtext: 'Within 48h' }
            ]}
            onSaveProfile={handleSaveProfile}
            accentColor="brand"
          />
        )}
      </main>

      {/* Extracted Shared Modals */}
      <PosterPreviewModal
        isOpen={posterPreview.isOpen}
        onClose={() => setPosterPreview({ isOpen: false, url: '', title: '' })}
        posterUrl={posterPreview.url}
        title={posterPreview.title}
      />

      <ProfileEditModal
        isOpen={profileEditModal}
        onClose={() => setProfileEditModal(false)}
        user={user}
        onSave={handleSaveProfile}
      />

      <TeamRegistrationModal
        isOpen={teamRegModal.isOpen}
        onClose={() => setTeamRegModal({ isOpen: false, event: null })}
        event={teamRegModal.event}
        onRegister={handleTeamRegister}
      />

      {/* SphereAI Copilot Widget */}
      <AIChatWidget userRole="student" userName={user?.name} />
    </div>
  );
}
