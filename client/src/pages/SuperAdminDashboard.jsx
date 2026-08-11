import React, { useState, useEffect } from 'react';
import { Shield, Building2, Users, Calendar, LogOut, CheckCircle, XCircle, Plus, Search, Edit3, Trash2, UserCheck, RefreshCw, BarChart3, AlertCircle, Sparkles, RotateCcw, Activity, Key, Cpu, User, Lock } from 'lucide-react';
import api from '../api/axios';
import AIChatWidget from '../components/ai/AIChatWidget';

const SuperAdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [deletedEvents, setDeletedEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'colleges' | 'users' | 'events' | 'trash' | 'diagnostics' | 'profile'
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Create College Modal State
  const [isCollegeModalOpen, setIsCollegeModalOpen] = useState(false);
  const [newCollege, setNewCollege] = useState({ name: '', location: '', emailDomain: '' });

  // Profile Edit Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', currentPassword: '', newPassword: '' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch current profile
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setProfileForm(prev => ({ ...prev, name: parsed.name || '', email: parsed.email || '' }));
      }

      // 2. Fetch SuperAdmin Stats
      const { data: statsRes } = await api.get('/api/superadmin/stats');
      setStats(statsRes.stats);

      // 3. Fetch Colleges
      const { data: collegeRes } = await api.get('/api/college/all');
      setColleges(collegeRes.colleges || collegeRes || []);

      // 4. Fetch System Users
      const { data: userRes } = await api.get('/api/superadmin/users');
      setUsersList(userRes.users || []);

      // 5. Fetch Active Events
      const { data: eventRes } = await api.get('/api/admin/events/approved');
      const { data: pendingEventRes } = await api.get('/api/admin/events/pending');
      setEventsList([...(eventRes.data || []), ...(pendingEventRes.data || [])]);

      // 6. Fetch Soft-Deleted Events (Trash Bin)
      const { data: deletedRes } = await api.get('/api/superadmin/events/deleted');
      setDeletedEvents(deletedRes.events || []);
    } catch (err) {
      console.error('SuperAdmin Dashboard Load Error:', err);
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
      alert('College institution created successfully!');
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
      alert(`Event "${title}" restored successfully!`);
    } catch (err) {
      alert('Failed to restore event');
    }
  };

  const handlePermanentDeleteEvent = async (eventId, title) => {
    if (!window.confirm(`Permanently delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/superadmin/events/${eventId}/permanent`);
      fetchInitialData();
    } catch (err) {
      alert('Failed to permanently delete event');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/api/auth/profile', {
        name: profileForm.name,
        currentPassword: profileForm.currentPassword,
        newPassword: profileForm.newPassword
      });
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      setIsProfileModalOpen(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert(err.response?.data?.msg || err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white font-sans relative overflow-x-hidden">
      {/* Background Glow Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl animate-pulse top-[-100px] left-[-100px]" />
        <div className="absolute w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-3xl animate-pulse bottom-[-150px] right-[-150px]" style={{ animationDelay: '1.5s' }} />
        <div className="absolute w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse top-1/2 left-1/3" style={{ animationDelay: '3s' }} />
      </div>

      {/* Header */}
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 rounded-xl text-white shadow-lg shadow-amber-500/25">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white flex items-center gap-2.5">
              <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-purple-300 bg-clip-text text-transparent">
                CollegeSphere Super Admin
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full shadow-inner">
                System Governance
              </span>
            </h1>
            <p className="text-xs text-gray-400">Multi-Tenant Platform Governance & Infrastructure Control</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all text-xs font-semibold"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center font-bold text-slate-950 text-[11px]">
              {user?.name?.[0]?.toUpperCase() || 'S'}
            </div>
            <span className="hidden sm:inline">{user?.name || 'Super Admin'}</span>
          </button>

          <button
            onClick={fetchInitialData}
            className="p-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/5"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-red-600/80 to-rose-600/80 hover:from-red-600 hover:to-rose-600 text-white text-xs font-semibold rounded-xl border border-red-500/30 shadow-lg transition-all hover:scale-105"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10 px-6 pt-3 flex gap-2 overflow-x-auto relative z-10">
        {[
          { id: 'overview', label: 'System Overview', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'colleges', label: 'College Management', icon: <Building2 className="w-4 h-4" /> },
          { id: 'users', label: 'User & Role Control', icon: <Users className="w-4 h-4" /> },
          { id: 'events', label: 'Global Moderation', icon: <Calendar className="w-4 h-4" /> },
          { id: 'trash', label: `Trash Bin (${deletedEvents.length})`, icon: <RotateCcw className="w-4 h-4" /> },
          { id: 'diagnostics', label: 'Platform Health', icon: <Activity className="w-4 h-4" /> },
          { id: 'profile', label: 'Admin Profile', icon: <User className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-amber-400 text-amber-300 bg-amber-500/15 rounded-t-xl backdrop-blur-md shadow-md'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-t-xl'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <main className="p-6 max-w-7xl mx-auto space-y-6 relative z-10">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6 animate-fadeInUp">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl hover:border-amber-500/30 hover:scale-[1.02] transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Users</span>
                  <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                  {stats.users?.total || 0}
                </div>
                <div className="text-[11px] text-gray-400 mt-2 flex gap-3">
                  <span>Students: <strong className="text-indigo-300">{stats.users?.students}</strong></span>
                  <span>Organizers: <strong className="text-indigo-300">{stats.users?.organizers}</strong></span>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl hover:border-amber-500/30 hover:scale-[1.02] transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Colleges Listed</span>
                  <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
                  {stats.colleges?.total || 0}
                </div>
                <p className="text-[11px] text-gray-400 mt-2">Active inter-college institutions</p>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl hover:border-amber-500/30 hover:scale-[1.02] transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Events</span>
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black bg-gradient-to-r from-white via-emerald-100 to-emerald-300 bg-clip-text text-transparent">
                  {stats.events?.total || 0}
                </div>
                <div className="text-[11px] text-gray-400 mt-2 flex gap-3">
                  <span className="text-emerald-400">Approved: {stats.events?.approved}</span>
                  <span className="text-amber-400">Pending: {stats.events?.pending}</span>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl hover:border-amber-500/30 hover:scale-[1.02] transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Registrations</span>
                  <div className="p-2.5 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
                  {stats.registrations?.total || 0}
                </div>
                <p className="text-[11px] text-gray-400 mt-2">Student event bookings</p>
              </div>
            </div>

            {/* System Governance Banner */}
            <div className="bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900/60 backdrop-blur-md border border-amber-500/25 p-6 rounded-2xl shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Super Admin Multi-Tenant Governance</h3>
              </div>
              <p className="text-xs text-gray-300 mb-5 max-w-3xl leading-relaxed">
                As Super Admin, you maintain full platform control: verify new college institutions, elevate user roles (promote users to College Admin or Super Admin), oversee global event approvals, manage soft-deleted trash events, and inspect system diagnostics.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setIsCollegeModalOpen(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  Add College Institution
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl flex items-center gap-2 border border-white/10 transition-all hover:scale-105"
                >
                  <Users className="w-4 h-4" />
                  Manage User Roles
                </button>
              </div>
            </div>
          </div>
        )}

        {/* COLLEGES TAB */}
        {activeTab === 'colleges' && (
          <div className="space-y-4 animate-fadeInUp">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">College Institutions ({colleges.length})</h3>
              <button
                onClick={() => setIsCollegeModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Add College
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {colleges.map((c) => (
                <div key={c._id} className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-xl hover:border-amber-500/30 transition-all space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{c.name}</h4>
                      <p className="text-xs text-gray-400">{c.location || 'Location Not Specified'}</p>
                    </div>
                    <button
                      onClick={() => handleToggleVerification(c._id, c.isVerified)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                        c.isVerified
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {c.isVerified ? 'Verified' : 'Unverified'}
                    </button>
                  </div>

                  {c.emailDomain && (
                    <p className="text-xs text-amber-300 font-mono">Domain: @{c.emailDomain}</p>
                  )}

                  <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                    <button
                      onClick={() => handleDeleteCollege(c._id, c.name)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-1 transition-all border border-red-500/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USERS & ROLES TAB */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-fadeInUp">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <h3 className="font-bold text-lg text-white">System Users & Role Control</h3>

              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search user email or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-slate-900 border border-white/10 text-xs text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
                >
                  <option value="">All Roles</option>
                  <option value="student">Student</option>
                  <option value="organizer">Organizer</option>
                  <option value="admin">College Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-white/5 text-amber-300 font-bold border-b border-white/10 uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">College</th>
                      <th className="p-3.5">Current Role</th>
                      <th className="p-3.5">Assign Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {usersList
                      .filter(u => !roleFilter || u.role === roleFilter)
                      .filter(u => !searchQuery || u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((u) => (
                        <tr key={u._id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3.5 font-semibold text-white">{u.name}</td>
                          <td className="p-3.5 text-gray-400">{u.email}</td>
                          <td className="p-3.5">{u.collegeId?.name || 'N/A'}</td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              u.role === 'superadmin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                              u.role === 'organizer' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                              'bg-white/10 text-gray-300'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              className="bg-slate-900 border border-white/20 text-xs text-white rounded-lg px-2.5 py-1 focus:border-amber-500"
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

        {/* GLOBAL EVENTS TAB */}
        {activeTab === 'events' && (
          <div className="space-y-4 animate-fadeInUp">
            <h3 className="font-bold text-lg text-white">Global Event Moderation ({eventsList.length})</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eventsList.map((e) => (
                <div key={e._id} className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-xl space-y-2 hover:border-amber-500/30 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{e.title}</h4>
                      <p className="text-xs text-gray-400">{e.collegeId?.name || 'College N/A'} • {e.category}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      e.isApproved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {e.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-2">{e.description}</p>
                  <div className="text-[11px] text-gray-400 flex gap-4 pt-1">
                    <span>Date: {new Date(e.date).toLocaleDateString()}</span>
                    <span>Venue: {e.venue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TRASH BIN TAB (SOFT-DELETED EVENTS) */}
        {activeTab === 'trash' && (
          <div className="space-y-4 animate-fadeInUp">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                Trash Bin - Soft-Deleted Events ({deletedEvents.length})
              </h3>
              <p className="text-xs text-gray-400">Events whose event date passed or were manually soft-deleted</p>
            </div>

            {deletedEvents.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-12 rounded-2xl text-center space-y-3">
                <RotateCcw className="w-12 h-12 text-gray-500 mx-auto" />
                <h4 className="font-bold text-white text-base">Trash Bin is Empty</h4>
                <p className="text-xs text-gray-400">There are no soft-deleted events in the recovery bin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deletedEvents.map((e) => (
                  <div key={e._id} className="bg-white/5 backdrop-blur-md border border-red-500/20 p-5 rounded-2xl shadow-xl space-y-3 hover:border-amber-500/30 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          {e.title}
                          <span className="px-2 py-0.5 text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 rounded-full">
                            Deleted
                          </span>
                        </h4>
                        <p className="text-xs text-gray-400">{e.collegeId?.name || 'College N/A'} • {e.category}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 line-clamp-2">{e.description}</p>
                    <div className="text-[11px] text-gray-400 flex gap-4 pt-1">
                      <span>Event Date: {new Date(e.date).toLocaleDateString()}</span>
                      <span>Venue: {e.venue}</span>
                    </div>
                    <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                      <button
                        onClick={() => handleRestoreEvent(e._id, e.title)}
                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-500/30 flex items-center gap-1.5 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore Event
                      </button>
                      <button
                        onClick={() => handlePermanentDeleteEvent(e._id, e.title)}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold rounded-lg border border-red-500/30 flex items-center gap-1.5 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Permanent Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DIAGNOSTICS & PLATFORM HEALTH TAB */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-4 animate-fadeInUp">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              Platform Diagnostics & AI Engine Health
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Database Engine</span>
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-xl font-bold text-white">MongoDB Atlas</div>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Connected & Operational
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Groq LLM Engine</span>
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-xl font-bold text-white">Llama 3.3 70B Versatile</div>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <Key className="w-4 h-4" /> Dual Fallback Primary Ready
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Gemini LLM Engine</span>
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-xl font-bold text-white">Gemini 2.5 Flash</div>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <Cpu className="w-4 h-4" /> Secondary AI Ready
                </p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl space-y-4">
              <h4 className="font-bold text-white text-base">System Operational Limits</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-gray-400 mb-1">JWT Session Lifetime</p>
                  <p className="font-bold text-amber-300">3 Hours (Rolling Token)</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-gray-400 mb-1">Backend Server Port</p>
                  <p className="font-bold text-indigo-300">HTTP 5000</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-gray-400 mb-1">Client Host Port</p>
                  <p className="font-bold text-purple-300">Vite 5173</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-gray-400 mb-1">Active Roles Supported</p>
                  <p className="font-bold text-emerald-300">4 Roles (Student, Org, Admin, Super)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE & SETTINGS TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fadeInUp max-w-3xl mx-auto">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-2xl space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/20">
                  {user?.name?.[0]?.toUpperCase() || 'S'}
                </div>
                <div>
                  <h3 className="font-bold text-xl text-white">{user?.name || 'Super Admin'}</h3>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                  <span className="inline-block mt-2 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                    System Super Admin
                  </span>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 space-y-4">
                <h4 className="font-bold text-white text-sm">Account Overview</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <span className="text-gray-400 block mb-1">Full Name</span>
                    <span className="font-semibold text-white">{user?.name}</span>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <span className="text-gray-400 block mb-1">Email Address</span>
                    <span className="font-semibold text-white">{user?.email}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile & Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CREATE COLLEGE MODAL */}
      {isCollegeModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/90 border border-white/15 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 animate-fadeInUp">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              Add New College Institution
            </h3>
            <form onSubmit={handleCreateCollege} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-300 mb-1">College Name *</label>
                <input
                  type="text"
                  required
                  value={newCollege.name}
                  onChange={(e) => setNewCollege({ ...newCollege, name: e.target.value })}
                  placeholder="e.g. Stanford University"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Location / City</label>
                <input
                  type="text"
                  value={newCollege.location}
                  onChange={(e) => setNewCollege({ ...newCollege, location: e.target.value })}
                  placeholder="e.g. California, USA"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Email Domain (Optional)</label>
                <input
                  type="text"
                  value={newCollege.emailDomain}
                  onChange={(e) => setNewCollege({ ...newCollege, emailDomain: e.target.value })}
                  placeholder="e.g. stanford.edu"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105"
                >
                  Create College
                </button>
                <button
                  type="button"
                  onClick={() => setIsCollegeModalOpen(false)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 font-medium rounded-xl border border-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/90 border border-white/15 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 animate-fadeInUp">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <User className="w-5 h-5 text-amber-400" />
              Edit Admin Profile & Password
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Current Password (Required for Password Change)</label>
                <input
                  type="password"
                  value={profileForm.currentPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={profileForm.newPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105"
                >
                  Save Profile Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 font-medium rounded-xl border border-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI ASSISTANT WIDGET FOR SUPER ADMIN */}
      <AIChatWidget userRole="superadmin" userName={user?.name || 'Super Admin'} />
    </div>
  );
};

export default SuperAdminDashboard;
