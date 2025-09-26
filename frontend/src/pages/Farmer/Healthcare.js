import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { createProblem, myProblems } from "../../api/farmer";

export default function Healthcare(){
  const [title,setTitle] = useState("");
  const [desc,setDesc] = useState("");
  const [problems,setProblems] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(()=>{
    if(token) load();
  },[]);

  const load = async () => {
    try{
      const r = await myProblems(token);
      setProblems(r.data);
    }catch(err){ console.error(err); }
  };

  const submit = async (e) => {
    e.preventDefault();
    try{
      await createProblem(token, { sector:"healthcare", title, description:desc });
      setTitle(""); setDesc("");
      load();
    }catch(err){ console.error(err); alert("Failed"); }
  };

  return (
    <div>
      <Navbar title="Healthcare - Farmer" />
      <div style={{padding:20}}>
        <h3>Report Healthcare Problem</h3>
        <form onSubmit={submit} style={{maxWidth:700}}>
          <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} style={{width:"100%",padding:8,marginBottom:8}}/>
          <textarea placeholder="Description" value={desc} onChange={e=>setDesc(e.target.value)} style={{width:"100%",padding:8,marginBottom:8}}/>
          <button type="submit" style={{padding:8, background:"#10b981", color:"white", border:"none", borderRadius:6}}>Submit</button>
        </form>

        <h4 style={{marginTop:20}}>Your Submitted Problems</h4>
        <div style={{marginTop:8}}>
          {problems.map(p=>(
            <div key={p.id} style={{border:"1px solid #e5e7eb", padding:10, borderRadius:6, marginBottom:8}}>
              <div style={{fontWeight:700}}>{p.title}</div>
              <div>{p.description}</div>
              <div style={{marginTop:6}}>
                <small>{p.status} — {new Date(p.date_submitted).toLocaleString()}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
