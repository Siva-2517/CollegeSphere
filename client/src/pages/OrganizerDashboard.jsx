import React, { useState, useEffect } from 'react';
import { Calendar, Users, LogOut, PlusCircle, Edit, Trash2, X, AlertCircle, CheckCircle, TrendingUp, Clock, Sparkles, Search, Download, BarChart3, Menu, X as CloseIcon } from 'lucide-react';

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

// Helper functin to format date as DD/MM/YYYY
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

// Event Modal Component
const EventModal = ({ isOpen, onClose, event, onSave, colleges }) => {
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        venue: '',
        registrationDeadline: '',
        description: '',
        collegeId: '',
        category: '',
        poster: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (event) {
            setFormData({
                title: event.title || event.name || '',
                date: event.date ? event.date.split('T')[0] : '',
                venue: event.venue || '',
                registrationDeadline: event.registrationDeadline ? event.registrationDeadline.split('T')[0] : (event.deadline ? event.deadline.split('T')[0] : ''),
                description: event.description || '',
                collegeId: event.collegeId || '',
                category: event.category || '',
                poster: event.poster || ''
            });
        } else {
            setFormData({
                title: '',
                date: '',
                venue: '',
                registrationDeadline: '',
                description: '',
                collegeId: '',
                category: '',
                poster: ''
            });
        }
    }, [event, isOpen]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title) newErrors.title = 'Event title is required';
        if (!formData.description) newErrors.description = 'Description is required';
        if (!formData.date) newErrors.date = 'Event date is required';
        if (!formData.venue) newErrors.venue = 'Venue is required';
        if (!formData.registrationDeadline) newErrors.registrationDeadline = 'Registration deadline is required';
        if (!formData.collegeId) newErrors.collegeId = 'College is required';
        if (!formData.category) newErrors.category = 'Category is required';

        if (formData.date && formData.registrationDeadline) {
            const eventDate = new Date(formData.date);
            const deadlineDate = new Date(formData.registrationDeadline);
            if (deadlineDate >= eventDate) {
                newErrors.registrationDeadline = 'Registration deadline must be before event date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving event:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeInUp">
                <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {event ? 'Edit Event' : 'Create New Event'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Event Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className={`w-full px-4 py-3 bg-white/5 border ${errors.title ? 'border-red-500' : 'border-white/10'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white`}
                            placeholder="Enter event title"
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Event Date *</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className={`w-full px-4 py-3 bg-white/5 border ${errors.date ? 'border-red-500' : 'border-white/10'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white`}
                            />
                            {errors.date && <p className="mt-1 text-sm text-red-400">{errors.date}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Registration Deadline *</label>
                            <input
                                type="date"
                                value={formData.registrationDeadline}
                                onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                                className={`w-full px-4 py-3 bg-white/5 border ${errors.registrationDeadline ? 'border-red-500' : 'border-white/10'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white`}
                            />
                            {errors.registrationDeadline && <p className="mt-1 text-sm text-red-400">{errors.registrationDeadline}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Venue *</label>
                        <input
                            type="text"
                            value={formData.venue}
                            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                            className={`w-full px-4 py-3 bg-white/5 border ${errors.venue ? 'border-red-500' : 'border-white/10'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white`}
                            placeholder="Enter venue"
                        />
                        {errors.venue && <p className="mt-1 text-sm text-red-400">{errors.venue}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">College *</label>
                        <select
                            value={formData.collegeId}
                            onChange={(e) => setFormData({ ...formData, collegeId: e.target.value })}
                            className={`w-full px-4 py-3 bg-white/5 border ${errors.collegeId ? 'border-red-500' : 'border-white/10'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white`}
                        >
                            <option value="" className="bg-slate-900">Select College</option>
                            {colleges.map(college => (
                                <option key={college._id} value={college._id} className="bg-slate-900">
                                    {college.name}
                                </option>
                            ))}
                        </select>
                        {errors.collegeId && <p className="mt-1 text-sm text-red-400">{errors.collegeId}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className={`w-full px-4 py-3 bg-white/5 border ${errors.category ? 'border-red-500' : 'border-white/10'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white`}
                                placeholder="Enter category (e.g., Sports, Technical, Cultural)"
                            />
                            {errors.category && <p className="mt-1 text-sm text-red-400">{errors.category}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Poster URL</label>
                            <input
                                type="url"
                                value={formData.poster}
                                onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
                                className={`w-full px-4 py-3 bg-white/5 border ${errors.poster ? 'border-red-500' : 'border-white/10'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white`}
                                placeholder="Enter poster image URL"
                            />
                            {errors.poster && <p className="mt-1 text-sm text-red-400">{errors.poster}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className={`w-full px-4 py-3 bg-white/5 border ${errors.description ? 'border-red-500' : 'border-white/10'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white`}
                            placeholder="Event description..."
                        />
                        {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:scale-105 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg font-semibold hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function OrganizerDashboard() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [events, setEvents] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [colleges, setColleges] = useState([]);
    const [stats, setStats] = useState({ totalEvents: 0, upcomingDeadlines: 0, totalRegistrations: 0 });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            window.location.href = '/login';
            return;
        }

        try {
            const parsedUser = JSON.parse(userData);
            if (parsedUser.role !== 'organizer' && parsedUser.role !== 'admin') {
                alert('Access denied. Organizer/Admin role required.');
                window.location.href = '/login';
                return;
            }
            setUser(parsedUser);
            fetchDashboardData(token, parsedUser);
        } catch (error) {
            console.error('Error parsing user data:', error);
            window.location.href = '/login';
        }
    }, []);

    const fetchDashboardData = async (token, userData) => {
        setLoading(true);
        setError('');

        try {
            // Fetch colleges
            const collegesRes = await fetch('http://localhost:5000/api/college/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (collegesRes.ok) {
                try {
                    const collegesData = await collegesRes.json();
                    setColleges(collegesData.colleges || collegesData || []);
                } catch (e) {
                    console.error('Error parsing colleges response:', e);
                    setColleges([]);
                }
            } else {
                setColleges([]);
            }

            // Fetch events
            const eventUrl =
                userData.role === 'organizer'
                    ? 'http://localhost:5000/api/event/my-events'
                    : 'http://localhost:5000/api/event/AllEvents';

            const eventsRes = await fetch(eventUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (eventsRes.ok) {
                try {
                    const eventsData = await eventsRes.json();
                    // Handle both array response and object response
                    const eventsList = Array.isArray(eventsData) ? eventsData : (eventsData.events || []);
                    setEvents(eventsList);

                    const now = new Date();

                    // For organizers, show only their events; for admins, show all events
                    let statsEvents = eventsList;
                    if (userData.role === 'organizer') {
                        // Filter events created by this organizer
                        statsEvents = eventsList.filter(e => {
                            const createdById = e.createdBy?._id || e.createdBy;
                            return createdById && String(createdById) === String(userData.id);
                        });
                    }

                    const upcomingDeadlines = statsEvents.filter(e => {
                        const deadline = e.registrationDeadline || e.deadline;
                        return deadline && new Date(deadline) > now && new Date(deadline) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    }).length;

                    setStats(prev => ({
                        ...prev,
                        totalEvents: statsEvents.length,
                        upcomingDeadlines
                    }));
                } catch (e) {
                    console.error('Error parsing events response:', e);
                    setEvents([]);
                    setStats({ totalEvents: 0, upcomingDeadlines: 0, totalRegistrations: 0 });
                }
            } else if (eventsRes.status === 401) {
                handleLogout();
                return;
            } else {
                console.error('Failed to fetch events:', eventsRes.status);
                setEvents([]);
                setStats({ totalEvents: 0, upcomingDeadlines: 0, totalRegistrations: 0 });
            }

            // Fetch registrations for each event created by the organizer
            try {
                // Get all event IDs for the organizer's events
                const organizerEventIds = events.map(e => e._id);

                if (organizerEventIds.length > 0) {
                    // Fetch registrations for all events
                    const registrationPromises = organizerEventIds.map(eventId =>
                        fetch(`http://localhost:5000/api/registration/event/${eventId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        }).then(res => res.ok ? res.json() : { registrations: [] })
                            .catch(() => ({ registrations: [] }))
                    );

                    const registrationResults = await Promise.all(registrationPromises);

                    // Flatten all registrations
                    const allRegistrations = registrationResults.flatMap(result => result.registrations || []);
                    setRegistrations(allRegistrations);

                    // Create a map of event ID to registration count
                    const eventRegistrationCounts = {};
                    registrationResults.forEach((result, index) => {
                        const eventId = organizerEventIds[index];
                        eventRegistrationCounts[eventId] = (result.registrations || []).length;
                    });

                    // Update events with registration counts
                    const eventsWithCounts = eventsList.map(event => ({
                        ...event,
                        registrationCount: eventRegistrationCounts[event._id] || 0
                    }));
                    setEvents(eventsWithCounts);

                    // Update stats with total registrations
                    setStats(prev => ({ ...prev, totalRegistrations: allRegistrations.length }));
                } else {
                    setRegistrations([]);
                    setStats(prev => ({ ...prev, totalRegistrations: 0 }));
                }
            } catch (error) {
                console.error('Error fetching registrations:', error);
                setRegistrations([]);
                setStats(prev => ({ ...prev, totalRegistrations: 0 }));
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Failed to load dashboard data');
            setEvents([]);
            setRegistrations([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (eventData) => {
        const token = localStorage.getItem('token');

        try {
            const requestOptions = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            };

            const response = await fetch('http://localhost:5000/api/event/create', requestOptions);

            const data = await response.json();

            if (response.ok) {
                alert('Event created successfully!');
                fetchDashboardData(token, user);
                setIsModalOpen(false);
                setEditingEvent(null);
            } else {
                alert(data.message || data.error || data.msg || 'Failed to create event');
            }
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event: ' + error.message);
        }
    };

    const handleUpdateEvent = async (eventData) => {
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`http://localhost:5000/api/event/${editingEvent._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });

            if (response.ok) {
                fetchDashboardData(token, user);
                setIsModalOpen(false);
                setEditingEvent(null);
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to update event');
            }
        } catch (error) {
            console.error('Error updating event:', error);
            alert('Failed to update event');
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`http://localhost:5000/api/event/${eventId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                fetchDashboardData(token, user);
            } else {
                alert('Failed to delete event');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const exportRegistrations = () => {
        const csv = [
            ['Student Name', 'Email', 'Event', 'Registration Date'],
            ...registrations.map(r => [
                r.studentName || 'N/A',
                r.studentEmail || 'N/A',
                r.eventName || 'N/A',
                formatDate(r.registeredAt || r.createdAt)
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'registrations.csv';
        a.click();
    };

    const filteredRegistrations = registrations.filter(r =>
    (r.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.studentEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.eventName?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading dashboard...</p>
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
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="font-bold">Organizer</h2>
                                            <p className="text-xs text-gray-400">Dashboard</p>
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
                                        <p className="text-sm font-medium truncate">{user?.name || 'Organizer'}</p>
                                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation */}
                            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
                                    <BarChart3 className="w-5 h-5" />
                                    <span className="font-medium">Dashboard</span>
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
                                    <span className="font-medium">My Events</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setActiveTab('registrations');
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'registrations'
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <Users className="w-5 h-5" />
                                    <span className="font-medium">Registrations</span>
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
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Organizer Dashboard</h1>
                                <p className="text-xs text-gray-400 hidden sm:block">Manage your events</p>
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
                            <nav className="hidden md:flex items-center gap-4">
                                <button
                                    onClick={() => setActiveTab('dashboard')}
                                    className={`flex items-center gap-2 transition-colors ${activeTab === 'dashboard' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <BarChart3 className="w-4 h-4" />
                                    Dashboard
                                </button>
                                <button
                                    onClick={() => setActiveTab('events')}
                                    className={`flex items-center gap-2 transition-colors ${activeTab === 'events' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <Calendar className="w-4 h-4" />
                                    My Events
                                </button>
                                <button
                                    onClick={() => setActiveTab('registrations')}
                                    className={`flex items-center gap-2 transition-colors ${activeTab === 'registrations' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <Users className="w-4 h-4" />
                                    Registrations
                                </button>
                            </nav>

                            <button
                                onClick={() => setActiveTab('profile')}
                                className="hidden md:block text-right hover:opacity-80 transition-opacity"
                            >
                                <p className="text-sm font-medium">{user?.name || 'Organizer'}</p>
                                <p className="text-xs text-gray-400">Event Organizer</p>
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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <p className="text-red-300">{error}</p>
                    </div>
                )}

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-fadeInUp">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:scale-105 transition-transform">
                                <div className="flex items-center justify-between mb-4">
                                    <Calendar className="w-8 h-8 text-purple-400" />
                                    <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                        <AnimatedCounter end={stats.totalEvents} />
                                    </span>
                                </div>
                                <p className="text-gray-400">Total Events</p>
                            </div>

                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:scale-105 transition-transform">
                                <div className="flex items-center justify-between mb-4">
                                    <Clock className="w-8 h-8 text-orange-400" />
                                    <span className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                                        <AnimatedCounter end={stats.upcomingDeadlines} />
                                    </span>
                                </div>
                                <p className="text-gray-400">Upcoming Deadlines</p>
                            </div>

                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:scale-105 transition-transform">
                                <div className="flex items-center justify-between mb-4">
                                    <Users className="w-8 h-8 text-blue-400" />
                                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                        <AnimatedCounter end={stats.totalRegistrations} />
                                    </span>
                                </div>
                                <p className="text-gray-400">Total Registrations</p>
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center">
                            <TrendingUp className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold mb-2">Welcome to Your Dashboard</h3>
                            <p className="text-gray-400 mb-6">Manage your college events, track registrations, and more.</p>
                            <button
                                onClick={() => setActiveTab('events')}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:scale-105 transition-all"
                            >
                                Manage Events
                            </button>
                        </div>
                    </div>
                )}

                {/* Manage Events Tab */}
                {activeTab === 'events' && (
                    <div className="space-y-6 animate-fadeInUp">
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Manage Events
                            </h2>
                            <button
                                onClick={() => {
                                    setEditingEvent(null);
                                    setIsModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:scale-105 transition-all"
                            >
                                <PlusCircle className="w-5 h-5" />
                                Create Event
                            </button>
                        </div>

                        {events.length === 0 ? (
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
                                <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400 text-lg mb-4">No events created yet</p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="text-purple-400 hover:text-purple-300 font-medium"
                                >
                                    Create your first event →
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {events
                                    .filter(event => {
                                        // For organizers, show only their events; for admins, show all events
                                        if (user?.role === 'organizer') {
                                            const createdById = event.createdBy?._id || event.createdBy;
                                            return createdById && String(createdById) === String(user?.id);
                                        }
                                        return true; // Admins see all events
                                    })
                                    .map((event, idx) => {
                                        const daysUntilDeadline = Math.ceil((new Date(event.registrationDeadline || event.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                                        const isUrgent = daysUntilDeadline <= 3 && daysUntilDeadline > 0;

                                        return (
                                            <div
                                                key={event._id}
                                                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:scale-105 hover:shadow-2xl transition-all"
                                                style={{ animationDelay: `${idx * 0.05}s` }}
                                            >
                                                <div className="h-32 bg-gradient-to-br from-purple-600 to-pink-600 relative" style={{
                                                    backgroundImage: event.poster ? `url(${event.poster})` : undefined,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center'
                                                }}>
                                                    {event.poster && <div className="absolute inset-0 bg-black/30"></div>}
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

                                                    <div className="space-y-2 mb-4 text-sm text-gray-400">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>{formatDate(event.date)}</span>
                                                        </div>
                                                        {event.venue && (
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-4 h-4" />
                                                                <span>{event.venue}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4" />
                                                            <span className={isUrgent ? 'text-orange-400 font-semibold' : ''}>
                                                                Deadline: {formatDate(event.registrationDeadline || event.deadline)}
                                                                {isUrgent && ` (${daysUntilDeadline} days left!)`}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Users className="w-4 h-4" />
                                                            <span>{event.registrationCount || 0} registrations</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingEvent(event);
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-all"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteEvent(event._id)}
                                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                )}

                {/* Registrations Tab */}
                {activeTab === 'registrations' && (
                    <div className="space-y-6 animate-fadeInUp">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Event Registrations
                            </h2>
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <div className="relative flex-1 sm:flex-initial">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search registrations..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full sm:w-80 pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <button
                                    onClick={exportRegistrations}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-all whitespace-nowrap"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Export CSV</span>
                                </button>
                            </div>
                        </div>

                        {filteredRegistrations.length === 0 ? (
                            <div className="text-center py-16 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
                                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400 text-lg">No registrations found</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden md:block bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-white/5 border-b border-white/10">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold">Student Name</th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold">Event</th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold">Registration Date</th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {filteredRegistrations.map((registration) => (
                                                    <tr key={registration._id} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-6 py-4">{registration.studentName || 'N/A'}</td>
                                                        <td className="px-6 py-4 text-gray-400">{registration.studentEmail || 'N/A'}</td>
                                                        <td className="px-6 py-4">{registration.eventName || 'N/A'}</td>
                                                        <td className="px-6 py-4 text-gray-400">
                                                            {formatDate(registration.registeredAt || registration.createdAt)}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-semibold">
                                                                Registered
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-4">
                                    {filteredRegistrations.map((registration) => (
                                        <div key={registration._id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg mb-1">{registration.studentName || 'N/A'}</h3>
                                                    <p className="text-sm text-gray-400 break-all">{registration.studentEmail || 'N/A'}</p>
                                                </div>
                                                <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-semibold whitespace-nowrap ml-2">
                                                    Registered
                                                </span>
                                            </div>
                                            <div className="pt-3 border-t border-white/10 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-purple-400" />
                                                    <span className="text-sm text-gray-400">Event:</span>
                                                    <span className="text-sm font-medium">{registration.eventName || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-orange-400" />
                                                    <span className="text-sm text-gray-400">Registered:</span>
                                                    <span className="text-sm font-medium">
                                                        {formatDate(registration.registeredAt || registration.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="space-y-6 animate-fadeInUp">
                        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Organizer Profile
                        </h2>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Profile Card */}
                            <div className="lg:col-span-1">
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
                                            <Users className="w-12 h-12" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-1">{user?.name || 'Organizer'}</h3>
                                        <p className="text-gray-400 mb-2">{user?.email}</p>
                                        <span className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-sm font-semibold">
                                            Event Organizer
                                        </span>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-400">Role</span>
                                            <span className="font-medium capitalize">{user?.role || 'organizer'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-400">Status</span>
                                            <span className="text-green-400 font-medium">Active</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-400">Member Since</span>
                                            <span className="font-medium">{user?.createdAt ? formatDate(user.createdAt) : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Overview */}
                            <div className="lg:col-span-2">
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                                    <h3 className="text-xl font-bold mb-6">Your Statistics</h3>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Calendar className="w-5 h-5 text-purple-400" />
                                                <span className="text-gray-400 text-sm">Total Events</span>
                                            </div>
                                            <p className="text-2xl font-bold">{stats.totalEvents}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Clock className="w-5 h-5 text-orange-400" />
                                                <span className="text-gray-400 text-sm">Pending</span>
                                            </div>
                                            <p className="text-2xl font-bold">{stats.pendingEvents}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                            <div className="flex items-center gap-3 mb-2">
                                                <CheckCircle className="w-5 h-5 text-green-400" />
                                                <span className="text-gray-400 text-sm">Approved</span>
                                            </div>
                                            <p className="text-2xl font-bold">{stats.approvedEvents}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Users className="w-5 h-5 text-blue-400" />
                                                <span className="text-gray-400 text-sm">Registrations</span>
                                            </div>
                                            <p className="text-2xl font-bold">{stats.totalRegistrations}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-sm text-gray-400">Quick Actions</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setActiveTab('dashboard')}
                                                className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-all"
                                            >
                                                <BarChart3 className="w-4 h-4 text-purple-400" />
                                                <span className="text-sm font-medium">View Dashboard</span>
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('events')}
                                                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-all"
                                            >
                                                <Calendar className="w-4 h-4 text-blue-400" />
                                                <span className="text-sm font-medium">Manage Events</span>
                                            </button>
                                            <button
                                                onClick={() => setIsModalOpen(true)}
                                                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-all"
                                            >
                                                <PlusCircle className="w-4 h-4 text-green-400" />
                                                <span className="text-sm font-medium">Create Event</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Activity Summary */}
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                            <h3 className="text-xl font-bold mb-4">Event Status</h3>
                            <div className="space-y-3">
                                {stats.pendingEvents > 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                        <Clock className="w-5 h-5 text-orange-400" />
                                        <p className="text-sm">
                                            <span className="font-semibold">{stats.pendingEvents}</span> event{stats.pendingEvents !== 1 ? 's' : ''} awaiting approval
                                        </p>
                                    </div>
                                )}
                                {stats.approvedEvents > 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                        <p className="text-sm">
                                            <span className="font-semibold">{stats.approvedEvents}</span> event{stats.approvedEvents !== 1 ? 's' : ''} approved and live
                                        </p>
                                    </div>
                                )}
                                {stats.totalEvents === 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                        <AlertCircle className="w-5 h-5 text-blue-400" />
                                        <p className="text-sm">No events created yet. Click "Create Event" to get started!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Event Modal */}
            <EventModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingEvent(null);
                }}
                event={editingEvent}
                onSave={editingEvent ? handleUpdateEvent : handleCreateEvent}
                colleges={colleges}
            />
        </div>
    );
}