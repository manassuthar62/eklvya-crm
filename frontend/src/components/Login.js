import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    // 1. ADMIN CHECK
    if (username === 'shailesh' && password === 'admin123') {
      alert('Welcome Boss!');
      navigate('/admin');
      return;
    } 

    // 2. STAFF CHECK
    try {
        // ✅ URL THEEK KAR DIYA HAI (Correct Link)
        const res = await axios.post('https://eklvya-crm.onrender.com/api/staff/login', { username, password });
        
        if (res.data.success) {
            alert(`👨‍💼 Welcome ${res.data.name}!`);
            
            // 👇 YEH LINE JARURI HAI (Staff ki ID save kar rahe hain)
            localStorage.setItem('staffUser', username); 
            
            navigate('/staff');
        } else {
            alert('❌ Galat ID ya Password!');
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert('❌ Login Failed. Check Internet or details.');
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "10px", textAlign: "center", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
      <h2>🔐 एकलव्य एजुकेशन लोगिन</h2>
      <input type="text" placeholder="User ID" value={username} onChange={(e) => setUsername(e.target.value)} style={{ padding: "10px", width: "90%", marginBottom: "10px" }} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: "10px", width: "90%", marginBottom: "10px" }} />
      <button onClick={handleLogin} style={{ padding: "10px 20px", backgroundColor: "#2c3e50", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", width: "100%" }}>Login</button>
    </div>
  );
}

export default Login;