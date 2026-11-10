import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import OrganizerDashboard from './pages/OrganizerDashboard.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import GoogleCallback from './pages/GoogleCallback.jsx';
import CompleteProfile from './pages/CompleteProfile.jsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />

      {/* Authenticated Profile Setup */}
      <Route
        path="/complete-profile"
        element={
          <ProtectedRoute>
            <CompleteProfile />
          </ProtectedRoute>
        }
      />

      {/* Role-Protected Dashboards */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student', 'organizer', 'admin', 'superadmin']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['organizer', 'admin', 'superadmin']}>
            <OrganizerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

