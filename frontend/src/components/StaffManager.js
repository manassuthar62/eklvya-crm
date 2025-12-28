import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// 👇 AAPKA LIVE BACKEND URL
const API_BASE_URL = "https://eklvya-crm.onrender.com/api/staff";

function StaffManager() {
  const navigate = useNavigate();
  const [staffs, setStaffs] = useState([]);
  const [newStaff, setNewStaff] = useState({ name: '', username: '', password: '' });

  useEffect(() => { loadStaffs(); }, []);

  const loadStaffs = async () => {
    try {
      // ✅ LOCALHOST BADAL DIYA
      const res = await axios.get(`${API_BASE_URL}/all`);
      setStaffs(res.data);
    } catch (error) {
      console.log("Error loading staff data");
    }
  };

  const handleAdd = async () => {
    if(!newStaff.name || !newStaff.username || !newStaff.password) return alert("Sab bharna jaruri hai");
    try {
      // ✅ LOCALHOST BADAL DIYA
      await axios.post(`${API_BASE_URL}/add`, newStaff);
      alert("✅ Staff Added!");
      setNewStaff({ name: '', username: '', password: '' });
      loadStaffs();
    } catch (error) {
      alert("Error adding staff account");
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Is Staff ko delete kar dein?")) {
        try {
          // ✅ LOCALHOST BADAL DIYA
          await axios.delete(`${API_BASE_URL}/delete/${id}`);
          loadStaffs();
        } catch (error) {
          alert("Error deleting staff account");
        }
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto", padding: "20px", fontFamily: "Arial" }}>
      <button onClick={() => navigate('/admin')} style={{marginBottom: "20px"}}>⬅ Back to Dashboard</button>
      
      <h2>🛠️ Manage Staff Accounts</h2>

      {/* ADD FORM */}
      <div style={{ background: "#eee", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>
        <h4>Add New Staff</h4>
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input placeholder="Staff Name (Ex: Rahul)" value={newStaff.name} onChange={(e)=>setNewStaff({...newStaff, name: e.target.value})} style={{flex: 1, padding: "8px"}} />
            <input placeholder="Login ID" value={newStaff.username} onChange={(e)=>setNewStaff({...newStaff, username: e.target.value})} style={{flex: 1, padding: "8px"}} />
            <input placeholder="Password" value={newStaff.password} onChange={(e)=>setNewStaff({...newStaff, password: e.target.value})} style={{flex: 1, padding: "8px"}} />
        </div>
        <button onClick={handleAdd} style={{ width: "100%", padding: "10px", background: "#2c3e50", color: "white", border: "none", cursor: "pointer" }}>Create Account</button>
      </div>

      {/* LIST */}
      <table border="1" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ background: "#3498db", color: "white" }}>
            <tr><th>Name</th><th>Login ID</th><th>Password</th><th>Action</th></tr>
        </thead>
        <tbody>
            {staffs.map(s => (
                <tr key={s._id}>
                    <td style={{padding: "8px"}}>{s.name}</td>
                    <td style={{padding: "8px"}}>{s.username}</td>
                    <td style={{padding: "8px"}}>{s.password}</td>
                    <td style={{padding: "8px"}}>
                        <button onClick={() => handleDelete(s._id)} style={{background: "red", color: "white", border: "none", cursor: "pointer", padding: "5px 10px"}}>Delete 🗑️</button>
                    </td>
                </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default StaffManager;