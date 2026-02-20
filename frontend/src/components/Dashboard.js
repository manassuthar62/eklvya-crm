
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// 👇 LIVE SERVER LINK
const BASE_URL = "https://eklvya-crm.onrender.com/api";

function Dashboard() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [expenses, setExpenses] = useState([]);

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // 🔍 SEARCH & FILTERS
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCourse, setFilterCourse] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");

    // POPUP STATE
    const [viewStudent, setViewStudent] = useState(null);
    const [editStudent, setEditStudent] = useState(null);
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
        if (students.length > 0 || expenses.length > 0) {
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

    // 🔍 FILTER LOGIC
    const filteredStudents = useMemo(() => {
        return students.filter(std => {
            const matchesSearch = std.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                std.mobile.includes(searchTerm);
            const matchesCourse = filterCourse === "All" || std.course === filterCourse;

            let matchesStatus = true;
            if (filterStatus === "Paid") matchesStatus = (std.fees.finalFee - std.fees.paidAmount) <= 0;
            if (filterStatus === "Pending") matchesStatus = (std.fees.finalFee - std.fees.paidAmount) > 0;

            return matchesSearch && matchesCourse && matchesStatus;
        });
    }, [students, searchTerm, filterCourse, filterStatus]);

    // 📊 COURSE ANALYTICS LOGIC
    const courseStats = useMemo(() => {
        const stats = {};
        students.forEach(std => {
            stats[std.course] = (stats[std.course] || 0) + 1;
        });
        return stats;
    }, [students]);

    // 👇 DELETE STUDENT FUNCTION
    const handleDeleteStudent = async (id) => {
        if (window.confirm("⚠️ WARNING: Kya aap is student ko HAMESHA ke liye delete karna chahte hain?")) {
            try {
                await axios.delete(`${BASE_URL}/student/delete/${id}`);
                alert("🗑️ Student Deleted!");
                setViewStudent(null);
                loadData();
            } catch (error) { alert("Error deleting student"); }
        }
    };

    // 👇 UPDATE STUDENT FUNCTION
    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        try {
            // Recalculate Final Fee before sending
            const updatedStudent = { ...editStudent };
            updatedStudent.fees.finalFee = updatedStudent.fees.totalFee - updatedStudent.fees.discount;

            await axios.put(`${BASE_URL}/student/update/${editStudent._id}`, updatedStudent);
            alert("✅ Student Updated Successfully!");
            setEditStudent(null);
            setViewStudent(null);
            loadData();
        } catch (error) { alert("Error updating student"); }
    };

    // 👇 DELETE EXPENSE FUNCTION
    const handleDeleteExpense = async (id) => {
        if (window.confirm("⚠️ Delete Expense?")) {
            try {
                await axios.delete(`${BASE_URL}/expense/delete/${id}`);
                alert("🗑️ Expense Deleted!");
                loadData();
            } catch (error) { alert("Error deleting expense"); }
        }
    };

    // 👇 TOGGLE ONLINE FORM STATUS
    const toggleOnlineStatus = async (student) => {
        try {
            const res = await axios.put(`${BASE_URL}/student/toggle-online/${student._id}`);
            if (res.data.success) {
                const updatedStudent = { ...student, isOnlineSubmitted: !student.isOnlineSubmitted };
                setViewStudent(updatedStudent);
                loadData();
            }
        } catch (error) { alert("Error updating status"); }
    };

    // 👇 REPORT DOWNLOAD
    const handleDownloadReport = () => {
        const targetMonth = selectedDate.substring(0, 7);
        let csvContent = "Date,Type,Description,Category,Amount\n";

        students.forEach(std => {
            std.paymentHistory.forEach(pay => {
                if (pay.date.startsWith(targetMonth)) {
                    const row = `${new Date(pay.date).toLocaleDateString()},INCOME,${std.name} (${std.course}),Fee Collection,${pay.amount}`;
                    csvContent += row + "\n";
                }
            });
        });

        expenses.forEach(exp => {
            if (exp.date.startsWith(targetMonth)) {
                const row = `${new Date(exp.date).toLocaleDateString()},EXPENSE,${exp.title},${exp.category},-${exp.amount}`;
                csvContent += row + "\n";
            }
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
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
            if (admDate === dateToCheck) { adm++; }
            if (std.paymentHistory) {
                std.paymentHistory.forEach(pay => {
                    if (new Date(pay.date).toISOString().split('T')[0] === dateToCheck) coll += pay.amount;
                });
            }
        });

        if (expData) {
            expData.forEach(exp => {
                let expDate = new Date(exp.date).toISOString().split('T')[0];
                if (expDate === dateToCheck) totalExpense += exp.amount;
            });
        }

        setStats({
            dayAdmissions: adm, dayCollection: coll, dayExpense: totalExpense, netProfit: coll - totalExpense, totalPending: allPending
        });
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!newExpense.title || !newExpense.amount) return alert("Detail bharo!");
        try {
            await axios.post(`${BASE_URL}/expense/add`, { ...newExpense, date: selectedDate });
            setShowExpenseForm(false);
            setNewExpense({ title: '', amount: '', category: 'Office' });
            loadData();
        } catch (error) { alert("Error adding expense"); }
    };

    const handleApprove = async (id) => {
        if (window.confirm("Approve discount?")) {
            await axios.put(`${BASE_URL}/student/approve/${id}`);
            loadData();
        }
    };

    // --- STYLES ---
    const styles = {
        container: { maxWidth: "1250px", margin: "0 auto", padding: "20px", fontFamily: "'Inter', 'Segoe UI', sans-serif", background: "#f8fafc", minHeight: "100vh" },
        header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", background: "white", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", flexWrap: "wrap", gap: "20px" },
        title: { margin: 0, color: "#0f172a", fontSize: "24px", fontWeight: "800", display: "flex", alignItems: "center", gap: "10px" },
        controls: { display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" },

        // Modern Buttons with Gradients & Shadows
        btnPrimary: { background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", color: "white", padding: "10px 20px", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "600", fontSize: "14px", boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)", transition: "transform 0.2s" },
        btnSuccess: { background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white", padding: "10px 20px", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "600", fontSize: "14px", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)" },
        btnDanger: { background: "#ef4444", color: "white", padding: "10px 20px", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "600", fontSize: "14px" },
        btnOutline: { background: "white", border: "1px solid #e2e8f0", color: "#64748b", padding: "10px 20px", borderRadius: "12px", cursor: "pointer", fontWeight: "600", fontSize: "14px" },

        // Inputs & Search
        searchBar: { padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0", width: "250px", outline: "none", fontSize: "14px", background: "#f8fafc" },
        selectInput: { padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", background: "white", cursor: "pointer" },
        dateInput: { padding: "10px", borderRadius: "12px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", background: "white" },

        // Layout
        grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "30px" },

        // Premium Cards
        statCard: (color, bg) => ({
            background: "white", padding: "24px", borderRadius: "20px",
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)",
            borderLeft: `5px solid ${color}`, position: "relative", overflow: "hidden"
        }),

        // Table
        tableContainer: { background: "white", borderRadius: "20px", boxShadow: "0 4px 25px rgba(0,0,0,0.04)", overflow: "hidden", border: "1px solid #f1f5f9" },
        tableHeader: { background: "#f8fafc", color: "#64748b", fontWeight: "600", padding: "16px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "left" },
        tableRow: { borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" },
        tableCell: { padding: "16px", color: "#334155", verticalAlign: "middle", fontSize: "14px" },

        // Badges
        badge: (type) => ({
            padding: "6px 12px", borderRadius: "30px", fontSize: "12px", fontWeight: "700",
            background: type === 'paid' ? "#dcfce7" : type === 'pending' ? "#fee2e2" : "#f1f5f9",
            color: type === 'paid' ? "#166534" : type === 'pending' ? "#991b1b" : "#475569",
            border: `1px solid ${type === 'paid' ? "#bbf7d0" : type === 'pending' ? "#fecaca" : "#e2e8f0"}`
        })
    };

    return (
        <div style={styles.container}>

            {/* 🟢 HEADER SECTION */}
            <div style={styles.header}>
                <div style={styles.title}>🚀 EKLVYA DASHBOARD</div>
                <div style={styles.controls}>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={styles.dateInput} />
                    <button onClick={handleDownloadReport} style={styles.btnSuccess}>📊 Export Report</button>
                    <button onClick={() => setShowExpenseForm(true)} style={styles.btnPrimary}>+ New Expense</button>
                    <button onClick={() => navigate('/admin/staff-manager')} style={styles.btnOutline}>👥 Staff</button>
                    <button onClick={() => navigate('/')} style={styles.btnDanger}>Logout</button>
                </div>
            </div>

            {/* 🟢 STATS OVERVIEW CARDS */}
            <div style={styles.grid}>
                <div style={styles.statCard("#3b82f6")}>
                    <h4 style={{ margin: "0 0 10px", color: "#64748b", fontSize: "13px", textTransform: "uppercase" }}>Today's Admission</h4>
                    <h1 style={{ margin: 0, color: "#1e293b", fontSize: "32px", fontWeight: "800" }}>{stats.dayAdmissions}</h1>
                </div>
                <div style={styles.statCard("#f59e0b")}>
                    <h4 style={{ margin: "0 0 10px", color: "#64748b", fontSize: "13px", textTransform: "uppercase" }}>Cash Collection</h4>
                    <h1 style={{ margin: 0, color: "#1e293b", fontSize: "32px", fontWeight: "800" }}>₹{stats.dayCollection.toLocaleString()}</h1>
                </div>
                <div onClick={() => setViewExpenseHistory(true)} style={{ ...styles.statCard("#ef4444"), cursor: "pointer" }}>
                    <h4 style={{ margin: "0 0 10px", color: "#ef4444", fontSize: "13px", textTransform: "uppercase" }}>Today's Expense ➔</h4>
                    <h1 style={{ margin: 0, color: "#ef4444", fontSize: "32px", fontWeight: "800" }}>₹{stats.dayExpense.toLocaleString()}</h1>
                </div>
                <div style={styles.statCard("#10b981")}>
                    <h4 style={{ margin: "0 0 10px", color: "#10b981", fontSize: "13px", textTransform: "uppercase" }}>Net Profit</h4>
                    <h1 style={{ margin: 0, color: "#10b981", fontSize: "32px", fontWeight: "800" }}>₹{stats.netProfit.toLocaleString()}</h1>
                </div>
            </div>

            {/* 🟢 COURSE ANALYTICS CARDS */}
            <h3 style={{ color: "#334155", margin: "0 0 15px 0", fontSize: "18px" }}>📚 Enrollment Analytics</h3>
            <div style={{ ...styles.grid, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", marginBottom: "40px" }}>
                {Object.entries(courseStats).map(([course, count]) => (
                    <div key={course} style={{ background: "white", padding: "15px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", textAlign: "center", borderTop: "3px solid #6366f1" }}>
                        <h2 style={{ margin: "0", color: "#4f46e5", fontSize: "24px" }}>{count}</h2>
                        <span style={{ color: "#64748b", fontSize: "12px", fontWeight: "600" }}>{course}</span>
                    </div>
                ))}
            </div>

            {/* 🟢 FILTER & SEARCH BAR */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center", background: "white", padding: "15px", borderRadius: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                <input
                    placeholder="🔍 Search Student..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={styles.searchBar}
                />
                <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} style={styles.selectInput}>
                    <option value="All">All Courses</option>
                    <option>RS-CIT</option>
                    <option>P.G.D.C.A</option>
                    <option>Tally Prime</option>
                    <option>DCA</option>
                    <option>Full Stack Dev</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={styles.selectInput}>
                    <option value="All">All Status</option>
                    <option value="Paid">Fully Paid</option>
                    <option value="Pending">Pending Dues</option>
                </select>
                <span style={{ marginLeft: "auto", fontSize: "13px", color: "#64748b", fontWeight: "600" }}>Showing {filteredStudents.length} Students</span>
            </div>

            {/* 🟢 DATA TABLE */}
            <div style={styles.tableContainer}>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                        <thead>
                            <tr style={{ background: "#f8fafc" }}>
                                <th style={styles.tableHeader}>Student Name</th>
                                <th style={styles.tableHeader}>Course & Join Date</th>
                                <th style={styles.tableHeader}>Fee Status</th>
                                <th style={styles.tableHeader}>Verification</th>
                                <th style={styles.tableHeader}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((std) => (
                                <tr key={std._id} style={styles.tableRow}>
                                    <td style={styles.tableCell}>
                                        <div style={{ fontWeight: "700", color: "#1e293b" }}>{std.name}</div>
                                        <div style={{ fontSize: "12px", color: "#64748b" }}>{std.mobile}</div>
                                    </td>
                                    <td style={styles.tableCell}>
                                        <div style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px", display: "inline-block", fontSize: "12px", fontWeight: "600", color: "#475569" }}>{std.course}</div>
                                        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>{new Date(std.admissionDate).toLocaleDateString()}</div>
                                    </td>
                                    <td style={styles.tableCell}>
                                        <div style={{ fontSize: "13px", fontWeight: "600" }}>
                                            <span style={{ color: "#10b981" }}>Paid: ₹{std.fees.paidAmount}</span>
                                            {std.fees.finalFee - std.fees.paidAmount > 0 ? (
                                                <div style={{ color: "#ef4444", marginTop: "2px", fontSize: "12px" }}>Due: ₹{std.fees.finalFee - std.fees.paidAmount}</div>
                                            ) : (
                                                <div style={{ color: "#10b981", marginTop: "2px", fontSize: "12px" }}>✅ Completed</div>
                                            )}
                                        </div>
                                    </td>
                                    <td style={styles.tableCell}>
                                        {!std.approval.isApproved ? (
                                            <button onClick={() => handleApprove(std._id)} style={{ background: "#f59e0b", color: "white", padding: "6px 12px", borderRadius: "20px", border: "none", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>Needs Approval ⚠️</button>
                                        ) : (
                                            <span style={{ color: "#166534", background: "#dcfce7", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>Verified ✅</span>
                                        )}
                                    </td>
                                    <td style={styles.tableCell}>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button onClick={() => setViewStudent(std)} style={{ background: "white", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>View</button>
                                            <button onClick={() => setEditStudent(std)} style={{ background: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Edit</button> {/* NEW BUTTON */}
                                            <button onClick={() => handleDeleteStudent(std._id)} style={{ background: "#fee2e2", border: "1px solid #fecaca", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", color: "#991b1b" }}>Trash</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🟢 POPUPS (Unchanged Functionality, Just Rendering) */}
            {showExpenseForm && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100 }}>
                    <div style={{ background: "white", padding: "20px", borderRadius: "20px", width: "320px", margin: "20px" }}>
                        <h3 style={{ marginTop: 0, color: "#333", marginBottom: "15px" }}>💸 Add Expense</h3>
                        <form onSubmit={handleAddExpense}>
                            <input placeholder="Item Name" value={newExpense.title} onChange={e => setNewExpense({ ...newExpense, title: e.target.value })} style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", boxSizing: "border-box" }} required />
                            <input type="number" placeholder="Amount (₹)" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", boxSizing: "border-box" }} required />
                            <select value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })} style={{ width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", boxSizing: "border-box" }}>
                                <option>Office</option><option>Salary</option><option>Rent</option><option>Other</option>
                            </select>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button type="submit" style={{ flex: 1, background: "#1e293b", color: "white", padding: "10px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer" }}>Save</button>
                                <button type="button" onClick={() => setShowExpenseForm(false)} style={{ flex: 1, background: "#f1f5f9", color: "#64748b", padding: "10px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer" }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewExpenseHistory && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100 }}>
                    <div style={{ background: "white", padding: "20px", borderRadius: "10px", width: "90%", maxWidth: "500px", boxShadow: "0 5px 15px rgba(0,0,0,0.3)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ccc", paddingBottom: "10px", marginBottom: "10px" }}>
                            <h3 style={{ margin: 0, color: "#e74c3c" }}>📉 Expenses on {selectedDate}</h3>
                            <button onClick={() => setViewExpenseHistory(false)} style={{ background: "red", color: "white", border: "none", borderRadius: "50%", width: "25px", height: "25px", cursor: "pointer" }}>X</button>
                        </div>
                        {expenses.filter(e => new Date(e.date).toISOString().split('T')[0] === selectedDate).length > 0 ? (
                            <div style={{ overflowX: "auto" }}>
                                <table border="1" style={{ width: "100%", borderCollapse: "collapse", minWidth: "300px" }}>
                                    <thead style={{ background: "#eee" }}>
                                        <tr>
                                            <th style={{ padding: "5px" }}>Item</th>
                                            <th style={{ padding: "5px" }}>Amount</th>
                                            <th style={{ padding: "5px" }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expenses.filter(e => new Date(e.date).toISOString().split('T')[0] === selectedDate).map(exp => (
                                            <tr key={exp._id}>
                                                <td style={{ padding: "5px" }}>{exp.title}</td>
                                                <td style={{ padding: "5px", fontWeight: "bold", color: "red" }}>₹{exp.amount}</td>
                                                <td style={{ padding: "5px", textAlign: "center" }}>
                                                    <button onClick={() => handleDeleteExpense(exp._id)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "16px" }}>🗑️</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (<p style={{ textAlign: "center", color: "gray" }}>No expenses.</p>)}
                    </div>
                </div>
            )}

            {/* 👇 STUDENT DETAIL POPUP */}
            {viewStudent && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
                    <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "20px", width: "90%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                            <h2 style={{ margin: 0 }}>👤 {viewStudent.name}</h2>
                            <button onClick={() => setViewStudent(null)} style={{ background: "#f1f5f9", padding: "5px 10px", borderRadius: "50%", border: "none", cursor: "pointer" }}>✕</button>
                        </div>

                        <div style={{ textAlign: "center", marginBottom: "20px" }}>
                            {viewStudent.isOnlineSubmitted ? (
                                <span style={styles.badge('paid')}>✅ Govt Form Submitted</span>
                            ) : (
                                <span style={styles.badge('pending')}>🔴 Govt Form Pending</span>
                            )}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px", fontSize: "14px" }}>
                            <div><strong>Father:</strong> {viewStudent.fatherName}</div>
                            <div><strong>Course:</strong> {viewStudent.course}</div>
                            <div><strong>Mobile:</strong> {viewStudent.mobile}</div>
                            <div><strong>Address:</strong> {viewStudent.address}</div>
                            <div><strong>DOB:</strong> {viewStudent.dob}</div>
                            <div style={{ color: "purple" }}><strong>By:</strong> {viewStudent.addedBy || "Staff"}</div>
                        </div>

                        <div style={{ backgroundColor: "#f8fafc", padding: "15px", borderRadius: "12px", marginBottom: "20px" }}>
                            <h3 style={{ marginTop: 0, fontSize: "16px" }}>💰 Fee Summary</h3>
                            <p>Total: ₹{viewStudent.fees.totalFee} | Final: ₹{viewStudent.fees.finalFee}</p>
                            <p style={{ color: "green", fontWeight: "bold" }}>Paid: ₹{viewStudent.fees.paidAmount}</p>
                            <p style={{ color: "red", fontWeight: "bold" }}>Due: ₹{viewStudent.fees.finalFee - viewStudent.fees.paidAmount}</p>
                        </div>

                        <h3 style={{ marginTop: 0, fontSize: "16px" }}>📜 Payments</h3>
                        {viewStudent.paymentHistory.length > 0 ? (
                            <table style={{ width: "100%", fontSize: "13px", marginBottom: "20px" }}>
                                <tbody>
                                    {viewStudent.paymentHistory.map((pay, index) => (
                                        <tr key={index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "8px" }}>{new Date(pay.date).toLocaleDateString()}</td>
                                            <td style={{ padding: "8px", fontWeight: "bold" }}>₹{pay.amount}</td>
                                            <td style={{ padding: "8px", color: "#64748b" }}>{pay.remark}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <p style={{ color: "gray" }}>No payments yet.</p>}

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <button onClick={() => toggleOnlineStatus(viewStudent)} style={{ padding: "12px", background: "#f1f5f9", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "600" }}>
                                {viewStudent.isOnlineSubmitted ? "Mark Pending" : "Mark Submitted"}
                            </button>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button onClick={() => setEditStudent(viewStudent)} style={{ flex: 1, padding: "12px", background: "#3b82f6", color: "white", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "600" }}>✏️ Edit Data</button>
                                <button onClick={() => handleDeleteStudent(viewStudent._id)} style={{ flex: 1, padding: "12px", background: "#ef4444", color: "white", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "600" }}>🗑️ Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 👇 EDIT STUDENT MODAL */}
            {editStudent && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1200 }}>
                    <div style={{ background: "white", padding: "20px", borderRadius: "20px", width: "400px", margin: "20px", maxHeight: "90vh", overflowY: "auto" }}>
                        <h3 style={{ marginTop: 0, color: "#2c3e50", marginBottom: "15px" }}>✏️ Edit Student Details</h3>
                        <form onSubmit={handleUpdateStudent}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px" }}>Name</label>
                                    <input value={editStudent.name} onChange={e => setEditStudent({ ...editStudent, name: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0" }} required />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px" }}>Mobile</label>
                                    <input value={editStudent.mobile} onChange={e => setEditStudent({ ...editStudent, mobile: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0" }} required />
                                </div>
                            </div>

                            <div style={{ marginBottom: "10px" }}>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px" }}>Father Name</label>
                                <input value={editStudent.fatherName} onChange={e => setEditStudent({ ...editStudent, fatherName: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0" }} required />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px" }}>DOB</label>
                                    <input type="date" value={editStudent.dob} onChange={e => setEditStudent({ ...editStudent, dob: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0" }} required />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px" }}>Course</label>
                                    <select value={editStudent.course} onChange={e => setEditStudent({ ...editStudent, course: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                                        <option>RS-CIT</option><option>P.G.D.C.A</option><option>Tally Prime</option><option>DCA</option><option>Full Stack Dev</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: "10px" }}>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px" }}>Address</label>
                                <textarea value={editStudent.address} onChange={e => setEditStudent({ ...editStudent, address: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0" }} required />
                            </div>

                            {/* FEES EDIT SECTION */}
                            <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", marginBottom: "15px", border: "1px solid #e2e8f0" }}>
                                <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#64748b" }}>💰 Update Fees</h4>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <div>
                                        <label style={{ fontSize: "11px" }}>Total Fee</label>
                                        <input type="number" value={editStudent.fees.totalFee}
                                            onChange={e => setEditStudent({ ...editStudent, fees: { ...editStudent.fees, totalFee: e.target.value, finalFee: e.target.value - editStudent.fees.discount } })}
                                            style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "11px" }}>Discount</label>
                                        <input type="number" value={editStudent.fees.discount}
                                            onChange={e => setEditStudent({ ...editStudent, fees: { ...editStudent.fees, discount: e.target.value, finalFee: editStudent.fees.totalFee - e.target.value } })}
                                            style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginTop: "5px", fontSize: "12px", fontWeight: "bold", color: "#334155" }}>
                                    Final Fee: ₹{editStudent.fees.totalFee - editStudent.fees.discount}
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "10px" }}>
                                <button type="submit" style={{ flex: 1, background: "#3b82f6", color: "white", padding: "10px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer" }}>Save Update</button>
                                <button type="button" onClick={() => setEditStudent(null)} style={{ flex: 1, background: "#f1f5f9", color: "#64748b", padding: "10px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer" }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Dashboard;
