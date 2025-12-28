const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// DATABASE
mongoose.connect("mongodb+srv://manas:Man1234@cluster0.aeev3kv.mongodb.net/?appName=Cluster0")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ DB Error:", err.message));

// --- ROUTES LOADER (Suraksha Kavach) ---
// Agar koi file nahi mili to server crash nahi hoga, bas error dikhayega.

try {
    app.use('/api/student', require('./routes/studentRoutes'));
    console.log("✅ Student Routes Loaded");
} catch (e) { console.log("⚠️ Student Route Missing or Error"); }

try {
    app.use('/api/staff', require('./routes/staffRoutes'));
    console.log("✅ Staff Routes Loaded");
} catch (e) { console.log("⚠️ Staff Route Missing: File check karein 'routes/staffRoutes.js'"); }

try {
    app.use('/api/expense', require('./routes/expenseRoutes'));
    console.log("✅ Expense Routes Loaded");
} catch (e) { console.log("⚠️ Expense Route Missing: File check karein 'routes/expenseRoutes.js'"); }


app.get('/', (req, res) => res.send('Server OK'));

app.listen(5000, () => console.log("🚀 Server Started on Port 5000"));