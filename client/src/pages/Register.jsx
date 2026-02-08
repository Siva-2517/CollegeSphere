import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Mail, Lock, Sparkles, CheckCircle, XCircle, AlertCircle, ArrowRight, Calendar, Send } from 'lucide-react';
import { useNavigate } from "react-router-dom";
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
    if (formData.role === 'admin' || formData.role === 'organizer' || formData.role === 'student') {
      fetchColleges();
    }
  }, [formData.role]);

  const fetchColleges = async () => {
    try {
      const { data } = await api.get('/api/college/all');
      setColleges(data.colleges || data || []);
    } catch (error) {
      console.error('Error fetching colleges:', error);
      setColleges([
        { _id: '1', name: 'MIT College' },
        { _id: '2', name: 'Stanford University' },
        { _id: '3', name: 'Harvard University' },
        { _id: '4', name: 'Berkeley College' }
      ]);
    }
  };

  // Password strength calculator
  useEffect(() => {
    const password = formData.password;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    setPasswordStrength(strength);
  }, [formData.password]);

  // Resend timer countdown
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
      console.error('Send OTP error:', error);
      if (error.response?.data?.msg) {
        setOtpError(error.response.data.msg);
      } else if (error.response?.data?.message) {
        setOtpError(error.response.data.message);
      } else {
        setOtpError('Failed to send OTP. Please try again.');
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
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if ((formData.role === 'admin' || formData.role === 'organizer' || formData.role === 'student') && !formData.collegeId) {
      newErrors.collegeId = 'Please select a college';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    // Send OTP and show modal
    setLoading(true);
    const otpSent = await sendOTP();
    setLoading(false);

    if (otpSent) {
      setShowOtpModal(true);
    }
  };

  const handleOtpSubmit = async () => {
    if (!otpValue || otpValue.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setOtpError('');

    try {
      const payload = {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        otp: otpValue,
        ...(formData.role === 'admin' || formData.role === 'organizer' || formData.role === 'student' ? { collegeId: formData.collegeId } : {})
      };

      const { data } = await api.post('/api/auth/register', payload);

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      setTimeout(() => {
        if (formData.role === 'admin') navigate('/admin/dashboard');
        else if (formData.role === 'organizer') navigate('/organizer/dashboard');
        else navigate('/student/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Registration error:', error);

      if (error.response?.data?.msg) {
        setOtpError(error.response.data.msg);
      } else if (error.response?.data?.message) {
        setOtpError(error.response.data.message);
      } else if (error.response?.data?.error) {
        setOtpError(error.response.data.error);
      } else if (error.response) {
        setOtpError('Registration failed. Please try again.');
      } else {
        setOtpError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-600';
    if (passwordStrength === 1) return 'bg-red-500';
    if (passwordStrength === 2) return 'bg-orange-500';
    if (passwordStrength === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength === 1) return 'Weak';
    if (passwordStrength === 2) return 'Fair';
    if (passwordStrength === 3) return 'Good';
    return 'Strong';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse top-10 left-10" />
        <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse bottom-10 right-10" style={{ animationDelay: '1s' }} />
        <div className="absolute w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse top-1/2 left-1/2" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fadeInUp">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-4 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Join CollegeSphere Today</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            Create Your Account
          </h1>
          <p className="text-gray-400 text-lg">
            Discover and manage college events across campuses
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* API Error Message */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{apiError}</p>
            </div>
          )}

          <div className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${errors.fullName ? 'border-red-500' : 'border-white/10'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-gray-500`}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1 animate-shake">
                  <XCircle className="w-4 h-4" />
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${errors.email ? 'border-red-500' : 'border-white/10'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-gray-500`}
                  placeholder="you@college.edu"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1 animate-shake">
                  <XCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 bg-white/5 border ${errors.password ? 'border-red-500' : 'border-white/10'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-gray-500`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded ${level <= passwordStrength ? getPasswordStrengthColor() : 'bg-gray-700'
                          } transition-all duration-300`}
                      />
                    ))}
                  </div>
                  {passwordStrength > 0 && (
                    <p className="text-xs text-gray-400">
                      Password strength: <span className={passwordStrength >= 3 ? 'text-green-400' : 'text-orange-400'}>{getPasswordStrengthText()}</span>
                    </p>
                  )}
                </div>
              )}

              {errors.password && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1 animate-shake">
                  <XCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 bg-white/5 border ${errors.confirmPassword ? 'border-red-500' : 'border-white/10'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-gray-500`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="mt-1 text-sm text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Passwords match
                </p>
              )}
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1 animate-shake">
                  <XCircle className="w-4 h-4" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                I am a
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'student' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${formData.role === 'student'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                >
                  <User className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-medium text-sm">Student</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'organizer' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${formData.role === 'organizer'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                >
                  <Calendar className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-medium text-sm">Organizer</p>
                </button>
              </div>
            </div>

            {/* College Selection (for admin and organizer only) */}
            {((formData.role === 'organizer' || formData.role === 'student')) && (
              <div className="animate-fadeInUp">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Your College
                </label>
                <select
                  name="collegeId"
                  value={formData.collegeId}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white/5 border ${errors.collegeId ? 'border-red-500' : 'border-white/10'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white`}
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
            )}

            {/* Terms and Conditions */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/10 bg-white/5 text-purple-600 focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  I agree to the Terms and Conditions and Privacy Policy
                </span>
              </label>
              {errors.terms && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1 animate-shake">
                  <XCircle className="w-4 h-4" />
                  {errors.terms}
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
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <button
                onClick={() => navigate("/login")}
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-500 text-sm mt-6">
          By creating an account, you'll be able to discover and register for events across multiple colleges
        </p>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fadeIn">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Verify Your Email</h3>
              <p className="text-gray-400 text-sm">
                We've sent a 6-digit verification code to<br />
                <span className="text-purple-400 font-medium">{formData.email}</span>
              </p>
            </div>

            {/* OTP Error Message */}
            {otpError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{otpError}</p>
              </div>
            )}

            {/* OTP Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2 text-center">
                Enter Verification Code
              </label>
              <input
                type="text"
                value={otpValue}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpValue(value);
                  setOtpError('');
                }}
                maxLength={6}
                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-gray-500 tracking-[0.5em] text-center text-2xl font-bold"
                placeholder="000000"
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleOtpSubmit}
                disabled={loading || otpValue.length !== 6}
                className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Verify & Create Account
                  </>
                )}
              </button>

              <button
                onClick={async () => {
                  if (resendTimer === 0) {
                    setOtpError('');
                    await sendOTP();
                  }
                }}
                disabled={resendTimer > 0}
                className="w-full py-2 text-purple-400 hover:text-purple-300 disabled:text-gray-500 disabled:cursor-not-allowed font-medium transition-colors text-sm"
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend verification code'}
              </button>

              <button
                onClick={() => {
                  setShowOtpModal(false);
                  setOtpValue('');
                  setOtpError('');
                }}
                className="w-full py-2 text-gray-400 hover:text-gray-300 font-medium transition-colors text-sm"
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