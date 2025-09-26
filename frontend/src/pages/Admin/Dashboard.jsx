import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { getStatusSummary, getSectorSummary } from "../../api/admin";

function useSummary() {
  const [status, setStatus] = React.useState({});
  const [sector, setSector] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    const load = async () => {
      try{
        setLoading(true);
        const [s, sec] = await Promise.all([getStatusSummary(), getSectorSummary()]);
        setStatus(s.data || {});
        setSector(sec.data || {});
      }catch(e){ setError(e?.message || "Failed to load"); }
      finally{ setLoading(false); }
    };
    load();
  }, []);
  return { status, sector, loading, error };
}

export default function AdminDashboard() {
  const { status, sector, loading, error } = useSummary();
  const totalResolved = (status["Resolved"] || 0) + (status["Solved"] || 0);
  const totalPending = status["Pending"] || 0;
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Admin Dashboard" />
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-xl font-semibold mb-4">Overview</h2>
        {error && <div className="mb-3 text-red-600">{error}</div>}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Problems (Pending)" value={totalPending} color="bg-amber-100 text-amber-700" />
            <StatCard label="Problems (Resolved)" value={totalResolved} color="bg-emerald-100 text-emerald-700" />
            <StatCard label="Healthcare" value={sector["healthcare"] || 0} color="bg-red-100 text-red-700" />
            <StatCard label="Agriculture" value={sector["agriculture"] || 0} color="bg-emerald-100 text-emerald-700" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg border shadow-sm p-4">
            <h3 className="font-semibold mb-3">Problems by Status</h3>
            {!loading && <BarChart data={status} height={240} color="#10b981" />}
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-4">
            <h3 className="font-semibold mb-3">Problems by Sector</h3>
            {!loading && <BarChart data={sector} height={240} color="#3b82f6" />}
            <div className="flex flex-col gap-2 mt-4">
              <Link className="px-3 py-2 rounded bg-orange-500 text-white text-sm text-center" to="/admin/users">Manage Users</Link>
              <button className="px-3 py-2 rounded bg-gray-200 text-sm">Export Report</button>
            </div>
          </div>
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

function BarChart({ data, height=200, color="#6366f1" }){
  const entries = Object.entries(data || {});
  const max = Math.max(1, ...entries.map(([,v]) => v));
  const barW = 32;
  const gap = 12;
  const width = entries.length * (barW + gap) + gap;
  return (
    <svg width={width} height={height} role="img" aria-label="Bar Chart">
      {entries.map(([k, v], i) => {
        const h = Math.round((v / max) * (height - 40));
        const x = gap + i * (barW + gap);
        const y = height - 20 - h;
        return (
          <g key={k}>
            <rect x={x} y={y} width={barW} height={h} fill={color} rx={4} />
            <text x={x + barW/2} y={height - 5} textAnchor="middle" fontSize="10" fill="#6b7280">{k}</text>
            <text x={x + barW/2} y={y - 4} textAnchor="middle" fontSize="10" fill="#374151">{v}</text>
          </g>
        );
      })}
      <line x1="0" y1={height-20} x2={width} y2={height-20} stroke="#e5e7eb" />
    </svg>
  );
}
