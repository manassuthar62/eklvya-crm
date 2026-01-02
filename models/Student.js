const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    fatherName: { type: String, required: true },
    dob: { type: String, required: true },
    mobile: { type: String, required: true },
    address: { type: String, required: true },
    course: { type: String, required: true },
    
    // FEES
    fees: {
        totalFee: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        finalFee: { type: Number, required: true },
        paidAmount: { type: Number, default: 0 }
    },
    
    approval: {
        needsApproval: { type: Boolean, default: false },
        isApproved: { type: Boolean, default: false }
    },
    
    paymentHistory: [
        {
            amount: Number,
            date: { type: Date, default: Date.now },
            remark: String
        }
    ],

    emis: [{ amount: Number, dueDate: String }],

    admissionDate: { type: Date, default: Date.now },
    
    addedBy: { type: String, default: 'Staff Panel' },

    // 👇 NAYA FIELD: Govt Form Status (Pending / Done)
    isOnlineSubmitted: { type: Boolean, default: false } 
});

module.exports = mongoose.model('Student', studentSchema);