import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, roles }) {
  const token = localStorage.getItem("token");
  const storedRole = localStorage.getItem("role");
  const role = storedRole === "user" ? "farmer" : storedRole; // map backend "user" → UI "farmer"

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (roles && roles.length > 0 && !roles.includes(role)) {
    const fallback = role === "farmer" ? "/farmer" : role === "officer" ? "/officer" : "/admin";
    return <Navigate to={fallback} replace />;
  }
  return children;
}
