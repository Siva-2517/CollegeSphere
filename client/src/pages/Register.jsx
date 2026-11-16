import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Mail, Lock, CheckCircle, XCircle, AlertCircle, ArrowRight, Calendar, GraduationCap, Building2 } from 'lucide-react';
import { useNavigate, Link } from "react-router-dom";
import api from '../api/axios';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    collegeId: '',
    otp: ''
  });

  const navigate = useNavigate();
  const [colleges, setColleges] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    fetchColleges();
  }, [formData.role]);

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

  useEffect(() => {
    const password = formData.password;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    setPasswordStrength(strength);
  }, [formData.password]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  const sendOTP = async () => {
    try {
      await api.post('/api/auth/send-otp', { email: formData.email });
      setResendTimer(60);
      return true;
    } catch (error) {
      if (error.response?.data?.msg) {
        setOtpError(error.response.data.msg);
      } else if (error.response?.data?.message) {
        setOtpError(error.response.data.message);
      } else {
        setOtpError('Failed to dispatch verification code. Please check email.');
      }
      return false;
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'University or personal email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmation password required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if ((formData.role === 'admin' || formData.role === 'organizer' || formData.role === 'student') && !formData.collegeId) {
      newErrors.collegeId = 'Please select your affiliated college';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'Please accept the terms to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) return;

    setLoading(true);
    const otpSent = await sendOTP();
    setLoading(false);

    if (otpSent) {
      setShowOtpModal(true);
    }
  };

  const handleOtpSubmit = async () => {
    if (!otpValue || otpValue.length !== 6) {
      setOtpError('Please enter the full 6-digit verification code');
      return;
    }

    setLoading(true);
    setOtpError('');

    try {
      const payload = {
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        otp: otpValue,
        ...(formData.collegeId ? { collegeId: formData.collegeId } : {})
      };

      const { data } = await api.post('/api/auth/register', payload);

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      if (formData.role === 'admin') navigate('/admin/dashboard');
      else if (formData.role === 'organizer') navigate('/organizer/dashboard');
      else navigate('/student/dashboard');
    } catch (error) {
      if (error.response?.data?.msg) {
        setOtpError(error.response.data.msg);
      } else if (error.response?.data?.message) {
        setOtpError(error.response.data.message);
      } else if (error.response?.data?.error) {
        setOtpError(error.response.data.error);
      } else {
        setOtpError('Registration verification failed. Please check code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStrengthBar = (level) => {
    if (level <= passwordStrength) {
      if (passwordStrength === 1) return 'bg-rose-500';
      if (passwordStrength === 2) return 'bg-amber-500';
      if (passwordStrength === 3) return 'bg-brand-500';
      return 'bg-emerald-500';
    }
    return 'bg-slate-800';
  };

  return (
    <div className="min-h-screen bg-surface-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-brand-600 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-3 mb-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex-shrink-0 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white leading-none">
            CollegeSphere
          </span>
        </Link>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Create Your Collegiate Account
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Join your campus community to discover, organize, and participate in events
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-surface-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-ticket">
          {apiError && (
            <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Role Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                I am registering as:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'student' }))}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-semibold transition-all cursor-pointer ${
                    formData.role === 'student'
                      ? 'border-brand-600 bg-brand-600/10 text-white shadow-sm'
                      : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <User className="w-4 h-4 text-brand-400" />
                  <span>Student Participant</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'organizer' }))}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-semibold transition-all cursor-pointer ${
                    formData.role === 'organizer'
                      ? 'border-brand-600 bg-brand-600/10 text-white shadow-sm'
                      : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-brand-400" />
                  <span>Event Organizer</span>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border ${
                    errors.fullName ? 'border-rose-500' : 'border-slate-700'
                  } rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600`}
                  placeholder="e.g., Alex Johnson"
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-xs text-rose-400 font-medium">{errors.fullName}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border ${
                    errors.email ? 'border-rose-500' : 'border-slate-700'
                  } rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600`}
                  placeholder="alex@university.edu"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-400 font-medium">{errors.email}</p>
              )}
            </div>

            {/* College Affiliation */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Affiliated University / College
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <select
                  name="collegeId"
                  value={formData.collegeId}
                  onChange={handleChange}
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

            {/* Passwords in Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-9 py-2.5 bg-slate-950/70 border ${
                      errors.password ? 'border-rose-500' : 'border-slate-700'
                    } rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600`}
                    placeholder="Min. 8 chars"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-400 font-medium">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-9 py-2.5 bg-slate-950/70 border ${
                      errors.confirmPassword ? 'border-rose-500' : 'border-slate-700'
                    } rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600`}
                    placeholder="Repeat password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-rose-400 font-medium">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Password Strength Meter */}
            {formData.password && (
              <div className="flex items-center gap-1.5 pt-1">
                {[1, 2, 3, 4].map((idx) => (
                  <div key={idx} className={`h-1 flex-1 rounded-full ${getStrengthBar(idx)} transition-all`} />
                ))}
              </div>
            )}

            {/* Terms checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-600"
                />
                <span className="text-xs text-slate-300 leading-normal">
                  I agree to CollegeSphere's terms of service and academic integrity policies.
                </span>
              </label>
              {errors.terms && (
                <p className="mt-1 text-xs text-rose-400 font-medium">{errors.terms}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Verify Email & Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold cursor-pointer">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Verification OTP Modal */}
      {showOtpModal && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-modal animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-brand-500/15 border border-brand-500/30 text-brand-400 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Verify Your Email</h3>
              <p className="text-slate-400 text-xs">
                Enter the 6-digit code dispatched to <br />
                <span className="font-semibold text-slate-200">{formData.email}</span>
              </p>
            </div>

            {otpError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                <span>{otpError}</span>
              </div>
            )}

            <div className="mb-6">
              <input
                type="text"
                value={otpValue}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpValue(val);
                  setOtpError('');
                }}
                maxLength={6}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white tracking-[0.5em] text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-brand-600"
                placeholder="000000"
                autoFocus
              />
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleOtpSubmit}
                disabled={loading || otpValue.length !== 6}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Verifying Code...' : 'Complete Registration'}
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (resendTimer === 0) {
                    setOtpError('');
                    await sendOTP();
                  }
                }}
                disabled={resendTimer > 0}
                className="w-full py-2 text-brand-400 hover:text-brand-300 disabled:text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend verification code'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowOtpModal(false);
                  setOtpValue('');
                  setOtpError('');
                }}
                className="w-full py-2 text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
