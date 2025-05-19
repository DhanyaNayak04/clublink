const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  // Add field to store PDF data or path
  pdfData: {
    type: String  // This will store base64 encoded PDF
  },
  // Add field to track email status
  emailSent: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Compound index to ensure one certificate per student per event
certificateSchema.index({ event: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);
