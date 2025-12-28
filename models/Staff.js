const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    name: { type: String, required: true },     // Staff ka asli naam
    username: { type: String, required: true, unique: true }, // Login ID
    password: { type: String, required: true }, // Login Password
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Staff', staffSchema);