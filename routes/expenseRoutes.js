const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// 1. ADD EXPENSE
router.post('/add', async (req, res) => {
    try {
        const { title, amount, category, date } = req.body;
        const newExpense = new Expense({ 
            title, 
            amount, 
            category,
            date: date || new Date() 
        });
        await newExpense.save();
        res.status(201).json({ message: "Expense Added!" });
    } catch (error) {
        res.status(500).json({ message: "Error" });
    }
});

// 2. GET ALL EXPENSES
router.get('/all', async (req, res) => {
    try {
        const expenses = await Expense.find();
        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).json({ message: "Error" });
    }
});

// 3. DELETE EXPENSE
router.delete('/delete/:id', async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error" });
    }
});
// 👇 DELETE EXPENSE ROUTE (Ise routes/expense.js me sabse neeche dalein)
router.delete('/delete/:id', async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Expense Deleted Successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting expense" });
    }
});
module.exports = router;