import React from "react";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";

export default function OfficerDashboard(){
  const nav = useNavigate();
  const sectors = [
    {key:"healthcare", label:"Healthcare"},
    {key:"agriculture", label:"Agriculture"},
    {key:"village", label:"Village/Infrastructure"},
    {key:"education", label:"Education"},
    {key:"water", label:"Water & Sanitation"},
  ];

  return (
    <div>
      <Navbar title="Officer Dashboard" />
      <div style={{padding:20}}>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:12}}>
          {sectors.map(s => (
            <div key={s.key} style={{padding:12, border:"1px solid #e5e7eb", borderRadius:8}}>
              <div style={{fontWeight:700}}>{s.label}</div>
              <div style={{marginTop:8}}>
                <button onClick={()=>nav(`/officer/${s.key}`)}>View Problems</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
