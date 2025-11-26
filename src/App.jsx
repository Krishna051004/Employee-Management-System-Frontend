// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home"; // your login page (Home.jsx)
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";

import Nav from "./components/Nav";
import Footer from "./components/Footer";

function getUser() {
  try {
    const data = localStorage.getItem("ems_user");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function ProtectedRoute({ children, role }) {
  const user = getUser();

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;

  return children;
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Nav />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Home />} />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Employee */}
            <Route
              path="/employee"
              element={
                <ProtectedRoute role="employee">
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </main>

      <Footer />
    </div>
  );
}
