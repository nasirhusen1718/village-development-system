import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register as registerUser } from "../api/auth";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    // basic client-side validation
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = "Name is required";
    if (!email.trim()) nextErrors.email = "Email is required";
    if (password.length < 6) nextErrors.password = "Password must be at least 6 characters";
    if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      // Submit with selected role
      await registerUser({ name, email, password, role });
      alert("Registration successful. Please log in.");
      nav("/login");
    } catch (err) {
      console.error(err);
      // our axios interceptor returns Error(message) without response attached
      alert(err?.response?.data?.detail || err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white border rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-4">Create an Account</h1>
        <form className="space-y-3" onSubmit={onSubmit} noValidate>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {errors.name && <div className="text-sm text-red-600">{errors.name}</div>}
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        {errors.email && <div className="text-sm text-red-600">{errors.email}</div>}
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {errors.password && <div className="text-sm text-red-600">{errors.password}</div>}
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {errors.confirmPassword && <div className="text-sm text-red-600">{errors.confirmPassword}</div>}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Role</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">Farmer</option>
              <option value="officer">Officer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button disabled={loading} className="w-full py-2 rounded text-white disabled:opacity-60" style={{ background: "#10b981" }}>
            {loading ? "Creating..." : "Register"}
          </button>
        </form>
        <div className="text-sm text-gray-600 mt-4">
          Already have an account? <Link className="text-blue-600" to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
