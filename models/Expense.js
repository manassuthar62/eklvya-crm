const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    title: { type: String, required: true },   // Karch kis cheez ka (Chai, Bill, Rent)
    amount: { type: Number, required: true },  // Kitne rupaye
    category: { type: String, default: "Office" }, // Category
    date: { type: Date, default: Date.now }    // Kab hua
});

module.exports = mongoose.model('Expense', expenseSchema);