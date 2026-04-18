import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Sparkles, ArrowRight, AlertCircle, CheckCircle, XCircle, Building2 } from 'lucide-react';
import api from '../api/axios';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [collegeId, setCollegeId] = useState('');
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [errors, setErrors] = useState({});
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Check if user is logged in and profile is incomplete
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      navigate('/login');
      return;
    }

    try {
      const parsed = JSON.parse(user);
      if (parsed.isProfileComplete) {
        // Already complete, redirect to dashboard
        redirectBasedOnRole(parsed.role);
        return;
      }
      setUserData(parsed);
    } catch (err) {
      navigate('/login');
    }

    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const { data } = await api.get('/api/college/all');
      setColleges(data.colleges || data || []);
    } catch (error) {
      console.error('Error fetching colleges:', error);
      setColleges([]);
    }
  };

  const redirectBasedOnRole = (r) => {
    if (r === 'admin') navigate('/admin/dashboard');
    else if (r === 'organizer') navigate('/organizer/dashboard');
    else navigate('/student/dashboard');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!collegeId) {
      newErrors.collegeId = 'Please select a college';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const { data } = await api.put('/api/auth/complete-profile', {
        role,
        collegeId
      });

      // Update stored token and user data
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Redirect to dashboard
      setTimeout(() => {
        redirectBasedOnRole(data.user?.role || role);
      }, 500);
    } catch (error) {
      console.error('Complete profile error:', error);
      if (error.response?.data?.msg) {
        setApiError(error.response.data.msg);
      } else {
        setApiError('Failed to complete profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse top-10 left-10" />
        <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse bottom-10 right-10" style={{ animationDelay: '1s' }} />
        <div className="absolute w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse top-1/2 left-1/2" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fadeInUp">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mb-4 shadow-2xl shadow-purple-500/50 animate-float">
            <Sparkles className="w-10 h-10" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            Complete Your Profile
          </h1>

          {userData && (
            <div className="flex items-center justify-center gap-3 mt-4">
              {userData.avatar && (
                <img
                  src={userData.avatar}
                  alt={userData.name}
                  className="w-10 h-10 rounded-full border-2 border-purple-500"
                />
              )}
              <div className="text-left">
                <p className="text-white font-medium">{userData.name}</p>
                <p className="text-gray-400 text-sm">{userData.email}</p>
              </div>
            </div>
          )}

          <p className="text-gray-400 text-lg mt-4">
            Just a few more details to get you started
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* API Error */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{apiError}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-5 rounded-xl border-2 transition-all duration-300 ${
                    role === 'student'
                      ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20 scale-[1.02]'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                  }`}
                >
                  <User className={`w-8 h-8 mx-auto mb-3 ${role === 'student' ? 'text-purple-400' : 'text-gray-400'}`} />
                  <p className={`font-semibold ${role === 'student' ? 'text-purple-300' : 'text-gray-300'}`}>Student</p>
                  <p className="text-xs text-gray-500 mt-1">Browse & register for events</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('organizer')}
                  className={`p-5 rounded-xl border-2 transition-all duration-300 ${
                    role === 'organizer'
                      ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20 scale-[1.02]'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                  }`}
                >
                  <Calendar className={`w-8 h-8 mx-auto mb-3 ${role === 'organizer' ? 'text-purple-400' : 'text-gray-400'}`} />
                  <p className={`font-semibold ${role === 'organizer' ? 'text-purple-300' : 'text-gray-300'}`}>Organizer</p>
                  <p className="text-xs text-gray-500 mt-1">Create & manage events</p>
                </button>
              </div>
            </div>

            {/* Organizer Notice */}
            {role === 'organizer' && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3 animate-fadeInUp">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-300 text-sm">
                  Organizer accounts require admin approval before you can create events.
                </p>
              </div>
            )}

            {/* College Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Select Your College
              </label>
              <select
                value={collegeId}
                onChange={(e) => {
                  setCollegeId(e.target.value);
                  if (errors.collegeId) setErrors(prev => ({ ...prev, collegeId: '' }));
                  setApiError('');
                }}
                className={`w-full px-4 py-3 bg-white/5 border ${
                  errors.collegeId ? 'border-red-500' : 'border-white/10'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white`}
              >
                <option value="" className="bg-slate-900">Select a college</option>
                {colleges.map(college => (
                  <option key={college._id} value={college._id} className="bg-slate-900">
                    {college.name}
                  </option>
                ))}
              </select>
              {errors.collegeId && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1 animate-shake">
                  <XCircle className="w-4 h-4" />
                  {errors.collegeId}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Complete Setup
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          You can change these settings later from your profile
        </p>
      </div>
    </div>
  );
}
