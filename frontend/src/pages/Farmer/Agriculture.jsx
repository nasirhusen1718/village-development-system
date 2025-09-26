import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { createProblem, myProblems } from "../../api/farmer";
import ImagePicker from "../../components/ImagePicker";
import api from "../../api/http";

export default function Agriculture(){
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
  // AI prediction state
  const [aiCrop, setAiCrop] = useState("");
  const [aiState, setAiState] = useState("");
  const [aiSeason, setAiSeason] = useState("Kharif");
  const [aiArea, setAiArea] = useState("");
  const [aiRain, setAiRain] = useState("");
  const [aiFert, setAiFert] = useState("");
  const [aiPest, setAiPest] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [aiSchedule, setAiSchedule] = useState(null);
  // AI recommend state
  const [recState, setRecState] = useState("");
  const [recSeason, setRecSeason] = useState("Kharif");
  const [recArea, setRecArea] = useState("");
  const [recRain, setRecRain] = useState("");
  const [recFert, setRecFert] = useState("");
  const [recPest, setRecPest] = useState("");
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState("");
  const [recTop, setRecTop] = useState([]);

  useEffect(()=>{ load(); },[]);

  // auto-refresh every 15s
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

  const recommendCrops = async () => {
    try{
      setRecLoading(true); setRecError(""); setRecTop([]);
      const body = {
        state: recState || "Assam",
        season: recSeason || "Kharif",
        area: Number(recArea || 0),
        annual_rainfall: Number(recRain || 0),
        fertilizer: Number(recFert || 0),
        pesticide: Number(recPest || 0),
      };
      const r = await api.post("/ai/agri/recommend_crops", body, { params: { top_n: 2 }, timeout: 60000 });
      setRecTop(r.data?.top || []);
    }catch(err){ setRecError(err?.message || "Recommendation failed"); }
    finally { setRecLoading(false); }
  };

  const predictYield = async () => {
    try{
      setAiLoading(true); setAiError(""); setAiResult(null);
      const body = {
        crop: aiCrop || "Rice",
        state: aiState || "Assam",
        season: aiSeason || "Kharif",
        area: Number(aiArea || 0),
        annual_rainfall: Number(aiRain || 0),
        fertilizer: Number(aiFert || 0),
        pesticide: Number(aiPest || 0),
      };
      const r = await api.post("/ai/agri/predict_yield", body);
      setAiResult(r.data);
      // also fetch schedule
      const qs = new URLSearchParams({ crop: body.crop, state: body.state, season: body.season }).toString();
      const s = await api.get(`/ai/agri/schedule?${qs}`);
      setAiSchedule(s.data);
    }catch(err){ setAiError(err?.message || "Prediction failed"); }
    finally { setAiLoading(false); }
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
      await createProblem({ sector:"agriculture", title, description:extended, location, priority });
      setTitle(""); setDesc("");
      setLocation(""); setPriority("medium"); setContact(""); setTargetDate("");
      setSuccess("Problem submitted successfully."); setTimeout(()=>setSuccess(""), 2500);
      load();
    }catch(err){ console.error(err); setError(err?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Agriculture - Farmer" />
      <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl shadow-sm p-5">
          <h3 className="text-lg font-semibold mb-4">Report Agriculture Problem</h3>
          <div className="text-xs text-gray-600 mb-3 flex gap-2 items-center">
            <span className="px-2 py-0.5 rounded border bg-amber-50 border-amber-200 text-amber-700">Pending</span>
            <span className="px-2 py-0.5 rounded border bg-blue-50 border-blue-200 text-blue-700">In Progress</span>
            <span className="px-2 py-0.5 rounded border bg-emerald-50 border-emerald-200 text-emerald-700">Resolved</span>
            <span className="px-2 py-0.5 rounded border bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700">Escalated</span>
          </div>

        <div className="bg-white border rounded-xl shadow-sm p-5">
          <h4 className="text-lg font-semibold mb-3">Recommend Crops (AI)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">State</label>
              <input className="w-full border rounded px-3 py-2" placeholder="e.g., Assam" value={recState} onChange={e=>setRecState(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Season</label>
              <select className="w-full border rounded px-3 py-2" value={recSeason} onChange={e=>setRecSeason(e.target.value)}>
                <option>Kharif</option>
                <option>Rabi</option>
                <option>Summer</option>
                <option>Winter</option>
                <option>Whole Year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Area</label>
              <input className="w-full border rounded px-3 py-2" type="number" min="0" placeholder="e.g., 1000" value={recArea} onChange={e=>setRecArea(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Annual Rainfall (mm)</label>
              <input className="w-full border rounded px-3 py-2" type="number" min="0" placeholder="optional" value={recRain} onChange={e=>setRecRain(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Fertilizer (units)</label>
              <input className="w-full border rounded px-3 py-2" type="number" min="0" placeholder="optional" value={recFert} onChange={e=>setRecFert(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Pesticide (units)</label>
              <input className="w-full border rounded px-3 py-2" type="number" min="0" placeholder="optional" value={recPest} onChange={e=>setRecPest(e.target.value)} />
            </div>
          </div>
          <button onClick={recommendCrops} disabled={recLoading} className="mt-3 px-4 py-2 rounded text-white disabled:opacity-60" style={{ background: "#6366f1" }}>{recLoading? "Recommending...":"Recommend Crops"}</button>
          {recError && <div className="text-sm text-red-600 mt-2">{recError}</div>}
          {recTop.length > 0 && (
            <div className="mt-3 text-sm">
              <div className="font-semibold">Top 2 Crops</div>
              <ul className="list-disc pl-5 mt-1">
                {recTop.map((c)=> (
                  <li key={c.crop}>
                    <span className="font-medium">{c.crop}</span> — Predicted Yield: {Number(c.predicted_yield).toFixed(3)} (Conf: {Math.round((c.confidence||0)*100)}%)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Title</label>
              <input className={`w-full border rounded px-3 py-2 ${formErrors.title? 'border-red-400':''}`} placeholder="e.g., Pest Infestation" value={title} onChange={e=>setTitle(e.target.value)} />
              {formErrors.title && <div className="text-xs text-red-600 mt-1">{formErrors.title}</div>}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Description</label>
              <textarea className={`w-full border rounded px-3 py-2 min-h-[100px] ${formErrors.desc? 'border-red-400':''}`} placeholder="Describe the issue clearly" value={desc} onChange={e=>setDesc(e.target.value)} />
              {formErrors.desc && <div className="text-xs text-red-600 mt-1">{formErrors.desc}</div>}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Attachments</label>
              <ImagePicker files={images} setFiles={setImages} max={3} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Location</label>
              <input className="w-full border rounded px-3 py-2" placeholder="Village/Area" value={location} onChange={e=>setLocation(e.target.value)} />
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
          <h4 className="text-lg font-semibold mb-3">Yield Prediction (AI)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Crop</label>
              <input className="w-full border rounded px-3 py-2" placeholder="e.g., Rice" value={aiCrop} onChange={e=>setAiCrop(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">State</label>
              <input className="w-full border rounded px-3 py-2" placeholder="e.g., Assam" value={aiState} onChange={e=>setAiState(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Season</label>
              <select className="w-full border rounded px-3 py-2" value={aiSeason} onChange={e=>setAiSeason(e.target.value)}>
                <option>Kharif</option>
                <option>Rabi</option>
                <option>Summer</option>
                <option>Winter</option>
                <option>Whole Year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Area</label>
              <input className="w-full border rounded px-3 py-2" type="number" min="0" placeholder="e.g., 1000" value={aiArea} onChange={e=>setAiArea(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Annual Rainfall (mm)</label>
              <input className="w-full border rounded px-3 py-2" type="number" min="0" placeholder="optional" value={aiRain} onChange={e=>setAiRain(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Fertilizer (units)</label>
              <input className="w-full border rounded px-3 py-2" type="number" min="0" placeholder="optional" value={aiFert} onChange={e=>setAiFert(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Pesticide (units)</label>
              <input className="w-full border rounded px-3 py-2" type="number" min="0" placeholder="optional" value={aiPest} onChange={e=>setAiPest(e.target.value)} />
            </div>
          </div>
          <button onClick={predictYield} disabled={aiLoading} className="mt-3 px-4 py-2 rounded text-white disabled:opacity-60" style={{ background: "#0ea5e9" }}>{aiLoading? "Predicting...":"Predict Yield"}</button>
          {aiError && <div className="text-sm text-red-600 mt-2">{aiError}</div>}
          {aiResult && (
            <div className="mt-3 text-sm">
              <div className="font-semibold">Prediction</div>
              <div>Predicted Yield: <span className="font-medium">{Number(aiResult.predicted_yield).toFixed(3)}</span></div>
              <div>Confidence: <span className="font-medium">{Math.round((aiResult.confidence||0)*100)}%</span> ({aiResult.model})</div>
            </div>
          )}
          {aiSchedule && (
            <div className="mt-3 text-sm">
              <div className="font-semibold">Suggested Schedule</div>
              <div>Planting: <span className="font-medium">{aiSchedule.planting_window}</span></div>
              <div>Harvest: <span className="font-medium">{aiSchedule.harvest_window}</span></div>
              <div className="text-gray-500 mt-1">{aiSchedule.rationale}</div>
            </div>
          )}
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
                  <span className={`text-xs px-2 py-0.5 rounded border ${String(p.status).toLowerCase().includes('pending')? 'bg-amber-50 border-amber-200 text-amber-700':'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>{p.status}</span>
                </div>
                <div className="text-sm text-gray-600 whitespace-pre-wrap mt-1">{p.description}</div>
                <div className="flex gap-2 text-xs mt-2">
                  {!!p.location && <span className="px-2 py-0.5 rounded border bg-sky-50 border-sky-200 text-sky-700">{p.location}</span>}
                  {!!p.priority && <span className="px-2 py-0.5 rounded border bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 capitalize">{p.priority}</span>}
                </div>
                <div className="text-xs text-gray-500 mt-2">{new Date(p.date_submitted).toLocaleString()}</div>
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
