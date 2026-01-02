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
    totalPending: 0 
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

  // 👇 DELETE STUDENT FUNCTION
  const handleDeleteStudent = async (id) => {
    if(window.confirm("⚠️ WARNING: Kya aap is student ko HAMESHA ke liye delete karna chahte hain?")) {
        try {
            await axios.delete(`${BASE_URL}/student/delete/${id}`);
            alert("🗑️ Student Deleted!");
            setViewStudent(null); // Agar popup khula hai to band kar do
            loadData(); 
        } catch (error) {
            alert("Error deleting student");
        }
    }
  };

  // 👇 DELETE EXPENSE FUNCTION
  const handleDeleteExpense = async (id) => {
    if(window.confirm("⚠️ Kya aap is kharche ko delete karna chahte hain?")) {
        try {
            await axios.delete(`${BASE_URL}/expense/delete/${id}`);
            alert("🗑️ Expense Deleted!");
            loadData(); 
        } catch (error) { alert("Error deleting expense"); }
    }
  };

  // 👇 NEW: TOGGLE ONLINE FORM STATUS
  const toggleOnlineStatus = async (student) => {
    try {
        const res = await axios.put(`${BASE_URL}/student/toggle-online/${student._id}`);
        if(res.data.success) {
            // Local update taaki turant dikhe
            const updatedStudent = { ...student, isOnlineSubmitted: !student.isOnlineSubmitted };
            setViewStudent(updatedStudent); // Popup update
            loadData(); // Table update
        }
    } catch (error) { alert("Error updating status"); }
  };

  // 👇 LIGHTWEIGHT EXCEL (CSV) DOWNLOAD
  const handleDownloadReport = () => {
    const targetMonth = selectedDate.substring(0, 7); 
    let csvContent = "Date,Type,Description,Category,Amount\n";

    students.forEach(std => {
        std.paymentHistory.forEach(pay => {
            if(pay.date.startsWith(targetMonth)) {
                const row = `${new Date(pay.date).toLocaleDateString()},INCOME,${std.name} (${std.course}),Fee Collection,${pay.amount}`;
                csvContent += row + "\n";
            }
        });
    });

    expenses.forEach(exp => {
        if(exp.date.startsWith(targetMonth)) {
            const row = `${new Date(exp.date).toLocaleDateString()},EXPENSE,${exp.title},${exp.category},-${exp.amount}`;
            csvContent += row + "\n";
        }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Report_${targetMonth}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const calculateDailyStats = (stdData, expData, dateToCheck) => {
    let adm = 0, coll = 0, totalExpense = 0;
    let allPending = 0; 

    stdData.forEach(std => {
        allPending += (std.fees.finalFee - std.fees.paidAmount);
        let admDate = std.admissionDate ? new Date(std.admissionDate).toISOString().split('T')[0] : "";
        if(admDate === dateToCheck) { adm++; }
        if(std.paymentHistory) {
            std.paymentHistory.forEach(pay => {
                if(new Date(pay.date).toISOString().split('T')[0] === dateToCheck) coll += pay.amount;
            });
        }
    });

    if(expData) {
        expData.forEach(exp => {
            let expDate = new Date(exp.date).toISOString().split('T')[0];
            if(expDate === dateToCheck) totalExpense += exp.amount;
        });
    }

    setStats({ 
        dayAdmissions: adm, dayCollection: coll, dayExpense: totalExpense, netProfit: coll - totalExpense, totalPending: allPending 
    });
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if(!newExpense.title || !newExpense.amount) return alert("Detail bharo!");
    try {
        await axios.post(`${BASE_URL}/expense/add`, { ...newExpense, date: selectedDate });
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

  // --- STYLES ---
  const styles = {
    container: { maxWidth: "1200px", margin: "0 auto", padding: "10px", fontFamily: "'Segoe UI', sans-serif" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: "white", padding: "15px", borderRadius: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", flexWrap: "wrap", gap: "15px" },
    title: { margin: 0, color: "#1e293b", fontSize: "22px", fontWeight: "800", flex: "1 1 auto" },
    controls: { display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-start" },
    btnPrimary: { background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", padding: "8px 15px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
    btnSuccess: { background: "#10b981", color: "white", padding: "8px 15px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "5px", fontSize: "13px" },
    btnDanger: { background: "#ef4444", color: "white", padding: "8px 15px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
    btnOutline: { background: "transparent", border: "1px solid #334155", color: "#334155", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
    dateInput: { padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "13px" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "15px", marginBottom: "30px" },
    card: { background: "white", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", textAlign: "center" },
    tableContainer: { background: "white", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", overflow: "hidden", overflowX: "auto" },
    table: { width: "100%", borderCollapse: "collapse", minWidth: "600px" },
    tableHeader: { background: "#f8fafc", color: "#64748b", fontWeight: "600", textAlign: "left", padding: "12px", fontSize: "13px", textTransform: "uppercase", whiteSpace: "nowrap" },
    tableRow: { borderBottom: "1px solid #f1f5f9" },
    tableCell: { padding: "12px", color: "#334155", verticalAlign: "middle", fontSize: "14px" },
    statusBadge: (approved) => ({
      padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold",
      background: approved ? "#dcfce7" : "#fef9c3", color: approved ? "#166534" : "#854d0e",
      display: "inline-block"
    })
  };

  return (
    <div style={styles.container}>
      
      {/* HEADER */}
      <div style={styles.header}>
        <h2 style={styles.title}>🚀 Admin</h2>
        <div style={styles.controls}>
             <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={styles.dateInput} />
             <button onClick={handleDownloadReport} style={styles.btnSuccess}>📥 Report</button>
             <button onClick={() => setShowExpenseForm(true)} style={styles.btnPrimary}>+ Expense</button>
             <button onClick={() => navigate('/admin/staff-manager')} style={styles.btnOutline}>Staff</button>
             <button onClick={() => navigate('/')} style={styles.btnDanger}>Logout</button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div style={styles.grid}>
        <div style={{...styles.card, borderTop: "4px solid #f59e0b"}}>
            <h4 style={{margin:"0 0 5px", color:"#64748b", fontSize: "12px", textTransform: "uppercase"}}>Cash In</h4>
            <h1 style={{margin:0, color:"#1e293b", fontSize: "24px"}}>₹{stats.dayCollection}</h1>
        </div>
        <div onClick={() => setViewExpenseHistory(true)} style={{...styles.card, borderTop: "4px solid #ef4444", cursor:"pointer"}}>
            <h4 style={{margin:"0 0 5px", color:"#64748b", fontSize: "12px", textTransform: "uppercase"}}>Expense</h4>
            <h1 style={{margin:0, color:"#ef4444", fontSize: "24px"}}>₹{stats.dayExpense}</h1>
        </div>
        <div style={{...styles.card, borderTop: "4px solid #10b981"}}>
            <h4 style={{margin:"0 0 5px", color:"#64748b", fontSize: "12px", textTransform: "uppercase"}}>Profit</h4>
            <h1 style={{margin:0, color:"#10b981", fontSize: "24px"}}>₹{stats.netProfit}</h1>
        </div>
        <div style={{...styles.card, borderTop: "4px solid #dc2626"}}>
            <h4 style={{margin:"0 0 5px", color:"#64748b", fontSize: "12px", textTransform: "uppercase"}}>Total Pending</h4>
            <h1 style={{margin:0, color:"#dc2626", fontSize: "24px"}}>₹{stats.totalPending}</h1>
        </div>
        <div style={{...styles.card, borderTop: "4px solid #3b82f6"}}>
            <h4 style={{margin:"0 0 5px", color:"#64748b", fontSize: "12px", textTransform: "uppercase"}}>Admissions</h4>
            <h1 style={{margin:0, color:"#3b82f6", fontSize: "24px"}}>{stats.dayAdmissions}</h1>
        </div>
      </div>

      {/* TABLE */}
      <div style={styles.tableContainer}>
        <div style={{padding: "15px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
            <h3 style={{margin:0, color: "#1e293b", fontSize: "16px"}}>📄 Students</h3>
            <span style={{fontSize: "11px", color: "#64748b", background: "#f1f5f9", padding: "4px 8px", borderRadius: "20px"}}>{students.length} Records</span>
        </div>
        <div style={{overflowX: "auto"}}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.tableHeader}>Student Name</th>
                        <th style={styles.tableHeader}>Mobile</th>
                        <th style={styles.tableHeader}>Fee Status</th>
                        <th style={styles.tableHeader}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((std) => (
                        <tr key={std._id} style={styles.tableRow}>
                            <td style={styles.tableCell}>
                                <div style={{fontWeight: "bold", fontSize: "14px"}}>{std.name}</div>
                                <div style={{fontSize: "11px", color: "#64748b", marginTop: "2px"}}>{std.course} • {new Date(std.admissionDate).toLocaleDateString()}</div>
                            </td>
                            <td style={styles.tableCell}><span style={{background: "#eff6ff", color: "#2563eb", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "600"}}>{std.mobile}</span></td>
                            <td style={styles.tableCell}>
                                <div style={{fontSize: "12px", display: "flex", flexDirection: "column", gap: "2px"}}>
                                    <span style={{color:"#16a34a", fontWeight: "600"}}>Paid: ₹{std.fees.paidAmount}</span>
                                    <span style={{color:"#dc2626", fontWeight: "600"}}>Bal: ₹{std.fees.finalFee - std.fees.paidAmount}</span>
                                </div>
                            </td>
                            <td style={styles.tableCell}>
                                <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                                    {!std.approval.isApproved ? (
                                        <button onClick={() => handleApprove(std._id)} style={{...styles.statusBadge(false), border:"none", cursor:"pointer"}}>Approve</button>
                                    ) : (
                                        <span onClick={() => setViewStudent(std)} style={{...styles.statusBadge(true), cursor:"pointer"}}>View</span>
                                    )}
                                    <button onClick={() => handleDeleteStudent(std._id)} style={{border: "1px solid #fee2e2", background: "#fef2f2", color: "#ef4444", borderRadius: "6px", padding: "5px 8px", cursor: "pointer"}}>🗑️</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* POPUPS */}
      {showExpenseForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100 }}>
            <div style={{ background: "white", padding: "20px", borderRadius: "20px", width: "320px", margin: "20px" }}>
                <h3 style={{marginTop: 0, color: "#333", marginBottom: "15px"}}>💸 Add Expense</h3>
                <form onSubmit={handleAddExpense}>
                    <input placeholder="Item Name" value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} style={{width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", boxSizing:"border-box"}} required />
                    <input type="number" placeholder="Amount (₹)" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} style={{width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", boxSizing:"border-box"}} required />
                    <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} style={{width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", boxSizing:"border-box"}}>
                        <option>Office</option><option>Salary</option><option>Rent</option><option>Other</option>
                    </select>
                    <button type="submit" style={{width: "100%", background: "#1e293b", color: "white", padding: "10px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer"}}>Save</button>
                    <button type="button" onClick={() => setShowExpenseForm(false)} style={{width: "100%", background: "transparent", color: "#64748b", padding: "10px", marginTop: "5px", border: "none", cursor: "pointer"}}>Cancel</button>
                </form>
            </div>
        </div>
      )}

      {viewExpenseHistory && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100 }}>
            <div style={{ background: "white", padding: "20px", borderRadius: "10px", width: "90%", maxWidth: "500px", boxShadow: "0 5px 15px rgba(0,0,0,0.3)" }}>
                <div style={{display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ccc", paddingBottom: "10px", marginBottom: "10px"}}>
                    <h3 style={{margin: 0, color: "#e74c3c"}}>📉 Expenses on {selectedDate}</h3>
                    <button onClick={() => setViewExpenseHistory(false)} style={{background: "red", color: "white", border: "none", borderRadius: "50%", width: "25px", height: "25px", cursor: "pointer"}}>X</button>
                </div>
                {expenses.filter(e => new Date(e.date).toISOString().split('T')[0] === selectedDate).length > 0 ? (
                    <div style={{overflowX: "auto"}}>
                        <table border="1" style={{width: "100%", borderCollapse: "collapse", minWidth: "300px"}}>
                            <thead style={{background: "#eee"}}>
                                <tr>
                                    <th style={{padding: "5px"}}>Item</th>
                                    <th style={{padding: "5px"}}>Date</th>
                                    <th style={{padding: "5px"}}>Amount</th>
                                    <th style={{padding: "5px"}}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.filter(e => new Date(e.date).toISOString().split('T')[0] === selectedDate).map(exp => (
                                    <tr key={exp._id}>
                                        <td style={{padding: "5px"}}>{exp.title} <br/><small>{exp.category}</small></td>
                                        <td style={{padding: "5px"}}>{new Date(exp.date).toLocaleDateString()}</td>
                                        <td style={{padding: "5px", fontWeight: "bold", color: "red"}}>₹{exp.amount}</td>
                                        <td style={{padding: "5px", textAlign: "center"}}>
                                            <button onClick={() => handleDeleteExpense(exp._id)} style={{border: "none", background: "none", cursor: "pointer", fontSize: "16px"}}>🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                                <tr style={{background: "#ffebeb"}}><td colSpan="2" style={{padding: "5px", fontWeight: "bold", textAlign: "right"}}>Total:</td><td style={{padding: "5px", fontWeight: "bold", color: "red"}}>₹{stats.dayExpense}</td></tr>
                            </tbody>
                        </table>
                    </div>
                ) : ( <p style={{textAlign: "center", color: "gray"}}>Aaj koi kharcha nahi hua! 🎉</p> )}
            </div>
        </div>
      )}

      {/* 👇 UPDATED STUDENT DETAIL POPUP (STATUS, EDIT, DELETE) */}
      {viewStudent && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "10px", width: "90%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
                
                {/* Header */}
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #3498db", paddingBottom: "10px", marginBottom: "15px"}}>
                    <h2 style={{ margin: 0, color: "#2c3e50" }}>👤 Student Profile</h2>
                    <button onClick={() => setViewStudent(null)} style={{ background: "red", color: "white", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer" }}>X</button>
                </div>

                {/* 👇 STATUS BADGE (Top) */}
                <div style={{textAlign: "center", marginBottom: "20px"}}>
                    {viewStudent.isOnlineSubmitted ? (
                        <span style={{background:"#dcfce7", color:"#166534", padding:"8px 15px", borderRadius:"20px", fontSize:"14px", fontWeight:"bold", border: "1px solid #86efac"}}>
                            ✅ Govt Form Submitted
                        </span>
                    ) : (
                        <span style={{background:"#fee2e2", color:"#991b1b", padding:"8px 15px", borderRadius:"20px", fontSize:"14px", fontWeight:"bold", border: "1px solid #fecaca"}}>
                            🔴 Govt Form Pending
                        </span>
                    )}
                </div>

                {/* Details */}
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

                {/* Fees */}
                <div style={{ backgroundColor: "#f9f9f9", padding: "10px", borderRadius: "5px", marginBottom: "20px" }}>
                    <h3 style={{marginTop: 0}}>💰 Fees Summary</h3>
                    <p>Total Fee: ₹{viewStudent.fees.totalFee} | Discount: ₹{viewStudent.fees.discount}</p>
                    <p><strong>Final Deal: ₹{viewStudent.fees.finalFee}</strong></p>
                    <p style={{color: "green"}}>Paid: ₹{viewStudent.fees.paidAmount}</p>
                    <p style={{color: "red"}}>Balance: ₹{viewStudent.fees.finalFee - viewStudent.fees.paidAmount}</p>
                </div>

                {/* History */}
                <h3 style={{marginTop: 0}}>📜 Payment History</h3>
                {viewStudent.paymentHistory.length > 0 ? (
                    <div style={{overflowX: "auto", marginBottom: "20px"}}>
                        <table border="1" style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "300px" }}>
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
                    </div>
                ) : ( <p style={{color: "gray", marginBottom: "20px"}}>No payments recorded yet.</p> )}

                {/* 👇 ACTION BUTTONS FOOTER */}
                <div style={{borderTop: "1px solid #ccc", paddingTop: "15px", display: "flex", flexDirection: "column", gap: "10px"}}>
                    
                    {/* 1. TOGGLE STATUS BUTTON */}
                    <button onClick={() => toggleOnlineStatus(viewStudent)} style={{
                        padding: "12px", 
                        background: viewStudent.isOnlineSubmitted ? "#f1f5f9" : "#2c3e50", 
                        color: viewStudent.isOnlineSubmitted ? "#333" : "white", 
                        border: viewStudent.isOnlineSubmitted ? "1px solid #ccc" : "none",
                        borderRadius: "8px", 
                        cursor: "pointer", 
                        fontWeight: "bold",
                        fontSize: "14px"
                    }}>
                        {viewStudent.isOnlineSubmitted ? "Mark as Pending ❌" : "Mark as Submitted ✅"}
                    </button>

                    <div style={{display: "flex", gap: "10px"}}>
                        {/* 2. EDIT BUTTON */}
                        <button onClick={() => alert("Edit Feature Coming Soon!")} style={{flex: 1, padding: "10px", background: "#3498db", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold"}}>✏️ Edit</button>
                        
                        {/* 3. DELETE BUTTON */}
                        <button onClick={() => handleDeleteStudent(viewStudent._id)} style={{flex: 1, padding: "10px", background: "#e74c3c", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold"}}>🗑️ Delete</button>
                    </div>
                </div>

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