import React from 'react'
import Landing from './pages/Landing.jsx'
import {Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import AdminDashboard from './pages/AdminDashBoard.jsx';
import OrganizerDashboard from './pages/OrganizerDashboard.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';

function App() {
  return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />

      </Routes>
  );
}

export default App;
