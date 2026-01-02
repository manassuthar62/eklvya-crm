const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// 1. ADD STUDENT
router.post('/add', async (req, res) => {
    try {
        const { name, fatherName, dob, mobile, address, course, totalFee, discount, emis, addedBy } = req.body;
        
        let needsApproval = discount > 0 ? true : false;
        let isApproved = discount > 0 ? false : true;
        const finalFee = totalFee - discount;

        const newStudent = new Student({
            name, fatherName, dob, mobile, address, course,
            fees: { totalFee, discount, finalFee, paidAmount: 0 },
            approval: { needsApproval, isApproved },
            emis: emis || [],
            paymentHistory: [],
            admissionDate: new Date(),
            addedBy: addedBy || 'Admin',
            isOnlineSubmitted: false // Default Pending rahega
        });

        await newStudent.save();
        res.status(201).json({ message: "Saved!" });
    } catch (error) {
        res.status(500).json({ message: "Error" });
    }
});

// 2. GET ALL
router.get('/all', async (req, res) => {
    try {
        const students = await Student.find();
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: "Error" });
    }
});

// 3. GET MY STUDENTS
router.get('/my-students/:staffName', async (req, res) => {
    try {
        const staffName = req.params.staffName;
        const students = await Student.find({ addedBy: staffName });
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: "Error" });
    }
});

// 4. PAY AMOUNT
router.put('/pay-amount/:id', async (req, res) => {
    try {
        const { amount, remark } = req.body;
        const student = await Student.findById(req.params.id);
        if (student) {
            student.fees.paidAmount += Number(amount);
            student.paymentHistory.push({
                amount: Number(amount),
                date: new Date(),
                remark: remark || "Fee Payment"
            });
            await student.save();
            res.status(200).json({ message: "Payment Received!" });
        } else {
            res.status(404).json({ message: "Student not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error" });
    }
});

// 5. APPROVE
router.put('/approve/:id', async (req, res) => {
    try {
        await Student.findByIdAndUpdate(req.params.id, {
            'approval.isApproved': true,
            'approval.needsApproval': false
        });
        res.status(200).json({ message: "Approved!" });
    } catch (error) {
        res.status(500).json({ message: "Error" });
    }
});

// 👇 6. TOGGLE ONLINE FORM STATUS (NAYA FEATURE)
router.put('/toggle-online/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (student) {
            // Jo bhi status hai, uska ulta (Pending <-> Done) kar do
            student.isOnlineSubmitted = !student.isOnlineSubmitted;
            await student.save();
            res.json({ success: true, status: student.isOnlineSubmitted });
        } else {
            res.status(404).json({ message: "Student not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating status" });
    }
});

// 7. DELETE STUDENT
router.delete('/delete/:id', async (req, res) => {
    try {
        const deletedStudent = await Student.findByIdAndDelete(req.params.id);
        if (!deletedStudent) {
            return res.status(404).json({ success: false, message: "Student nahi mila" });
        }
        res.json({ success: true, message: "Student Deleted Successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error deleting student" });
    }
});

module.exports = router;