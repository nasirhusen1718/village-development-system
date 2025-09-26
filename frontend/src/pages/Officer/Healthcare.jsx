import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { sectorProblems, updateStatus } from "../../api/officer";
import ProblemTable from "../../components/ProblemTable";

export default function Healthcare(){
  const [problems,setProblems] = useState([]);

  const load = async () => {
    try{
      const r = await sectorProblems("healthcare");
      setProblems(r.data);
    }catch(err){ console.error(err); }
  };

  useEffect(()=>{ load(); },[]);

  const onAction = async (id, status) => {
    try{
      await updateStatus(id, status);
      load();
    }catch(err){ console.error(err); alert("Failed"); }
  };

  return (
    <div>
      <Navbar title="Healthcare - Officer" />
      <div style={{padding:20}}>
        <h3>Healthcare Problems</h3>
        <ProblemTable problems={problems} onAction={onAction} />
      </div>
    </div>
  );
}
