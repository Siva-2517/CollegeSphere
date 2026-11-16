import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { CollegeSphereLogoMark } from '../components/common/CollegeSphereLogo';

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

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        const timer = setTimeout(() => {
          setStatus('success');
          setTimeout(() => {
            if (!user.isProfileComplete) {
              navigate('/complete-profile');
            } else {
              if (user.role === 'superadmin') navigate('/superadmin/dashboard');
              else if (user.role === 'admin') navigate('/admin/dashboard');
              else if (user.role === 'organizer') navigate('/organizer/dashboard');
              else navigate('/student/dashboard');
            }
          }, 800);
        }, 100);

        return () => clearTimeout(timer);
      } catch {
        const timer = setTimeout(() => {
          setStatus('error');
          setError('Failed to process authentication credentials.');
          setTimeout(() => navigate('/login'), 3000);
        }, 100);
        return () => clearTimeout(timer);
      }
    } else {
      const timer = setTimeout(() => {
        setStatus('error');
        setError('Google authentication was interrupted. Please retry.');
        setTimeout(() => navigate('/login'), 3000);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-surface-900 text-white flex items-center justify-center p-6 font-sans">
      <div className="bg-surface-800/80 border border-slate-700/80 rounded-2xl p-8 max-w-sm w-full text-center shadow-ticket">
        {status === 'processing' && (
          <>
            <div className="flex justify-center mb-4">
              <CollegeSphereLogoMark size={48} animated />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              Verifying Credentials
            </h2>
            <p className="text-slate-400 text-xs mb-6">
              Finalizing secure Google OAuth session...
            </p>
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              Authenticated
            </h2>
            <p className="text-slate-400 text-xs">
              Redirecting to your collegiate workspace...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-rose-400 mb-1">
              Authentication Failed
            </h2>
            <p className="text-slate-400 text-xs mb-4">{error}</p>
            <p className="text-slate-500 text-[11px]">Returning to login...</p>
          </>
        )}
      </div>
    </div>
  );
}
