import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx'; // 👈 EXCEL LIBRARY IMPORT KI

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

  // 👇 NEW: EXCEL DOWNLOAD FUNCTION
  const handleDownloadReport = () => {
    const targetMonth = selectedDate.substring(0, 7); // "2025-12" nikalega
    
    // 1. Prepare INCOME Data (Fees)
    const incomeData = [];
    students.forEach(std => {
        std.paymentHistory.forEach(pay => {
            if(pay.date.startsWith(targetMonth)) {
                incomeData.push({
                    Date: new Date(pay.date).toLocaleDateString(),
                    Student_Name: std.name,
                    Course: std.course,
                    Amount: pay.amount,
                    Remark: pay.remark || "Fee"
                });
            }
        });
    });

    // 2. Prepare EXPENSE Data
    const expenseData = [];
    expenses.forEach(exp => {
        if(exp.date.startsWith(targetMonth)) {
            expenseData.push({
                Date: new Date(exp.date).toLocaleDateString(),
                Item: exp.title,
                Category: exp.category,
                Amount: exp.amount
            });
        }
    });

    // 3. Create Excel File
    const wb = XLSX.utils.book_new();
    
    // Income Sheet
    const ws1 = XLSX.utils.json_to_sheet(incomeData.length ? incomeData : [{Note: "No Income this month"}]);
    XLSX.utils.book_append_sheet(wb, ws1, "Income (Fees)");
    
    // Expense Sheet
    const ws2 = XLSX.utils.json_to_sheet(expenseData.length ? expenseData : [{Note: "No Expenses this month"}]);
    XLSX.utils.book_append_sheet(wb, ws2, "Expenses");

    // Download
    XLSX.writeFile(wb, `Report_${targetMonth}.xlsx`);
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
    } catch (error) { alert("Error"); }
  };

  const handleApprove = async (id) => {
    if(window.confirm("Approve discount?")) {
        await axios.put(`${BASE_URL}/student/approve/${id}`);
        loadData();
    }
  };

  // --- STYLES ---
  const styles = {
    container: { maxWidth: "1200px", margin: "0 auto", padding: "20px", fontFamily: "'Segoe UI', sans-serif" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", background: "white", padding: "15px 25px", borderRadius: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" },
    title: { margin: 0, color: "#1e293b", fontSize: "24px", fontWeight: "800" },
    controls: { display: "flex", gap: "10px", alignItems: "center" },
    btnPrimary: { background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", boxShadow: "0 4px 6px rgba(79, 70, 229, 0.2)" },
    btnSuccess: { background: "#10b981", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "5px" },
    btnDanger: { background: "#ef4444", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
    btnOutline: { background: "transparent", border: "2px solid #334155", color: "#334155", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
    dateInput: { padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px" },
    
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "30px" },
    card: { background: "white", padding: "25px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", textAlign: "center", transition: "transform 0.2s" },
    
    tableContainer: { background: "white", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", overflow: "hidden" },
    tableHeader: { background: "#f8fafc", color: "#64748b", fontWeight: "600", textAlign: "left", padding: "15px", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" },
    tableRow: { borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" },
    tableCell: { padding: "15px", color: "#334155", verticalAlign: "middle" },
    
    statusBadge: (approved) => ({
      padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold",
      background: approved ? "#dcfce7" : "#fef9c3", color: approved ? "#166534" : "#854d0e",
      display: "inline-block"
    })
  };

  return (
    <div style={styles.container}>
      
      {/* HEADER */}
      <div style={styles.header}>
        <h2 style={styles.title}>🚀 Admin Dashboard</h2>
        <div style={styles.controls}>
             <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={styles.dateInput} />
             {/* 👇 DOWNLOAD BUTTON */}
             <button onClick={handleDownloadReport} style={styles.btnSuccess}>📥 Report</button>
             
             <button onClick={() => setShowExpenseForm(true)} style={styles.btnPrimary}>+ Expense</button>
             <button onClick={() => navigate('/admin/staff-manager')} style={styles.btnOutline}>Staff</button>
             <button onClick={() => navigate('/')} style={styles.btnDanger}>Logout</button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div style={styles.grid}>
        <div style={{...styles.card, borderTop: "4px solid #f59e0b"}}>
            <h4 style={{margin:"0 0 10px", color:"#64748b", fontSize: "14px", textTransform: "uppercase"}}>Cash Collection</h4>
            <h1 style={{margin:0, color:"#1e293b", fontSize: "32px"}}>₹{stats.dayCollection}</h1>
        </div>
        <div onClick={() => setViewExpenseHistory(true)} style={{...styles.card, borderTop: "4px solid #ef4444", cursor:"pointer"}}>
            <h4 style={{margin:"0 0 10px", color:"#64748b", fontSize: "14px", textTransform: "uppercase"}}>Expense (Click)</h4>
            <h1 style={{margin:0, color:"#ef4444", fontSize: "32px"}}>₹{stats.dayExpense}</h1>
        </div>
        <div style={{...styles.card, borderTop: "4px solid #10b981"}}>
            <h4 style={{margin:"0 0 10px", color:"#64748b", fontSize: "14px", textTransform: "uppercase"}}>Net Profit</h4>
            <h1 style={{margin:0, color:"#10b981", fontSize: "32px"}}>₹{stats.netProfit}</h1>
        </div>
        <div style={{...styles.card, borderTop: "4px solid #3b82f6"}}>
            <h4 style={{margin:"0 0 10px", color:"#64748b", fontSize: "14px", textTransform: "uppercase"}}>New Admissions</h4>
            <h1 style={{margin:0, color:"#3b82f6", fontSize: "32px"}}>{stats.dayAdmissions}</h1>
        </div>
      </div>

      {/* TABLE */}
      <div style={styles.tableContainer}>
        <div style={{padding: "20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
            <h3 style={{margin:0, color: "#1e293b"}}>📄 Student Database</h3>
            <span style={{fontSize: "12px", color: "#64748b", background: "#f1f5f9", padding: "5px 10px", borderRadius: "20px"}}>{students.length} Records</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                    <tr key={std._id} style={styles.tableRow} onMouseOver={e => e.currentTarget.style.background = "#f8fafc"} onMouseOut={e => e.currentTarget.style.background = "white"}>
                        <td style={styles.tableCell}>
                            <div style={{fontWeight: "bold", fontSize: "16px"}}>{std.name}</div>
                            <div style={{fontSize: "13px", color: "#64748b", marginTop: "4px"}}>{std.course} • {new Date(std.admissionDate).toLocaleDateString()}</div>
                        </td>
                        <td style={styles.tableCell}><span style={{background: "#eff6ff", color: "#2563eb", padding: "5px 10px", borderRadius: "6px", fontSize: "13px", fontWeight: "600"}}>{std.mobile}</span></td>
                        <td style={styles.tableCell}>
                            <div style={{fontSize: "13px", display: "flex", flexDirection: "column", gap: "2px"}}>
                                <span style={{color:"#16a34a", fontWeight: "600"}}>Paid: ₹{std.fees.paidAmount}</span>
                                <span style={{color:"#dc2626", fontWeight:"600"}}>Bal: ₹{std.fees.finalFee - std.fees.paidAmount}</span>
                            </div>
                        </td>
                        <td style={styles.tableCell}>
                            <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                                {!std.approval.isApproved ? (
                                    <button onClick={() => handleApprove(std._id)} style={{...styles.statusBadge(false), border:"none", cursor:"pointer"}}>Approve</button>
                                ) : (
                                    <span onClick={() => setViewStudent(std)} style={{...styles.statusBadge(true), cursor:"pointer"}}>Active 👁️</span>
                                )}
                                <button onClick={() => handleDeleteStudent(std._id)} style={{border: "1px solid #fee2e2", background: "#fef2f2", color: "#ef4444", borderRadius: "6px", padding: "6px 10px", cursor: "pointer", transition: "all 0.2s"}}>🗑️</button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* --- POPUPS (EXPENSE FORM) --- */}
      {showExpenseForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(5px)", zIndex: 1100 }}>
            <div style={{ background: "white", padding: "30px", borderRadius: "20px", width: "350px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)" }}>
                <h3 style={{marginTop: 0, color: "#333", marginBottom: "20px"}}>💸 Add New Expense</h3>
                <input placeholder="Item Name (e.g. Chai)" value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} style={{width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px"}} />
                <input type="number" placeholder="Amount (₹)" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} style={{width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px"}} />
                <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} style={{width: "100%", padding: "12px", marginBottom: "20px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", backgroundColor: "white"}}>
                    <option>Office</option><option>Salary</option><option>Rent</option><option>Other</option>
                </select>
                <button onClick={handleAddExpense} style={{width: "100%", background: "#1e293b", color: "white", padding: "12px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "14px"}}>Save Expense</button>
                <button onClick={() => setShowExpenseForm(false)} style={{width: "100%", background: "transparent", color: "#64748b", padding: "10px", marginTop: "5px", border: "none", cursor: "pointer", fontSize: "14px"}}>Cancel</button>
            </div>
        </div>
      )}

      {/* --- VIEW STUDENT POPUP --- */}
      {viewStudent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(5px)", zIndex: 1100 }}>
            <div style={{ background: "white", padding: "30px", borderRadius: "24px", width: "500px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto", position: "relative", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
                <button onClick={() => setViewStudent(null)} style={{ position: "absolute", top: "20px", right: "20px", background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "#64748b" }}>✕</button>
                
                <h2 style={{ color: "#1e293b", margin: "0 0 5px 0" }}>{viewStudent.name}</h2>
                <span style={{background: "#dbeafe", color: "#1e40af", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold"}}>{viewStudent.course} Student</span>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", margin: "25px 0", background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
                    <div><label style={{color:"#94a3b8", fontSize:"11px", fontWeight: "bold", letterSpacing: "0.5px"}}>FATHER'S NAME</label><div style={{fontWeight:"600", color: "#334155"}}>{viewStudent.fatherName}</div></div>
                    <div><label style={{color:"#94a3b8", fontSize:"11px", fontWeight: "bold", letterSpacing: "0.5px"}}>MOBILE NUMBER</label><div style={{fontWeight:"600", color: "#334155"}}>{viewStudent.mobile}</div></div>
                    <div><label style={{color:"#94a3b8", fontSize:"11px", fontWeight: "bold", letterSpacing: "0.5px"}}>ADDRESS</label><div style={{fontWeight:"600", color: "#334155"}}>{viewStudent.address}</div></div>
                    <div><label style={{color:"#94a3b8", fontSize:"11px", fontWeight: "bold", letterSpacing: "0.5px"}}>ADMISSION DATE</label><div style={{fontWeight:"600", color: "#334155"}}>{new Date(viewStudent.admissionDate).toLocaleDateString()}</div></div>
                </div>

                <div style={{borderTop: "1px solid #e2e8f0", paddingTop: "20px"}}>
                    <h4 style={{margin:"0 0 15px", color:"#334155"}}>📜 Fee Payment History</h4>
                    {viewStudent.paymentHistory.length === 0 ? <p style={{color: "#94a3b8", fontSize: "14px", fontStyle: "italic"}}>No payments recorded yet.</p> : (
                        <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
                            {viewStudent.paymentHistory.map((p,i) => (
                                <div key={i} style={{display: "flex", justifyContent: "space-between", padding: "12px", background: "#f1f5f9", borderRadius: "8px", alignItems: "center"}}>
                                    <div>
                                        <div style={{fontWeight: "bold", color: "#1e293b"}}>₹{p.amount}</div>
                                        <div style={{fontSize: "12px", color: "#64748b"}}>{p.remark || "Fee Payment"}</div>
                                    </div>
                                    <div style={{fontSize: "13px", color: "#475569"}}>{new Date(p.date).toLocaleDateString()}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

       {/* ... Expense History Popup ... */}
       {viewExpenseHistory && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(5px)", zIndex: 1100 }}>
             <div style={{ background: "white", padding: "25px", borderRadius: "16px", width: "400px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px"}}>
                    <h3 style={{margin: 0, color: "#1e293b"}}>📉 Expenses ({selectedDate})</h3>
                    <button onClick={() => setViewExpenseHistory(false)} style={{background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "14px"}}>✕</button>
                </div>
                {expenses.filter(e => new Date(e.date).toISOString().split('T')[0] === selectedDate).length > 0 ? (
                    <ul style={{padding: 0, listStyle: "none", maxHeight: "300px", overflowY: "auto"}}>
                        {expenses.filter(e => new Date(e.date).toISOString().split('T')[0] === selectedDate).map(exp => (
                            <li key={exp._id} style={{display: "flex", justifyContent: "space-between", padding: "10px", borderBottom: "1px solid #f1f5f9"}}>
                                <span style={{color: "#334155"}}>{exp.title} <small style={{color:"#94a3b8"}}>({exp.category})</small></span>
                                <span style={{fontWeight: "bold", color: "#ef4444"}}>₹{exp.amount}</span>
                            </li>
                        ))}
                    </ul>
                ) : <p style={{color: "#94a3b8", textAlign: "center"}}>No expenses today.</p>}
             </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;