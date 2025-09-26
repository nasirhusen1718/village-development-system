import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Pages
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import FarmerDashboard from "./pages/Farmer/Dashboard.jsx";
import FarmerHealthcare from "./pages/Farmer/Healthcare.jsx";
import FarmerAgriculture from "./pages/Farmer/Agriculture.jsx";
import FarmerInfrastructure from "./pages/Farmer/Infrastructure.jsx";
import FarmerEducation from "./pages/Farmer/Education.jsx";
import FarmerWater from "./pages/Farmer/Water.jsx";
import OfficerDashboard from "./pages/Officer/Dashboard.jsx";
import OfficerSector from "./pages/Officer/Sector.jsx";
import OfficerHealthAlerts from "./pages/Officer/HealthAlerts.jsx";
import AdminDashboard from "./pages/Admin/Dashboard.jsx";
import AdminUsers from "./pages/Admin/UserManagement.jsx";

function HomeHealthCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking...');

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8003/');
        if (!response.ok) {
          throw new Error(`Backend returned status: ${response.status}`);
        }
        const data = await response.json();
        setBackendStatus('connected');
      } catch (err) {
        console.error('Backend connection error:', err);
        setError(`Failed to connect to backend: ${err.message}`);
        setBackendStatus('disconnected');
      } finally {
        setIsLoading(false);
      }
    };

    checkBackend();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Village Development System</h1>
        
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            <p>Checking system status...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border-l-4 border-red-500">
            <p className="text-red-700">
              <span className="font-semibold">Connection Error:</span> {error}
            </p>
            <p className="mt-2 text-sm text-red-600">
              Please ensure the backend server is running at {import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8003/'}
            </p>
          </div>
        ) : (
          <div className="p-4 bg-green-50 border-l-4 border-green-500">
            <p className="text-green-700">
              <span className="font-semibold">Status:</span> System is operational
            </p>
            <p className="mt-1 text-sm text-green-600">Backend connection established successfully</p>
          </div>
        )}
        
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            <Link 
              className="px-4 py-2 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors" 
              to="/farmer"
            >
              Farmer Dashboard
            </Link>
            <Link 
              className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors" 
              to="/officer"
            >
              Officer Dashboard
            </Link>
            <Link 
              className="px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 transition-colors" 
              to="/admin"
            >
              Admin Dashboard
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link 
              className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-800 transition-colors" 
              to="/login"
            >
              Login
            </Link>
            <Link 
              className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 transition-colors" 
              to="/register"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeHealthCard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Farmer */}
        <Route
          path="/farmer"
          element={
            <ProtectedRoute roles={["farmer"]}>
              <FarmerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/healthcare"
          element={
            <ProtectedRoute roles={["farmer"]}>
              <FarmerHealthcare />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/agriculture"
          element={
            <ProtectedRoute roles={["farmer"]}>
              <FarmerAgriculture />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/infrastructure"
          element={
            <ProtectedRoute roles={["farmer"]}>
              <FarmerInfrastructure />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/education"
          element={
            <ProtectedRoute roles={["farmer"]}>
              <FarmerEducation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/water"
          element={
            <ProtectedRoute roles={["farmer"]}>
              <FarmerWater />
            </ProtectedRoute>
          }
        />

        {/* Officer */}
        <Route
          path="/officer"
          element={
            <ProtectedRoute roles={["officer"]}>
              <OfficerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/healthcare-alerts"
          element={
            <ProtectedRoute roles={["officer", "admin"]}>
              <OfficerHealthAlerts />
            </ProtectedRoute>
          }
        />
        {/* Generic officer sector route: agriculture, infrastructure, education, water */}
        <Route
          path="/officer/:sector"
          element={
            <ProtectedRoute roles={["officer"]}>
              <OfficerSector />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
