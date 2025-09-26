import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("farmer");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      if (loading) return; // guard against double-click
      setLoading(true);
      const resp = await login(email, password);
      let role = (resp.data && resp.data.role) || localStorage.getItem("role") || "";
      if (role === "user") role = "farmer"; // normalize backend role
      if (role === "farmer") nav("/farmer");
      else if (role === "officer") nav("/officer");
      else nav("/admin");
    } catch (err) {
      console.error(err);
      alert("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const RoleCard = ({ role, color, title, emoji }) => (
    <button
      type="button"
      onClick={() => setSelectedRole(role)}
      className={`bg-white rounded-xl border shadow-sm transition p-5 flex-1 text-left ${
        selectedRole === role ? "ring-2 ring-offset-2 ring-orange-400" : "hover:shadow-md"
      } ${color}`}
      style={{ backdropFilter: "blur(2px)" }}
      aria-pressed={selectedRole === role}
    >
      <div className="text-center mb-4">
        <div className="text-5xl mb-2" aria-hidden>{emoji}</div>
        <div className="text-lg font-semibold">{title}</div>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{
      backgroundImage: "url('https://images.unsplash.com/photo-1559622214-64d5f2f5b9c6?q=80&w=1200&auto=format&fit=crop')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      <div className="bg-white/70">
        <div className="max-w-5xl mx-auto py-8 px-4 text-center">
          <h1 className="text-3xl font-extrabold">AI-Enhanced Village Development System</h1>
        </div>
      </div>

      <div className="flex-1 bg-white/60">
        <div className="max-w-5xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <RoleCard role="farmer" title="Farmer" color="border-emerald-200" emoji="🧑‍🌾" />
            <RoleCard role="officer" title="Officer" color="border-blue-200" emoji="👮‍♂️" />
            <RoleCard role="admin" title="Admin" color="border-orange-200" emoji="🛠️" />
          </div>

          <form onSubmit={handleLogin} className="max-w-md mx-auto bg-white p-5 rounded-xl border shadow-sm">
            <div className="text-sm text-gray-600 mb-3">Selected role: <span className="font-medium capitalize">{selectedRole}</span></div>
            <div className="space-y-3">
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Username / Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button disabled={loading} className="w-full py-2 rounded text-white disabled:opacity-60" style={{ background: "#fb923c" }}>
                {loading ? "Signing in..." : "Login"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="text-center py-4 text-gray-700 bg-white/70">
        © 2025 Village Development System
      </div>
    </div>
  );
}
