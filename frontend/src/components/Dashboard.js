import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// 👇 LIVE SERVER LINK
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
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: 'Office' });

  const [stats, setStats] = useState({
    dayAdmissions: 0, dayCollection: 0, dayExpense: 0, netProfit: 0
  });

  useEffect(() => { loadData(); }, []);
  useEffect(() => { 
    if(students.length > 0 || expenses.length > 0) calculateDailyStats(students, expenses, selectedDate);
  }, [selectedDate, students, expenses]);

  const loadData = async () => {
    try {
      const resStd = await axios.get(`${BASE_URL}/student/all`);
      const resExp = await axios.get(`${BASE_URL}/expense/all`);
      setStudents(resStd.data);
      setExpenses(resExp.data);
      calculateDailyStats(resStd.data, resExp.data, selectedDate);
    } catch (error) { console.log("Error loading data"); }
  };

  const handleDeleteStudent = async (id) => {
    if(window.confirm("⚠️ WARNING: Delete this student permanently?")) {
        try {
            await axios.delete(`${BASE_URL}/student/delete/${id}`);
            alert("🗑️ Student Deleted!");
            loadData();
        } catch (error) { alert("Error deleting"); }
    }
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
    stdData.forEach(std => {
        if((std.admissionDate?.split('T')[0]) === dateToCheck) adm++;
        std.paymentHistory?.forEach(pay => {
            if((pay.date?.split('T')[0]) === dateToCheck) coll += pay.amount;
        });
    });
    expData?.forEach(exp => {
        if((exp.date?.split('T')[0]) === dateToCheck) totalExpense += exp.amount;
    });
    setStats({ dayAdmissions: adm, dayCollection: coll, dayExpense: totalExpense, netProfit: coll - totalExpense });
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if(!newExpense.title || !newExpense.amount) return alert("Fill details!");
    try {
        await axios.post(`${BASE_URL}/expense/add`, { ...newExpense, date: selectedDate });
        setShowExpenseForm(false); setNewExpense({ title: '', amount: '', category: 'Office' });
        loadData(); 
    } catch (error) { alert("Error adding expense"); }
  };

  const handleApprove = async (id) => {
    if(window.confirm("Approve discount?")) {
        await axios.put(`${BASE_URL}/student/approve/${id}`);
        loadData();
    }
  };

  // --- STYLES (MOBILE RESPONSIVE FIXED) ---
  const styles = {
    container: { maxWidth: "1200px", margin: "0 auto", padding: "10px", fontFamily: "'Segoe UI', sans-serif" }, // Padding kam kiya mobile ke liye
    
    // 👇 HEADER ME FLEX-WRAP LAGAYA (Mobile me buttons niche aa jayenge)
    header: { 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "20px", 
        background: "white", 
        padding: "15px", 
        borderRadius: "15px", 
        boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
        flexWrap: "wrap", 
        gap: "15px" 
    },
    title: { margin: 0, color: "#1e293b", fontSize: "22px", fontWeight: "800", flex: "1 1 auto" }, // Title ko flexible banaya
    
    // 👇 CONTROLS ME BHI WRAP (Buttons chipkenge nahi)
    controls: { display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-start" },
    
    btnPrimary: { background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", padding: "8px 15px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
    btnSuccess: { background: "#10b981", color: "white", padding: "8px 15px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "5px", fontSize: "13px" },
    btnDanger: { background: "#ef4444", color: "white", padding: "8px 15px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
    btnOutline: { background: "transparent", border: "1px solid #334155", color: "#334155", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
    dateInput: { padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "13px" },
    
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "15px", marginBottom: "30px" }, // Grid chhota kiya
    card: { background: "white", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", textAlign: "center" },
    
    // 👇 TABLE SCROLLABLE (Mobile me side scroll hoga)
    tableContainer: { background: "white", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", overflow: "hidden", overflowX: "auto" },
    table: { width: "100%", borderCollapse: "collapse", minWidth: "600px" }, // Min width di taaki squish na ho

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
        
        {/* Table wrapper for scrolling */}
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

      {/* --- POPUPS (EXPENSE FORM) --- */}
      {showExpenseForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100 }}>
            <div style={{ background: "white", padding: "20px", borderRadius: "20px", width: "320px", margin: "20px" }}>
                <h3 style={{marginTop: 0, color: "#333", marginBottom: "15px"}}>💸 Add Expense</h3>
                <input placeholder="Item Name" value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} style={{width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #e2e8f0"}} />
                <input type="number" placeholder="Amount (₹)" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} style={{width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #e2e8f0"}} />
                <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} style={{width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white"}}>
                    <option>Office</option><option>Salary</option><option>Rent</option><option>Other</option>
                </select>
                <button onClick={handleAddExpense} style={{width: "100%", background: "#1e293b", color: "white", padding: "10px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer"}}>Save</button>
                <button onClick={() => setShowExpenseForm(false)} style={{width: "100%", background: "transparent", color: "#64748b", padding: "10px", marginTop: "5px", border: "none", cursor: "pointer"}}>Cancel</button>
            </div>
        </div>
      )}

      {/* --- VIEW STUDENT POPUP --- */}
      {viewStudent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100 }}>
            <div style={{ background: "white", padding: "20px", borderRadius: "16px", width: "500px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
                <button onClick={() => setViewStudent(null)} style={{ position: "absolute", top: "15px", right: "15px", background: "#f1f5f9", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer" }}>✕</button>
                
                <h2 style={{ color: "#1e293b", margin: "0 0 5px 0", fontSize: "20px" }}>{viewStudent.name}</h2>
                <span style={{background: "#dbeafe", color: "#1e40af", padding: "3px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold"}}>{viewStudent.course}</span>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "15px 0", background: "#f8fafc", padding: "15px", borderRadius: "12px", border: "1px solid #f1f5f9", fontSize: "13px" }}>
                    <div><label style={{color:"#94a3b8", fontSize:"10px", fontWeight: "bold"}}>FATHER</label><div>{viewStudent.fatherName}</div></div>
                    <div><label style={{color:"#94a3b8", fontSize:"10px", fontWeight: "bold"}}>MOBILE</label><div>{viewStudent.mobile}</div></div>
                    <div><label style={{color:"#94a3b8", fontSize:"10px", fontWeight: "bold"}}>ADDRESS</label><div>{viewStudent.address}</div></div>
                    <div><label style={{color:"#94a3b8", fontSize:"10px", fontWeight: "bold"}}>JOINED</label><div>{new Date(viewStudent.admissionDate).toLocaleDateString()}</div></div>
                </div>

                <div style={{borderTop: "1px solid #e2e8f0", paddingTop: "15px"}}>
                    <h4 style={{margin:"0 0 10px", color:"#334155", fontSize: "14px"}}>📜 Payments</h4>
                    {viewStudent.paymentHistory.length === 0 ? <p style={{color: "#94a3b8", fontSize: "13px"}}>No payments.</p> : (
                        <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                            {viewStudent.paymentHistory.map((p,i) => (
                                <div key={i} style={{display: "flex", justifyContent: "space-between", padding: "10px", background: "#f1f5f9", borderRadius: "8px", alignItems: "center", fontSize: "13px"}}>
                                    <div><div style={{fontWeight: "bold", color: "#1e293b"}}>₹{p.amount}</div></div>
                                    <div style={{color: "#475569"}}>{new Date(p.date).toLocaleDateString()}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* --- EXPENSE HISTORY --- */}
      {viewExpenseHistory && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100 }}>
             <div style={{ background: "white", padding: "20px", borderRadius: "16px", width: "400px", maxWidth: "90%" }}>
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px"}}>
                    <h3 style={{margin: 0, color: "#1e293b", fontSize: "18px"}}>📉 Expenses</h3>
                    <button onClick={() => setViewExpenseHistory(false)} style={{background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "50%", width: "25px", height: "25px", cursor: "pointer"}}>✕</button>
                </div>
                {expenses.filter(e => new Date(e.date).toISOString().split('T')[0] === selectedDate).length > 0 ? (
                    <ul style={{padding: 0, listStyle: "none", maxHeight: "300px", overflowY: "auto"}}>
                        {expenses.filter(e => new Date(e.date).toISOString().split('T')[0] === selectedDate).map(exp => (
                            <li key={exp._id} style={{display: "flex", justifyContent: "space-between", padding: "10px", borderBottom: "1px solid #f1f5f9", fontSize: "14px"}}>
                                <span>{exp.title}</span>
                                <span style={{fontWeight: "bold", color: "#ef4444"}}>₹{exp.amount}</span>
                            </li>
                        ))}
                    </ul>
                ) : <p style={{color: "#94a3b8", textAlign: "center"}}>No expenses.</p>}
             </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;