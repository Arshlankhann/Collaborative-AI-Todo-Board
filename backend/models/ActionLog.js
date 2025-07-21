const mongoose = require('mongoose');

const ActionLogSchema = new mongoose.Schema({
  user: { type: String, required: true }, // Storing username directly for simplicity
  action: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('ActionLog', ActionLogSchema);