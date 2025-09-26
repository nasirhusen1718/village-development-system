import React from "react";
export default function Navbar({ title }){
  return (
    <div style={{background:"#f3f4f6", padding:"12px 20px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
      <div style={{fontWeight:700}}>{title || "Village Development System"}</div>
      <div>
        <button onClick={()=>{ localStorage.removeItem("token"); localStorage.removeItem("role"); window.location.href="/" }} style={{padding:"6px 10px"}}>Logout</button>
      </div>
    </div>
  );
}
