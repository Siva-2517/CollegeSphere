import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  User,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Download,
  Search,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import api from '../api/axios';
import { formatDate } from '../utils/formatDate';
import PosterPreviewModal from '../components/common/PosterPreviewModal';
import ProfileEditModal from '../components/common/ProfileEditModal';
import ProfileSection from '../components/common/ProfileSection';
import StatCard from '../components/common/StatCard';
import EventModal from '../components/events/EventModal';
import AIChatWidget from '../components/ai/AIChatWidget';

export default function OrganizerDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'registrations'
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, upcomingDeadlines: 0, totalRegistrations: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventFilter, setSelectedEventFilter] = useState('all');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [posterPreview, setPosterPreview] = useState({ isOpen: false, url: '', title: '' });
  const [profileEditModal, setProfileEditModal] = useState(false);

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
      fetchDashboardData(token, parsedUser);
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async (token, userData) => {
    setLoading(true);
    setError('');

    try {
      // 1. Fetch colleges
      try {
        const { data: collegesData } = await api.get('/api/college/all');
        setColleges(collegesData.colleges || collegesData || []);
      } catch (e) {
        console.error('Error fetching colleges:', e);
      }

      // 2. Fetch organizer's events
      let fetchedEvents = [];
      try {
        const currentUser = userData || user || JSON.parse(localStorage.getItem('user') || '{}');
        const eventUrl = currentUser?.role === 'organizer' ? '/api/event/my-events' : '/api/event/AllEvents';
        const { data: eventsData } = await api.get(eventUrl);
        fetchedEvents = eventsData.events || (Array.isArray(eventsData) ? eventsData : []);
        setEvents(fetchedEvents);
      } catch (e) {
        console.error('Error fetching organizer events:', e);
      }

      // 3. Fetch registrations for all owned events
      let allRegistrations = [];
      if (fetchedEvents.length > 0) {
        try {
          const regPromises = fetchedEvents.map((evt) => {
            const eventId = evt._id || evt.id;
            return api
              .get(`/api/registration/event/${eventId}`)
              .then((res) => {
                const regs = res.data.registrations || res.data || [];
                return regs.map((r) => ({
                  ...r,
                  eventName: evt.title || evt.name,
                  eventId: eventId,
                  studentName: r.user?.name || r.student?.name || r.name || 'Student',
                  studentEmail: r.user?.email || r.student?.email || r.email || 'N/A',
                  studentCollege: r.user?.collegeId?.name || r.student?.collegeId?.name || r.collegeName || 'N/A'
                }));
              })
              .catch(() => []);
          });

          const results = await Promise.all(regPromises);
          allRegistrations = results.flat();
          setRegistrations(allRegistrations);
        } catch (e) {
          console.error('Error fetching registrations:', e);
        }
      }

      // 4. Calculate stats
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const upcomingDeadlinesCount = fetchedEvents.filter((e) => {
        const d = new Date(e.registrationDeadline || e.deadline);
        return d > now && d <= threeDaysFromNow;
      }).length;

      setStats({
        totalEvents: fetchedEvents.length,
        upcomingDeadlines: upcomingDeadlinesCount,
        totalRegistrations: allRegistrations.length
      });
    } catch (err) {
      setError('Unable to load organizer workspace data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateEvent = async (eventData) => {
    const token = localStorage.getItem('token');

    if (editingEvent) {
      // Edit mode: plain JSON with both deadline and registrationDeadline for backend compatibility
      const updatePayload = {
        ...eventData,
        deadline: eventData.registrationDeadline || eventData.deadline
      };
      await api.put(`/api/event/${editingEvent._id}`, updatePayload);
      alert('Event details updated successfully!');
    } else {
      // Create mode: FormData multipart upload for poster
      const formData = new FormData();
      formData.append('title', eventData.title);
      formData.append('date', eventData.date);
      formData.append('venue', eventData.venue);
      formData.append('registrationDeadline', eventData.registrationDeadline);
      formData.append('description', eventData.description);
      formData.append('collegeId', eventData.collegeId);
      formData.append('category', eventData.category);
      formData.append('eventType', eventData.eventType);

      if (eventData.eventType === 'team') {
        if (eventData.minTeamSize) formData.append('minTeamSize', eventData.minTeamSize);
        if (eventData.maxTeamSize) formData.append('maxTeamSize', eventData.maxTeamSize);
      }

      if (eventData.poster) {
        formData.append('poster', eventData.poster);
      }

      await api.post('/api/event/create', formData);
      alert('Event submitted successfully! Awaiting College Admin approval.');
    }

    setIsModalOpen(false);
    setEditingEvent(null);
    fetchDashboardData(token, user);
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) return;
    try {
      await api.delete(`/api/event/${eventId}`);
      setEvents((prev) => prev.filter((e) => e._id !== eventId));
      setStats((prev) => ({ ...prev, totalEvents: Math.max(0, prev.totalEvents - 1) }));
      const token = localStorage.getItem('token');
      fetchDashboardData(token, user);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete event');
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
      alert('Profile updated successfully!');
    } else {
      setProfileEditModal(false);
      alert('Password updated successfully!');
    }
  };

  // CSV Export Algorithm with Team Flattening
  const handleExportCSV = () => {
    const dataToExport =
      selectedEventFilter === 'all'
        ? registrations
        : registrations.filter((r) => r.eventId === selectedEventFilter || r.event?._id === selectedEventFilter);

    if (dataToExport.length === 0) {
      alert('No registrations found for the selected filter.');
      return;
    }

    const csvRows = [];
    csvRows.push([
      'Student Name',
      'Email',
      'College',
      'Event',
      'Event Type',
      'Team Name',
      'Team Member Name',
      'Team Member Email',
      'Registration Date'
    ]);

    dataToExport.forEach((r) => {
      if (r.isTeamRegistration && r.participants && r.participants.length > 0) {
        r.participants.forEach((participant, idx) => {
          csvRows.push([
            idx === 0 ? r.studentName || 'N/A' : '',
            idx === 0 ? r.studentEmail || 'N/A' : '',
            idx === 0 ? r.studentCollege || 'N/A' : '',
            idx === 0 ? r.eventName || 'N/A' : '',
            idx === 0 ? 'Team' : '',
            idx === 0 ? r.teamName || 'N/A' : '',
            participant.name || 'N/A',
            participant.email || 'N/A',
            idx === 0 ? formatDate(r.registeredAt || r.createdAt) : ''
          ]);
        });
      } else {
        csvRows.push([
          r.studentName || 'N/A',
          r.studentEmail || 'N/A',
          r.studentCollege || 'N/A',
          r.eventName || 'N/A',
          'Solo',
          '',
          '',
          '',
          formatDate(r.registeredAt || r.createdAt)
        ]);
      }
    });

    const csvContent = csvRows
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      )
      .join('\n');

    const filename =
      selectedEventFilter === 'all'
        ? 'all_events_roster'
        : events.find((e) => e._id === selectedEventFilter)?.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'event';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roster_${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredRegistrations = registrations.filter((r) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      (r.studentName || '').toLowerCase().includes(searchLower) ||
      (r.studentEmail || '').toLowerCase().includes(searchLower) ||
      (r.eventName || '').toLowerCase().includes(searchLower) ||
      (r.teamName || '').toLowerCase().includes(searchLower);

    const matchesEvent =
      selectedEventFilter === 'all' ||
      r.eventId === selectedEventFilter ||
      r.event?._id === selectedEventFilter;

    return matchesSearch && matchesEvent;
  });

  return (
    <div className="min-h-screen bg-surface-900 text-slate-100 font-sans selection:bg-brand-600 selection:text-white pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-surface-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <Link to="/organizer/dashboard" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex-shrink-0 flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-extrabold text-lg text-white tracking-tight leading-tight">
                CollegeSphere
              </span>
              <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider leading-none mt-0.5">
                Organizer Workspace
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
              Managed Events ({events.length})
            </button>
            <button
              onClick={() => setActiveTab('registrations')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'registrations'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <span>Participant Rosters</span>
              {registrations.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-950 font-bold tabular-nums">
                  {registrations.length}
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
              <span>Organizer Profile</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingEvent(null);
                setIsModalOpen(true);
              }}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Event</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-brand-500 bg-brand-500/15 text-white shadow-sm'
                  : 'border-slate-800 bg-surface-800 hover:bg-slate-700/60 text-slate-200'
              }`}
              title="View Organizer Profile"
            >
              <div className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-[11px]">
                {user?.name?.[0]?.toUpperCase() || 'O'}
              </div>
              <span className="hidden sm:inline">{user?.name || 'Organizer'}</span>
            </button>

            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
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

        {/* Organizer Header & Top Metrics (Shown on events / registrations tabs) */}
        {activeTab !== 'profile' && (
          <>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Event Management & Rosters
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Create inter-college events, monitor admin approvals, inspect team participants, and export verified rosters.
                </p>
              </div>

              <button
                onClick={() => fetchDashboardData(localStorage.getItem('token'), user)}
                className="self-start sm:self-auto px-3.5 py-2 bg-surface-800 hover:bg-slate-700/60 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Workspace</span>
              </button>
            </div>

            {/* Metric Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {/* Card 1: Created Events */}
              <div className="bg-surface-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Created Events</span>
                  <div className="p-2 bg-brand-500/10 text-brand-400 rounded-xl">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white tracking-tight font-mono">
                    {stats.totalEvents}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Active Event Portfolios</p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 font-semibold">
                    {events.filter((e) => e.isApproved !== false).length} Published
                  </span>
                  <span className="text-amber-400 font-semibold">
                    {events.filter((e) => e.isApproved === false).length} Pending Review
                  </span>
                </div>
              </div>

              {/* Card 2: Total Participants */}
              <div className="bg-surface-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Total Participants</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white tracking-tight font-mono">
                    {stats.totalRegistrations}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Across All Owned Events</p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{registrations.filter((r) => r.isTeamRegistration).length} Team Registrations</span>
                  <span>{registrations.filter((r) => !r.isTeamRegistration).length} Solo Attendees</span>
                </div>
              </div>

              {/* Card 3: Deadlines Imminent */}
              <div className="bg-surface-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Deadlines Imminent</span>
                  <div className={`p-2 rounded-xl ${stats.upcomingDeadlines > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-surface-800 text-slate-400'}`}>
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white tracking-tight font-mono">
                    {stats.upcomingDeadlines}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Registration Cutoffs</p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className={stats.upcomingDeadlines > 0 ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                    {stats.upcomingDeadlines > 0 ? 'Closing in ≤ 72 hours' : 'No Urgent Deadlines'}
                  </span>
                  <span className="text-slate-500">Live Roster</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tab 1: Managed Events */}
        {activeTab === 'events' && (() => {
          const filteredEvents = events.filter((evt) => {
            const q = eventSearchQuery.toLowerCase();
            const matchQ =
              (evt.title || evt.name || '').toLowerCase().includes(q) ||
              (evt.venue || '').toLowerCase().includes(q) ||
              (evt.category || '').toLowerCase().includes(q);
            const isApproved = evt.isApproved !== false;
            const deadlinePassed = new Date(evt.registrationDeadline || evt.deadline) < new Date();
            const matchStatus =
              eventStatusFilter === 'all' ||
              (eventStatusFilter === 'published' && isApproved && !deadlinePassed) ||
              (eventStatusFilter === 'pending' && !isApproved) ||
              (eventStatusFilter === 'closed' && deadlinePassed);
            return matchQ && matchStatus;
          });

          return (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Event Directory & Approval Status ({events.length})</h2>
                  <p className="text-xs text-slate-400">Track event publication states, manage details, and inspect dates.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 pointer-events-none text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search title, venue..."
                      value={eventSearchQuery}
                      onChange={(e) => setEventSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
                    />
                  </div>
                  <select
                    value={eventStatusFilter}
                    onChange={(e) => setEventStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600 cursor-pointer"
                  >
                    <option value="all">All Events ({events.length})</option>
                    <option value="published">Published ({events.filter((e) => e.isApproved !== false && new Date(e.registrationDeadline || e.deadline) >= new Date()).length})</option>
                    <option value="pending">Pending ({events.filter((e) => e.isApproved === false).length})</option>
                    <option value="closed">Closed ({events.filter((e) => new Date(e.registrationDeadline || e.deadline) < new Date()).length})</option>
                  </select>
                  <button
                    onClick={() => {
                      setEditingEvent(null);
                      setIsModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Event</span>
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="py-20 text-center text-slate-400">
                  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs">Loading organizer portfolio...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-20 bg-surface-900 border border-slate-800 rounded-2xl p-8">
                  <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">No events created yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                    Draft your first inter-college event to open registrations for students across campuses.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Create New Event
                  </button>
                </div>
              ) : (
                <div className="bg-surface-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-800/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3.5 px-4">Event Title</th>
                          <th className="py-3.5 px-4">Event Date</th>
                          <th className="py-3.5 px-4">Reg. Deadline</th>
                          <th className="py-3.5 px-4">Type</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {filteredEvents.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-12 text-center text-slate-400">
                              <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                              <p className="text-xs font-semibold text-white">No matching events found</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                No events match "{eventSearchQuery}" under {eventStatusFilter} status.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          filteredEvents.map((evt) => {
                            const isApproved = evt.isApproved !== false;
                            const deadlinePassed = new Date(evt.registrationDeadline || evt.deadline) < new Date();

                            return (
                              <tr key={evt._id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="py-3.5 px-4 font-semibold text-white">
                                  <div className="flex items-center gap-2.5">
                                    <span>{evt.title || evt.name}</span>
                                    {evt.poster && (
                                      <button
                                        onClick={() =>
                                          setPosterPreview({
                                            isOpen: true,
                                            url: evt.poster,
                                            title: evt.title || evt.name
                                          })
                                        }
                                        className="text-slate-400 hover:text-brand-400 cursor-pointer"
                                        title="Preview Poster"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
                                    {evt.category} · {evt.venue}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-slate-300 tabular-nums">
                                  {formatDate(evt.date)}
                                </td>
                                <td className="py-3.5 px-4 text-slate-300 tabular-nums">
                                  {formatDate(evt.registrationDeadline || evt.deadline)}
                                </td>
                                <td className="py-3.5 px-4 capitalize text-slate-300">
                                  {evt.eventType || 'solo'}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                      !isApproved
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        : deadlinePassed
                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    }`}
                                  >
                                    {!isApproved ? 'Pending Approval' : deadlinePassed ? 'Closed' : 'Published'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingEvent(evt);
                                        setIsModalOpen(true);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                      title="Edit Event Details"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteEvent(evt._id, evt.title || evt.name)}
                                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                      title="Delete Event"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          );
        })()}

        {/* Tab 2: Participant Rosters */}
        {activeTab === 'registrations' && (
          <section className="space-y-6">
            <div className="bg-surface-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search attendee by name, email, or team..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>

                <select
                  value={selectedEventFilter}
                  onChange={(e) => setSelectedEventFilter(e.target.value)}
                  className="w-full sm:w-60 px-3 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
                >
                  <option value="all">All Managed Events</option>
                  {events.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.title || e.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleExportCSV}
                disabled={filteredRegistrations.length === 0}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Verified CSV</span>
              </button>
            </div>

            {filteredRegistrations.length === 0 ? (
              <div className="text-center py-20 bg-surface-900 border border-slate-800 rounded-2xl p-8">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">
                  {searchQuery || selectedEventFilter !== 'all' ? 'No matching attendees found' : 'No registrations recorded yet'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchQuery || selectedEventFilter !== 'all'
                    ? `No registrations match your search criteria. Try clearing search or event filter.`
                    : 'Registrations for your events will appear here with team structures and participant rosters.'}
                </p>
                {(searchQuery || selectedEventFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedEventFilter('all');
                    }}
                    className="mt-3 px-3.5 py-1.5 bg-surface-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-xl cursor-pointer"
                  >
                    Reset Roster Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-surface-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-800/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">Student / Lead</th>
                        <th className="py-3.5 px-4">College</th>
                        <th className="py-3.5 px-4">Event</th>
                        <th className="py-3.5 px-4">Mode / Team</th>
                        <th className="py-3.5 px-4">Registration Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredRegistrations.map((r, i) => (
                        <tr key={r._id || i} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-white">
                            <div>{r.studentName}</div>
                            <span className="text-[11px] text-slate-400 font-normal">{r.studentEmail}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">{r.studentCollege}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-200">{r.eventName}</td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {r.isTeamRegistration ? (
                              <div>
                                <span className="font-semibold text-brand-300">{r.teamName || 'Team'}</span>
                                <span className="text-[11px] text-slate-400 block">
                                  ({r.participants?.length || 0} members)
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">Solo Participant</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 tabular-nums">
                            {formatDate(r.registeredAt || r.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Certified Organizer Profile & Credentials */}
        {activeTab === 'profile' && (
          <ProfileSection
            user={user}
            collegeName={
              colleges.find((c) => c._id === user?.collegeId || c._id === user?.collegeId?._id)?.name ||
              user?.collegeName ||
              user?.collegeId?.name ||
              'Affiliated Institution'
            }
            roleTitle="Event Lead / Organizer"
            roleDescription="Authorized Collegiate Organizer"
            stats={[
              { label: 'Events Hosted', value: stats.totalEvents, icon: Calendar, subtext: 'Created & Published' },
              { label: 'Deadlines', value: stats.upcomingDeadlines, icon: Clock, subtext: 'Closing in ≤ 72h' },
              { label: 'Total Attendees', value: stats.totalRegistrations, icon: Users, subtext: 'Across All Events' }
            ]}
            onSaveProfile={handleSaveProfile}
            accentColor="brand"
          />
        )}
      </main>

      {/* Event Creation & Edit Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
        onSave={handleCreateOrUpdateEvent}
        colleges={colleges}
      />

      {/* Poster Preview Modal */}
      <PosterPreviewModal
        isOpen={posterPreview.isOpen}
        onClose={() => setPosterPreview({ isOpen: false, url: '', title: '' })}
        posterUrl={posterPreview.url}
        title={posterPreview.title}
      />

      {/* Profile & Password Edit Modal */}
      <ProfileEditModal
        isOpen={profileEditModal}
        onClose={() => setProfileEditModal(false)}
        user={user}
        onSave={handleSaveProfile}
      />

      {/* SphereAI Copilot Widget */}
      <AIChatWidget userRole="organizer" userName={user?.name} />
    </div>
  );
}
