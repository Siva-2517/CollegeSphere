import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    if (token && userParam) {
      try {
        const user = JSON.parse(userParam);

        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        setStatus('success');

        setTimeout(() => {
          // If profile is incomplete, redirect to complete profile page
          if (!user.isProfileComplete) {
            navigate('/complete-profile');
          } else {
            // Redirect based on role
            if (user.role === 'admin') navigate('/admin/dashboard');
            else if (user.role === 'organizer') navigate('/organizer/dashboard');
            else navigate('/student/dashboard');
          }
        }, 1500);
      } catch (err) {
        console.error('Error processing Google auth callback:', err);
        setStatus('error');
        setError('Failed to process authentication data.');
        setTimeout(() => navigate('/login'), 3000);
      }
    } else {
      setStatus('error');
      setError('Authentication failed. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out; }
        .pulse-ring {
          animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
      `}</style>

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse top-10 left-10" />
        <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse bottom-10 right-10" style={{ animationDelay: '1s' }} />
      </div>

      <div className="text-center relative z-10 animate-fadeInUp">
        {status === 'processing' && (
          <>
            <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
              <div className="absolute w-24 h-24 bg-purple-500/30 rounded-full pulse-ring" />
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/50">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Signing you in...
            </h2>
            <p className="text-gray-400 text-lg">Completing Google authentication</p>
            <div className="mt-6 flex justify-center">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h2 className="text-3xl font-bold mb-3 text-green-400">
              Welcome!
            </h2>
            <p className="text-gray-400 text-lg">Setting up your account...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 rounded-full mb-6">
              <AlertCircle className="w-12 h-12 text-red-400" />
            </div>
            <h2 className="text-3xl font-bold mb-3 text-red-400">
              Authentication Failed
            </h2>
            <p className="text-gray-400 text-lg">{error}</p>
            <p className="text-gray-500 text-sm mt-2">Redirecting to login page...</p>
          </>
        )}
      </div>
    </div>
  );
}
