import axios from "axios";

// Increase timeout to tolerate first-run AI model training
const api = axios.create({ 
  baseURL: "http://localhost:8000", // Updated to point to the FastAPI backend
  timeout: 60000 
});

// Attach token automatically if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// Global error handler to improve UX when requests hang or fail
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // token missing/expired or forbidden by role: force re-login
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
      } catch {}
      if (typeof window !== "undefined") {
        const current = window.location.pathname;
        if (current !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    if (error.code === "ECONNABORTED") {
      // timeout
      return Promise.reject(new Error("Request timed out. Please check your connection and try again."));
    }
    // surface server-provided message if any
    const msg = error?.response?.data?.detail || error?.message || "Request failed";
    return Promise.reject(new Error(msg));
  }
);
