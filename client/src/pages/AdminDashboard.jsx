import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  User,
  Calendar,
  Building2,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';
import api from '../api/axios';
import { formatDate } from '../utils/formatDate';
import PosterPreviewModal from '../components/common/PosterPreviewModal';
import ProfileEditModal from '../components/common/ProfileEditModal';
import ProfileSection from '../components/common/ProfileSection';
import ConfirmationModal from '../components/common/ConfirmationModal';
import StatCard from '../components/common/StatCard';
import AIChatWidget from '../components/ai/AIChatWidget';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'organizers' | 'events'
  const [pendingOrganizers, setPendingOrganizers] = useState([]);
  const [approvedOrganizers, setApprovedOrganizers] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [stats, setStats] = useState({
    totalColleges: 0,
    totalOrganizers: 0,
    pendingApprovals: 0,
    totalEvents: 0
  });

  const [loading, setLoading] = useState(true);
  const [organizerSearchQuery, setOrganizerSearchQuery] = useState('');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [eventCategoryFilter, setEventCategoryFilter] = useState('all');
  const [error, setError] = useState('');

  // Modals state
  const [posterPreview, setPosterPreview] = useState({ isOpen: false, url: '', title: '' });
  const [profileEditModal, setProfileEditModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'approve',
    onConfirm: () => {}
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      window.location.href = '/login';
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin' && parsedUser.role !== 'superadmin') {
        window.location.href = '/login';
        return;
      }
      setUser(parsedUser);
      fetchDashboardData();
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Fetch Stats
      try {
        const { data: statsData } = await api.get('/api/admin/stats');
        setStats({
          totalColleges: statsData.data?.totalColleges || 0,
          totalOrganizers: statsData.data?.totalOrganizers || 0,
          pendingApprovals: statsData.data?.pendingApprovals || 0,
          totalEvents: statsData.data?.totalEvents || 0
        });
      } catch (err) {
        console.error('Error fetching admin stats:', err);
      }

      // 2. Fetch Pending & Approved Organizers
      try {
        const { data: pendingOrgData } = await api.get('/api/admin/organizers/pending');
        setPendingOrganizers(pendingOrgData.data || []);
      } catch (err) {
        console.error('Error fetching pending organizers:', err);
      }

      try {
        const { data: approvedOrgData } = await api.get('/api/admin/organizers/approved');
        setApprovedOrganizers(approvedOrgData.data || []);
      } catch (err) {
        console.error('Error fetching approved organizers:', err);
      }

      // 3. Fetch Pending & Approved Events
      try {
        const { data: pendingEvtData } = await api.get('/api/admin/events/pending');
        setPendingEvents(pendingEvtData.data || []);
      } catch (err) {
        console.error('Error fetching pending events:', err);
      }

      try {
        const { data: approvedEvtData } = await api.get('/api/admin/events/approved');
        setApprovedEvents(approvedEvtData.data || []);
      } catch (err) {
        console.error('Error fetching approved events:', err);
      }
    } catch (err) {
      setError('Unable to load administration records.');
    } finally {
      setLoading(false);
    }
  };

  // Organizer Actions
  const handleApproveOrganizer = (org) => {
    setConfirmModal({
      isOpen: true,
      title: 'Approve Event Organizer',
      message: `Grant "${org.name}" (${org.email}) verified event organizer permissions for ${org.collegeId?.name || 'their college'}?`,
      type: 'approve',
      onConfirm: async () => {
        try {
          await api.put(`/api/admin/organizers/${org._id}/approve`);
          setConfirmModal({ isOpen: false, onConfirm: () => {} });
          const token = localStorage.getItem('token');
          fetchDashboardData(token);
        } catch (err) {
          alert('Failed to approve organizer');
        }
      }
    });
  };

  const handleRejectOrganizer = (org) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject Organizer Application',
      message: `Decline organizer authorization for "${org.name}"? They will remain a student user.`,
      type: 'reject',
      onConfirm: async () => {
        try {
          await api.put(`/api/admin/organizers/${org._id}/reject`);
          setConfirmModal({ isOpen: false, onConfirm: () => {} });
          const token = localStorage.getItem('token');
          fetchDashboardData(token);
        } catch (err) {
          alert('Failed to reject organizer');
        }
      }
    });
  };

  // Event Actions
  const handleApproveEvent = (event) => {
    setConfirmModal({
      isOpen: true,
      title: 'Approve & Publish Event',
      message: `Publish "${event.title || event.name}" to the live inter-college public schedule?`,
      type: 'approve',
      onConfirm: async () => {
        try {
          await api.put(`/api/admin/events/${event._id}/approve`);
          setConfirmModal({ isOpen: false, onConfirm: () => {} });
          const token = localStorage.getItem('token');
          fetchDashboardData(token);
        } catch (err) {
          alert('Failed to approve event');
        }
      }
    });
  };

  const handleRejectEvent = (event) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject Event Submission',
      message: `Decline publication for "${event.title || event.name}"?`,
      type: 'reject',
      onConfirm: async () => {
        try {
          await api.put(`/api/admin/events/${event._id}/reject`);
          setConfirmModal({ isOpen: false, onConfirm: () => {} });
          const token = localStorage.getItem('token');
          fetchDashboardData(token);
        } catch (err) {
          alert('Failed to reject event');
        }
      }
    });
  };

  const handleDeleteEvent = (event) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Event',
      message: `Remove event "${event.title || event.name}"? This soft-deletes the event into system archive.`,
      type: 'delete',
      onConfirm: async () => {
        try {
          await api.delete(`/api/admin/events/${event._id}`);
          setConfirmModal({ isOpen: false, onConfirm: () => {} });
          const token = localStorage.getItem('token');
          fetchDashboardData(token);
        } catch (err) {
          alert('Failed to delete event');
        }
      }
    });
  };

  const handleSaveProfile = async (data, type) => {
    const endpoint = type === 'profile' ? '/api/auth/profile' : '/api/auth/password';
    const { data: result } = await api.put(endpoint, data);

    if (type === 'profile') {
      const updatedUser = { ...user, name: result.user?.name || data.name };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setProfileEditModal(false);
      alert('Administrator profile updated successfully!');
    } else {
      setProfileEditModal(false);
      alert('Password updated successfully!');
    }
  };

  const pendingCount = pendingOrganizers.length + pendingEvents.length;

  return (
    <div className="min-h-screen bg-surface-900 text-slate-100 font-sans selection:bg-brand-600 selection:text-white pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-surface-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <Link to="/admin/dashboard" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex-shrink-0 flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-extrabold text-lg text-white tracking-tight leading-tight">
                CollegeSphere
              </span>
              <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider leading-none mt-0.5">
                College Administration
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <span>Review Queue</span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold tabular-nums">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('organizers')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'organizers'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              Organizers ({approvedOrganizers.length})
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'events'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              Approved Events ({approvedEvents.length})
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
              <span>Admin Profile</span>
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
              title="View Administrator Profile"
            >
              <div className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-[11px]">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <span className="hidden sm:inline">{user?.name || 'Admin'}</span>
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

        {/* Administration Header & Top Metrics (Shown on pending/organizers/events tabs) */}
        {activeTab !== 'profile' && (
          <>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Campus Administration & Approvals
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Verify campus event organizers, review event submission permits, and audit platform activity.
                </p>
              </div>

              <button
                onClick={() => fetchDashboardData(localStorage.getItem('token'))}
                className="self-start sm:self-auto px-3.5 py-2 bg-surface-800 hover:bg-slate-700/60 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Sync Approvals</span>
              </button>
            </div>

            {/* Admin Metric Cards Deck */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              {/* Card 1: Review Queue */}
              <div className="bg-surface-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Review Queue</span>
                  <div className={`p-2 rounded-xl ${pendingCount > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white tracking-tight font-mono">
                    {pendingCount}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Pending Approvals</p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className={pendingCount > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                    {pendingCount > 0 ? 'Action Required' : 'All Clear'}
                  </span>
                  <span className="text-slate-400">{pendingOrganizers.length} Leads · {pendingEvents.length} Events</span>
                </div>
              </div>

              {/* Card 2: Campus Organizers */}
              <div className="bg-surface-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Campus Organizers</span>
                  <div className="p-2 bg-brand-500/10 text-brand-400 rounded-xl">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white tracking-tight font-mono">
                    {approvedOrganizers.length}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Verified Event Leads</p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Department Leads</span>
                  <span className="text-brand-400 font-semibold">Active Roster</span>
                </div>
              </div>

              {/* Card 3: Approved Events */}
              <div className="bg-surface-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Approved Events</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white tracking-tight font-mono">
                    {approvedEvents.length}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Published Schedule</p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Live on Platform</span>
                  <span className="text-emerald-400 font-semibold">Inter-College</span>
                </div>
              </div>

              {/* Card 4: Institutional Standing */}
              <div className="bg-surface-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Affiliated Campus</span>
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-base font-bold text-white truncate" title={user?.collegeId?.name || 'Partner College'}>
                    {user?.collegeId?.name || 'Partner Institution'}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Accredited Member</p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified
                  </span>
                  <span className="text-slate-400 font-mono">Role: Admin</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tab 1: Review Queue (Pending Organizers & Events) */}
        {activeTab === 'pending' && (
          <div className="space-y-8">
            {pendingCount === 0 ? (
              <div className="bg-surface-900 border border-slate-800 rounded-2xl p-8 sm:p-10 text-center shadow-sm space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Campus Review Queue is Clear</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    All submitted event proposals and organizer credentials for your institution have been reviewed and processed.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('organizers')}
                    className="px-4 py-2 bg-surface-800 hover:bg-slate-700/60 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                  >
                    Manage Organizers ({approvedOrganizers.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('events')}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
                  >
                    View Live Events ({approvedEvents.length})
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Pending Organizers Section */}
                {pendingOrganizers.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-white">Pending Organizer Applications</h2>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 tabular-nums">
                          {pendingOrganizers.length}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pendingOrganizers.map((org) => (
                        <div
                          key={org._id}
                          className="bg-surface-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-base font-bold text-white">{org.name}</h3>
                              <p className="text-xs text-slate-400">{org.email}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              Pending
                            </span>
                          </div>

                          <div className="text-xs text-slate-400">
                            <span className="text-slate-500">College:</span> {org.collegeId?.name || 'N/A'}
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-slate-800">
                            <button
                              onClick={() => handleRejectOrganizer(org)}
                              className="flex-1 py-2 bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-700 hover:border-rose-500/20 rounded-xl text-xs font-semibold text-slate-300 transition-all cursor-pointer"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => handleApproveOrganizer(org)}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                            >
                              Approve
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Events Section */}
                {pendingEvents.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-white">Pending Event Submissions</h2>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 tabular-nums">
                          {pendingEvents.length}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {pendingEvents.map((evt) => (
                        <div
                          key={evt._id}
                          className="bg-surface-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-surface-800 text-slate-300 border border-slate-700/60">
                                {evt.category || 'General'}
                              </span>
                              {evt.poster && (
                                <button
                                  onClick={() =>
                                    setPosterPreview({
                                      isOpen: true,
                                      url: evt.poster,
                                      title: evt.title || evt.name
                                    })
                                  }
                                  className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Poster
                                </button>
                              )}
                            </div>

                            <h3 className="text-base font-bold text-white line-clamp-2">
                              {evt.title || evt.name}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {evt.description}
                            </p>

                            <div className="space-y-1 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
                              <div>
                                <span className="text-slate-500">Host:</span> {evt.collegeId?.name || 'College'}
                              </div>
                              <div>
                                <span className="text-slate-500">Date:</span> {formatDate(evt.date)} ·{' '}
                                <span className="text-slate-500">Venue:</span> {evt.venue}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-3 border-t border-slate-800">
                            <button
                              onClick={() => handleRejectEvent(evt)}
                              className="flex-1 py-2 bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-700 hover:border-rose-500/20 rounded-xl text-xs font-semibold text-slate-300 transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApproveEvent(evt)}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                            >
                              Publish
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab 2: Approved Organizers */}
        {activeTab === 'organizers' && (() => {
          const filteredOrganizers = approvedOrganizers.filter((org) => {
            const q = organizerSearchQuery.toLowerCase();
            return (
              (org.name || '').toLowerCase().includes(q) ||
              (org.email || '').toLowerCase().includes(q) ||
              (org.collegeId?.name || '').toLowerCase().includes(q)
            );
          });

          return (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Verified Campus Event Organizers ({approvedOrganizers.length})</h2>
                  <p className="text-xs text-slate-400">Campus department heads and student leaders authorized to host events.</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search organizer name or email..."
                    value={organizerSearchQuery}
                    onChange={(e) => setOrganizerSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
              </div>

              <div className="bg-surface-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-800/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">Organizer Name</th>
                        <th className="py-3.5 px-4">Email</th>
                        <th className="py-3.5 px-4">Affiliated College</th>
                        <th className="py-3.5 px-4">Approved Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredOrganizers.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-12 text-center text-slate-400">
                            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <p className="text-xs font-semibold text-white">No organizers found</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {organizerSearchQuery ? `No verified leads match "${organizerSearchQuery}"` : 'No verified organizers for this campus yet.'}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredOrganizers.map((org) => (
                          <tr key={org._id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-white">{org.name}</td>
                            <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">{org.email}</td>
                            <td className="py-3.5 px-4 text-slate-300">{org.collegeId?.name || user?.collegeId?.name || 'N/A'}</td>
                            <td className="py-3.5 px-4 text-slate-400 tabular-nums">{formatDate(org.createdAt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Tab 3: Approved Events */}
        {activeTab === 'events' && (() => {
          const filteredEvents = approvedEvents.filter((evt) => {
            const q = eventSearchQuery.toLowerCase();
            const matchQ =
              (evt.title || evt.name || '').toLowerCase().includes(q) ||
              (evt.venue || '').toLowerCase().includes(q) ||
              (evt.category || '').toLowerCase().includes(q);
            const matchCategory =
              eventCategoryFilter === 'all' || (evt.category || '').toLowerCase() === eventCategoryFilter.toLowerCase();
            return matchQ && matchCategory;
          });

          return (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Live Published Inter-College Events ({approvedEvents.length})</h2>
                  <p className="text-xs text-slate-400">Events currently live on the inter-college calendar open for registrations.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search title, venue, category..."
                      value={eventSearchQuery}
                      onChange={(e) => setEventSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
                    />
                  </div>
                  <select
                    value={eventCategoryFilter}
                    onChange={(e) => setEventCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600 cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    <option value="technical">Technical</option>
                    <option value="cultural">Cultural</option>
                    <option value="sports">Sports</option>
                    <option value="workshop">Workshop</option>
                  </select>
                </div>
              </div>

              <div className="bg-surface-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-800/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">Event Title</th>
                        <th className="py-3.5 px-4">Host Campus</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4">Deadline</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredEvents.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-400">
                            <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <p className="text-xs font-semibold text-white">No approved events found</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {eventSearchQuery || eventCategoryFilter !== 'all'
                                ? 'No live events match your search or category filter.'
                                : 'No live published events for your campus yet.'}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredEvents.map((evt) => (
                          <tr key={evt._id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-white">
                              <div className="flex items-center gap-2">
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
                            </td>
                            <td className="py-3.5 px-4 text-slate-300">{evt.collegeId?.name || user?.collegeId?.name || 'N/A'}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-800 text-slate-300 border border-slate-700">
                                {evt.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-300 tabular-nums">{formatDate(evt.date)}</td>
                            <td className="py-3.5 px-4 text-slate-300 tabular-nums">
                              {formatDate(evt.registrationDeadline || evt.deadline)}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleDeleteEvent(evt)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Archive Event"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Tab 4: Campus Administrator Profile & Authority */}
        {activeTab === 'profile' && (
          <ProfileSection
            user={user}
            collegeName={
              user?.collegeName ||
              user?.collegeId?.name ||
              'Campus Administration Authority'
            }
            roleTitle="Campus Administrator"
            roleDescription="Accredited Institutional Oversight"
            stats={[
              { label: 'Pending Queue', value: pendingCount, icon: Clock, subtext: 'Awaiting Vetting' },
              { label: 'Organizers', value: stats.totalOrganizers, icon: Users, subtext: 'Verified Campus Leads' },
              { label: 'Live Events', value: stats.totalEvents, icon: Calendar, subtext: 'Approved & Active' }
            ]}
            onSaveProfile={handleSaveProfile}
            accentColor="brand"
          />
        )}
      </main>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
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
      <AIChatWidget userRole="admin" userName={user?.name} />
    </div>
  );
}
