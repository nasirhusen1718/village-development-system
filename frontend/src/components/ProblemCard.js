import React from "react";

export default function ProblemCard({p}){
  return (
    <div style={{border:"1px solid #e5e7eb", padding:12, borderRadius:8, marginBottom:8}}>
      <div style={{fontWeight:600}}>{p.title}</div>
      <div style={{fontSize:13, color:"#374151"}}>{p.description}</div>
      <div style={{marginTop:8}}>
        <span style={{padding:"4px 8px", borderRadius:6, background:p.status==="Pending"?"#fee2e2":"#ecfccb"}}>{p.status}</span>
        <small style={{marginLeft:8, color:"#6b7280"}}>{new Date(p.date_submitted).toLocaleString()}</small>
      </div>
    </div>
  );
}
