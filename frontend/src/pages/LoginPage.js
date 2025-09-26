import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// import { login } from "../api/auth"; // Will integrate with backend later

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  const onMockLogin = (role) => (e) => {
    e.preventDefault();
    // Mock nav for wireframe; integrate API later
    if (role === "farmer") nav("/farmer");
    else if (role === "officer") nav("/officer");
    else nav("/admin");
  };

  const Card = ({ role, color, title }) => (
    <div className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition p-5 ${color} flex-1`}
         style={{ backdropFilter: "blur(2px)" }}>
      <div className="text-center mb-4">
        <div className="text-5xl mb-2" aria-hidden>
          {role === "farmer" && "🧑‍🌾"}
          {role === "officer" && "👮‍♂️"}
          {role === "admin" && "🛠️"}
        </div>
        <div className="text-lg font-semibold">{title}</div>
      </div>
      <form className="space-y-2" onSubmit={onMockLogin(role)}>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Username / Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="w-full py-2 rounded text-white" style={{ background: "#fb923c" }}>
          Login
        </button>
      </form>
    </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card role="farmer" title="Farmer" color="border-emerald-200" />
            <Card role="officer" title="Officer" color="border-blue-200" />
            <Card role="admin" title="Admin" color="border-orange-200" />
          </div>
        </div>
      </div>

      <div className="text-center py-4 text-gray-700 bg-white/70">
        © 2025 Village Development System
      </div>
    </div>
  );
}
