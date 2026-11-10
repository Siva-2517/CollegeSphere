import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Building2, AlertCircle, ArrowRight, GraduationCap } from 'lucide-react';
import api from '../api/axios';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [collegeId, setCollegeId] = useState('');
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    try {
      const parsed = JSON.parse(userStr);
      if (parsed.isProfileComplete) {
        redirectBasedOnRole(parsed.role);
        return;
      }
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
      setColleges([
        { _id: '1', name: 'MIT College of Engineering' },
        { _id: '2', name: 'Stanford University' },
        { _id: '3', name: 'Harvard University' },
        { _id: '4', name: 'UC Berkeley' }
      ]);
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
      newErrors.collegeId = 'Please select your affiliated college';
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

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      redirectBasedOnRole(data.user?.role || role);
    } catch (error) {
      if (error.response?.data?.msg) {
        setApiError(error.response.data.msg);
      } else {
        setApiError('Failed to complete profile. Please verify your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-brand-600 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Complete Your Profile
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Select your primary campus role and affiliated university
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-surface-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-ticket">
          {apiError && (
            <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Select Your Campus Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    role === 'student'
                      ? 'border-brand-600 bg-brand-600/10 text-white shadow-sm'
                      : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-5 h-5 text-brand-400" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('organizer')}
                  className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    role === 'organizer'
                      ? 'border-brand-600 bg-brand-600/10 text-white shadow-sm'
                      : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-5 h-5 text-brand-400" />
                  <span>Event Organizer</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Affiliated University
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <select
                  value={collegeId}
                  onChange={(e) => setCollegeId(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border ${
                    errors.collegeId ? 'border-rose-500' : 'border-slate-700'
                  } rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-600`}
                >
                  <option value="" className="bg-surface-900 text-slate-400">Select affiliated college</option>
                  {colleges.map((c) => (
                    <option key={c._id} value={c._id} className="bg-surface-900 text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.collegeId && (
                <p className="mt-1 text-xs text-rose-400 font-medium">{errors.collegeId}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Configuring Profile...</span>
              ) : (
                <>
                  <span>Save & Continue to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
