import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// 👇 AAPKA LIVE LINK
const API_URL = "https://eklvya-crm.onrender.com/api/student";

function AdmissionForm() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null); 
  
  const loggedInStaff = localStorage.getItem('staffUser'); 

  const [payAmount, setPayAmount] = useState('');
  const [payRemark, setPayRemark] = useState('');

  const [student, setStudent] = useState({
    name: '', fatherName: '', dob: '', mobile: '', address: '', course: 'RSCIT', totalFee: 4200, discount: 0
  });

  useEffect(() => { 
      if(!loggedInStaff) {
          navigate('/');
      } else {
          loadMyStudents(); 
      }
  }, []);

  const loadMyStudents = async () => {
    try {
      // ✅ LOCALHOST BADAL DIYA
      const res = await axios.get(`${API_URL}/my-students/${loggedInStaff}`);
      setStudents(res.data);
    } catch (error) { console.log("Error loading students"); }
  };

  const handleChange = (e) => setStudent({ ...student, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = { ...student, addedBy: loggedInStaff };
      
      // ✅ LOCALHOST BADAL DIYA
      await axios.post(`${API_URL}/add`, dataToSend);
      alert('✅ Student Saved!');
      loadMyStudents(); 
      setStudent({ ...student, name: '', mobile: '' }); 
    } catch (error) { alert('❌ Error saving student'); }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if(!payAmount) return alert("Amount to likho!");
    try {
        // ✅ LOCALHOST BADAL DIYA
        await axios.put(`${API_URL}/pay-amount/${selectedStudent}`, {
            amount: payAmount,
            remark: payRemark
        });
        alert(`✅ ₹${payAmount} Jama ho gaye!`);
        loadMyStudents();
        setSelectedStudent(null);
        setPayAmount(''); setPayRemark('');
    } catch (error) { alert("Payment Fail"); }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "auto", padding: "10px", fontFamily: "Arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2>👨‍💼 Staff Panel: <span style={{color: "orange"}}>{loggedInStaff}</span></h2>
        <button onClick={() => { localStorage.removeItem('staffUser'); navigate('/'); }} style={{ background: "red", color: "white", border: "none", padding: "5px 10px" }}>Logout</button>
      </div>

      {/* --- FORM --- */}
      <div style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "10px", marginBottom: "20px", background: "#f9f9f9" }}>
        <h3>New Admission</h3>
        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <input name="name" placeholder="Name" value={student.name} onChange={handleChange} required style={{padding: "8px"}} />
            <input name="fatherName" placeholder="Father Name" onChange={handleChange} required style={{padding: "8px"}} />
            <input name="mobile" type="number" placeholder="Mobile" value={student.mobile} onChange={handleChange} required style={{padding: "8px"}} />
            <input name="address" placeholder="Address" onChange={handleChange} required style={{padding: "8px"}} />
            <input name="dob" type="date" onChange={handleChange} required style={{padding: "8px"}} />
            <div style={{display: "flex", gap: "5px"}}>
                <select name="course" onChange={handleChange} style={{padding: "8px"}}><option>RSCIT</option><option>Tally</option></select>
                <input name="totalFee" placeholder="Fee" onChange={handleChange} style={{padding: "8px", width: "100px"}} />
            </div>
            <input name="discount" placeholder="Discount" onChange={handleChange} style={{padding: "8px", borderColor: "red"}} />
            <button type="submit" style={{ gridColumn: "span 2", padding: "10px", background: "green", color: "white", border: "none" }}>Save Admission</button>
        </form>
      </div>

      {/* --- LIST --- */}
      <h3>My Students List ({students.length})</h3>
      <table border="1" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ background: "#2c3e50", color: "white" }}>
            <tr><th>Name</th><th>Mobile</th><th>Fee Info</th><th>Action</th></tr>
        </thead>
        <tbody>
            {students.map((s) => {
                const pending = s.fees.finalFee - s.fees.paidAmount;
                return (
                    <tr key={s._id}>
                        <td style={{padding: "8px"}}>{s.name}</td>
                        <td style={{padding: "8px"}}>{s.mobile}</td>
                        <td style={{padding: "8px"}}>
                            Total: {s.fees.finalFee} <br/>
                            <span style={{color: "green"}}>Paid: {s.fees.paidAmount}</span> <br/>
                            <span style={{color: "red", fontWeight: "bold"}}>Bal: {pending}</span>
                        </td>
                        <td style={{padding: "8px"}}>
                            {pending > 0 ? (
                                <button onClick={() => setSelectedStudent(s._id)} style={{background: "orange", border: "none", padding: "5px 10px", cursor: "pointer"}}>Collect Fee</button>
                            ) : (
                                <span style={{color: "green", fontWeight: "bold"}}>✅ FULL PAID</span>
                            )}
                        </td>
                    </tr>
                )
            })}
        </tbody>
      </table>

      {/* Payment Popup */}
      {selectedStudent && (
        <div style={{ position: "fixed", top: "0", left: "0", width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ background: "white", padding: "20px", borderRadius: "10px", width: "300px" }}>
                <h3>💰 Collect Money</h3>
                <form onSubmit={handlePaymentSubmit}>
                    <label>Amount (₹):</label>
                    <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} autoFocus required style={{width: "100%", padding: "10px", margin: "10px 0"}} />
                    <label>Remark:</label>
                    <input type="text" placeholder="Remark" value={payRemark} onChange={(e) => setPayRemark(e.target.value)} style={{width: "100%", padding: "10px", marginBottom: "10px"}} />
                    <button type="submit" style={{width: "100%", padding: "10px", background: "green", color: "white", border: "none", cursor: "pointer"}}>Submit</button>
                    <button type="button" onClick={() => setSelectedStudent(null)} style={{width: "100%", padding: "10px", background: "red", color: "white", border: "none", marginTop: "10px", cursor: "pointer"}}>Cancel</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}

export default AdmissionForm;