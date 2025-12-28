import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// 👇 AAPKA LIVE BACKEND URL
const API_BASE_URL = "https://eklvya-crm.onrender.com/api/student";

function FeeCollection() {
  const [mobile, setMobile] = useState('');
  const [student, setStudent] = useState(null); 
  const navigate = useNavigate();

  // 1. Mobile Number se Student dhundna
  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      // ✅ LOCALHOST BADAL DIYA
      const response = await axios.get(`${API_BASE_URL}/all`);
      const foundStudent = response.data.find(s => s.mobile === mobile);
      
      if (foundStudent) {
        setStudent(foundStudent);
      } else {
        alert("❌ Is mobile number se koi student nahi mila.");
        setStudent(null);
      }
    } catch (error) {
      alert("Error searching student on live server");
    }
  };

  // 2. Fees Jama Karna
  const handlePay = async (emiIndex) => {
    if(window.confirm("Kya aap payment collect kar rahe hain?")) {
        try {
            // ✅ LOCALHOST BADAL DIYA
            await axios.put(`${API_BASE_URL}/pay-emi/${student._id}`, { emiIndex });
            alert("✅ Payment Successful! Receipt Generated.");
            
            const updatedStudent = { ...student };
            updatedStudent.emis[emiIndex].status = "Paid";
            setStudent(updatedStudent);

        } catch (error) {
            alert("❌ Payment Update Failed");
        }
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto", padding: "20px", border: "1px solid #333", borderRadius: "10px" }}>
      <button onClick={() => navigate('/staff')} style={{marginBottom: "10px"}}>⬅ Back to Admission</button>
      
      <h2>💰 Fee Collection Window</h2>

      {/* Search Box */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input 
            type="number" 
            placeholder="Enter Student Mobile Number" 
            value={mobile} 
            onChange={(e) => setMobile(e.target.value)} 
            required 
            style={{ padding: "10px", flex: 1 }}
        />
        <button type="submit" style={{ padding: "10px 20px", backgroundColor: "#2c3e50", color: "white", border: "none" }}>Search 🔍</button>
      </form>

      {/* Result Section */}
      {student && (
        <div>
            <h3>👤 {student.name} (Course: {student.course})</h3>
            <p>Father: {student.fatherName}</p>
            <p>Total Fee: ₹{student.fees.totalFee}</p>
            <hr/>
            
            <h4>Installments Status:</h4>
            {student.emis.length === 0 ? <p>No Installments (Full Paid)</p> : (
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {student.emis.map((emi, index) => (
                        <li key={index} style={{ padding: "10px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>
                                <strong>Kist {index + 1}:</strong> ₹{emi.amount} <br/>
                                <small>Due Date: {emi.dueDate}</small>
                            </span>
                            
                            {emi.status === "Paid" ? (
                                <span style={{ color: "green", fontWeight: "bold" }}>✅ PAID</span>
                            ) : (
                                <button 
                                    onClick={() => handlePay(index)}
                                    style={{ padding: "5px 15px", backgroundColor: "orange", border: "none", cursor: "pointer", fontWeight: "bold" }}
                                >
                                    Collect ₹{emi.amount}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
      )}
    </div>
  );
}

export default FeeCollection;