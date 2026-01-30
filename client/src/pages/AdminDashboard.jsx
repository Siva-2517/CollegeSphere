import React, { useState, useEffect } from 'react';
import { Shield, Users, Calendar, Building2, LogOut, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp, Sparkles, Search, Download, Menu, X as CloseIcon } from 'lucide-react';

const AnimatedCounter = ({ end, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count}</span>;
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, type = 'approve' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 animate-fadeInUp">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${type === 'approve' ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
          {type === 'approve' ? (
            <CheckCircle className="w-6 h-6 text-green-400" />
          ) : (
            <XCircle className="w-6 h-6 text-red-400" />
          )}
        </div>
        <h3 className="text-xl font-bold text-center mb-2">{title}</h3>
        <p className="text-gray-400 text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white/5 border border-white/10 rounded-lg font-semibold hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${type === 'approve'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:scale-105'
              : 'bg-gradient-to-r from-red-600 to-rose-600 hover:scale-105'
              }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to format date as DD/MM/YYYY
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingOrganizers, setPendingOrganizers] = useState([]);
  const [approvedOrganizers, setApprovedOrganizers] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [stats, setStats] = useState({
    totalColleges: 0,
    totalOrganizers: 0,
    pendingApprovals: 0,
    totalEvents: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingIds, setProcessingIds] = useState({});
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'approve',
    organizerId: null,
    organizerName: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

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
        alert('Access denied. Super Admin role required.');
        window.location.href = '/login';
        return;
      }
      setUser(parsedUser);
      fetchDashboardData(token);
    } catch (error) {
      console.error('Error parsing user data:', error);
      window.location.href = '/login';
    }
  }, []);

  const fetchDashboardData = async (token) => {
    setLoading(true);
    setError('');

    try {
      // Fetch stats from backend
      const statsRes = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          totalColleges: statsData.data.totalColleges || 0,
          totalOrganizers: statsData.data.totalOrganizers || 0,
          pendingApprovals: statsData.data.pendingApprovals || 0,
          totalEvents: statsData.data.totalEvents || 0
        });
      }

      // Fetch pending organizers
      const pendingOrgRes = await fetch('http://localhost:5000/api/admin/organizers/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (pendingOrgRes.ok) {
        const pendingOrgData = await pendingOrgRes.json();
        setPendingOrganizers(pendingOrgData.data || []);
      }

      // Fetch approved organizers
      const approvedOrgRes = await fetch('http://localhost:5000/api/admin/organizers/approved', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (approvedOrgRes.ok) {
        const approvedOrgData = await approvedOrgRes.json();
        setApprovedOrganizers(approvedOrgData.data || []);
      }

      // Fetch pending events
      const pendingEventsRes = await fetch('http://localhost:5000/api/admin/events/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      let pendingEventsData = [];
      if (pendingEventsRes.ok) {
        const data = await pendingEventsRes.json();
        pendingEventsData = data.data || [];
        setPendingEvents(pendingEventsData);
      }

      // Fetch approved events
      const approvedEventsRes = await fetch('http://localhost:5000/api/admin/events/approved', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      let approvedEventsData = [];
      if (approvedEventsRes.ok) {
        const data = await approvedEventsRes.json();
        approvedEventsData = data.data || [];
        setApprovedEvents(approvedEventsData);
      }

      // Combine all events for the "All Events" tab
      const allEventsData = [...pendingEventsData, ...approvedEventsData];
      setAllEvents(allEventsData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrganizer = async (organizerId) => {
    const token = localStorage.getItem('token');
    setProcessingIds(prev => ({ ...prev, [organizerId]: true }));

    try {
      const response = await fetch(`http://localhost:5000/api/admin/organizers/${organizerId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setPendingOrganizers(prev => prev.filter(org => org._id !== organizerId));
        setSuccessMessage('Organizer approved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchDashboardData(token);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to approve organizer');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error approving organizer:', error);
      setError('Failed to approve organizer');
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessingIds(prev => ({ ...prev, [organizerId]: false }));
      setConfirmModal({ isOpen: false, type: 'approve', organizerId: null, organizerName: '' });
    }
  };

  const handleRejectOrganizer = async (organizerId) => {
    const token = localStorage.getItem('token');
    setProcessingIds(prev => ({ ...prev, [organizerId]: true }));

    try {
      const response = await fetch(`http://localhost:5000/api/admin/organizers/${organizerId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setPendingOrganizers(prev => prev.filter(org => org._id !== organizerId));
        setSuccessMessage('Organizer rejected successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchDashboardData(token);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to reject organizer');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error rejecting organizer:', error);
      setError('Failed to reject organizer');
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessingIds(prev => ({ ...prev, [organizerId]: false }));
      setConfirmModal({ isOpen: false, type: 'reject', organizerId: null, organizerName: '' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleApproveEvent = async (eventId) => {
    const token = localStorage.getItem('token');
    setProcessingIds(prev => ({ ...prev, [eventId]: true }));

    try {
      const response = await fetch(`http://localhost:5000/api/admin/events/${eventId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setAllEvents(prev => prev.map(e => e._id === eventId ? { ...e, isApproved: true } : e));
        setSuccessMessage('Event approved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchDashboardData(token);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to approve event');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error approving event:', error);
      setError('Failed to approve event');
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessingIds(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleRejectEvent = async (eventId) => {
    const token = localStorage.getItem('token');
    setProcessingIds(prev => ({ ...prev, [eventId]: true }));

    try {
      const response = await fetch(`http://localhost:5000/api/admin/events/${eventId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setAllEvents(prev => prev.map(e => e._id === eventId ? { ...e, isApproved: false } : e));
        setSuccessMessage('Event rejected successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchDashboardData(token);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to reject event');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error rejecting event:', error);
      setError('Failed to reject event');
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessingIds(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleDeleteEvent = async (eventId) => {
    const token = localStorage.getItem('token');
    setProcessingIds(prev => ({ ...prev, [eventId]: true }));

    try {
      const response = await fetch(`http://localhost:5000/api/admin/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setAllEvents(prev => prev.filter(e => e._id !== eventId));
        setSuccessMessage('Event deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchDashboardData(token);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete event');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event');
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessingIds(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const exportOrganizers = () => {
    const csv = [
      ['Name', 'Email', 'College', 'Created Events', 'Joined Date'],
      ...approvedOrganizers.map(org => [
        org.name || 'N/A',
        org.email || 'N/A',
        org.collegeName || 'N/A',
        org.eventsCount || 0,
        formatDate(org.createdAt)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'approved-organizers.csv';
    a.click();
  };

  const filteredPendingOrganizers = pendingOrganizers.filter(org =>
    org.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.collegeName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredApprovedOrganizers = approvedOrganizers.filter(org =>
    org.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.collegeName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out; }
        .animate-slideInLeft { animation: slideInLeft 0.3s ease-out; }
      `}</style>

      <header className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  CollegeSphere
                </h1>
                <p className="text-xs text-gray-400">Super Admin Dashboard</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 transition-colors ${activeTab === 'dashboard' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <TrendingUp className="w-4 h-4" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('approvals')}
                className={`flex items-center gap-2 transition-colors ${activeTab === 'approvals' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Clock className="w-4 h-4" />
                Organizer Approvals
                {stats.pendingApprovals > 0 && (
                  <span className="px-2 py-0.5 bg-orange-500 text-xs rounded-full">{stats.pendingApprovals}</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('eventApprovals')}
                className={`flex items-center gap-2 transition-colors ${activeTab === 'eventApprovals' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Calendar className="w-4 h-4" />
                Event Approvals
                {pendingEvents.length > 0 && (
                  <span className="px-2 py-0.5 bg-orange-500 text-xs rounded-full">{pendingEvents.length}</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('organizers')}
                className={`flex items-center gap-2 transition-colors ${activeTab === 'organizers' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Users className="w-4 h-4" />
                Organizers
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`flex items-center gap-2 transition-colors ${activeTab === 'events' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Calendar className="w-4 h-4" />
                All Events
              </button>
            </nav>

            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className="hidden md:block text-right hover:opacity-80 transition-opacity"
              >
                <p className="text-sm font-medium">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-400">Super Admin</p>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          ></div>

          {/* Sidebar */}
          <div className="absolute top-0 left-0 h-full w-64 bg-slate-900 border-r border-white/10 shadow-2xl animate-slideInLeft">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    CollegeSphere
                  </h2>
                  <p className="text-xs text-gray-400">Admin Panel</p>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="p-6 border-b border-white/10">
              <p className="text-sm font-medium text-white">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-400">Super Admin</p>
            </div>

            {/* Navigation Links */}
            <nav className="p-4 space-y-2">
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">Overview</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('approvals');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${activeTab === 'approvals'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Organizer Approvals</span>
                </div>
                {stats.pendingApprovals > 0 && (
                  <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full font-semibold">
                    {stats.pendingApprovals}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('eventApprovals');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${activeTab === 'eventApprovals'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">Event Approvals</span>
                </div>
                {pendingEvents.length > 0 && (
                  <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full font-semibold">
                    {pendingEvents.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('organizers');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'organizers'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Organizers</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('events');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'events'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="font-medium">All Events</span>
              </button>

              <div className="border-t border-white/10 my-2"></div>

              <button
                onClick={() => {
                  setActiveTab('profile');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'profile'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <Shield className="w-5 h-5" />
                <span className="font-medium">Profile</span>
              </button>
            </nav>

            {/* Logout Button */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all text-red-400 font-medium"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}


      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3 animate-fadeInUp">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-300">{successMessage}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 animate-fadeInUp">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fadeInUp">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Platform Overview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <Building2 className="w-8 h-8 text-blue-400" />
                  <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    <AnimatedCounter end={stats.totalColleges} />
                  </span>
                </div>
                <p className="text-gray-400">Total Colleges</p>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-purple-400" />
                  <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    <AnimatedCounter end={stats.totalOrganizers} />
                  </span>
                </div>
                <p className="text-gray-400">Approved Organizers</p>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="w-8 h-8 text-orange-400" />
                  <span className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                    <AnimatedCounter end={stats.pendingApprovals} />
                  </span>
                </div>
                <p className="text-gray-400">Pending Approvals</p>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <Calendar className="w-8 h-8 text-green-400" />
                  <span className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    <AnimatedCounter end={stats.totalEvents} />
                  </span>
                </div>
                <p className="text-gray-400">Total Events</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center">
              <Shield className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Platform Administration</h3>
              <p className="text-gray-400 mb-6">Manage organizer approvals, monitor events, and oversee the entire CollegeSphere platform.</p>
              {stats.pendingApprovals > 0 && (
                <button
                  onClick={() => setActiveTab('approvals')}
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg font-semibold hover:scale-105 transition-all"
                >
                  Review {stats.pendingApprovals} Pending Approval{stats.pendingApprovals !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="space-y-6 animate-fadeInUp">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Pending Organizer Approvals
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white w-full sm:w-auto"
                />
              </div>
            </div>

            {filteredPendingOrganizers.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No pending organizer approvals</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPendingOrganizers.map((organizer, idx) => (
                  <div
                    key={organizer._id}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:scale-105 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{organizer.name}</h3>
                        <p className="text-gray-400 text-sm">{organizer.email}</p>
                      </div>
                      <span className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-semibold">
                        Pending
                      </span>
                    </div>

                    <div className="space-y-2 mb-4 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>{organizer.collegeName || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Requested: {formatDate(organizer.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmModal({
                          isOpen: true,
                          type: 'approve',
                          organizerId: organizer._id,
                          organizerName: organizer.name
                        })}
                        disabled={processingIds[organizer._id]}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500/10 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-all disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {processingIds[organizer._id] ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => setConfirmModal({
                          isOpen: true,
                          type: 'reject',
                          organizerId: organizer._id,
                          organizerName: organizer.name
                        })}
                        disabled={processingIds[organizer._id]}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        {processingIds[organizer._id] ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'eventApprovals' && (
          <div className="space-y-6 animate-fadeInUp">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Pending Event Approvals
              </h2>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white w-full sm:w-auto"
                />
              </div>
            </div>

            {pendingEvents.filter(event =>
              event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              event.collegeId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              event.createdBy?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 ? (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No pending event approvals</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingEvents.filter(event =>
                  event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  event.collegeId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  event.createdBy?.name?.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((event, idx) => (
                  <div
                    key={event._id}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:scale-105 transition-all"
                  >
                    <div className="h-32 bg-gradient-to-br from-purple-600 to-pink-600 relative" style={{
                      backgroundImage: event.poster ? `url(${event.poster})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}>
                      {event.poster && <div className="absolute inset-0 bg-black/30"></div>}
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-semibold">
                          Pending
                        </span>
                      </div>
                      {event.category && (
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-semibold">
                            {event.category}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2">{event.title}</h3>

                      <div className="space-y-2 mb-4 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span>{event.collegeId?.name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>By: {event.createdBy?.name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Deadline: {formatDate(event.deadline)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveEvent(event._id)}
                          disabled={processingIds[event._id]}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500/10 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-all disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {processingIds[event._id] ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleRejectEvent(event._id)}
                          disabled={processingIds[event._id]}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          {processingIds[event._id] ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {activeTab === 'organizers' && (
          <div className="space-y-6 animate-fadeInUp">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Approved Organizers
              </h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search organizers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white w-full"
                  />
                </div>
                <button
                  onClick={exportOrganizers}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:scale-105 transition-all whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">Export</span>
                </button>
              </div>
            </div>

            {filteredApprovedOrganizers.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No approved organizers found</p>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">College</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Events Created</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Joined</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredApprovedOrganizers.map((organizer) => (
                        <tr key={organizer._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">{organizer.name}</td>
                          <td className="px-6 py-4 text-gray-400">{organizer.email}</td>
                          <td className="px-6 py-4 text-gray-400">{organizer.collegeName || 'N/A'}</td>
                          <td className="px-6 py-4 text-gray-400">{organizer.eventsCount || 0}</td>
                          <td className="px-6 py-4 text-gray-400">
                            {formatDate(organizer.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-semibold">
                              Approved
                            </span>
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

        {activeTab === 'events' && (
          <div className="space-y-6 animate-fadeInUp">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                All Platform Events
              </h2>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white w-full sm:w-auto"
                />
              </div>
            </div>

            {allEvents.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No events found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allEvents.filter(event =>
                  event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  event.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  event.collegeName?.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((event, idx) => (
                  <div
                    key={event._id}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:scale-105 transition-all"
                  >
                    <div className="h-32 bg-gradient-to-br from-purple-600 to-pink-600 relative" style={{
                      backgroundImage: event.poster ? `url(${event.poster})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}>
                      {event.poster && <div className="absolute inset-0 bg-black/30"></div>}
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${event.isApproved
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          }`}>
                          {event.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                      {event.category && (
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-semibold">
                            {event.category}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2">{event.title || event.name}</h3>

                      {event.category && (
                        <p className="text-sm text-blue-300 mb-3 font-medium">Category: {event.category}</p>
                      )}

                      <div className="space-y-2 mb-4 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span>{event.collegeId?.name || event.collegeName || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Deadline: {formatDate(event.registrationDeadline || event.deadline)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{event.registrationCount || 0} registrations</span>
                        </div>
                      </div>

                      {!event.isApproved && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveEvent(event._id)}
                            disabled={processingIds[event._id]}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500/10 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-all disabled:opacity-50 text-green-400 text-sm font-semibold"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {processingIds[event._id] ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleRejectEvent(event._id)}
                            disabled={processingIds[event._id]}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50 text-red-400 text-sm font-semibold"
                          >
                            <XCircle className="w-4 h-4" />
                            {processingIds[event._id] ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      )}

                      {event.isApproved && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteEvent(event._id)}
                            disabled={processingIds[event._id]}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50 text-red-400 text-sm font-semibold"
                          >
                            <XCircle className="w-4 h-4" />
                            {processingIds[event._id] ? 'Processing...' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fadeInUp">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Admin Profile
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
                      <Shield className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">{user?.name || 'Admin'}</h3>
                    <p className="text-gray-400 mb-2">{user?.email || 'admin@collegesphere.com'}</p>
                    <span className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-sm font-semibold">
                      Super Admin
                    </span>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Role</span>
                      <span className="font-medium">{user?.role || 'admin'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Status</span>
                      <span className="text-green-400 font-medium">Active</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Member Since</span>
                      <span className="font-medium">Jan 2024</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="lg:col-span-2">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-bold mb-6">Platform Overview</h3>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="w-5 h-5 text-blue-400" />
                        <span className="text-gray-400 text-sm">Colleges</span>
                      </div>
                      <p className="text-2xl font-bold">{stats.totalColleges}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 text-purple-400" />
                        <span className="text-gray-400 text-sm">Organizers</span>
                      </div>
                      <p className="text-2xl font-bold">{stats.totalOrganizers}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-green-400" />
                        <span className="text-gray-400 text-sm">Total Events</span>
                      </div>
                      <p className="text-2xl font-bold">{stats.totalEvents}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-orange-400" />
                        <span className="text-gray-400 text-sm">Pending</span>
                      </div>
                      <p className="text-2xl font-bold">{stats.pendingApprovals + pendingEvents.length}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-400">Quick Actions</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => setActiveTab('approvals')}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500/10 border border-orange-500/30 rounded-lg hover:bg-orange-500/20 transition-all"
                      >
                        <Clock className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-medium">Review Organizers</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('eventApprovals')}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-all"
                      >
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium">Review Events</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('organizers')}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-all"
                      >
                        <Users className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium">View Organizers</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('events')}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-all"
                      >
                        <Calendar className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium">View All Events</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {stats.pendingApprovals > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                    <p className="text-sm">
                      <span className="font-semibold">{stats.pendingApprovals}</span> organizer approval{stats.pendingApprovals !== 1 ? 's' : ''} pending
                    </p>
                  </div>
                )}
                {pendingEvents.length > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-blue-400" />
                    <p className="text-sm">
                      <span className="font-semibold">{pendingEvents.length}</span> event approval{pendingEvents.length !== 1 ? 's' : ''} pending
                    </p>
                  </div>
                )}
                {stats.pendingApprovals === 0 && pendingEvents.length === 0 && (
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-sm">All approvals are up to date!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: 'approve', organizerId: null, organizerName: '' })}
        onConfirm={() => {
          if (confirmModal.type === 'approve') {
            handleApproveOrganizer(confirmModal.organizerId);
          } else {
            handleRejectOrganizer(confirmModal.organizerId);
          }
        }}
        type={confirmModal.type}
        title={confirmModal.type === 'approve' ? 'Approve Organizer?' : 'Reject Organizer?'}
        message={`Are you sure you want to ${confirmModal.type} ${confirmModal.organizerName}? This action cannot be undone.`}
      />
    </div>
  );
}