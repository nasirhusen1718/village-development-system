import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { listUsers } from "../../api/admin";

export default function UserManagement(){
  const token = localStorage.getItem("token");
  const [users,setUsers] = useState([]);

  useEffect(()=>{
    if(token){
      listUsers(token).then(r=>setUsers(r.data)).catch(e=>console.error(e));
    }
  },[]);

  return (
    <div>
      <Navbar title="User Management" />
      <div style={{padding:20}}>
        <table style={{width:"100%"}}>
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>
            {users.map(u=>(
              <tr key={u.id}><td>{u.id}</td><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
