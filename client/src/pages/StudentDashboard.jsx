import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Users, LogOut, Home, BookOpen, Trophy, Sparkles, Search, Filter, AlertCircle, CheckCircle, XCircle, ArrowRight, Menu, X as CloseIcon, BarChart3 } from 'lucide-react';

// Animated Counter Component
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

// Helper function to format date as DD/MM/YYYY
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, deadlines: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [processingEvents, setProcessingEvents] = useState({});
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      window.location.href = '/login';
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
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
      // Fetch upcoming events
      const eventsRes = await fetch('http://localhost:5000/api/event/AllEvents', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setUpcomingEvents(eventsData.events || eventsData || []);
      } else if (eventsRes.status === 401) {
        handleLogout();
        return;
      } else {
        // Fallback demo data
        setUpcomingEvents([
          {
            _id: '1',
            name: 'TechFest 2026',
            collegeName: 'MIT College',
            date: '2026-02-15',
            venue: 'Main Auditorium',
            deadline: '2026-02-10',
            isRegistered: false
          },
          {
            _id: '2',
            name: 'AI Workshop',
            collegeName: 'Stanford',
            date: '2026-02-20',
            venue: 'Tech Lab',
            deadline: '2026-02-18',
            isRegistered: true
          }
        ]);
      }

      // Fetch my registrations
      const regRes = await fetch('http://localhost:5000/api/registration/my-registrations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (regRes.ok) {
        const regData = await regRes.json();
        setMyRegistrations(regData.registrations || regData || []);

        // Calculate stats
        const registrations = regData.registrations || regData || [];
        const now = new Date();
        const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

        setStats({
          total: registrations.length,
          upcoming: registrations.filter(r => new Date(r.eventDate || r.date) > now).length,
          deadlines: registrations.filter(r => {
            const eventDate = new Date(r.eventDate || r.date);
            return eventDate > now && eventDate <= twoDaysFromNow;
          }).length
        });
      } else if (regRes.status === 401) {
        handleLogout();
        return;
      } else {
        // Fallback
        setMyRegistrations([
          {
            _id: 'r1',
            eventName: 'AI Workshop',
            collegeName: 'Stanford',
            eventDate: '2026-02-20',
            status: 'registered',
            deadline: '2026-02-18'
          }
        ]);
        setStats({ total: 1, upcoming: 1, deadlines: 0 });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard. Please try again.');
      // Set fallback data
      setUpcomingEvents([
        {
          _id: '1',
          name: 'TechFest 2026',
          collegeName: 'MIT College',
          date: '2026-02-15',
          venue: 'Main Auditorium',
          deadline: '2026-02-10',
          isRegistered: false
        }
      ]);
      setMyRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    const token = localStorage.getItem('token');
    setProcessingEvents(prev => ({ ...prev, [eventId]: true }));

    try {
      const response = await fetch(`http://localhost:5000/api/registration/register/${eventId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Update local state
        setUpcomingEvents(prev =>
          prev.map(event =>
            event._id === eventId ? { ...event, isRegistered: true } : event
          )
        );

        // Refresh registrations
        fetchDashboardData(token);
      } else {
        alert('Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setProcessingEvents(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleCancelRegistration = async (registrationId, eventId) => {
    const token = localStorage.getItem('token');
    setProcessingEvents(prev => ({ ...prev, [registrationId]: true }));

    try {
      const response = await fetch(`http://localhost:5000/api/registration/cancel/${registrationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Update local state
        setMyRegistrations(prev => prev.filter(r => r._id !== registrationId));

        // Update upcoming events if event is still there
        if (eventId) {
          setUpcomingEvents(prev =>
            prev.map(event =>
              event._id === eventId ? { ...event, isRegistered: false } : event
            )
          );
        }

        // Refresh data
        fetchDashboardData(token);
      } else {
        alert('Cancellation failed. Please try again.');
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      alert('Cancellation failed. Please try again.');
    } finally {
      setProcessingEvents(prev => ({ ...prev, [registrationId]: false }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const deadline = new Date(event.deadline);

    if (event.isRegistered) return 'registered';
    if (deadline < now) return 'closed';
    return 'open';
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', label: 'Open' },
      closed: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: 'Closed' },
      registered: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', label: 'Registered' }
    };
    const badge = badges[status] || badges.open;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text} border ${badge.border}`}>
        {badge.label}
      </span>
    );
  };

  const getDaysUntilDeadline = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredEvents = upcomingEvents.filter(event => {
    const matchesSearch = event.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.collegeName?.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && getEventStatus(event) === filterStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your dashboard...</p>
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

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed top-0 left-0 h-full w-72 bg-slate-900 border-r border-white/10 z-50 md:hidden animate-slideInLeft">
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="font-bold">CollegeSphere</h2>
                      <p className="text-xs text-gray-400">Student</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-all"
                  >
                    <CloseIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name || 'Student'}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <button
                  onClick={() => {
                    setActiveTab('home');
                    setIsSidebarOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'home'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <Home className="w-5 h-5" />
                  <span className="font-medium">Home</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('events');
                    setIsSidebarOpen(false);
                    document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'events'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">Events</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('registrations');
                    setIsSidebarOpen(false);
                    document.getElementById('registrations')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'registrations'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="font-medium">My Registrations</span>
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
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Profile</span>
                </button>
              </nav>

              {/* Logout Button */}
              <div className="p-4 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  CollegeSphere
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block">Student Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                <button
                  onClick={() => {
                    setActiveTab('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-2 transition-colors ${activeTab === 'home' ? 'text-white' : 'text-gray-300 hover:text-white'
                    }`}
                >
                  <Home className="w-4 h-4" />
                  Home
                </button>
                <button
                  onClick={() => {
                    setActiveTab('events');
                    document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-2 transition-colors ${activeTab === 'events' ? 'text-white' : 'text-gray-300 hover:text-white'
                    }`}
                >
                  <Calendar className="w-4 h-4" />
                  Events
                </button>
                <button
                  onClick={() => {
                    setActiveTab('registrations');
                    document.getElementById('registrations')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-2 transition-colors ${activeTab === 'registrations' ? 'text-white' : 'text-gray-300 hover:text-white'
                    }`}
                >
                  <BookOpen className="w-4 h-4" />
                  My Registrations
                </button>
              </nav>

              <button
                onClick={() => {
                  setActiveTab('profile');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hidden md:block text-right hover:opacity-80 transition-opacity"
              >
                <p className="text-sm font-medium">{user?.name || 'Student'}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8" id="home">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Show home content only when profile is not active */}
        {activeTab !== 'profile' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fadeInUp">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <Trophy className="w-8 h-8 text-purple-400" />
                  <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    <AnimatedCounter end={stats.total} />
                  </span>
                </div>
                <p className="text-gray-400">Total Registrations</p>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <Calendar className="w-8 h-8 text-blue-400" />
                  <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    <AnimatedCounter end={stats.upcoming} />
                  </span>
                </div>
                <p className="text-gray-400">Upcoming Events</p>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="w-8 h-8 text-orange-400" />
                  <span className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                    <AnimatedCounter end={stats.deadlines} />
                  </span>
                </div>
                <p className="text-gray-400">Deadlines This Week</p>
              </div>
            </div>

            {/* Upcoming Events Section */}
            <section id="events" className="mb-12 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Available Events
                </h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-auto pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="all" className="bg-slate-900">All Status</option>
                    <option value="open" className="bg-slate-900">Open</option>
                    <option value="registered" className="bg-slate-900">Registered</option>
                    <option value="closed" className="bg-slate-900">Closed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event, idx) => {
                  const status = getEventStatus(event);
                  const daysLeft = getDaysUntilDeadline(event.deadline);
                  const isUrgent = daysLeft <= 2 && daysLeft > 0;

                  return (
                    <div
                      key={event._id}
                      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="h-32 bg-gradient-to-br from-purple-600 to-pink-600 relative">
                        <div className="absolute top-4 right-4">
                          {getStatusBadge(status)}
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-2">{event.name}</h3>

                        <div className="space-y-2 mb-4 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{event.collegeName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(event.date)}</span>
                          </div>
                          {event.venue && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{event.venue}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span className={isUrgent ? 'text-orange-400 font-semibold' : ''}>
                              Deadline: {formatDate(event.deadline)}
                              {isUrgent && ` (${daysLeft} days left!)`}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRegister(event._id)}
                          disabled={status !== 'open' || processingEvents[event._id]}
                          className={`w-full py-3 rounded-lg font-semibold transition-all ${status === 'open'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105'
                            : 'bg-gray-600 cursor-not-allowed opacity-50'
                            }`}
                        >
                          {processingEvents[event._id] ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Processing...
                            </span>
                          ) : status === 'registered' ? (
                            'Already Registered'
                          ) : status === 'closed' ? (
                            'Registration Closed'
                          ) : (
                            'Register Now'
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No events found matching your criteria</p>
                </div>
              )}
            </section>

            {/* My Registrations Section */}
            <section id="registrations" className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
                My Registrations
              </h2>

              {myRegistrations.length === 0 ? (
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-4">You haven't registered for any events yet</p>
                  <a href="#events" className="text-purple-400 hover:text-purple-300 font-medium">
                    Browse Available Events →
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myRegistrations.map((registration, idx) => {
                    const isPastDeadline = new Date(registration.deadline) < new Date();
                    const canCancel = !isPastDeadline && registration.status !== 'cancelled';

                    return (
                      <div
                        key={registration._id}
                        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:scale-105 transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold mb-1">{registration.eventName || registration.name}</h3>
                            <p className="text-gray-400 text-sm">{registration.collegeName}</p>
                          </div>
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>

                        <div className="space-y-2 mb-4 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Event: {formatDate(registration.eventDate || registration.date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Registered on: {formatDate(registration.registeredAt || registration.createdAt || Date.now())}</span>
                          </div>
                        </div>

                        {canCancel ? (
                          <button
                            onClick={() => handleCancelRegistration(registration._id, registration.eventId)}
                            disabled={processingEvents[registration._id]}
                            className="w-full py-2 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all font-semibold text-red-400"
                          >
                            {processingEvents[registration._id] ? 'Cancelling...' : 'Cancel Registration'}
                          </button>
                        ) : (
                          <div className="w-full py-2 bg-gray-600/20 border border-gray-600/30 rounded-lg text-center text-gray-400 text-sm">
                            {isPastDeadline ? 'Deadline Passed' : 'Cancelled'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fadeInUp">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Student Profile
              </h2>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{user?.name || 'Student'}</h3>
                    <p className="text-gray-400 text-sm mb-1">{user?.email}</p>
                    <p className="text-gray-500 text-xs mb-4">Role: Student</p>

                    <div className="w-full pt-4 border-t border-white/10 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Status:</span>
                        <span className="text-green-400 font-semibold">Active</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Member Since:</span>
                        <span className="font-medium">Jan 2024</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Trophy className="w-8 h-8 text-purple-400" />
                      <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        <AnimatedCounter end={stats.total} />
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">Total Registrations</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Calendar className="w-8 h-8 text-blue-400" />
                      <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        <AnimatedCounter end={stats.upcoming} />
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">Upcoming Events</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="w-8 h-8 text-orange-400" />
                      <span className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                        <AnimatedCounter end={stats.deadlines} />
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">Deadlines This Week</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                      <span className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                        <AnimatedCounter end={upcomingEvents.filter(e => e.isRegistered).length} />
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">Registered Events</p>
                  </div>
                </div>

                {/* Activity Summary */}
                <div className="mt-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Activity Summary
                  </h3>
                  <div className="space-y-3">
                    {myRegistrations.length > 0 ? (
                      <>
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Latest Registration</p>
                            <p className="text-xs text-gray-400">{myRegistrations[0]?.eventName || 'N/A'}</p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(myRegistrations[0]?.registeredAt || myRegistrations[0]?.createdAt)}
                          </span>
                        </div>
                        {stats.upcoming > 0 && (
                          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Upcoming Events</p>
                              <p className="text-xs text-gray-400">You have {stats.upcoming} event{stats.upcoming !== 1 ? 's' : ''} coming up</p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">No activity yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}