import React from "react";

export default function ImagePicker({ files, setFiles, max=3 }){
  const onSelect = (e) => {
    const list = Array.from(e.target.files || []);
    const allowed = ["image/png","image/jpeg","image/webp"]; 
    const valid = list.filter(f => allowed.includes(f.type) && f.size <= 2*1024*1024);
    const next = [...files, ...valid].slice(0, max);
    setFiles(next);
    e.target.value = ""; // reset
  };
  const removeAt = (i) => setFiles(files.filter((_,idx)=>idx!==i));

  return (
    <div>
      <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
        <label style={{border:'1px dashed #cbd5e1', padding:'10px 12px', borderRadius:8, background:'#f8fafc', cursor:'pointer'}}>
          <input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={onSelect} />
          <span style={{fontSize:12, color:'#334155'}}>Add images (max {max}, 2MB)</span>
        </label>
        {files.map((f, i) => (
          <div key={i} style={{position:'relative'}}>
            <img src={URL.createObjectURL(f)} alt={f.name} style={{width:64, height:64, objectFit:'cover', borderRadius:6, border:'1px solid #e5e7eb'}} />
            <button type="button" onClick={()=>removeAt(i)} title="Remove" style={{position:'absolute', top:-6, right:-6, background:'#ef4444', color:'white', border:'none', width:20, height:20, borderRadius:9999, fontSize:12, lineHeight:'20px'}}>×</button>
          </div>
        ))}
      </div>
      {files.some(f => f.size > 2*1024*1024) && (
        <div style={{color:'#b91c1c', fontSize:12, marginTop:6}}>Some files exceed 2MB and were ignored.</div>
      )}
    </div>
  );
}
