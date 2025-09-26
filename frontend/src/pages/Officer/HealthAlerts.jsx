import React, { useEffect, useMemo, useRef, useState } from "react";
import { predictHealth, batchPredictHealth } from "../../api/health";

export default function HealthAlerts() {
  const [sample, setSample] = useState({
    hr: 90,
    bp_sys: 130,
    bp_dia: 85,
    spo2: 97,
    temp_c: 37.0,
    rr: 18,
    age: 50,
    gender: "male",
    medical_history_count: 1,
    prior_events_count: 0,
    env_air_quality_index: 60,
    env_heat_index: 30,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feed, setFeed] = useState([]);
  const wsRef = useRef(null);

  const tokenParam = useMemo(() => {
    const t = localStorage.getItem("token") || "";
    return encodeURIComponent(t);
  }, []);

  const canListen = useMemo(() => {
    const role = localStorage.getItem("role") || "";
    return role === "officer" || role === "admin";
  }, []);

  useEffect(() => {
    if (!canListen) return;
    // Connect to websocket for sector=healthcare
    const url = `ws://127.0.0.1:8000/ws/officer?token=${tokenParam}&sector=healthcare`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      // no-op
    };
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        setFeed((prev) => [
          {
            ts: new Date().toISOString(),
            ...msg,
          },
          ...prev,
        ].slice(0, 50));
      } catch (_) {}
    };
    ws.onerror = () => {};
    ws.onclose = () => {};

    return () => {
      try { ws.close(); } catch {}
    };
  }, [tokenParam, canListen]);

  const onChange = (k, v) => {
    setSample((s) => ({ ...s, [k]: v }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const out = await predictHealth({ ...sample });
      setResult(out);
    } catch (err) {
      alert(err?.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Healthcare Alerts</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl shadow-sm p-4">
          <h2 className="font-semibold mb-3">Test Prediction</h2>
          <form className="grid grid-cols-2 gap-3" onSubmit={onSubmit}>
            {Object.entries(sample).map(([k, v]) => (
              <div key={k} className="col-span-1">
                <label className="block text-sm text-gray-600 mb-1">{k}</label>
                <input
                  className="w-full border rounded px-2 py-1"
                  value={v}
                  onChange={(e) => onChange(k, k === "gender" ? e.target.value : Number(e.target.value))}
                />
              </div>
            ))}
            <div className="col-span-2 mt-2">
              <button disabled={loading} className="px-4 py-2 rounded text-white disabled:opacity-50" style={{ background: "#0ea5e9" }}>
                {loading ? "Predicting..." : "Predict"}
              </button>
            </div>
          </form>
          {result && (
            <div className="mt-4 text-sm">
              <div><span className="font-semibold">Likelihood:</span> {(result.likelihood * 100).toFixed(1)}%</div>
              <div><span className="font-semibold">Anomaly:</span> {(result.anomaly * 100).toFixed(1)}%</div>
              <div><span className="font-semibold">Severity:</span> {result.severity}</div>
              {Array.isArray(result.factors) && result.factors.length > 0 && (
                <div className="mt-2">
                  <span className="font-semibold">Factors:</span> {result.factors.join(", ")}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border rounded-xl shadow-sm p-4">
          <h2 className="font-semibold mb-3">Live Alerts Feed {canListen ? "" : "(login as officer/admin)"}</h2>
          <div className="space-y-2 max-h-[420px] overflow-auto">
            {feed.length === 0 ? (
              <div className="text-gray-500 text-sm">No alerts yet.</div>
            ) : (
              feed.map((it, idx) => (
                <div key={idx} className="border rounded p-2">
                  <div className="text-xs text-gray-500">{it.ts}</div>
                  <div className="text-sm">
                    <span className="font-semibold">Type:</span> {it.type}
                  </div>
                  {it.payload && (
                    <div className="text-sm">
                      <span className="font-semibold">Severity:</span> {it.payload.severity}
                      {Array.isArray(it.payload.factors) && it.payload.factors.length > 0 && (
                        <span> • {it.payload.factors.join(", ")}</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
