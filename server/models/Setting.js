const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  siteName: { type: String, default: 'Study Buddy' },
  supportEmail: { type: String, default: 'support@studybuddy.local' },
  maintenanceMode: { type: Boolean, default: false },
  allowRegistrations: { type: Boolean, default: true },
  themePrimaryColor: { type: String, default: '#3b82f6' }
}, { timestamps: true });

module.exports = mongoose.model('Setting', SettingSchema);


