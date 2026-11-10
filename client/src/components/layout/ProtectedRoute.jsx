import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute guard: validates user authentication, profile completion,
 * and role-based access before rendering protected views.
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  let user = null;
  try {
    user = JSON.parse(userStr);
  } catch (e) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If user signed in with Google OAuth and has not assigned role/college
  if (user && user.isProfileComplete === false && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // Check role authorization if roles specified
  if (allowedRoles.length > 0) {
    const userRole = user.role;
    // Superadmin inherits administrative access
    const isAuthorized = allowedRoles.includes(userRole) ||
      (userRole === 'superadmin' && allowedRoles.some(r => ['admin', 'organizer', 'student'].includes(r)));

    if (!isAuthorized) {
      // Redirect to user's native dashboard
      if (userRole === 'superadmin') return <Navigate to="/superadmin/dashboard" replace />;
      if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
      if (userRole === 'organizer') return <Navigate to="/organizer/dashboard" replace />;
      return <Navigate to="/student/dashboard" replace />;
    }
  }

  return children;
}
