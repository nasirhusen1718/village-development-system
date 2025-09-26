import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { createProblem, myProblems } from "../../api/farmer";
import ImagePicker from "../../components/ImagePicker";

export default function Water(){
  const [title,setTitle] = useState("");
  const [desc,setDesc] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("medium");
  const [contact, setContact] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [problems,setProblems] = useState([]);
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [lastStatuses, setLastStatuses] = useState({});
  const [resolvedToast, setResolvedToast] = useState("");

  useEffect(()=>{ load(); },[]);
  useEffect(()=>{ const id = setInterval(load, 15000); return ()=>clearInterval(id); },[]);

  const load = async () => {
    try{
      const r = await myProblems();
      const arr = r.data || [];
      const prev = lastStatuses || {};
      const nowMap = {};
      for (const p of arr) { nowMap[p.id] = p.status; }
      const newlyResolved = arr.find(p => (p.status||"").toLowerCase().includes("resolved") || (p.status||"").toLowerCase().includes("solved"));
      const triggered = newlyResolved && prev[newlyResolved.id] && prev[newlyResolved.id] !== newlyResolved.status;
      if (triggered) {
        setResolvedToast(`Problem #${newlyResolved.id} marked as ${newlyResolved.status}`);
        setTimeout(()=>setResolvedToast(""), 3000);
      }
      setLastStatuses(nowMap);
      setProblems(arr);
    }catch(err){ console.error(err); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    const fe = {};
    if (!title.trim()) fe.title = "Title is required";
    if (!desc.trim()) fe.desc = "Description is required";
    setFormErrors(fe);
    if (Object.keys(fe).length) return;
    setSubmitting(true);
    try{
      const attachLine = images.length ? `\nAttachments: ${images.length} file(s)` : "";
      const extended = `${desc}${attachLine}\n\nLocation: ${location || "-"}\nPriority: ${priority}\nContact: ${contact || "-"}\nTarget date: ${targetDate || "-"}`;
      await createProblem({ sector:"water", title, description:extended, location, priority });
      setTitle(""); setDesc("");
      setLocation(""); setPriority("medium"); setContact(""); setTargetDate("");
      setSuccess("Problem submitted successfully."); setTimeout(()=>setSuccess(""), 2500);
      load();
    }catch(err){ console.error(err); setError(err?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Water & Sanitation - Farmer" />
      <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl shadow-sm p-5">
          <h3 className="text-lg font-semibold mb-2">Report Water & Sanitation Problem</h3>
          <div className="text-xs text-gray-600 mb-3 flex gap-2 items-center">
            <span className="px-2 py-0.5 rounded border bg-amber-50 border-amber-200 text-amber-700">Pending</span>
            <span className="px-2 py-0.5 rounded border bg-blue-50 border-blue-200 text-blue-700">In Progress</span>
            <span className="px-2 py-0.5 rounded border bg-emerald-50 border-emerald-200 text-emerald-700">Resolved</span>
            <span className="px-2 py-0.5 rounded border bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700">Escalated</span>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Title</label>
              <input className={`w-full border rounded px-3 py-2 ${formErrors.title? 'border-red-400':''}`} placeholder="e.g., Water Leakage" value={title} onChange={e=>setTitle(e.target.value)} />
              {formErrors.title && <div className="text-xs text-red-600 mt-1">{formErrors.title}</div>}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Description</label>
              <textarea className={`w-full border rounded px-3 py-2 min-h-[100px] ${formErrors.desc? 'border-red-400':''}`} placeholder="Describe the issue clearly" value={desc} onChange={e=>setDesc(e.target.value)} />
              {formErrors.desc && <div className="text-xs text-red-600 mt-1">{formErrors.desc}</div>}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Location</label>
              <input className="w-full border rounded px-3 py-2" placeholder="Village/Area" value={location} onChange={e=>setLocation(e.target.value)} list="locations" />
              <datalist id="locations">
                {[...new Set(problems.map(p=>p.location).filter(Boolean))].slice(0,10).map(loc => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Priority</label>
                <select className="w-full border rounded px-3 py-2" value={priority} onChange={e=>setPriority(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Contact Phone</label>
                <input className="w-full border rounded px-3 py-2" placeholder="Optional" value={contact} onChange={e=>setContact(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Target Date</label>
                <input className="w-full border rounded px-3 py-2" type="date" value={targetDate} onChange={e=>setTargetDate(e.target.value)} />
              </div>
            </div>
            <button disabled={submitting} type="submit" className="w-full py-2 rounded text-white disabled:opacity-60" style={{ background: "#10b981" }}>{submitting ? "Submitting..." : "Submit"}</button>
            {success && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">{success}</div>}
            {error && <div className="text-sm text-red-600">Error: {error}</div>}
          </form>
        </div>

        <div className="bg-white border rounded-xl shadow-sm p-5">
          <h4 className="text-lg font-semibold mb-4">Your Submitted Problems</h4>
          <div className="mb-3 flex items-center gap-2 text-sm">
            <label>Status:</label>
            <select className="border rounded px-2 py-1" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Escalated">Escalated</option>
            </select>
          </div>
          {resolvedToast && (
            <div className="mb-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">{resolvedToast}</div>
          )}
          <div className="space-y-3">
            {problems
              .filter(p => !statusFilter || (p.status||"").toLowerCase().includes(statusFilter.toLowerCase()))
              .map(p=> (
              <div key={p.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{p.title}</div>
                  <div className="flex items-center gap-2">
                    {p.escalated_to_admin && <span className="text-xs px-2 py-0.5 rounded border bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700">Escalated</span>}
                    <span className={`text-xs px-2 py-0.5 rounded border ${String(p.status).toLowerCase().includes('pending')? 'bg-amber-50 border-amber-200 text-amber-700':'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>{p.status}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 whitespace-pre-wrap mt-1">{p.description}</div>
                <div className="flex gap-2 text-xs mt-2">
                  {!!p.location && <span className="px-2 py-0.5 rounded border bg-sky-50 border-sky-200 text-sky-700">{p.location}</span>}
                  {!!p.priority && <span className="px-2 py-0.5 rounded border bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 capitalize">{p.priority}</span>}
                </div>
                {p.officer_remarks && <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1 mt-2">Officer remarks: {p.officer_remarks}</div>}
                <div className="text-xs text-gray-500 mt-2">
                  Submitted: {new Date(p.date_submitted).toLocaleString()} {p.date_resolved && (<span> • Resolved: {new Date(p.date_resolved).toLocaleString()}</span>)}
                </div>
              </div>
            ))}
            {problems.length === 0 && (
              <div className="text-sm text-gray-500">No problems submitted yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
