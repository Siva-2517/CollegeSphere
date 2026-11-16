import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Building2,
  Users,
  Calendar,
  LogOut,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Trash2,
  RefreshCw,
  BarChart3,
  AlertCircle,
  RotateCcw,
  Activity,
  User,
  Lock,
  GraduationCap,
  Sparkles,
  Trophy,
  Key,
  Cpu,
  ArrowRight
} from 'lucide-react';
import api from '../api/axios';
import { formatDate } from '../utils/formatDate';
import StatCard from '../components/common/StatCard';
import ProfileSection from '../components/common/ProfileSection';
import AIChatWidget from '../components/ai/AIChatWidget';
import CollegeSphereLogo from '../components/common/CollegeSphereLogo';

export default function SuperAdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [deletedEvents, setDeletedEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [collegeSearchQuery, setCollegeSearchQuery] = useState('');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState('all');
  const [collegeStatusFilter, setCollegeStatusFilter] = useState('all');
  const [overviewLedgerTab, setOverviewLedgerTab] = useState('colleges');

  // Create College Modal State
  const [isCollegeModalOpen, setIsCollegeModalOpen] = useState(false);
  const [newCollege, setNewCollege] = useState({ name: '', location: '', emailDomain: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      window.location.href = '/login';
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      if (parsed.role !== 'superadmin') {
        window.location.href = '/login';
        return;
      }
      setUser(parsed);
      fetchInitialData();
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch SuperAdmin Stats
      try {
        const { data: statsRes } = await api.get('/api/superadmin/stats');
        setStats(statsRes.stats);
      } catch (err) {
        console.error('Stats error:', err);
      }

      // 2. Fetch Colleges
      try {
        const { data: collegeRes } = await api.get('/api/college/all');
        setColleges(collegeRes.colleges || collegeRes || []);
      } catch (err) {
        console.error('Colleges error:', err);
      }

      // 3. Fetch System Users
      try {
        const { data: userRes } = await api.get('/api/superadmin/users');
        setUsersList(userRes.users || []);
      } catch (err) {
        console.error('Users error:', err);
      }

      // 4. Fetch Active & Pending Events
      try {
        const { data: eventRes } = await api.get('/api/admin/events/approved');
        const { data: pendingEventRes } = await api.get('/api/admin/events/pending');
        setEventsList([...(eventRes.data || []), ...(pendingEventRes.data || [])]);
      } catch (err) {
        console.error('Events error:', err);
      }

      // 5. Fetch Soft-Deleted Events
      try {
        const { data: deletedRes } = await api.get('/api/superadmin/events/deleted');
        setDeletedEvents(deletedRes.events || []);
      } catch (err) {
        console.error('Trash error:', err);
      }
    } catch (err) {
      console.error('SuperAdmin load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollege = async (e) => {
    e.preventDefault();
    if (!newCollege.name.trim()) return;

    try {
      await api.post('/api/superadmin/colleges', newCollege);
      setIsCollegeModalOpen(false);
      setNewCollege({ name: '', location: '', emailDomain: '' });
      fetchInitialData();
      alert('College institution added successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create college');
    }
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      await api.put(`/api/superadmin/users/${targetUserId}/role`, { role: newRole });
      fetchInitialData();
      alert(`User role updated to ${newRole}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleToggleVerification = async (collegeId, currentVerified) => {
    try {
      await api.put(`/api/superadmin/colleges/${collegeId}/verify`, { isVerified: !currentVerified });
      fetchInitialData();
    } catch (err) {
      alert('Failed to update college verification status');
    }
  };

  const handleDeleteCollege = async (collegeId, collegeName) => {
    if (!window.confirm(`Are you sure you want to delete "${collegeName}"?`)) return;
    try {
      await api.delete(`/api/superadmin/colleges/${collegeId}`);
      fetchInitialData();
    } catch (err) {
      alert('Failed to delete college');
    }
  };

  const handleRestoreEvent = async (eventId, title) => {
    try {
      await api.put(`/api/superadmin/events/${eventId}/restore`);
      fetchInitialData();
      alert(`Event "${title}" restored to active schedule!`);
    } catch (err) {
      alert('Failed to restore event');
    }
  };

  const handlePermanentDeleteEvent = async (eventId, title) => {
    if (!window.confirm(`Permanently purge "${title}" from database? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/superadmin/events/${eventId}/permanent`);
      fetchInitialData();
      alert('Event permanently purged');
    } catch (err) {
      alert('Failed to permanently delete event');
    }
  };

  const handleDeleteEvent = async (eventId, title) => {
    if (!window.confirm(`Move "${title}" to soft-deleted trash bin?`)) return;
    try {
      await api.delete(`/api/admin/events/${eventId}`);
      fetchInitialData();
      alert(`Event "${title}" moved to trash archive`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to archive event');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-surface-900 text-slate-100 font-sans selection:bg-brand-600 selection:text-white pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-surface-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <CollegeSphereLogo
            to="/superadmin/dashboard"
            variant="amber"
            subtitle="Super Admin Console"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-amber-400 bg-amber-500/15 text-white shadow-sm'
                  : 'border-slate-800 bg-surface-800 hover:bg-slate-700/60 text-slate-200'
              }`}
              title="View SuperAdmin Profile"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px]">
                {user?.name?.[0]?.toUpperCase() || 'S'}
              </div>
              <span className="hidden sm:inline">{user?.name || 'Super Admin'}</span>
            </button>

            <button
              onClick={fetchInitialData}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              title="Refresh Platform Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-surface-950/60 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto custom-scrollbar">
          {[
            { id: 'overview', label: 'System Overview', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'colleges', label: `Colleges (${colleges.length})`, icon: <Building2 className="w-4 h-4" /> },
            { id: 'users', label: `User & Roles (${usersList.length})`, icon: <Users className="w-4 h-4" /> },
            { id: 'events', label: `Global Events (${eventsList.length})`, icon: <Calendar className="w-4 h-4" /> },
            { id: 'trash', label: `Trash Archive (${deletedEvents.length})`, icon: <RotateCcw className="w-4 h-4" /> },
            { id: 'diagnostics', label: 'Platform Diagnostics', icon: <Activity className="w-4 h-4" /> },
            { id: 'profile', label: 'Admin Profile', icon: <User className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* TAB 1: SYSTEM OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Executive Metric Deck */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Card 1: User Population */}
              <div className="bg-surface-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">User Population</span>
                  <div className="p-2 bg-brand-500/10 text-brand-400 rounded-xl">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white tracking-tight font-mono">
                    {stats?.users?.total || usersList.length}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Registered Platform Accounts</p>
                </div>
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1.5 font-medium">
                    <span>{stats?.users?.students ?? usersList.filter((u) => u.role === 'student').length} Students</span>
                    <span>{stats?.users?.organizers ?? usersList.filter((u) => u.role === 'organizer').length} Leads</span>
                    <span>{stats?.users?.admins ?? usersList.filter((u) => u.role === 'admin' || u.role === 'superadmin').length} Admins</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      style={{
                        width: `${((stats?.users?.students ?? usersList.filter((u) => u.role === 'student').length) / (stats?.users?.total || usersList.length || 1)) * 100}%`
                      }}
                      className="bg-brand-500 h-full"
                      title="Students"
                    />
                    <div
                      style={{
                        width: `${((stats?.users?.organizers ?? usersList.filter((u) => u.role === 'organizer').length) / (stats?.users?.total || usersList.length || 1)) * 100}%`
                      }}
                      className="bg-amber-400 h-full"
                      title="Organizers"
                    />
                    <div
                      style={{
                        width: `${((stats?.users?.admins ?? usersList.filter((u) => u.role === 'admin' || u.role === 'superadmin').length) / (stats?.users?.total || usersList.length || 1)) * 100}%`
                      }}
                      className="bg-indigo-400 h-full"
                      title="Admins"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Partner Institutions */}
              <div className="bg-surface-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Institutional Network</span>
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white tracking-tight font-mono">
                    {stats?.colleges?.total || colleges.length}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Accredited Partner Campuses</p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {colleges.filter((c) => c.isVerified).length} Verified
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {colleges.filter((c) => !c.isVerified).length > 0
                      ? `${colleges.filter((c) => !c.isVerified).length} Pending Review`
                      : '0 Pending'}
                  </span>
                </div>
              </div>

              {/* Card 3: Global Event Records */}
              <div className="bg-surface-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Global Event Registry</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white tracking-tight font-mono">
                    {stats?.events?.total || eventsList.length}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Active & Scheduled Events</p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">
                    {stats?.events?.approved ?? eventsList.filter((e) => e.isApproved).length} Live Approved
                  </span>
                  <span className="text-amber-400 font-semibold font-mono">
                    {deletedEvents.length} in Trash
                  </span>
                </div>
              </div>

              {/* Card 4: Student Registrations */}
              <div className="bg-surface-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Participation Entries</span>
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                    <Trophy className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white tracking-tight font-mono">
                    {stats?.registrations?.total || 0}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Student Event Entry Passes</p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Inter-College Network</span>
                  <span className="text-brand-400 font-semibold">Active Roster</span>
                </div>
              </div>
            </div>

            {/* Mission Control: 2-Column Command & Dispatch Hub */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (60%): Live Multi-Tenant Ledger */}
              <div className="lg:col-span-7 bg-surface-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-amber-400" />
                        Live Platform Ledger
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Real-time institutional directory and newly authenticated campus accounts
                      </p>
                    </div>
                    <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 self-start sm:self-auto">
                      <button
                        onClick={() => setOverviewLedgerTab('colleges')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          overviewLedgerTab === 'colleges'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Institutions ({colleges.length})
                      </button>
                      <button
                        onClick={() => setOverviewLedgerTab('users')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          overviewLedgerTab === 'users'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Users ({usersList.length})
                      </button>
                    </div>
                  </div>

                  {overviewLedgerTab === 'colleges' ? (
                    <div className="space-y-2.5">
                      {colleges.slice(0, 5).map((col) => (
                        <div
                          key={col._id}
                          className="flex items-center justify-between p-3 rounded-xl bg-surface-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                        >
                          <div className="min-w-0 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-white truncate">{col.name}</span>
                              {col.isVerified ? (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                                  Verified
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
                                  Pending
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {col.location || 'Location Unspecified'} · <span className="font-mono text-slate-300">{col.emailDomain ? `@${col.emailDomain.replace(/^@/, '')}` : 'All Domains'}</span>
                            </p>
                          </div>
                          <button
                            onClick={() => handleToggleVerification(col._id, col.isVerified)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700/80 transition-colors flex-shrink-0 cursor-pointer"
                          >
                            {col.isVerified ? 'Revoke' : 'Verify'}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {usersList.slice(0, 5).map((usr) => (
                        <div
                          key={usr._id}
                          className="flex items-center justify-between p-3 rounded-xl bg-surface-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                        >
                          <div className="min-w-0 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-white truncate">{usr.name}</span>
                              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-surface-800 text-slate-300 border border-slate-700 flex-shrink-0">
                                {usr.role}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                              {usr.email} · <span className="text-slate-400 font-sans">{usr.collegeId?.name || 'Unassigned Campus'}</span>
                            </p>
                          </div>
                          <select
                            value={usr.role}
                            onChange={(e) => handleRoleChange(usr._id, e.target.value)}
                            className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer flex-shrink-0"
                          >
                            <option value="student">Student</option>
                            <option value="organizer">Organizer</option>
                            <option value="admin">Admin</option>
                            <option value="superadmin">Super Admin</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Showing latest 5 of {overviewLedgerTab === 'colleges' ? colleges.length : usersList.length} records from MongoDB
                  </span>
                  <button
                    onClick={() => setActiveTab(overviewLedgerTab)}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Open full {overviewLedgerTab} roster</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Column (40%): Governance Dispatch & Telemetry */}
              <div className="lg:col-span-5 space-y-6">
                {/* Governance Action Center */}
                <div className="bg-surface-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-400" />
                        Multi-Tenant Governance Dispatch
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Root platform administrative shortcuts
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Root Level
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setIsCollegeModalOpen(true)}
                      className="p-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-left transition-all cursor-pointer shadow-sm group"
                    >
                      <Plus className="w-4 h-4 mb-1.5 text-slate-950 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold leading-tight">Add College</p>
                      <p className="text-[10px] text-slate-900/80 leading-tight mt-0.5">New Campus Tenant</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('users')}
                      className="p-3 bg-surface-950/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white rounded-xl text-left transition-all cursor-pointer group"
                    >
                      <Users className="w-4 h-4 mb-1.5 text-amber-400 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold leading-tight">Elevate Roles</p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Assign Permissions</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('events')}
                      className="p-3 bg-surface-950/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white rounded-xl text-left transition-all cursor-pointer group"
                    >
                      <Calendar className="w-4 h-4 mb-1.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold leading-tight">Moderate Events</p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Review Global Schedule</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('trash')}
                      className="p-3 bg-surface-950/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white rounded-xl text-left transition-all cursor-pointer group"
                    >
                      <RotateCcw className="w-4 h-4 mb-1.5 text-rose-400 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold leading-tight">Trash Archive</p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{deletedEvents.length} Soft-Deleted</p>
                    </button>
                  </div>

                  {deletedEvents.length > 0 && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-xs text-rose-300">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        <span>{deletedEvents.length} events held in soft-deleted recovery</span>
                      </div>
                      <button
                        onClick={() => setActiveTab('trash')}
                        className="text-[11px] font-bold text-rose-400 hover:text-rose-300 underline cursor-pointer"
                      >
                        Review
                      </button>
                    </div>
                  )}
                </div>

                {/* Live Infrastructure Telemetry Card */}
                <div className="bg-surface-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      Live Engine Telemetry
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Systems Nominal
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface-950/60 border border-slate-800/60">
                      <span className="text-slate-300 flex items-center gap-2 font-medium">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        MongoDB Atlas Database
                      </span>
                      <span className="font-mono text-emerald-400 text-[11px] font-semibold">Active & Synced</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface-950/60 border border-slate-800/60">
                      <span className="text-slate-300 flex items-center gap-2 font-medium">
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        Groq LLM (Llama 3.3 70B)
                      </span>
                      <span className="font-mono text-slate-300 text-[11px]">Primary Engine</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface-950/60 border border-slate-800/60">
                      <span className="text-slate-300 flex items-center gap-2 font-medium">
                        <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                        Gemini 2.5 Flash
                      </span>
                      <span className="font-mono text-slate-300 text-[11px]">Fallback Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COLLEGES */}
        {activeTab === 'colleges' && (() => {
          const filteredColleges = colleges.filter((col) => {
            const q = collegeSearchQuery.toLowerCase();
            const matchQ =
              (col.name || '').toLowerCase().includes(q) ||
              (col.location || '').toLowerCase().includes(q) ||
              (col.emailDomain || '').toLowerCase().includes(q);
            const matchStatus =
              collegeStatusFilter === 'all' ||
              (collegeStatusFilter === 'verified' ? col.isVerified : !col.isVerified);
            return matchQ && matchStatus;
          });

          return (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Accredited College Institutions ({colleges.length})</h2>
                  <p className="text-xs text-slate-400">Manage multi-tenant college records and institutional domains.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 text-xs">
                    <button
                      onClick={() => setCollegeStatusFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        collegeStatusFilter === 'all'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All ({colleges.length})
                    </button>
                    <button
                      onClick={() => setCollegeStatusFilter('verified')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        collegeStatusFilter === 'verified'
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Verified ({colleges.filter((c) => c.isVerified).length})
                    </button>
                    <button
                      onClick={() => setCollegeStatusFilter('unverified')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        collegeStatusFilter === 'unverified'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Pending ({colleges.filter((c) => !c.isVerified).length})
                    </button>
                  </div>
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search name, location, domain..."
                      value={collegeSearchQuery}
                      onChange={(e) => setCollegeSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-1.5 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <button
                    onClick={() => setIsCollegeModalOpen(true)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add College</span>
                  </button>
                </div>
              </div>

              <div className="bg-surface-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-800/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">Institution Name</th>
                        <th className="py-3.5 px-4">Location</th>
                        <th className="py-3.5 px-4">Domain</th>
                        <th className="py-3.5 px-4">Verification</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredColleges.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-slate-400">
                            <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <p className="text-xs font-semibold text-white">No institutions found</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              No colleges match your current search query or verification filter.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredColleges.map((col) => (
                          <tr key={col._id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-white">{col.name}</td>
                            <td className="py-3.5 px-4 text-slate-300">{col.location || 'N/A'}</td>
                            <td className="py-3.5 px-4 text-slate-400 font-mono">
                              {col.emailDomain ? `@${col.emailDomain.replace(/^@/, '')}` : 'All domains'}
                            </td>
                            <td className="py-3.5 px-4">
                              <button
                                onClick={() => handleToggleVerification(col._id, col.isVerified)}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-pointer ${
                                  col.isVerified
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {col.isVerified ? 'Verified' : 'Unverified'}
                              </button>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleDeleteCollege(col._id, col.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Delete College"
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

        {/* TAB 3: USER & ROLE CONTROL */}
        {activeTab === 'users' && (() => {
          const filteredUsers = usersList.filter((u) => {
            const q = searchQuery.toLowerCase();
            const matchQ =
              (u.name || '').toLowerCase().includes(q) ||
              (u.email || '').toLowerCase().includes(q) ||
              (u.collegeId?.name || '').toLowerCase().includes(q);
            const matchR = !roleFilter || u.role === roleFilter;
            return matchQ && matchR;
          });

          return (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">System User Accounts & Authorization ({usersList.length})</h2>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span>Students: {stats?.users?.students ?? usersList.filter((u) => u.role === 'student').length}</span>
                    <span>·</span>
                    <span>Leads: {stats?.users?.organizers ?? usersList.filter((u) => u.role === 'organizer').length}</span>
                    <span>·</span>
                    <span>Admins: {stats?.users?.admins ?? usersList.filter((u) => u.role === 'admin' || u.role === 'superadmin').length}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Filter by name, email, campus..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
                    />
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600 cursor-pointer"
                  >
                    <option value="">All Roles ({usersList.length})</option>
                    <option value="student">Student ({usersList.filter((u) => u.role === 'student').length})</option>
                    <option value="organizer">Organizer ({usersList.filter((u) => u.role === 'organizer').length})</option>
                    <option value="admin">College Admin ({usersList.filter((u) => u.role === 'admin').length})</option>
                    <option value="superadmin">Super Admin ({usersList.filter((u) => u.role === 'superadmin').length})</option>
                  </select>
                </div>
              </div>

              <div className="bg-surface-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-800/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">User</th>
                        <th className="py-3.5 px-4">Email</th>
                        <th className="py-3.5 px-4">College</th>
                        <th className="py-3.5 px-4">Current Role</th>
                        <th className="py-3.5 px-4 text-right">Assign New Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-slate-400">
                            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <p className="text-xs font-semibold text-white">No users match your filter</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              No user accounts found matching "{searchQuery}" under {roleFilter || 'all roles'}.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((usr) => (
                          <tr key={usr._id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-white">{usr.name}</td>
                            <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">{usr.email}</td>
                            <td className="py-3.5 px-4 text-slate-400">{usr.collegeId?.name || 'Unassigned'}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-800 border border-slate-700 text-slate-300">
                                {usr.role}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <select
                                value={usr.role}
                                onChange={(e) => handleRoleChange(usr._id, e.target.value)}
                                className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                              >
                                <option value="student">Student</option>
                                <option value="organizer">Organizer</option>
                                <option value="admin">College Admin</option>
                                <option value="superadmin">Super Admin</option>
                              </select>
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

        {/* TAB 4: GLOBAL EVENTS MODERATION */}
        {activeTab === 'events' && (() => {
          const filteredEvents = eventsList.filter((evt) => {
            const q = eventSearchQuery.toLowerCase();
            const matchQ =
              (evt.title || evt.name || '').toLowerCase().includes(q) ||
              (evt.collegeId?.name || '').toLowerCase().includes(q) ||
              (evt.category || '').toLowerCase().includes(q);
            const matchStatus =
              eventStatusFilter === 'all' ||
              (eventStatusFilter === 'approved' ? evt.isApproved !== false : evt.isApproved === false);
            return matchQ && matchStatus;
          });

          return (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Global Event Registry Moderation ({eventsList.length})</h2>
                  <p className="text-xs text-slate-400">Search, monitor approval statuses, and moderate events across all institutions.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search title, college, category..."
                      value={eventSearchQuery}
                      onChange={(e) => setEventSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <select
                    value={eventStatusFilter}
                    onChange={(e) => setEventStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="all">All Statuses ({eventsList.length})</option>
                    <option value="approved">Live / Approved ({eventsList.filter((e) => e.isApproved !== false).length})</option>
                    <option value="pending">Pending Review ({eventsList.filter((e) => e.isApproved === false).length})</option>
                  </select>
                </div>
              </div>

              <div className="bg-surface-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-800/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">Event</th>
                        <th className="py-3.5 px-4">College</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Moderation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredEvents.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-400">
                            <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <p className="text-xs font-semibold text-white">No events match your criteria</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              No scheduled events found matching your query or status filter.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredEvents.map((evt) => (
                          <tr key={evt._id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-white">{evt.title || evt.name}</td>
                            <td className="py-3.5 px-4 text-slate-300">{evt.collegeId?.name || 'N/A'}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-800 text-slate-300 border border-slate-700">
                                {evt.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-400 tabular-nums">{formatDate(evt.date)}</td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  evt.isApproved !== false
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}
                              >
                                {evt.isApproved !== false ? 'Live' : 'Pending Review'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleDeleteEvent(evt._id, evt.title || evt.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Archive Event to Trash"
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

        {/* TAB 5: TRASH BIN (SOFT DELETED EVENTS) */}
        {activeTab === 'trash' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Soft-Deleted Events Archive</h2>
              <p className="text-xs text-slate-400">Restore accidentally removed events or permanently purge them.</p>
            </div>

            {deletedEvents.length === 0 ? (
              <div className="text-center py-16 bg-surface-900 border border-slate-800 rounded-2xl p-6">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Trash bin is currently clean. No soft-deleted records.</p>
              </div>
            ) : (
              <div className="bg-surface-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-800/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">Archived Event Title</th>
                        <th className="py-3.5 px-4">College</th>
                        <th className="py-3.5 px-4">Event Date</th>
                        <th className="py-3.5 px-4 text-right">Recovery Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {deletedEvents.map((evt) => (
                        <tr key={evt._id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-rose-300">{evt.title || evt.name}</td>
                          <td className="py-3.5 px-4 text-slate-400">{evt.collegeId?.name || 'N/A'}</td>
                          <td className="py-3.5 px-4 text-slate-400 tabular-nums">{formatDate(evt.date)}</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleRestoreEvent(evt._id, evt.title || evt.name)}
                                className="px-3 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                Restore
                              </button>
                              <button
                                onClick={() => handlePermanentDeleteEvent(evt._id, evt.title || evt.name)}
                                className="px-3 py-1 bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                Purge Forever
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: DIAGNOSTICS & PLATFORM HEALTH */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-400" />
                Platform Diagnostics & AI Engine Health
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time status of backend microservices, database clusters, and AI inference engines.</p>
            </div>

            {/* AI & Infrastructure Engine Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-surface-900 border border-slate-800 p-6 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Database Engine</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-xl font-bold text-white">MongoDB Atlas</div>
                <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle className="w-4 h-4" /> Connected & Operational
                </p>
              </div>

              <div className="bg-surface-900 border border-slate-800 p-6 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Groq LLM Engine</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-xl font-bold text-white">gpt-oss-120b</div>
                <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                  <Key className="w-4 h-4" /> Dual Fallback Primary Ready
                </p>
              </div>

              <div className="bg-surface-900 border border-slate-800 p-6 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Gemini LLM Engine</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-xl font-bold text-white">Gemini 2.5 Flash</div>
                <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                  <Cpu className="w-4 h-4" /> Secondary AI Ready
                </p>
              </div>
            </div>

            {/* System Operational Limits */}
            <div className="bg-surface-900 border border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-white text-base">System Operational Limits & Infrastructure Topology</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-surface-950/70 p-4 rounded-xl border border-slate-800">
                  <p className="text-slate-400 mb-1">JWT Session Lifetime</p>
                  <p className="font-bold text-amber-300">3 Hours (Rolling Token)</p>
                </div>
                <div className="bg-surface-950/70 p-4 rounded-xl border border-slate-800">
                  <p className="text-slate-400 mb-1">Backend Server Port</p>
                  <p className="font-bold text-slate-200 font-mono">HTTP 5000 (Express API)</p>
                </div>
                <div className="bg-surface-950/70 p-4 rounded-xl border border-slate-800">
                  <p className="text-slate-400 mb-1">Client Host Port</p>
                  <p className="font-bold text-slate-200 font-mono">Vite 5173 (React SPA)</p>
                </div>
                <div className="bg-surface-950/70 p-4 rounded-xl border border-slate-800">
                  <p className="text-slate-400 mb-1">Supported User Roles</p>
                  <p className="font-bold text-slate-200">4 Roles (RBAC Active)</p>
                </div>
              </div>
            </div>

            {/* Cluster & Multi-Tenant Enforcement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Cluster & Tenant Diagnostics
                </h3>
                <div className="space-y-3 text-xs text-slate-300 divide-y divide-slate-800">
                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400">Platform Environment:</span>
                    <span className="font-mono text-emerald-400 font-bold">Production / Connected</span>
                  </div>
                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400">Database Engine:</span>
                    <span className="font-mono text-white">MongoDB Atlas Multi-Tenant</span>
                  </div>
                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400">AI Tool Calling Provider:</span>
                    <span className="font-mono text-white">Groq / Gemini Function Calling</span>
                  </div>
                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400">Active Tenant Colleges:</span>
                    <span className="font-mono text-white">{colleges.length} institutions</span>
                  </div>
                </div>
              </div>

              <div className="bg-surface-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  Multi-Tenant Access Enforcement
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  SuperAdmin holds system-level governance. Changes to roles, verification flags, and soft-delete restorations apply synchronously across the cluster.
                </p>
                <div className="p-3 bg-surface-950/70 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Audit Protocol Active
                  </div>
                  <p>All institutional mutations and user role escalations are timestamped and logged.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: PROFILE & SYSTEM GOVERNANCE CREDENTIALS */}
        {activeTab === 'profile' && (
          <ProfileSection
            user={user}
            collegeName="Global Multi-Tenant Root"
            roleTitle="Platform Super Administrator"
            roleDescription="Root System Authority & Global Multi-Tenant Governance"
            stats={[
              { label: 'System Users', value: stats?.users?.total || usersList.length, icon: Users, subtext: 'Registered Accounts' },
              { label: 'Partner Institutions', value: stats?.colleges?.total || colleges.length, icon: Building2, subtext: 'Accredited Campuses' },
              { label: 'Live Events', value: stats?.events?.total || eventsList.length, icon: Calendar, subtext: 'Across All Colleges' },
              { label: 'Trash Archive', value: deletedEvents.length, icon: RotateCcw, subtext: 'Soft-Deleted Records' }
            ]}
            onSaveProfile={async (data, type) => {
              if (type === 'profile') {
                const { data: resData } = await api.put('/api/auth/profile', { name: data.name });
                const updatedUser = { ...user, name: resData.user?.name || data.name };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
              } else {
                await api.put('/api/auth/password', {
                  currentPassword: data.currentPassword,
                  newPassword: data.newPassword
                });
              }
            }}
            accentColor="amber"
          />
        )}
      </main>

      {/* Create College Institution Modal */}
      {isCollegeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-surface-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-modal animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-1">Add College Institution</h3>
            <p className="text-xs text-slate-400 mb-4">Register a new accredited university to the platform.</p>

            <form onSubmit={handleCreateCollege} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Institution Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCollege.name}
                  onChange={(e) => setNewCollege({ ...newCollege, name: e.target.value })}
                  placeholder="e.g., Oxford University"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Campus Location
                </label>
                <input
                  type="text"
                  value={newCollege.location}
                  onChange={(e) => setNewCollege({ ...newCollege, location: e.target.value })}
                  placeholder="e.g., Cambridge, MA"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Email Domain
                </label>
                <input
                  type="text"
                  value={newCollege.emailDomain}
                  onChange={(e) => setNewCollege({ ...newCollege, emailDomain: e.target.value })}
                  placeholder="e.g., @oxford.ac.uk"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCollegeModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Create College
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SphereAI Copilot Widget */}
      <AIChatWidget userRole="superadmin" userName={user?.name} />
    </div>
  );
}
