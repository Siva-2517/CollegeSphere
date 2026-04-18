import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, Sparkles, AlertCircle, ArrowRight, LogIn } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import api from '../api/axios';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        const userData = JSON.parse(user);
        redirectBasedOnRole(userData.role);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    // Load remembered email if exists
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);


  const redirectBasedOnRole = (role) => {
    if (role === 'admin') navigate('/admin/dashboard');
    else if (role === 'organizer') navigate('/organizer/dashboard');
    else navigate('/student/dashboard');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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

    setLoading(true);

    try {
      const { data } = await api.post('/api/auth/login', {
        email: formData.email,
        password: formData.password
      });

      // Store token
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // Store user data
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Success animation then redirect
      setTimeout(() => {
        redirectBasedOnRole(data.user?.role || 'student');
      }, 500);
    } catch (error) {
      console.error('Login error:', error);

      // Handle backend errors
      if (error.response?.data?.message) {
        setApiError(error.response.data.message);
      } else if (error.response?.data?.error) {
        setApiError(error.response.data.error);
      } else if (error.response) {
        setApiError('Login failed. Please check your credentials.');
      } else {
        setApiError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
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
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse top-10 left-10" />
        <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse bottom-10 right-10" style={{ animationDelay: '1s' }} />
        <div className="absolute w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse top-1/2 left-1/2" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fadeInUp">
        {/* Hero Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mb-4 shadow-2xl shadow-purple-500/50 animate-float">
            <Sparkles className="w-10 h-10" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            CollegeSphere
          </h1>

          <p className="text-gray-400 text-lg">
            Discover, manage & register for college events
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
            <p className="text-gray-400">Sign in to continue to your account</p>
          </div>

          {/* API Error Message */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{apiError}</p>
            </div>
          )}

          <div className="space-y-5">
            {/* Email Input */}
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
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${errors.email ? 'border-red-500' : 'border-white/10'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-gray-500`}
                  placeholder="you@college.edu"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400 animate-shake">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Input */}
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
                  className={`w-full pl-10 pr-12 py-3 bg-white/5 border ${errors.password ? 'border-red-500' : 'border-white/10'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-gray-500`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400 animate-shake">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-purple-600 focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  Remember me
                </span>
              </label>

              <a
                href="/forgot-password"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Forgot Password?
              </a>
            </div>

            {/* Login Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/5 text-gray-400">Or continue with</span>
              </div>
            </div>

            {/* Google Sign-In Button */}
            <button
              onClick={() => {
                window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`;
              }}
              className="w-full py-3.5 bg-white/5 border border-white/10 rounded-lg font-medium text-base transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-3 group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-gray-300 group-hover:text-white transition-colors">
                Sign in with Google
              </span>
            </button>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-gray-400">
                Don't have an account?{' '}
                <a
                  href="/register"
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  Create Account
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            Your connection is secure and encrypted
          </p>
        </div>
      </div>
    </div>
  );
}