import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { sectorProblems, updateStatus, escalateProblem, getProblemHistory } from "../../api/officer";
import ProblemTable from "../../components/ProblemTable";

const labelMap = {
  healthcare: "Healthcare",
  agriculture: "Agriculture",
  infrastructure: "Village / Infrastructure",
  education: "Education",
  water: "Water & Sanitation",
};

export default function OfficerSector() {
  const { sector } = useParams();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ status: "", priority: "", location: "", q: "" });
  const [statusMulti, setStatusMulti] = useState({ Pending:false, "In Progress":false, Resolved:false, Escalated:false });
  const [priorityMulti, setPriorityMulti] = useState({ low:false, medium:false, high:false });
  const [sort, setSort] = useState({ orderBy: "date_submitted", orderDir: "desc" });
  const [remarkForId, setRemarkForId] = useState(null);
  const [remarkText, setRemarkText] = useState("");
  const [toasts, setToasts] = useState([]);
  const [lastReloadAt, setLastReloadAt] = useState(0);
  const [historyForId, setHistoryForId] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const params = {};
      // multi-select -> comma separated
      const selStatuses = Object.entries(statusMulti).filter(([,v])=>v).map(([k])=>k);
      const selPriorities = Object.entries(priorityMulti).filter(([,v])=>v).map(([k])=>k);
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (selStatuses.length) params.status = selStatuses.join(',');
      if (selPriorities.length) params.priority = selPriorities.join(',');
      if (filters.location) params.location = filters.location;
      if (filters.q) params.q = filters.q;
      if (sort.orderBy) params.orderBy = sort.orderBy;
      if (sort.orderDir) params.orderDir = sort.orderDir;
      const r = await sectorProblems(sector, params);
      setProblems(r.data || []);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to load problems");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sector, filters.status, filters.priority, filters.location, statusMulti, priorityMulti, sort.orderBy, sort.orderDir]);

  // WebSocket notifications for this sector
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !sector) return;
    const isSecure = window.location.protocol === "https:";
    const wsProto = isSecure ? "wss" : "ws";
    const wsUrl = `${wsProto}://${window.location.host}/api/ws/officer?token=${encodeURIComponent(token)}&sector=${encodeURIComponent(sector)}`;
    let ws;
    let alive = true;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          const type = data?.type;
          // Build human-readable message
          let text = "";
          if (type === "problem_created") {
            text = `New problem reported: #${data.problem_id} ${data.title || ""}`.trim();
            if (String(data.priority).toLowerCase() === "high") {
              text += " (High Priority)";
            }
          } else if (type === "status_changed") {
            text = `Problem #${data.problem_id} status: ${data.status}`;
          } else if (type === "problem_escalated") {
            text = `Problem #${data.problem_id} escalated`;
          } else {
            text = `Update on problem #${data?.problem_id || "?"}`;
          }
          // Push toast
          const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          setToasts((prev) => [...prev, { id, text }]);
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
          }, 3500);
          // Debounced reload (not more than once per 2s)
          const now = Date.now();
          if (now - lastReloadAt > 2000) {
            setLastReloadAt(now);
            load();
          }
        } catch (e) {
          console.warn("WS parse error", e);
        }
      };
      ws.onerror = () => {
        // optional: surface connection errors
      };
    } catch (e) {
      console.error("WS init error", e);
    }
    return () => {
      alive = false;
      try { ws && ws.close(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sector]);

  const onAction = async (id, payload) => {
    try {
      await updateStatus(id, payload);
      load();
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const onEscalate = async (id) => {
    const remarks = window.prompt("Remarks (optional) before escalating:", remarkText || "");
    try {
      await escalateProblem(id, remarks || undefined);
      setRemarkText("");
      load();
    } catch (err) {
      console.error(err);
      alert("Failed to escalate");
    }
  };

  const onRemark = (id) => {
    setRemarkForId(id);
    setRemarkText("");
  };

  const saveRemark = async () => {
    if (!remarkForId) return;
    try {
      await updateStatus(remarkForId, { status: "In Progress", officer_remarks: remarkText, assign_to_self: true });
      setRemarkForId(null);
      setRemarkText("");
      load();
    } catch (err) {
      console.error(err);
      alert("Failed to save remark");
    }
  };

  const title = labelMap[sector] || sector;

  const onHistory = async (id) => {
    setHistoryForId(id);
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const r = await getProblemHistory(id);
      setHistoryItems(r.data || []);
    } catch (e) {
      console.error(e);
      setHistoryError(e?.message || "Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div>
      <Navbar title={`${title} - Officer`} />
      <div style={{ padding: 20 }}>
        {!!toasts.length && (
          <div style={{position:"fixed", right:16, top:70, display:"flex", flexDirection:"column", gap:8, zIndex:50}}>
            {toasts.map(t => (
              <div key={t.id} style={{background:"#111827", color:"white", padding:"8px 12px", borderRadius:8, boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>{t.text}</div>
            ))}
          </div>
        )}
        <h3 style={{fontWeight:700, marginBottom:8}}>{title} Problems</h3>
        <div style={{display:"flex", flexWrap:"wrap", gap:10, margin:"12px 0", alignItems:"center", padding:12, border:'1px solid #e5e7eb', borderRadius:10, background:'#ffffff'}}> 
          <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
            <span style={{fontSize:12, color:'#6b7280', minWidth:56}}>Status</span>
            {Object.keys(statusMulti).map(k => {
              const active = !!statusMulti[k];
              const base = { padding:'6px 10px', borderRadius:9999, border:'1px solid #e5e7eb', cursor:'pointer', fontSize:12 };
              const style = active ? { ...base, background:'#eef2ff', border:'1px solid #c7d2fe', color:'#3730a3' } : { ...base, background:'#f8fafc', color:'#475569' };
              return (
                <button key={k} type="button" style={style} onClick={()=>setStatusMulti(s=>({...s,[k]: !s[k]}))}>{k}</button>
              );
            })}
          </div>
          <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
            <span style={{fontSize:12, color:'#6b7280', minWidth:56}}>Priority</span>
            {Object.keys(priorityMulti).map(k => {
              const active = !!priorityMulti[k];
              const base = { padding:'6px 10px', borderRadius:9999, border:'1px solid #e5e7eb', cursor:'pointer', fontSize:12, textTransform:'capitalize' };
              const style = active ? { ...base, background:'#fff1f2', border:'1px solid #fecdd3', color:'#9f1239' } : { ...base, background:'#f8fafc', color:'#475569' };
              return (
                <button key={k} type="button" style={style} onClick={()=>setPriorityMulti(s=>({...s,[k]: !s[k]}))}>{k}</button>
              );
            })}
          </div>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <input placeholder="Location" value={filters.location} onChange={(e)=>setFilters(f=>({...f, location: e.target.value}))} 
              style={{border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px'}} />
            <input placeholder="Search title/description" value={filters.q} onChange={(e)=>setFilters(f=>({...f, q: e.target.value}))} onKeyDown={(e)=>{ if(e.key==='Enter'){ load(); } }}
              style={{border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', minWidth:220}} />
          </div>
          <div style={{display:'inline-flex', gap:6, alignItems:'center', marginLeft:'auto'}}>
            <span style={{fontSize:12, color:'#6b7280'}}>Sort</span>
            <select value={sort.orderBy} onChange={(e)=>setSort(s=>({...s, orderBy: e.target.value}))} style={{border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px'}}>
              <option value="date_submitted">Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="location">Location</option>
            </select>
            <select value={sort.orderDir} onChange={(e)=>setSort(s=>({...s, orderDir: e.target.value}))} style={{border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px'}}>
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
            <button onClick={load} style={{background:'#0ea5e9', color:'white', border:'none', borderRadius:8, padding:'6px 12px'}}>Apply</button>
            <button onClick={()=>{ setFilters({ status:"", priority:"", location:"", q:"" }); setStatusMulti({ Pending:false, "In Progress":false, Resolved:false, Escalated:false }); setPriorityMulti({ low:false, medium:false, high:false }); }}
              style={{background:'#f3f4f6', color:'#111827', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 12px'}}>Reset</button>
          </div>
        </div>
        {loading && <div>Loading...</div>}
        {error && (
          <div style={{ color: "#b91c1c", marginBottom: 12 }}>Error: {error}</div>
        )}
        <ProblemTable problems={problems} onAction={onAction} onRemark={onRemark} onEscalate={onEscalate} onHistory={onHistory} />

        {remarkForId && (
          <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center"}}>
            <div style={{background:"white", padding:16, borderRadius:8, width:420}}>
              <h4 style={{marginBottom:8}}>Add / Update Remark</h4>
              <textarea value={remarkText} onChange={(e)=>setRemarkText(e.target.value)} style={{width:"100%", height:120}} placeholder="Enter notes..." />
              <div style={{display:"flex", justifyContent:"flex-end", gap:8, marginTop:8}}>
                <button onClick={()=>{setRemarkForId(null); setRemarkText("");}}>Cancel</button>
                <button onClick={saveRemark}>Save</button>
              </div>
            </div>
          </div>
        )}

        {historyForId && (
          <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center"}}>
            <div style={{background:"white", padding:16, borderRadius:8, width:520, maxHeight:'80vh', overflow:'auto'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                <h4 style={{margin:0}}>History for #{historyForId}</h4>
                <button onClick={()=>{ setHistoryForId(null); setHistoryItems([]); }}>Close</button>
              </div>
              {historyLoading && <div>Loading...</div>}
              {historyError && <div style={{color:'#b91c1c'}}>Error: {historyError}</div>}
              {!historyLoading && !historyError && (
                <ul style={{listStyle:'none', padding:0, margin:0}}>
                  {historyItems.map(h => (
                    <li key={h.id} style={{display:'flex', gap:12, padding:'10px 0', borderBottom:'1px solid #e5e7eb'}}>
                      <div style={{width:8, minWidth:8, height:8, marginTop:6, borderRadius:9999, background: h.action === 'Escalated' ? '#f43f5e' : '#10b981'}}></div>
                      <div>
                        <div style={{fontSize:13, color:'#374151'}}>
                          <strong>{h.action}</strong>
                          {h.from_status || h.to_status ? (
                            <span> — {h.from_status || '—'} ➝ {h.to_status || '—'}</span>
                          ) : null}
                        </div>
                        {h.remark && <div style={{fontSize:12, color:'#6b7280', marginTop:4}}>{h.remark}</div>}
                        <div style={{fontSize:11, color:'#9ca3af', marginTop:4}}>{new Date(h.created_at).toLocaleString()} {h.changed_by ? `(by ${h.changed_by})` : ''}</div>
                      </div>
                    </li>
                  ))}
                  {historyItems.length === 0 && (
                    <li style={{padding:'6px 0', color:'#6b7280', fontSize:13}}>No history yet.</li>
                  )}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
