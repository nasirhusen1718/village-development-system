import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { listUsers, deleteUser } from "../../api/admin";

export default function UserManagement(){
  const [users,setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(()=>{
    refresh();
  },[]);

  const refresh = async () => {
    try{
      setLoading(true); setError("");
      const r = await listUsers();
      setUsers(r.data || []);
    }catch(e){ console.error(e); setError(e?.message || "Failed to load users"); }
    finally{ setLoading(false); }
  };

  const onDelete = async (u) => {
    if (u.role === "admin") return;
    const ok = window.confirm(`Delete user ${u.name} (${u.email})? This will also remove their problems.`);
    if (!ok) return;
    try{
      await deleteUser(u.id);
      setSuccess("User deleted."); setTimeout(()=>setSuccess(""), 2000);
      refresh();
    }catch(e){ console.error(e); setError(e?.message || "Delete failed"); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="User Management" />
      <div className="max-w-5xl mx-auto p-6">
        {error && <div className="mb-3 text-red-600">{error}</div>}
        {success && <div className="mb-3 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">{success}</div>}
        <div className="overflow-x-auto bg-white border rounded-xl shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u=> (
                <tr key={u.id} className="border-b">
                  <td className="p-3">{u.id}</td>
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3 capitalize">{u.role}</td>
                  <td className="p-3">
                    {u.role !== "admin" ? (
                      <button className="px-3 py-1 rounded text-white" style={{background:'#ef4444'}} onClick={()=>onDelete(u)}>Delete</button>
                    ) : (
                      <span className="text-xs text-gray-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div className="p-3 text-gray-500">Loading...</div>}
        </div>
      </div>
    </div>
  );
}
