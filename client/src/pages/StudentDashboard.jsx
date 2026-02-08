import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Users, LogOut, Home, BookOpen, Trophy, Sparkles, Search, Filter, AlertCircle, CheckCircle, XCircle, ArrowRight, Menu, X as CloseIcon, BarChart3, Edit } from 'lucide-react';
import api from '../api/axios';

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

// Poster Preview Modal Component
const PosterPreviewModal = ({ isOpen, onClose, posterUrl, title }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <CloseIcon className="w-8 h-8" />
        </button>
        <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
          <div className="flex items-center justify-center bg-black">
            <img
              src={posterUrl}
              alt={title}
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Profile Edit Modal Component
const ProfileEditModal = ({ isOpen, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({ name: '', currentPassword: '', newPassword: '' });
  const [activeSection, setActiveSection] = useState('profile'); // 'profile' or 'password'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name || '', currentPassword: '', newPassword: '' });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (activeSection === 'profile') {
        await onSave({ name: formData.name }, 'profile');
      } else {
        if (!formData.currentPassword || !formData.newPassword) {
          setError('Both current and new password are required');
          setLoading(false);
          return;
        }
        await onSave({ currentPassword: formData.currentPassword, newPassword: formData.newPassword }, 'password');
        setFormData({ ...formData, currentPassword: '', newPassword: '' });
      }
    } catch (err) {
      setError(err.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 animate-fadeInUp">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Edit Profile</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveSection('profile')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${activeSection === 'profile'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-white/5 hover:bg-white/10'
              }`}
          >
            Profile Info
          </button>
          <button
            onClick={() => setActiveSection('password')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${activeSection === 'password'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-white/5 hover:bg-white/10'
              }`}
          >
            Change Password
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeSection === 'profile' ? (
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  minLength="6"
                />
                <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Team Registration Modal Component
const TeamRegistrationModal = ({ isOpen, onClose, event, onRegister }) => {
  const [teamName, setTeamName] = useState('');
  const [participants, setParticipants] = useState([{ name: '', email: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && event) {
      // Initialize participants based on team size
      const minSize = event.minTeamSize || 2;
      const initialParticipants = Array.from({ length: minSize }, () => ({ name: '', email: '' }));
      setParticipants(initialParticipants);
      setTeamName('');
      setError('');
    }
  }, [isOpen, event]);

  const addParticipant = () => {
    const maxSize = event?.maxTeamSize || 50;
    if (participants.length < maxSize) {
      setParticipants([...participants, { name: '', email: '' }]);
    }
  };

  const removeParticipant = (index) => {
    const minSize = event?.minTeamSize || 2;
    if (participants.length > minSize) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (index, field, value) => {
    const updated = [...participants];
    updated[index][field] = value;
    setParticipants(updated);
  };

  const validateForm = () => {
    if (!teamName.trim()) {
      setError('Team name is required');
      return false;
    }

    for (let i = 0; i < participants.length; i++) {
      if (!participants[i].name.trim()) {
        setError(`Participant ${i + 1} name is required`);
        return false;
      }
      if (!participants[i].email.trim()) {
        setError(`Participant ${i + 1} email is required`);
        return false;
      }
      // Basic email validation
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(participants[i].email)) {
        setError(`Participant ${i + 1} has invalid email format`);
        return false;
      }
    }

    const minSize = event?.minTeamSize;
    const maxSize = event?.maxTeamSize;

    if (minSize && participants.length < minSize) {
      setError(`Team must have at least ${minSize} members`);
      return false;
    }

    if (maxSize && participants.length > maxSize) {
      setError(`Team cannot exceed ${maxSize} members`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      await onRegister(event._id, { teamName, participants });
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !event) return null;

  const teamSizeInfo = event.minTeamSize && event.maxTeamSize && event.minTeamSize === event.maxTeamSize
    ? `${event.minTeamSize} members`
    : event.minTeamSize && event.maxTeamSize
      ? `${event.minTeamSize}-${event.maxTeamSize} members`
      : event.minTeamSize
        ? `Min ${event.minTeamSize} members`
        : event.maxTeamSize
          ? `Max ${event.maxTeamSize} members`
          : 'Team event';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeInUp">
        <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Team Registration
            </h2>
            <p className="text-sm text-gray-400 mt-1">{event.title || event.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Event Info */}
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <p className="text-sm text-purple-300">
              <strong>Team Size:</strong> {teamSizeInfo}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team Name *
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              placeholder="Enter your team name"
              required
            />
          </div>

          {/* Participants */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-300">
                Team Members *
              </label>
              {(!event.maxTeamSize || participants.length < event.maxTeamSize) && (
                <button
                  type="button"
                  onClick={addParticipant}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  + Add Member
                </button>
              )}
            </div>

            <div className="space-y-4">
              {participants.map((participant, index) => (
                <div key={index} className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-300">
                      Member {index + 1}
                    </h4>
                    {(!event.minTeamSize || participants.length > event.minTeamSize) && (
                      <button
                        type="button"
                        onClick={() => removeParticipant(index)}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={participant.name}
                      onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                      placeholder="Full Name"
                      required
                    />
                    <input
                      type="email"
                      value={participant.email}
                      onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                      placeholder="Email Address"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? 'Registering...' : 'Register Team'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg font-semibold hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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
  const [showMyCollegeOnly, setShowMyCollegeOnly] = useState(false);
  const [posterPreview, setPosterPreview] = useState({ isOpen: false, url: '', title: '' });
  const [profileEditModal, setProfileEditModal] = useState(false);
  const [teamRegModal, setTeamRegModal] = useState({ isOpen: false, event: null });

  // Advanced filter states
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

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

  // Refetch events when college filter changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && user) {
      fetchDashboardData(token);
    }
  }, [showMyCollegeOnly]);

  const fetchDashboardData = async (token) => {
    setLoading(true);
    setError('');

    try {
      // Fetch colleges for filter dropdown
      try {
        const { data: collegesData } = await api.get('/api/college/all');
        setColleges(collegesData.colleges || collegesData || []);
      } catch (err) {
        console.error('Error fetching colleges:', err);
      }

      // Fetch upcoming events - use college filter if enabled and user has collegeId
      const userData = JSON.parse(localStorage.getItem('user'));
      const collegeId = userData?.collegeId;

      let eventsUrl = '/api/event/AllEvents';
      if (showMyCollegeOnly && collegeId) {
        eventsUrl = `/api/event/college/${collegeId}`;
      }

      try {
        const { data: eventsData } = await api.get(eventsUrl);
        setUpcomingEvents(eventsData.events || eventsData || []);
      } catch (error) {
        if (error.response?.status === 401) {
          handleLogout();
          return;
        }
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
      try {
        const { data: regData } = await api.get('/api/registration/my-registrations');
        const rawRegistrations = regData.registrations || regData || [];

        const mappedRegistrations = rawRegistrations.map(reg => ({
          ...reg,
          eventName: reg.event?.title || reg.eventName || 'N/A',
          collegeName: reg.event?.collegeId?.name || reg.collegeName || 'N/A',
          eventDate: reg.event?.date || reg.eventDate || reg.date,
          deadline: reg.event?.deadline || reg.deadline,
          status: getEventStatus({ ...reg.event, isRegistered: true })
        }));

        setMyRegistrations(mappedRegistrations);

        // Calculate stats
        const now = new Date();
        const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

        setStats({
          total: mappedRegistrations.length,
          upcoming: mappedRegistrations.filter(r => new Date(r.eventDate) > now).length,
          deadlines: mappedRegistrations.filter(r => {
            const eventDate = new Date(r.eventDate);
            return eventDate > now && eventDate <= twoDaysFromNow;
          }).length
        });
      } catch (error) {
        if (error.response?.status === 401) {
          handleLogout();
          return;
        }
        setMyRegistrations([]);
        setStats({ total: 0, upcoming: 0, deadlines: 0 });
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
    // Find the event to check if it's a team event
    const event = upcomingEvents.find(e => e._id === eventId);

    if (event && event.eventType === 'team') {
      // Open team registration modal
      setTeamRegModal({ isOpen: true, event });
      return;
    }

    // Solo event registration (existing logic)
    const token = localStorage.getItem('token');
    setProcessingEvents(prev => ({ ...prev, [eventId]: true }));

    try {
      await api.post(`/api/registration/register/${eventId}`);

      // Update local state
      setUpcomingEvents(prev =>
        prev.map(event =>
          event._id === eventId ? { ...event, isRegistered: true } : event
        )
      );

      // Refresh registrations
      fetchDashboardData(token);
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setProcessingEvents(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleTeamRegister = async (eventId, teamData) => {
    const token = localStorage.getItem('token');
    setProcessingEvents(prev => ({ ...prev, [eventId]: true }));

    try {
      await api.post(`/api/registration/register/${eventId}`, teamData);

      // Update local state
      setUpcomingEvents(prev =>
        prev.map(event =>
          event._id === eventId ? { ...event, isRegistered: true } : event
        )
      );

      // Close modal
      setTeamRegModal({ isOpen: false, event: null });

      // Refresh registrations
      fetchDashboardData(token);
      alert('Team registered successfully!');
    } catch (error) {
      console.error('Team registration error:', error);
      throw error; // Re-throw to be caught by modal
    } finally {
      setProcessingEvents(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleCancelRegistration = async (registrationId, eventId) => {
    const token = localStorage.getItem('token');
    setProcessingEvents(prev => ({ ...prev, [registrationId]: true }));

    try {
      await api.delete(`/api/registration/cancel/${registrationId}`);

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

  const handleProfileUpdate = async (data, type) => {
    const token = localStorage.getItem('token');
    const endpoint = type === 'profile' ? '/api/profile' : '/api/password';

    try {
      const { data: result } = await api.put(endpoint, data);

      if (type === 'profile') {
        // Update localStorage and state
        const updatedUser = { ...user, name: result.user.name };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setProfileEditModal(false);
        alert('Profile updated successfully!');
      } else {
        setProfileEditModal(false);
        alert('Password updated successfully!');
      }
    } catch (error) {
      throw error;
    }
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
    // Enhanced search across multiple fields
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      event.name?.toLowerCase().includes(searchLower) ||
      event.title?.toLowerCase().includes(searchLower) ||
      event.description?.toLowerCase().includes(searchLower) ||
      event.collegeName?.toLowerCase().includes(searchLower) ||
      event.collegeId?.name?.toLowerCase().includes(searchLower) ||
      event.venue?.toLowerCase().includes(searchLower) ||
      event.category?.toLowerCase().includes(searchLower);

    // College filter
    const matchesCollege = selectedCollege === 'all' ||
      event.collegeId?._id === selectedCollege ||
      event.collegeId === selectedCollege;

    // Category filter
    const matchesCategory = selectedCategory === 'all' ||
      event.category === selectedCategory;

    // Date filter
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const now = new Date();
      const eventDate = new Date(event.date);

      if (dateFilter === 'upcoming') {
        matchesDate = eventDate > now;
      } else if (dateFilter === 'thisWeek') {
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        matchesDate = eventDate > now && eventDate <= weekFromNow;
      } else if (dateFilter === 'thisMonth') {
        const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        matchesDate = eventDate > now && eventDate <= monthFromNow;
      }
    }

    // Status filter
    const matchesStatus = filterStatus === 'all' || getEventStatus(event) === filterStatus;

    return matchesSearch && matchesCollege && matchesCategory && matchesDate && matchesStatus;
  });

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCollege('all');
    setSelectedCategory('all');
    setDateFilter('all');
    setFilterStatus('all');
  };

  // Count active filters
  const activeFiltersCount = [
    searchQuery !== '',
    selectedCollege !== 'all',
    selectedCategory !== 'all',
    dateFilter !== 'all',
    filterStatus !== 'all'
  ].filter(Boolean).length;

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
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Available Events
                    </h2>
                    {activeFiltersCount > 0 && (
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-semibold">
                        {activeFiltersCount} {activeFiltersCount === 1 ? 'Filter' : 'Filters'}
                      </span>
                    )}
                  </div>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                    >
                      <XCircle className="w-4 h-4" />
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* Advanced Filters Panel */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Search */}
                    <div className="relative lg:col-span-2">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search events, colleges, venues..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>

                    {/* College Filter */}
                    <select
                      value={selectedCollege}
                      onChange={(e) => setSelectedCollege(e.target.value)}
                      className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    >
                      <option value="all" className="bg-slate-900">All Colleges</option>
                      {colleges.map(college => (
                        <option key={college._id} value={college._id} className="bg-slate-900">
                          {college.name}
                        </option>
                      ))}
                    </select>

                    {/* Category Filter */}
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    >
                      <option value="all" className="bg-slate-900">All Categories</option>
                      <option value="Technical" className="bg-slate-900">Technical</option>
                      <option value="Cultural" className="bg-slate-900">Cultural</option>
                      <option value="Sports" className="bg-slate-900">Sports</option>
                      <option value="Workshop" className="bg-slate-900">Workshop</option>
                      <option value="Seminar" className="bg-slate-900">Seminar</option>
                      <option value="Competition" className="bg-slate-900">Competition</option>
                      <option value="Festival" className="bg-slate-900">Festival</option>
                      <option value="Other" className="bg-slate-900">Other</option>
                    </select>

                    {/* Date Filter */}
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    >
                      <option value="all" className="bg-slate-900">All Dates</option>
                      <option value="upcoming" className="bg-slate-900">Upcoming</option>
                      <option value="thisWeek" className="bg-slate-900">This Week</option>
                      <option value="thisMonth" className="bg-slate-900">This Month</option>
                    </select>
                  </div>

                  {/* Secondary Filters Row */}
                  <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-white/10">
                    <span className="text-sm text-gray-400">Status:</span>
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

                    <div className="flex-1"></div>

                    <span className="text-sm text-gray-400">
                      {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
                    </span>
                  </div>
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
                      <div className="relative h-48 overflow-hidden">
                        {event.poster ? (
                          <img
                            src={event.poster}
                            alt={event.name}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                            onClick={() => setPosterPreview({ isOpen: true, url: event.poster, title: event.name })}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600" />
                        )}
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
              <button
                onClick={() => setProfileEditModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:scale-105 transition-all"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
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

      {/* Poster Preview Modal */}
      <PosterPreviewModal
        isOpen={posterPreview.isOpen}
        onClose={() => setPosterPreview({ isOpen: false, url: '', title: '' })}
        posterUrl={posterPreview.url}
        title={posterPreview.title}
      />

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={profileEditModal}
        onClose={() => setProfileEditModal(false)}
        user={user}
        onSave={handleProfileUpdate}
      />

      {/* Team Registration Modal */}
      <TeamRegistrationModal
        isOpen={teamRegModal.isOpen}
        onClose={() => setTeamRegModal({ isOpen: false, event: null })}
        event={teamRegModal.event}
        onRegister={handleTeamRegister}
      />
    </div>
  );
}