import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import api from "../../api/http";

const sectors = [
  { key: "healthcare", name: "Healthcare", emoji: "🏥", color: "bg-red-100 text-red-700 border-red-200", to: "/farmer/healthcare" },
  { key: "agriculture", name: "Agriculture", emoji: "🌾", color: "bg-emerald-100 text-emerald-700 border-emerald-200", to: "/farmer/agriculture" },
  { key: "infrastructure", name: "Village / Infrastructure", emoji: "🏘️", color: "bg-gray-100 text-gray-700 border-gray-200", to: "/farmer/infrastructure" },
  { key: "education", name: "Education", emoji: "📚", color: "bg-yellow-100 text-yellow-700 border-yellow-200", to: "/farmer/education" },
  { key: "water", name: "Water & Sanitation", emoji: "💧", color: "bg-blue-100 text-blue-700 border-blue-200", to: "/farmer/water" },
];

export default function FarmerDashboard() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [counts, setCounts] = React.useState({ pending: 0, inProgress: 0, resolved: 0, escalated: 0 });

  React.useEffect(() => {
    const load = async () => {
      try{
        setLoading(true); setError("");
        const r = await api.get("/farmer/problems");
        const items = r.data || [];
        const c = { pending:0, inProgress:0, resolved:0, escalated:0 };
        for(const p of items){
          const s = String(p.status || '').toLowerCase();
          if (s.includes('pending')) c.pending++;
          else if (s.includes('progress')) c.inProgress++;
          else if (s.includes('resolved') || s.includes('solved')) c.resolved++;
          if (p.escalated_to_admin) c.escalated++;
        }
        setCounts(c);
      }catch(e){ setError(e?.message || 'Failed to load'); }
      finally{ setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Farmer Dashboard" />
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-xl font-semibold mb-4">Overview</h2>
        {error && <div className="mb-3 text-red-600">{error}</div>}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Pending" value={counts.pending} color="bg-amber-100 text-amber-700" />
          <StatCard label="In Progress" value={counts.inProgress} color="bg-blue-100 text-blue-700" />
          <StatCard label="Resolved" value={counts.resolved} color="bg-emerald-100 text-emerald-700" />
          <StatCard label="Escalated" value={counts.escalated} color="bg-fuchsia-100 text-fuchsia-700" />
        </div>

        <h2 className="text-xl font-semibold mb-3">Sectors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectors.map((s) => (
            s.to ? (
              <Link
                key={s.key}
                to={s.to}
                className={`border ${s.color} rounded-lg p-4 shadow-sm hover:shadow-md transition flex items-center justify-between`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>{s.emoji}</span>
                  <div>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-sm opacity-70">View and submit problems</div>
                  </div>
                </div>
                <span className="text-sm bg-white/70 px-2 py-1 rounded border">Open</span>
              </Link>
            ) : (
              <div
                key={s.key}
                className={`border ${s.color} rounded-lg p-4 shadow-sm opacity-60 cursor-not-allowed flex items-center justify-between`}
                title="Coming soon"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>{s.emoji}</span>
                  <div>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-sm opacity-70">Coming soon</div>
                  </div>
                </div>
                <span className="text-sm bg-white/70 px-2 py-1 rounded border">Locked</span>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }){
  return (
    <div className={`rounded-lg p-4 border shadow-sm ${color}`}>
      <div className="text-sm opacity-80">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
