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
    setEditFormData(std); // Edit ke liye data ready
    setIsEditing(false); // Shuru me edit mode band rahega
  };

  // 👇 SAVE CHANGES FUNCTION
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
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: "white", padding: "15px", borderRadius: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", flexWrap: "wrap", gap: "10px" },
    card: { background: "white", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", textAlign: "center", flex: 1, minWidth: "150px" },
    tableHeader: { background: "#f8fafc", color: "#64748b", fontWeight: "600", padding: "12px", fontSize: "13px", textAlign: "left" },
    tableCell: { padding: "12px", borderBottom: "1px solid #f1f5f9", fontSize: "14px" },
    btnAction: { padding: "5px 10px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "bold", marginLeft: "5px" },
    input: { width: "100%", padding: "8px", border: "1px solid #3b82f6", borderRadius: "5px", marginBottom: "5px", fontSize: "14px", boxSizing: "border-box", background: "#eff6ff" }
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h2 style={{margin:0, color:"#1e293b"}}>🚀 Admin</h2>
        <div style={{display:"flex", gap:"10px", flexWrap:"wrap"}}>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{padding:"8px", borderRadius:"8px", border:"1px solid #ccc"}} />
            <button onClick={handleDownloadReport} style={{...styles.btnAction, background:"#10b981", color:"white"}}>📥 Report</button>
            <button onClick={() => setShowExpenseForm(true)} style={{...styles.btnAction, background:"#6366f1", color:"white"}}>+ Expense</button>
            <button onClick={() => navigate('/admin/staff-manager')} style={{...styles.btnAction, background:"white", border:"1px solid #333"}}>Staff</button>
            <button onClick={() => navigate('/')} style={{...styles.btnAction, background:"#ef4444", color:"white"}}>Logout</button>
        </div>
      </div>

      {/* STATS */}
      <div style={{display:"flex", gap:"15px", flexWrap:"wrap", marginBottom:"20px"}}>
        <div style={{...styles.card, borderTop:"4px solid #f59e0b"}}><h4>Cash In</h4><h2 style={{color:"#1e293b"}}>₹{stats.dayCollection}</h2></div>
        <div onClick={()=>setViewExpenseHistory(true)} style={{...styles.card, borderTop:"4px solid #ef4444", cursor:"pointer"}}><h4>Expense</h4><h2 style={{color:"#ef4444"}}>₹{stats.dayExpense}</h2></div>
        <div style={{...styles.card, borderTop:"4px solid #10b981"}}><h4>Profit</h4><h2 style={{color:"#10b981"}}>₹{stats.netProfit}</h2></div>
        <div style={{...styles.card, borderTop:"4px solid #dc2626"}}><h4>Pending</h4><h2 style={{color:"#dc2626"}}>₹{stats.totalPending}</h2></div>
        <div style={{...styles.card, borderTop:"4px solid #3b82f6"}}><h4>Admissions</h4><h2 style={{color:"#3b82f6"}}>{stats.dayAdmissions}</h2></div>
      </div>

      {/* TABLE */}
      <div style={{background:"white", borderRadius:"16px", padding:"10px", overflowX:"auto"}}>
        <h3 style={{margin:"10px"}}>📄 Students ({students.length})</h3>
        <table style={{width:"100%", borderCollapse:"collapse", minWidth:"600px"}}>
            <thead>
                <tr><th style={styles.tableHeader}>Name</th><th style={styles.tableHeader}>Mobile</th><th style={styles.tableHeader}>Fees</th><th style={styles.tableHeader}>Action</th></tr>
            </thead>
            <tbody>
                {students.map(std => (
                    <tr key={std._id}>
                        <td style={styles.tableCell}><strong>{std.name}</strong><br/><small style={{color:"gray"}}>{std.course}</small></td>
                        <td style={styles.tableCell}>{std.mobile}</td>
                        <td style={styles.tableCell}><span style={{color:"green"}}>Paid: ₹{std.fees.paidAmount}</span><br/><span style={{color:"red"}}>Bal: ₹{std.fees.finalFee - std.fees.paidAmount}</span></td>
                        <td style={styles.tableCell}>
                            {!std.approval.isApproved ? (
                                <button onClick={()=>handleApprove(std._id)} style={{...styles.btnAction, background:"orange"}}>Approve</button>
                            ) : (
                                // 👇 Yaha change kiya hai function call
                                <button onClick={()=>openStudentPopup(std)} style={{...styles.btnAction, background:"#dcfce7", color:"green"}}>View 👁️</button>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* --- STUDENT DETAIL POPUP (EDITABLE) --- */}
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
                    
                    {/* Name Field */}
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
                                {/* EDIT BUTTON ACTIVATES EDIT MODE */}
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

export default Dashboard;