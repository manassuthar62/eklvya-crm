const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');

// 1. ADD NEW STAFF (Sirf Admin karega)
router.post('/add', async (req, res) => {
    try {
        const { name, username, password } = req.body;
        const newStaff = new Staff({ name, username, password });
        await newStaff.save();
        res.status(201).json({ message: "New Staff Created!" });
    } catch (error) {
        res.status(500).json({ message: "Error creating staff" });
    }
});

// 2. GET ALL STAFF
router.get('/all', async (req, res) => {
    try {
        const staffs = await Staff.find();
        res.status(200).json(staffs);
    } catch (error) {
        res.status(500).json({ message: "Error fetching list" });
    }
});

// 3. DELETE STAFF
router.delete('/delete/:id', async (req, res) => {
    try {
        await Staff.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Staff Deleted!" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting" });
    }
});

// 4. STAFF LOGIN CHECK (Asli Login Logic)
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Database me check karo
        const staff = await Staff.findOne({ username, password });

        if (staff) {
            res.status(200).json({ success: true, name: staff.name });
        } else {
            res.status(401).json({ success: false, message: "Wrong ID/Pass" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;