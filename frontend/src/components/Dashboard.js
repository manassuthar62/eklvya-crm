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
  
  // POPUP & EDIT STATE
  const [viewStudent, setViewStudent] = useState(null); 
  const [isEditing, setIsEditing] = useState(false); // 👈 Edit Mode State
  const [editFormData, setEditFormData] = useState({}); // 👈 Data store karne ke liye

  const [showExpenseForm, setShowExpenseForm] = useState(false); 
  const [viewExpenseHistory, setViewExpenseHistory] = useState(false); 
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: 'Office' });

  const [stats, setStats] = useState({
    dayAdmissions: 0, dayCollection: 0, dayExpense: 0, netProfit: 0, totalPending: 0 
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

  // 👇 POPUP KHOLNE KA FUNCTION (Edit data reset karega)
  const openStudentPopup = (std) => {
    setViewStudent(std);
    setEditFormData(std); // Edit ke liye data copy kiya
    setIsEditing(false); // Shuru me edit mode band
  };

  // 👇 SAVE CHANGES FUNCTION (Yeh Data Update Karega)
  const handleSaveChanges = async () => {
    try {
        await axios.put(`${BASE_URL}/student/update/${viewStudent._id}`, editFormData);
        alert("✅ Data Updated Successfully!");
        setIsEditing(false);
        setViewStudent(editFormData); // Popup me naya data dikhao
        loadData(); // Table refresh karo
    } catch (error) {
        alert("❌ Error updating data");
    }
  };

  // 👇 INPUT CHANGE HANDLER
  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleDeleteStudent = async (id) => {
    if(window.confirm("⚠️ WARNING: Delete permanently?")) {
        try {
            await axios.delete(`${BASE_URL}/student/delete/${id}`);
            alert("🗑️ Deleted!");
            setViewStudent(null);
            loadData(); 
        } catch (error) { alert("Error deleting"); }
    }
  };

  const handleDeleteExpense = async (id) => {
    if(window.confirm("Delete this expense?")) {
        try {
            await axios.delete(`${BASE_URL}/expense/delete/${id}`);
            loadData();
        } catch (error) { alert("Error deleting"); }
    }
  };

  const toggleOnlineStatus = async (student) => {
    try {
        const res = await axios.put(`${BASE_URL}/student/toggle-online/${student._id}`);
        if(res.data.success) {
            const updatedStudent = { ...student, isOnlineSubmitted: !student.isOnlineSubmitted };
            setViewStudent(updatedStudent);
            loadData();
        }
    } catch (error) { alert("Error updating status"); }
  };

  const handleDownloadReport = () => {
    const targetMonth = selectedDate.substring(0, 7); 
    let csvContent = "Date,Type,Description,Category,Amount\n";
    students.forEach(std => {
        std.paymentHistory.forEach(pay => {
            if(pay.date.startsWith(targetMonth)) {
                csvContent += `${new Date(pay.date).toLocaleDateString()},INCOME,${std.name},Fee,${pay.amount}\n`;
            }
        });
    });
    expenses.forEach(exp => {
        if(exp.date.startsWith(targetMonth)) {
            csvContent += `${new Date(exp.date).toLocaleDateString()},EXPENSE,${exp.title},${exp.category},-${exp.amount}\n`;
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
    let adm = 0, coll = 0, totalExpense = 0, allPending = 0;
    stdData.forEach(std => {
        allPending += (std.fees.finalFee - std.fees.paidAmount);
        if((std.admissionDate?.split('T')[0]) === dateToCheck) adm++;
        std.paymentHistory?.forEach(pay => {
            if((pay.date?.split('T')[0]) === dateToCheck) coll += pay.amount;
        });
    });
    expData?.forEach(exp => {
        if((exp.date?.split('T')[0]) === dateToCheck) totalExpense += exp.amount;
    });
    setStats({ dayAdmissions: adm, dayCollection: coll, dayExpense: totalExpense, netProfit: coll - totalExpense, totalPending: allPending });
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if(!newExpense.title) return alert("Fill details");
    await axios.post(`${BASE_URL}/expense/add`, { ...newExpense, date: selectedDate });
    setShowExpenseForm(false); setNewExpense({ title: '', amount: '', category: 'Office' });
    loadData();
  };

  const handleApprove = async (id) => {
    if(window.confirm("Approve student?")) {
        await axios.put(`${BASE_URL}/student/approve/${id}`);
        loadData();
    }
  };

  // STYLES
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
    }),
    input: { width: "100%", padding: "8px", border: "1px solid #3b82f6", borderRadius: "5px", marginBottom: "5px", fontSize: "14px", boxSizing: "border-box", background: "#eff6ff" }
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

      {/* STATS */}
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
                                        <button onClick={()=>openStudentPopup(std)} style={{...styles.statusBadge(true), cursor:"pointer"}}>View</button>
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

      {/* --- STUDENT DETAIL POPUP (EDIT MODE ACTIVE) --- */}
      {viewStudent && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000}}>
            <div style={{background:"white", padding:"25px", borderRadius:"20px", width:"90%", maxWidth:"500px", maxHeight:"90vh", overflowY:"auto"}}>
                
                {/* Header with Close */}
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #eee", paddingBottom:"10px"}}>
                    <h2 style={{margin:0, color: "#2c3e50"}}>
                        {isEditing ? "✏️ Edit Profile" : `👤 ${viewStudent.name}`}
                    </h2>
                    <button onClick={()=>setViewStudent(null)} style={{background:"transparent", border:"none", fontSize:"20px", cursor:"pointer"}}>✕</button>
                </div>

                {/* Status Badge */}
                {!isEditing && (
                    <div style={{marginTop:"15px", marginBottom: "15px", textAlign:"center"}}>
                        {viewStudent.isOnlineSubmitted ? (
                            <span style={{background:"#dcfce7", color:"#166534", padding:"8px 12px", borderRadius:"15px", fontSize:"13px", fontWeight:"bold", border: "1px solid #bbf7d0"}}>✅ Govt Form Submitted</span>
                        ) : (
                            <span style={{background:"#fee2e2", color:"#991b1b", padding:"8px 12px", borderRadius:"15px", fontSize:"13px", fontWeight:"bold", border: "1px solid #fecaca"}}>🔴 Govt Form Pending</span>
                        )}
                    </div>
                )}

                {/* 👇 EDITABLE FIELDS */}
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"15px", margin:"20px 0", fontSize:"14px", color: "#334155"}}>
                    
                    {/* Name */}
                    <div style={{gridColumn: "1 / -1"}}>
                        <small style={{color:"gray", fontWeight:"bold"}}>STUDENT NAME</small>
                        {isEditing ? <input style={styles.input} name="name" value={editFormData.name} onChange={handleEditChange}/> : <div>{viewStudent.name}</div>}
                    </div>

                    {/* Father Name */}
                    <div>
                        <small style={{color:"gray", fontWeight:"bold"}}>FATHER</small>
                        {isEditing ? <input style={styles.input} name="fatherName" value={editFormData.fatherName} onChange={handleEditChange}/> : <div>{viewStudent.fatherName}</div>}
                    </div>

                    {/* Mobile */}
                    <div>
                        <small style={{color:"gray", fontWeight:"bold"}}>MOBILE</small>
                        {isEditing ? <input style={styles.input} name="mobile" value={editFormData.mobile} onChange={handleEditChange}/> : <div>{viewStudent.mobile}</div>}
                    </div>

                    {/* Course */}
                    <div>
                        <small style={{color:"gray", fontWeight:"bold"}}>COURSE</small>
                        {isEditing ? <input style={styles.input} name="course" value={editFormData.course} onChange={handleEditChange}/> : <div>{viewStudent.course}</div>}
                    </div>

                    {/* Address */}
                    <div>
                        <small style={{color:"gray", fontWeight:"bold"}}>ADDRESS</small>
                        {isEditing ? <input style={styles.input} name="address" value={editFormData.address} onChange={handleEditChange}/> : <div>{viewStudent.address}</div>}
                    </div>
                </div>

                {/* Fee Summary (Hidden in Edit Mode) */}
                {!isEditing && (
                    <div style={{background:"#f8fafc", padding:"15px", borderRadius:"10px", marginBottom:"20px", border: "1px solid #e2e8f0"}}>
                        <h4 style={{margin:"0 0 10px", color: "#1e293b"}}>💰 Fees Summary</h4>
                        <div style={{display:"flex", justifyContent:"space-between", fontSize: "14px"}}>
                            <span>Total: ₹{viewStudent.fees.finalFee}</span>
                            <span style={{color:"green", fontWeight:"bold"}}>Paid: ₹{viewStudent.fees.paidAmount}</span>
                            <span style={{color:"red", fontWeight:"bold"}}>Bal: ₹{viewStudent.fees.finalFee - viewStudent.fees.paidAmount}</span>
                        </div>
                    </div>
                )}

                {/* 👇 ACTION BUTTONS FOOTER */}
                <div style={{borderTop: "1px solid #ccc", paddingTop: "15px", display: "flex", flexDirection: "column", gap:"10px"}}>
                    
                    {isEditing ? (
                        // SAVE / CANCEL BUTTONS
                        <div style={{display: "flex", gap: "10px"}}>
                            <button onClick={handleSaveChanges} style={{flex: 1, padding:"12px", background:"#16a34a", color: "white", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:"bold"}}>💾 Save Changes</button>
                            <button onClick={()=>setIsEditing(false)} style={{flex: 1, padding:"12px", background:"#64748b", color: "white", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:"bold"}}>❌ Cancel</button>
                        </div>
                    ) : (
                        // NORMAL BUTTONS
                        <>
                            <button onClick={() => toggleOnlineStatus(viewStudent)} style={{
                                padding: "12px", 
                                background: viewStudent.isOnlineSubmitted ? "#f1f5f9" : "#1e293b", 
                                color: viewStudent.isOnlineSubmitted ? "#333" : "white", 
                                border: viewStudent.isOnlineSubmitted ? "1px solid #ccc" : "none",
                                borderRadius:"8px", cursor:"pointer", fontWeight:"bold", fontSize:"14px"
                            }}>
                                {viewStudent.isOnlineSubmitted ? "Mark as Pending ❌" : "Mark as Submitted ✅"}
                            </button>

                            <div style={{display: "flex", gap: "10px"}}>
                                {/* EDIT BUTTON - ACTIVE NOW */}
                                <button onClick={() => setIsEditing(true)} style={{flex: 1, padding:"10px", background:"#3b82f6", color: "white", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:"bold"}}>✏️ Edit</button>
                                
                                <button onClick={() => handleDeleteStudent(viewStudent._id)} style={{flex: 1, padding:"10px", background:"#ef4444", color: "white", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:"bold"}}>🗑️ Delete</button>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>
      )}

      {/* --- EXPENSE POPUPS (Same as before) --- */}
      {showExpenseForm && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1100}}>
            <form onSubmit={handleAddExpense} style={{background:"white", padding:"20px", borderRadius:"15px", width:"300px"}}>
                <h3>Add Expense</h3>
                <input placeholder="Item" value={newExpense.title} onChange={e=>setNewExpense({...newExpense, title:e.target.value})} style={{width:"100%", padding:"10px", marginBottom:"10px", boxSizing:"border-box"}} />
                <input type="number" placeholder="Amount" value={newExpense.amount} onChange={e=>setNewExpense({...newExpense, amount:e.target.value})} style={{width:"100%", padding:"10px", marginBottom:"10px", boxSizing:"border-box"}} />
                <button style={{width:"100%", padding:"10px", background:"black", color:"white"}}>Save</button>
                <button type="button" onClick={()=>setShowExpenseForm(false)} style={{width:"100%", marginTop:"10px"}}>Cancel</button>
            </form>
        </div>
      )}

      {viewExpenseHistory && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1100}}>
            <div style={{background:"white", padding:"20px", borderRadius:"15px", width:"400px"}}>
                <div style={{display:"flex", justifyContent:"space-between"}}><h3>Expenses</h3><button onClick={()=>setViewExpenseHistory(false)}>X</button></div>
                {expenses.filter(e => new Date(e.date).toISOString().split('T')[0] === selectedDate).map(exp => (
                    <div key={exp._id} style={{display:"flex", justifyContent:"space-between", padding:"10px", borderBottom:"1px solid #eee"}}>
                        <span>{exp.title}</span>
                        <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                            <span style={{color:"red", fontWeight:"bold"}}>₹{exp.amount}</span>
                            <button onClick={()=>handleDeleteExpense(exp._id)}>🗑️</button>
                        </div>
                    </div>
                ))}
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