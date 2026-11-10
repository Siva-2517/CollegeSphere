import React, { useState, useEffect } from 'react';
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
  GraduationCap
} from 'lucide-react';
import api from '../api/axios';
import { formatDate } from '../utils/formatDate';
import StatCard from '../components/common/StatCard';
import AIChatWidget from '../components/ai/AIChatWidget';

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

  // Create College Modal State
  const [isCollegeModalOpen, setIsCollegeModalOpen] = useState(false);
  const [newCollege, setNewCollege] = useState({ name: '', location: '', emailDomain: '' });

  // Profile Form State
  const [profileForm, setProfileForm] = useState({ name: '', currentPassword: '', newPassword: '' });
  const [profileMessage, setProfileMessage] = useState('');

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
      setProfileForm((prev) => ({ ...prev, name: parsed.name || '' }));
      fetchInitialData();
    } catch (e) {
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

  // Fixed SuperAdmin Profile & Password Update (routes passwords to /api/auth/password)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage('');

    try {
      // 1. Update Name if modified
      if (profileForm.name && profileForm.name !== user?.name) {
        const { data } = await api.put('/api/auth/profile', { name: profileForm.name });
        const updatedUser = { ...user, name: data.user?.name || profileForm.name };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      // 2. Update Password if entered
      if (profileForm.newPassword) {
        if (!profileForm.currentPassword) {
          alert('Current password is required to set a new password');
          return;
        }
        await api.put('/api/auth/password', {
          currentPassword: profileForm.currentPassword,
          newPassword: profileForm.newPassword
        });
        setProfileForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
      }

      setProfileMessage('Settings saved successfully!');
    } catch (err) {
      alert(err.response?.data?.msg || err.response?.data?.message || 'Failed to update settings');
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-sm">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white block tracking-tight">
                CollegeSphere System
              </span>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Platform Governance & Multi-Tenant Control
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-surface-800 hover:bg-slate-700/60 transition-all text-xs font-semibold text-slate-200 cursor-pointer"
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
      <div className="bg-surface-950/60 border-b border-slate-800 px-4 sm:px-6 flex gap-2 overflow-x-auto custom-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'colleges', label: `Colleges (${colleges.length})`, icon: <Building2 className="w-4 h-4" /> },
          { id: 'users', label: `Users (${usersList.length})`, icon: <Users className="w-4 h-4" /> },
          { id: 'events', label: `Events (${eventsList.length})`, icon: <Calendar className="w-4 h-4" /> },
          { id: 'trash', label: `Trash Archive (${deletedEvents.length})`, icon: <RotateCcw className="w-4 h-4" /> },
          { id: 'diagnostics', label: 'Diagnostics', icon: <Activity className="w-4 h-4" /> },
          { id: 'profile', label: 'Governance Profile', icon: <User className="w-4 h-4" /> }
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* TAB 1: SYSTEM OVERVIEW */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard
                icon={Users}
                label="System Users"
                value={stats.users?.total || usersList.length}
                accent="brand"
                trend={`Students: ${stats.users?.students || 0} | Leads: ${stats.users?.organizers || 0}`}
              />
              <StatCard
                icon={Building2}
                label="Partner Institutions"
                value={stats.colleges?.total || colleges.length}
                accent="indigo"
                trend={`Verified: ${stats.colleges?.verified || 0}`}
              />
              <StatCard
                icon={Calendar}
                label="Total Event Records"
                value={stats.events?.total || eventsList.length}
                accent="emerald"
                trend={`Approved: ${stats.events?.approved || 0}`}
              />
              <StatCard
                icon={RotateCcw}
                label="Archived in Trash"
                value={stats.events?.deleted || deletedEvents.length}
                accent="rose"
                trend="Soft-deleted entries"
              />
            </div>
          </div>
        )}

        {/* TAB 2: COLLEGES */}
        {activeTab === 'colleges' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Accredited College Institutions</h2>
                <p className="text-xs text-slate-400">Manage multi-tenant college records and institutional domains.</p>
              </div>
              <button
                onClick={() => setIsCollegeModalOpen(true)}
                className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add College</span>
              </button>
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
                    {colleges.map((col) => (
                      <tr key={col._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white">{col.name}</td>
                        <td className="py-3.5 px-4 text-slate-300">{col.location || 'N/A'}</td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono">{col.emailDomain || 'All domains'}</td>
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: USER & ROLE CONTROL */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">System User Accounts & Authorization</h2>
                <p className="text-xs text-slate-400">Reassign user roles across the platform with immediate effect.</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Filter users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
                >
                  <option value="">All Roles</option>
                  <option value="student">Student</option>
                  <option value="organizer">Organizer</option>
                  <option value="admin">College Admin</option>
                  <option value="superadmin">Super Admin</option>
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
                    {usersList
                      .filter((u) => {
                        const q = searchQuery.toLowerCase();
                        const matchQ = (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
                        const matchR = !roleFilter || u.role === roleFilter;
                        return matchQ && matchR;
                      })
                      .map((usr) => (
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
                              className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                            >
                              <option value="student">Student</option>
                              <option value="organizer">Organizer</option>
                              <option value="admin">College Admin</option>
                              <option value="superadmin">Super Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GLOBAL EVENTS MODERATION */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white">Global Event Registry Moderation</h2>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {eventsList.map((evt) => (
                      <tr key={evt._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white">{evt.title || evt.name}</td>
                        <td className="py-3.5 px-4 text-slate-300">{evt.collegeId?.name || 'N/A'}</td>
                        <td className="py-3.5 px-4 text-slate-400">{evt.category}</td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

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

        {/* TAB 6: DIAGNOSTICS */}
        {activeTab === 'diagnostics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-900 border border-slate-800 rounded-2xl p-6 space-y-4">
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

            <div className="bg-surface-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                Multi-Tenant Access Enforcement
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                SuperAdmin holds system-level governance. Changes to roles, verification flags, and soft-delete restorations apply synchronously across the cluster.
              </p>
            </div>
          </div>
        )}

        {/* TAB 7: PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <div className="max-w-xl bg-surface-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white">Super Administrator Account</h3>
              <p className="text-xs text-slate-400 mt-0.5">Update credentials for global platform administration.</p>
            </div>

            {profileMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>{profileMessage}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Admin Name
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={profileForm.currentPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                  placeholder="Required to set new password"
                  className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={profileForm.newPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                  placeholder="Min. 6 characters"
                  className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
              >
                Save Administration Settings
              </button>
            </form>
          </div>
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
