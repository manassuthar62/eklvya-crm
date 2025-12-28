import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// 👇 LIVE SERVER LINK (Yahi link hona chahiye)
const BASE_URL = "https://eklvya-crm.onrender.com/api";

function Dashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [expenses, setExpenses] = useState([]); 
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // POPUP STATE
  const [viewStudent, setViewStudent] = useState(null); 
  const [showExpenseForm, setShowExpenseForm] = useState(false); 
  const [viewExpenseHistory, setViewExpenseHistory] = useState(false); 

  // New Expense Form Data
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: 'Office' });

  const [stats, setStats] = useState({
    dayAdmissions: 0, 
    dayCollection: 0, 
    dayExpense: 0, 
    netProfit: 0, 
    dayBusiness: 0, 
    dayPending: 0
  });

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if(students.length > 0 || expenses.length > 0) {
        calculateDailyStats(students, expenses, selectedDate);
    }
  }, [selectedDate, students, expenses]);

  const loadData = async () => {
    try {
      const resStd = await axios.get(`${BASE_URL}/student/all`);
      const resExp = await axios.get(`${BASE_URL}/expense/all`);
      
      setStudents(resStd.data);
      setExpenses(resExp.data);
      
      calculateDailyStats(resStd.data, resExp.data, selectedDate);
    } catch (error) { console.log("Error loading data from Render"); }
  };

  // 👇 DELETE FUNCTION (NEW)
  const handleDeleteStudent = async (id) => {
    if(window.confirm("⚠️ WARNING: Kya aap is student ko HAMESHA ke liye delete karna chahte hain?")) {
        try {
            await axios.delete(`${BASE_URL}/student/delete/${id}`);
            alert("🗑️ Student Deleted!");
            loadData(); // List refresh
        } catch (error) {
            alert("Error deleting student");
        }
    }
  };

  const calculateDailyStats = (stdData, expData, dateToCheck) => {
    let adm = 0, coll = 0, bus = 0, pending = 0;
    let totalExpense = 0;

    // 1. Student Calculations
    stdData.forEach(std => {
        let admDate = std.admissionDate ? new Date(std.admissionDate).toISOString().split('T')[0] : "";
        if(admDate === dateToCheck) {
            adm++; bus += std.fees.finalFee; pending += (std.fees.finalFee - std.fees.paidAmount);
        }
        if(std.paymentHistory) {
            std.paymentHistory.forEach(pay => {
                if(new Date(pay.date).toISOString().split('T')[0] === dateToCheck) coll += pay.amount;
            });
        }
    });

    // 2. Expense Calculations
    if(expData) {
        expData.forEach(exp => {
            let expDate = new Date(exp.date).toISOString().split('T')[0];
            if(expDate === dateToCheck) totalExpense += exp.amount;
        });
    }

    // 3. Set Stats
    setStats({ 
        dayAdmissions: adm, 
        dayCollection: coll, 
        dayExpense: totalExpense, 
        netProfit: coll - totalExpense, 
        dayBusiness: bus, 
        dayPending: pending 
    });
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if(!newExpense.title || !newExpense.amount) return alert("Detail bharo!");
    
    try {
        await axios.post(`${BASE_URL}/expense/add`, {
            ...newExpense,
            date: selectedDate
        });
        alert("💸 Kharcha Jud Gaya!");
        setShowExpenseForm(false);
        setNewExpense({ title: '', amount: '', category: 'Office' });
        loadData(); 
    } catch (error) { alert("Error adding expense"); }
  };

  const handleApprove = async (id) => {
    if(window.confirm("Approve discount?")) {
        await axios.put(`${BASE_URL}/student/approve/${id}`);
        loadData();
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", backgroundColor: "#f4f7f6", minHeight: "100vh" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2 style={{ color: "#2c3e50" }}>👑 Admin Dashboard</h2>
        <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
             <button onClick={() => setShowExpenseForm(true)} style={{ background: "#e74c3c", color: "white", padding: "8px 15px", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
                💸 Add Expense
             </button>

             <div style={{ background: "white", padding: "5px 15px", borderRadius: "20px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
                <label style={{ fontWeight: "bold", marginRight: "10px" }}>📅 Report For:</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ border: "none", fontSize: "16px" }} />
            </div>
            <button onClick={() => navigate('/')} style={{ background: "#c0392b", color: "white", padding: "8px 15px", border: "none", borderRadius: "5px", cursor: "pointer" }}>Logout</button>
            <button onClick={() => navigate('/admin/staff-manager')} style={{ background: "#2c3e50", color: "white", padding: "8px 15px", border: "none", borderRadius: "5px", cursor: "pointer", marginRight: "10px" }}>Manage Staff 👥</button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "20px", flexWrap: "wrap" }}>
        <Card title="💰 Cash Collection" value={`₹${stats.dayCollection}`} color="#f1c40f" sub="Total money in" highlight />
        
        <div onClick={() => setViewExpenseHistory(true)} style={{cursor: "pointer", flex: 1}}>
            <Card title="💸 Total Expense (Click)" value={`₹${stats.dayExpense}`} color="#e74c3c" sub="Click to see details" />
        </div>

        <Card title="✅ Net Profit" value={`₹${stats.netProfit}`} color="#27ae60" sub="Asli Bachat" />
        <Card title="New Admissions" value={stats.dayAdmissions} color="#3498db" sub="Joined today" />
      </div>

      {/* TABLE */}
      <div style={{ background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <h3 style={{ borderBottom: "2px solid #eee", paddingBottom: "10px" }}>📄 All Student Database</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#2c3e50", color: "white" }}>
                <tr>
                    <th style={{padding: "12px"}}>Name</th>
                    <th>Joined Date</th>
                    <th>Mobile</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status / Action</th>
                </tr>
            </thead>
            <tbody>
                {students.map((std) => (
                    <tr key={std._id} style={{textAlign: "center", borderBottom: "1px solid #eee"}}>
                        <td style={{padding: "10px", textAlign: "left"}}>
                            <strong>{std.name}</strong><br/><small style={{color: "gray"}}>{std.course}</small>
                        </td>
                        <td>{std.admissionDate ? new Date(std.admissionDate).toLocaleDateString() : "-"}</td>
                        <td>{std.mobile}</td>
                        <td style={{color: "green", fontWeight: "bold"}}>₹{std.fees.paidAmount}</td>
                        <td style={{color: "red", fontWeight: "bold"}}>₹{std.fees.finalFee - std.fees.paidAmount}</td>
                        <td style={{padding: "8px"}}>
                            {/* APPROVE / VIEW BUTTON */}
                            {!std.approval.isApproved ? (
                                <button onClick={() => handleApprove(std._id)} style={{background: "green", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", marginRight: "5px"}}>Approve</button>
                            ) : (
                                <button onClick={() => setViewStudent(std)} style={{background: "#27ae60", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", marginRight: "5px"}}>View 👁️</button>
                            )}

                            {/* 👇 DELETE BUTTON (NEW) */}
                            <button onClick={() => handleDeleteStudent(std._id)} style={{background: "red", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer"}}>Delete 🗑️</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* POPUPS (Expense Form, History, Student Detail) - Same UI logic as your original code */}
      {/* ... Add Expense Popup ... */}
      {showExpenseForm && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100 }}>
            <div style={{ background: "white", padding: "20px", borderRadius: "10px", width: "300px", boxShadow: "0 5px 15px rgba(0,0,0,0.3)" }}>
                <h3 style={{marginTop: 0, color: "#e74c3c"}}>💸 Add New Expense</h3>
                <form onSubmit={handleAddExpense}>
                    <label style={{fontWeight: "bold", display:"block", marginBottom:"5px"}}>Item Name:</label>
                    <input placeholder="Ex: Chai, Bill, Rent" value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} style={{width: "100%", padding: "8px", margin: "0 0 10px", border:"1px solid #ccc"}} required />
                    
                    <label style={{fontWeight: "bold", display:"block", marginBottom:"5px"}}>Amount (₹):</label>
                    <input type="number" placeholder="0" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} style={{width: "100%", padding: "8px", margin: "0 0 10px", border:"1px solid #ccc"}} required />
                    
                    <label style={{fontWeight: "bold", display:"block", marginBottom:"5px"}}>Category:</label>
                    <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} style={{width: "100%", padding: "8px", margin: "0 0 15px", border: "1px solid #ccc", backgroundColor: "white", color: "black"}}>
                        <option value="Office">Office</option>
                        <option value="Salary">Salary</option>
                        <option value="Rent">Rent</option>
                        <option value="Refreshment">Refreshment</option>
                        <option value="Other">Other</option>
                    </select>
                    
                    <button type="submit" style={{width: "100%", padding: "10px", background: "#e74c3c", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold"}}>Save Expense</button>
                    <button type="button" onClick={() => setShowExpenseForm(false)} style={{width: "100%", padding: "10px", background: "#7f8c8d", color: "white", border: "none", borderRadius: "5px", marginTop: "10px", cursor: "pointer"}}>Cancel</button>
                </form>
            </div>
        </div>
      )}

      {/* ... Expense History Popup ... */}
      {viewExpenseHistory && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100 }}>
            <div style={{ background: "white", padding: "20px", borderRadius: "10px", width: "500px", boxShadow: "0 5px 15px rgba(0,0,0,0.3)" }}>
                <div style={{display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ccc", paddingBottom: "10px", marginBottom: "10px"}}>
                    <h3 style={{margin: 0, color: "#e74c3c"}}>📉 Expenses on {selectedDate}</h3>
                    <button onClick={() => setViewExpenseHistory(false)} style={{background: "red", color: "white", border: "none", borderRadius: "50%", width: "25px", height: "25px", cursor: "pointer"}}>X</button>
                </div>
                {expenses.filter(e => new Date(e.date).toISOString().split('T')[0] === selectedDate).length > 0 ? (
                    <table border="1" style={{width: "100%", borderCollapse: "collapse"}}>
                        <thead style={{background: "#eee"}}>
                            <tr><th style={{padding: "5px"}}>Item</th><th style={{padding: "5px"}}>Category</th><th style={{padding: "5px"}}>Date</th><th style={{padding: "5px"}}>Amount</th></tr>
                        </thead>
                        <tbody>
                            {expenses.filter(e => new Date(e.date).toISOString().split('T')[0] === selectedDate).map(exp => (
                                <tr key={exp._id}>
                                    <td style={{padding: "5px"}}>{exp.title}</td>
                                    <td style={{padding: "5px"}}>{exp.category}</td>
                                    <td style={{padding: "5px"}}>{new Date(exp.date).toLocaleDateString()}</td>
                                    <td style={{padding: "5px", fontWeight: "bold", color: "red"}}>₹{exp.amount}</td>
                                </tr>
                            ))}
                            <tr style={{background: "#ffebeb"}}><td colSpan="3" style={{padding: "5px", fontWeight: "bold", textAlign: "right"}}>Total:</td><td style={{padding: "5px", fontWeight: "bold", color: "red"}}>₹{stats.dayExpense}</td></tr>
                        </tbody>
                    </table>
                ) : ( <p style={{textAlign: "center", color: "gray"}}>Aaj koi kharcha nahi hua! 🎉</p> )}
            </div>
        </div>
      )}

      {/* ... Student Detail Popup ... */}
      {viewStudent && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "10px", width: "500px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
                <button onClick={() => setViewStudent(null)} style={{ position: "absolute", top: "10px", right: "10px", background: "red", color: "white", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer" }}>X</button>
                <h2 style={{ borderBottom: "2px solid #3498db", paddingBottom: "10px", color: "#2c3e50" }}>👤 Student Profile</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                    <div><strong>Name:</strong> {viewStudent.name}</div>
                    <div><strong>Father:</strong> {viewStudent.fatherName}</div>
                    <div><strong>Course:</strong> {viewStudent.course}</div>
                    <div><strong>Mobile:</strong> {viewStudent.mobile}</div>
                    <div><strong>Address:</strong> {viewStudent.address}</div>
                    <div><strong>DOB:</strong> {viewStudent.dob}</div>
                    <div style={{color: "purple"}}><strong>Admission By:</strong> {viewStudent.addedBy || "Staff Panel"}</div>
                    <div style={{color: "blue"}}><strong>Joined:</strong> {new Date(viewStudent.admissionDate).toLocaleDateString()}</div>
                </div>
                <div style={{ backgroundColor: "#f9f9f9", padding: "10px", borderRadius: "5px", marginBottom: "20px" }}>
                    <h3 style={{marginTop: 0}}>💰 Fees Summary</h3>
                    <p>Total Fee: ₹{viewStudent.fees.totalFee} | Discount: ₹{viewStudent.fees.discount}</p>
                    <p><strong>Final Deal: ₹{viewStudent.fees.finalFee}</strong></p>
                    <p style={{color: "green"}}>Paid: ₹{viewStudent.fees.paidAmount}</p>
                    <p style={{color: "red"}}>Balance: ₹{viewStudent.fees.finalFee - viewStudent.fees.paidAmount}</p>
                </div>
                <h3 style={{marginTop: 0}}>📜 Payment History</h3>
                {viewStudent.paymentHistory.length > 0 ? (
                    <table border="1" style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                        <thead style={{backgroundColor: "#eee"}}><tr><th style={{padding: "5px"}}>Date</th><th style={{padding: "5px"}}>Amount</th><th style={{padding: "5px"}}>Remark</th></tr></thead>
                        <tbody>
                            {viewStudent.paymentHistory.map((pay, index) => (
                                <tr key={index}>
                                    <td style={{padding: "5px"}}>{new Date(pay.date).toLocaleDateString()}</td>
                                    <td style={{padding: "5px", fontWeight: "bold"}}>₹{pay.amount}</td>
                                    <td style={{padding: "5px"}}>{pay.remark || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : ( <p style={{color: "gray"}}>No payments recorded yet.</p> )}
            </div>
        </div>
      )}

    </div>
  );
}

function Card({ title, value, color, sub, highlight }) {
    return (
        <div style={{ padding: "20px", background: highlight ? "#f1c40f" : "white", borderRadius: "10px", flex: 1, boxShadow: "0 4px 8px rgba(0,0,0,0.1)", textAlign: "center", borderTop: `5px solid ${color}`, border: highlight ? "2px solid orange" : "none", minWidth: "200px" }}>
            <h4 style={{ margin: "0 0 10px 0", color: highlight ? "black" : "#7f8c8d" }}>{title}</h4>
            <h1 style={{ margin: 0, color: highlight ? "black" : color }}>{value}</h1>
            <small style={{color: highlight ? "black" : "gray"}}>{sub}</small>
        </div>
    );
}

export default Dashboard;