import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Users, Globe, Zap, ArrowRight, CheckCircle, Award, Clock, BarChart3, Sparkles } from 'lucide-react';
import { useNavigate } from "react-router-dom";

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setCount(Math.floor((end * step) / steps));
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [isVisible, end, duration]);

  return <span ref={countRef}>{count.toLocaleString()}{suffix}</span>;
};

export default function Landing() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [stats, setStats] = useState({ events: 0, students: 0, colleges: 0 });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState({});

  // Scroll and Mouse tracking
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY });

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Fetch dynamic data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats - endpoint doesn't exist, using fallback
        const statsRes = await fetch('http://localhost:5000/api/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats({
            events: statsData.totalEvents || 500,
            students: statsData.totalStudents || 10000,
            colleges: statsData.totalColleges || 50
          });
        } else {
          setStats({ events: 500, students: 10000, colleges: 50 });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats({ events: 500, students: 10000, colleges: 50 });
      }

      try {
        // Fetch upcoming events
        const eventsRes = await fetch('http://localhost:5000/api/event/AllEvents');
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents(eventsData.events || eventsData || []);
        } else {
          // Fallback demo events
          setEvents([
            {
              _id: '1',
              name: 'TechFest 2026',
              collegeName: 'MIT College',
              date: '2026-02-15',
              deadline: '2026-02-10',
              isRegistered: false,
              active: true
            },
            {
              _id: '2',
              name: 'HackInnovate',
              collegeName: 'Stanford University',
              date: '2026-03-05',
              deadline: '2026-02-28',
              isRegistered: false,
              active: true
            },
            {
              _id: '3',
              name: 'AI Workshop Series',
              collegeName: 'Berkeley',
              date: '2026-01-20',
              deadline: '2026-01-18',
              isRegistered: true,
              active: false
            },
            {
              _id: '4',
              name: 'Startup Summit',
              collegeName: 'Harvard',
              date: '2026-04-12',
              deadline: '2026-04-05',
              isRegistered: false,
              active: true
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([
          {
            _id: '1',
            name: 'TechFest 2026',
            collegeName: 'MIT College',
            date: '2026-02-15',
            deadline: '2026-02-10',
            isRegistered: false,
            active: true
          },
          {
            _id: '2',
            name: 'HackInnovate',
            collegeName: 'Stanford University',
            date: '2026-03-05',
            deadline: '2026-02-28',
            isRegistered: false,
            active: true
          },
          {
            _id: '3',
            name: 'AI Workshop Series',
            collegeName: 'Berkeley',
            date: '2026-01-20',
            deadline: '2026-01-18',
            isRegistered: true,
            active: false
          },
          {
            _id: '4',
            name: 'Startup Summit',
            collegeName: 'Harvard',
            date: '2026-04-12',
            deadline: '2026-04-05',
            isRegistered: false,
            active: true
          }
        ]);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const handleRegister = async (eventId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to register for events');
      return;
    }

    setRegistering(prev => ({ ...prev, [eventId]: true }));

    try {
      const response = await fetch(`http://localhost:5000/api/registration/register/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setEvents(prev => prev.map(event =>
          event._id === eventId ? { ...event, isRegistered: true } : event
        ));
      } else {
        alert('Please login to register for events');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setRegistering(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleCancelRegistration = async (eventId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to cancel registration');
      return;
    }

    setRegistering(prev => ({ ...prev, [eventId]: true }));

    try {
      // Note: This endpoint requires registrationId, not eventId
      // For now, using a placeholder - in real implementation, you'd need to fetch the registration ID first
      const response = await fetch(`http://localhost:5000/api/registration/cancel/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setEvents(prev => prev.map(event =>
          event._id === eventId ? { ...event, isRegistered: false } : event
        ));
      } else {
        alert('Cancellation failed. Please try again.');
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      alert('Cancellation failed. Please try again.');
    } finally {
      setRegistering(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Multi-College Events",
      description: "Access events from multiple colleges in one unified platform"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Registration",
      description: "Register for events with a single click before the deadline"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Deadline Based Access",
      description: "Smart system that locks registrations after deadlines"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Student Dashboard",
      description: "Track all your events, registrations, and participation history"
    }
  ];

  const steps = [
    { title: "Create Account", description: "Sign up with your college email" },
    { title: "Explore Events", description: "Browse events from multiple colleges" },
    { title: "Register Before Deadline", description: "Secure your spot in time" },
    { title: "Participate & Track", description: "Attend events and monitor progress" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden relative">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(1deg); }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }
      `}</style>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{
            top: '10%',
            left: '10%',
            transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.05}px)`
          }}
        />
        <div
          className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
          style={{
            top: '60%',
            right: '10%',
            animationDelay: '1s',
            transform: `translate(${-scrollY * 0.08}px, ${scrollY * 0.06}px)`
          }}
        />
        <div
          className="absolute w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
          style={{
            top: '40%',
            left: '50%',
            animationDelay: '2s',
            transform: `translate(${scrollY * 0.05}px, ${-scrollY * 0.04}px)`
          }}
        />
      </div>

      {/* Mouse Follow Glow */}
      <div
        className="fixed w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-300 ease-out"
        style={{
          left: mousePosition.x - 128,
          top: mousePosition.y - 128,
        }}
      />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-8 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">Welcome to the Future of College Events</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent leading-tight pb-2">
              CollegeSphere
            </h1>

            <p className="text-4xl md:text-5xl font-bold mb-6 text-white/90">
              Where College Events Come Alive
            </p>

            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
              Discover. Register. Participate. Across Multiple Colleges.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50">
                <span className="relative z-10 flex items-center gap-2">
                  Explore Events
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => navigate("/register")}
                className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full font-semibold text-lg transition-all duration-300 hover:bg-white/10 hover:scale-105 hover:shadow-xl"
              >
                Login / Register
              </button>
            </div>
          </div>

          {/* Floating Cards Preview */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent h-32 z-10 bottom-0" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto opacity-60">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 transform hover:scale-105 transition-all duration-300"
                  style={{
                    animation: `float ${3 + i}s ease-in-out infinite`,
                    animationDelay: `${i * 0.3}s`
                  }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-4" />
                  <div className="h-4 bg-white/10 rounded mb-2" />
                  <div className="h-3 bg-white/5 rounded w-2/3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats-section" className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: "Events Hosted", value: stats.events, suffix: "+" },
              { label: "Partner Colleges", value: stats.colleges, suffix: "+" },
              { label: "Active Students", value: stats.students, suffix: "+" }
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-gray-400 text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-400">Everything you need for seamless event management</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
                style={{
                  animation: `fade-in-up 0.6s ease-out ${i * 0.1}s both`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-gray-400">Get started in four simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                <div className="flex flex-col items-center text-center group">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-3xl font-bold mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/50">
                    {i + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-3/4 w-full h-0.5 bg-gradient-to-r from-purple-500 to-pink-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Upcoming Events
            </h2>
            <p className="text-xl text-gray-400">Don't miss out on these exciting opportunities</p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              <p className="mt-4 text-gray-400">Loading events...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {events.map((event, i) => {
                const isPastDeadline = new Date(event.deadline) < new Date();
                const isActive = event.active !== undefined ? event.active : !isPastDeadline;
                const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
                const formattedDeadline = new Date(event.deadline).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });

                return (
                  <div
                    key={event._id || i}
                    className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-2"
                  >
                    <div className="h-48 bg-gradient-to-br from-purple-600 to-pink-600 relative overflow-hidden">
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                      <div className="absolute top-4 right-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isActive ? 'bg-green-500' : 'bg-red-500'}`}>
                          {isActive ? 'Open' : 'Closed'}
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2">{event.name}</h3>
                      <div className="flex items-center gap-2 text-gray-400 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{event.collegeName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 mb-4">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Deadline: {formattedDeadline}</span>
                      </div>

                      {event.isRegistered ? (
                        <button
                          onClick={() => handleCancelRegistration(event._id)}
                          disabled={registering[event._id]}
                          className="w-full py-3 rounded-lg font-semibold transition-all duration-300 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 disabled:opacity-50"
                        >
                          {registering[event._id] ? 'Processing...' : 'Cancel Registration'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRegister(event._id)}
                          disabled={!isActive || registering[event._id]}
                          className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${isActive
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105'
                              : 'bg-gray-600 cursor-not-allowed opacity-50'
                            }`}
                        >
                          {registering[event._id] ? 'Registering...' : isActive ? 'Register Now' : 'Registration Closed'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Why CollegeSphere */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Why CollegeSphere?
              </h2>
              <div className="space-y-4">
                {[
                  "Secure backend with robust authentication and authorization",
                  "Deadline-locked registration system prevents late entries",
                  "Scalable MERN architecture for growing user base",
                  "Real-time event updates and notifications",
                  "Cross-college collaboration and networking"
                ].map((point, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                    <p className="text-lg text-gray-300">{point}</p>
                  </div>
                ))}
              </div>
              <button className="mt-8 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold text-lg hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300">
                Learn More
              </button>
            </div>
            <div className="relative h-96">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl backdrop-blur-sm border border-white/10" />
              <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl animate-pulse" />
              <div className="absolute bottom-10 right-10 w-40 h-40 bg-pink-500/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-2xl shadow-purple-500/50 flex items-center justify-center">
                <Award className="w-24 h-24" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-white/10 mt-20">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                CollegeSphere
              </h3>
              <p className="text-gray-400 mb-4">
                Connecting students across colleges through innovative event management.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-purple-400 cursor-pointer transition-colors">Events</li>
                <li className="hover:text-purple-400 cursor-pointer transition-colors">About Us</li>
                <li className="hover:text-purple-400 cursor-pointer transition-colors">Contact</li>
                <li className="hover:text-purple-400 cursor-pointer transition-colors">FAQ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex gap-4">
                {['Twitter', 'LinkedIn', 'Instagram'].map((social, i) => (
                  <div key={i} className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 cursor-pointer transition-all hover:scale-110">
                    <span className="text-xs">{social[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-center text-gray-500 pt-8 border-t border-white/5">
            <p>&copy; {new Date().getFullYear()} CollegeSphere. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}