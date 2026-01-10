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
  const [currentTime, setCurrentTime] = useState(new Date()); // 🕒 Clock State
  
  // POPUP & EDIT STATE
  const [viewStudent, setViewStudent] = useState(null); 
  const [isEditing, setIsEditing] = useState(false); 
  const [editFormData, setEditFormData] = useState({}); 

  const [showExpenseForm, setShowExpenseForm] = useState(false); 
  const [viewExpenseHistory, setViewExpenseHistory] = useState(false); 
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: 'Office' });

  const [stats, setStats] = useState({
    dayAdmissions: 0, dayCollection: 0, dayExpense: 0, netProfit: 0, totalPending: 0 
  });

  // 🕒 Live Clock Effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const openStudentPopup = (std) => {
    setViewStudent(std);
    setEditFormData(std); 
    setIsEditing(false); 
  };

  const handleSaveChanges = async () => {
    try {
        await axios.put(`${BASE_URL}/student/update/${viewStudent._id}`, editFormData);
        alert("✅ Data Updated Successfully!");
        setIsEditing(false);
        setViewStudent(editFormData); 
        loadData(); 
    } catch (error) { alert("❌ Error updating data"); }
  };

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

  // --- 🎨 RKCL INSPIRED STYLES ---
  const styles = {
    body: { fontFamily: "'Segoe UI', sans-serif", background: "#f8f9fa", minHeight: "100vh" },
    
    // 1. TOP BAR (WHITE)
    topBar: { background: "white", padding: "15px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ddd" },
    logoText: { fontSize: "22px", fontWeight: "bold", color: "#0d47a1", textTransform: "uppercase" },
    topControls: { display: "flex", alignItems: "center", gap: "20px" },
    dateInput: { padding: "8px", border: "1px solid #ccc", borderRadius: "4px", outline: "none", fontSize: "14px" },
    logoutBtn: { background: "#dc3545", color: "white", padding: "8px 15px", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" },

    // 2. NAV BAR (BLUE)
    navBar: { background: "#2196f3", padding: "0 40px", display: "flex", alignItems: "center", height: "50px", overflowX: "auto", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" },
    navLink: { color: "white", textDecoration: "none", padding: "0 20px", height: "100%", display: "flex", alignItems: "center", fontSize: "14px", fontWeight: "600", cursor: "pointer", borderRight: "1px solid rgba(255,255,255,0.2)" },

    // 3. MAIN CONTENT
    content: { maxWidth: "1200px", margin: "20px auto", padding: "0 15px" },
    
    // 4. SHORTCUTS SECTION
    sectionHeader: { background: "#2196f3", color: "white", padding: "10px 15px", fontSize: "16px", fontWeight: "bold", borderTopLeftRadius: "4px", borderTopRightRadius: "4px", display: "flex", alignItems: "center", gap: "10px", marginTop: "20px" },
    shortcutsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", background: "white", padding: "15px", border: "1px solid #ddd" },
    
    // Colorful Buttons
    shortcutBtn: (color) => ({
      background: color, color: "white", padding: "15px", borderRadius: "4px", textAlign: "center", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "90px", transition: "transform 0.2s"
    }),
    shortcutTitle: { fontSize: "13px", marginBottom: "5px", fontWeight: "bold", textTransform: "uppercase" },
    shortcutValue: { fontSize: "20px", fontWeight: "bold" },

    // 5. CLOCK SECTION
    clockContainer: { background: "white", border: "1px solid #2196f3", color: "#333", padding: "20px", textAlign: "center", marginBottom: "10px", borderRadius: "0 0 4px 4px", borderTop: "none" },
    clockTime: { fontSize: "42px", fontWeight: "bold", color: "#e67e22", textShadow: "1px 1px 2px rgba(0,0,0,0.1)" },
    clockDate: { fontSize: "18px", fontWeight: "600", color: "#0d47a1" },

    // 6. TABLE
    tableContainer: { background: "white", border: "1px solid #ddd", borderTop: "none" },
    tableHeader: { background: "#f8f9fa", color: "#495057", padding: "12px", borderBottom: "2px solid #dee2e6", textAlign: "left", fontSize: "13px", fontWeight: "bold" },
    tableCell: { padding: "12px", borderBottom: "1px solid #dee2e6", fontSize: "14px", color: "#333" },
    
    // Popup
    popupOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
    popupBox: { background: "white", padding: "25px", borderRadius: "8px", width: "90%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" },
    input: { width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px", marginBottom: "10px", boxSizing: "border-box", background: "#f9f9f9" }
  };

  return (
    <div style={styles.body}>
      
      {/* 1. TOP BAR (WHITE) */}
      <div style={styles.topBar}>
        <div style={styles.logoText}>🏫 Eklavya Education</div>
        <div style={styles.topControls}>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={styles.dateInput} />
            <button onClick={() => navigate('/')} style={styles.logoutBtn}>LOGOUT 🔒</button>
        </div>
      </div>

      {/* 2. NAV BAR (BLUE) */}
      <div style={styles.navBar}>
        <div style={styles.navLink} onClick={() => window.location.reload()}>🏠 DASHBOARD</div>
        <div style={styles.navLink} onClick={handleDownloadReport}>📥 REPORTS</div>
        <div style={styles.navLink} onClick={() => setShowExpenseForm(true)}>💸 ADD EXPENSE</div>
        <div style={styles.navLink} onClick={() => navigate('/admin/staff-manager')}>👥 STAFF</div>
      </div>

      {/* 3. MAIN CONTENT */}
      <div style={styles.content}>
        
        {/* SHORTCUTS HEADER */}
        <div style={styles.sectionHeader}>📌 Quick Shortcuts</div>
        
        {/* SHORTCUTS BUTTONS */}
        <div style={styles.shortcutsGrid}>
            <div style={styles.shortcutBtn("#dc3545")}> {/* Red */}
                <span style={styles.shortcutTitle}>TOTAL EXPENSE</span>
                <span style={styles.shortcutValue} onClick={()=>setViewExpenseHistory(true)}>₹{stats.dayExpense}</span>
            </div>
            
            <div style={styles.shortcutBtn("#ffc107")}> {/* Yellow */}
                <span style={{...styles.shortcutTitle, color: "black"}}>CASH COLLECTION</span>
                <span style={{...styles.shortcutValue, color: "black"}}>₹{stats.dayCollection}</span>
            </div>

            <div style={styles.shortcutBtn("#28a745")}> {/* Green */}
                <span style={styles.shortcutTitle}>NET PROFIT</span>
                <span style={styles.shortcutValue}>₹{stats.netProfit}</span>
            </div>

            <div style={styles.shortcutBtn("#17a2b8")}> {/* Cyan */}
                <span style={styles.shortcutTitle}>PENDING FEES</span>
                <span style={styles.shortcutValue}>₹{stats.totalPending}</span>
            </div>

            <div style={styles.shortcutBtn("#007bff")}> {/* Blue */}
                <span style={styles.shortcutTitle}>ADMISSIONS</span>
                <span style={styles.shortcutValue}>{stats.dayAdmissions}</span>
            </div>
        </div>

        {/* CLOCK SECTION (Just below shortcuts like RKCL) */}
        <div style={styles.clockContainer}>
            <div style={styles.clockDate}>{currentTime.toDateString()}</div>
            <div style={styles.clockTime}>{currentTime.toLocaleTimeString()}</div>
        </div>

        {/* STUDENT TABLE HEADER */}
        <div style={styles.sectionHeader}>📄 Registered Students ({students.length})</div>
        
        {/* TABLE */}
        <div style={{...styles.tableContainer, overflowX: "auto"}}>
            <table style={{width:"100%", borderCollapse:"collapse", minWidth:"600px"}}>
                <thead>
                    <tr>
                        <th style={styles.tableHeader}>NAME</th>
                        <th style={styles.tableHeader}>MOBILE</th>
                        <th style={styles.tableHeader}>FEES STATUS</th>
                        <th style={styles.tableHeader}>ACTION</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(std => (
                        <tr key={std._id} style={{background: "white"}}>
                            <td style={styles.tableCell}>
                                <strong>{std.name}</strong><br/>
                                <span style={{fontSize:"12px", color:"#888"}}>{std.course} | {new Date(std.admissionDate).toLocaleDateString()}</span>
                            </td>
                            <td style={styles.tableCell}>{std.mobile}</td>
                            <td style={styles.tableCell}>
                                <span style={{color:"green", fontWeight:"bold"}}>Paid: ₹{std.fees.paidAmount}</span><br/>
                                <span style={{color:"red", fontSize:"12px", fontWeight:"bold"}}>Bal: ₹{std.fees.finalFee - std.fees.paidAmount}</span>
                            </td>
                            <td style={styles.tableCell}>
                                {!std.approval.isApproved ? (
                                    <button onClick={()=>handleApprove(std._id)} style={{padding:"5px 10px", background:"orange", border:"none", color:"white", borderRadius:"4px", cursor:"pointer"}}>Approve</button>
                                ) : (
                                    <button onClick={()=>openStudentPopup(std)} style={{padding:"5px 10px", background:"#28a745", border:"none", color:"white", borderRadius:"4px", cursor:"pointer", fontWeight:"bold"}}>View 👁️</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

      </div>

      {/* --- POPUPS (Logic same as requested) --- */}
      
      {/* STUDENT DETAIL POPUP */}
      {viewStudent && (
        <div style={styles.popupOverlay}>
            <div style={styles.popupBox}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px", borderBottom:"1px solid #eee", paddingBottom:"10px"}}>
                    <h2 style={{margin:0, color:"#0d47a1"}}>{isEditing ? "✏️ Edit Profile" : `👤 ${viewStudent.name}`}</h2>
                    <button onClick={()=>setViewStudent(null)} style={{background:"none", border:"none", fontSize:"20px", cursor:"pointer"}}>✕</button>
                </div>

                {!isEditing && (
                    <div style={{textAlign:"center", marginBottom:"15px"}}>
                        <span style={{padding:"5px 10px", borderRadius:"20px", background: viewStudent.isOnlineSubmitted ? "#dcfce7" : "#fee2e2", color: viewStudent.isOnlineSubmitted ? "green" : "red", fontWeight:"bold", fontSize:"12px"}}>
                            {viewStudent.isOnlineSubmitted ? "✅ Govt Form Submitted" : "🔴 Govt Form Pending"}
                        </span>
                    </div>
                )}

                {/* FIELDS */}
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"15px", marginBottom:"20px", fontSize:"14px"}}>
                    <div style={{gridColumn: "1 / -1"}}>
                        <label style={{fontWeight:"bold", fontSize:"11px", color:"#666"}}>STUDENT NAME</label>
                        {isEditing ? <input style={styles.input} name="name" value={editFormData.name} onChange={handleEditChange} /> : <div>{viewStudent.name}</div>}
                    </div>
                    <div>
                        <label style={{fontWeight:"bold", fontSize:"11px", color:"#666"}}>FATHER</label>
                        {isEditing ? <input style={styles.input} name="fatherName" value={editFormData.fatherName} onChange={handleEditChange} /> : <div>{viewStudent.fatherName}</div>}
                    </div>
                    <div>
                        <label style={{fontWeight:"bold", fontSize:"11px", color:"#666"}}>MOBILE</label>
                        {isEditing ? <input style={styles.input} name="mobile" value={editFormData.mobile} onChange={handleEditChange} /> : <div>{viewStudent.mobile}</div>}
                    </div>
                    <div>
                        <label style={{fontWeight:"bold", fontSize:"11px", color:"#666"}}>COURSE</label>
                        {isEditing ? <input style={styles.input} name="course" value={editFormData.course} onChange={handleEditChange} /> : <div>{viewStudent.course}</div>}
                    </div>
                    <div style={{gridColumn:"1 / -1"}}>
                        <label style={{fontWeight:"bold", fontSize:"11px", color:"#666"}}>ADDRESS</label>
                        {isEditing ? <input style={styles.input} name="address" value={editFormData.address} onChange={handleEditChange} /> : <div>{viewStudent.address}</div>}
                    </div>
                </div>

                {/* BUTTONS */}
                <div style={{borderTop:"1px solid #eee", paddingTop:"15px", display:"flex", gap:"10px", flexWrap:"wrap"}}>
                    {isEditing ? (
                        <>
                            <button onClick={handleSaveChanges} style={{flex:1, padding:"10px", background:"#28a745", color:"white", border:"none", borderRadius:"4px", cursor:"pointer", fontWeight:"bold"}}>💾 Save Changes</button>
                            <button onClick={()=>setIsEditing(false)} style={{flex:1, padding:"10px", background:"#6c757d", color:"white", border:"none", borderRadius:"4px", cursor:"pointer", fontWeight:"bold"}}>❌ Cancel</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => toggleOnlineStatus(viewStudent)} style={{flex:1, padding:"10px", background:"#343a40", color:"white", border:"none", borderRadius:"4px", cursor:"pointer", fontSize:"12px", fontWeight:"bold"}}>{viewStudent.isOnlineSubmitted ? "Mark Pending" : "Mark Done"}</button>
                            <button onClick={() => setIsEditing(true)} style={{flex:1, padding:"10px", background:"#007bff", color:"white", border:"none", borderRadius:"4px", cursor:"pointer", fontWeight:"bold"}}>✏️ Edit</button>
                            <button onClick={() => handleDeleteStudent(viewStudent._id)} style={{flex:1, padding:"10px", background:"#dc3545", color:"white", border:"none", borderRadius:"4px", cursor:"pointer", fontWeight:"bold"}}>🗑️ Delete</button>
                        </>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* EXPENSE FORM */}
      {showExpenseForm && (
        <div style={styles.popupOverlay}>
            <form onSubmit={handleAddExpense} style={styles.popupBox}>
                <h3 style={{marginTop:0, color:"#0d47a1"}}>Add New Expense</h3>
                <input placeholder="Expense Title" value={newExpense.title} onChange={e=>setNewExpense({...newExpense, title:e.target.value})} style={styles.input} required />
                <input type="number" placeholder="Amount" value={newExpense.amount} onChange={e=>setNewExpense({...newExpense, amount:e.target.value})} style={styles.input} required />
                <select value={newExpense.category} onChange={e=>setNewExpense({...newExpense, category:e.target.value})} style={styles.input}>
                    <option>Office</option><option>Salary</option><option>Rent</option><option>Other</option>
                </select>
                <div style={{display:"flex", gap:"10px"}}>
                    <button style={{flex:1, padding:"10px", background:"#007bff", color:"white", border:"none", borderRadius:"4px", cursor:"pointer", fontWeight:"bold"}}>Save</button>
                    <button type="button" onClick={()=>setShowExpenseForm(false)} style={{flex:1, padding:"10px", background:"#dc3545", color:"white", border:"none", borderRadius:"4px", cursor:"pointer", fontWeight:"bold"}}>Close</button>
                </div>
            </form>
        </div>
      )}

      {/* EXPENSE HISTORY */}
      {viewExpenseHistory && (
        <div style={styles.popupOverlay}>
            <div style={styles.popupBox}>
                <div style={{display:"flex", justifyContent:"space-between", marginBottom:"15px"}}>
                    <h3 style={{margin:0}}>Today's Expenses</h3>
                    <button onClick={()=>setViewExpenseHistory(false)} style={{border:"none", background:"none", fontSize:"18px", cursor:"pointer"}}>X</button>
                </div>
                {expenses.filter(e => new Date(e.date).toISOString().split('T')[0] === selectedDate).map(exp => (
                    <div key={exp._id} style={{display:"flex", justifyContent:"space-between", padding:"10px", borderBottom:"1px solid #eee"}}>
                        <span>{exp.title}</span>
                        <div>
                            <span style={{fontWeight:"bold", color:"red", marginRight:"10px"}}>₹{exp.amount}</span>
                            <button onClick={()=>handleDeleteExpense(exp._id)} style={{border:"none", background:"none", cursor:"pointer"}}>🗑️</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;