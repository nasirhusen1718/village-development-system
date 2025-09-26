import React from "react";

export default function ProblemTable({
  problems,
  onAction,          // (id, status) => void
  onRemark,          // (id) => void (open modal)
  onEscalate,        // (id) => void
  onHistory,         // (id) => void
}) {
  return (
    <table style={{width:"100%", borderCollapse:"collapse"}}>
      <thead>
        <tr>
          <th style={{textAlign:"left", padding:8}}>Title</th>
          <th style={{textAlign:"left", padding:8}}>Description</th>
          <th style={{textAlign:"left", padding:8}}>Location</th>
          <th style={{textAlign:"left", padding:8}}>Priority</th>
          <th style={{textAlign:"left", padding:8}}>Farmer</th>
          <th style={{textAlign:"left", padding:8}}>Date</th>
          <th style={{textAlign:"left", padding:8}}>Status</th>
          <th style={{textAlign:"left", padding:8}}>Action</th>
        </tr>
      </thead>
      <tbody>
        {problems.map(p => (
          <tr key={p.id} style={{background:p.status?.toLowerCase().includes("pending")?"#fff7ed":"#ecfdf5"}}>
            <td style={{padding:8, fontWeight:600}}>{p.title}</td>
            <td style={{padding:8, whiteSpace:"pre-wrap"}}>{p.description}</td>
            <td style={{padding:8}}>{p.location || "-"}</td>
            <td style={{padding:8, textTransform:"capitalize"}}>{p.priority || "-"}</td>
            <td style={{padding:8}}>{p.user_id}</td>
            <td style={{padding:8}}>{new Date(p.date_submitted).toLocaleString()}</td>
            <td style={{padding:8}}>{p.status}</td>
            <td style={{padding:8, display:"flex", gap:6, flexWrap:"wrap"}}>
              {onAction && (
                <>
                  <button onClick={()=>onAction(p.id, { status: "In Progress", assign_to_self: true })}>In Progress</button>
                  <button onClick={()=>onAction(p.id, { status: "Resolved" })}>Resolved</button>
                </>
              )}
              {onRemark && (
                <button onClick={()=>onRemark(p.id)}>Remark</button>
              )}
              {onEscalate && (
                <button onClick={()=>onEscalate(p.id)}>Escalate</button>
              )}
              {onHistory && (
                <button onClick={()=>onHistory(p.id)}>History</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
