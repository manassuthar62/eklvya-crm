import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import AdmissionForm from './components/AdmissionForm';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import FeeCollection from './components/FeeCollection';
import StaffManager from './components/StaffManager'; 

function App() {
  return (
    <BrowserRouter>
      {/* Navbar */}
      <nav style={{ padding: "10px 20px", backgroundColor: "#2c3e50", color: "white", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        
        {/* 👇 LOGO AUR NAAM WALA SECTION */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            {/* Yahan Photo Dikhegi */}
            <img 
                src="/logo.png"  // 👈 Apni photo ka naam yahan likhein
                alt="Logo" 
                style={{ 
                    height: "100px", 
                    width: "100px", 
                    borderRadius: "50%", // Gol (Round) dikhega
                    objectFit: "cover", 
                    border: "2px solid white" 
                }} 
            />
            
            {/* Coaching ka Naam */}
            <span style={{ fontSize: "20px", fontWeight: "bold" }}>एकलव्य एजुकेशन अरथुना</span>
        </div>

        <Link to="/" style={{ color: "white", textDecoration: "none", background: "#c0392b", padding: "8px 15px", borderRadius: "5px", fontSize: "14px" }}>Logout 🔒</Link>
      </nav>

      <Routes>
        {/* 1. LOGIN PAGE */}
        <Route path="/" element={<Login />} />
        
        {/* 2. STAFF ROUTES */}
        <Route path="/staff" element={<AdmissionForm />} />
        <Route path="/staff/fees" element={<FeeCollection />} />

        {/* 3. ADMIN ROUTES */}
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/staff-manager" element={<StaffManager />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;