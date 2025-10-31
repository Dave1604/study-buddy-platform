const Setting = require('../models/Setting');

// @desc    Get system settings
// @route   GET /api/system/settings
// @access  Private (Admin)
exports.getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.status(200).json({ status: 'success', data: { settings } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Update system settings
// @route   PUT /api/system/settings
// @access  Private (Admin)
exports.updateSettings = async (req, res) => {
  try {
    const payload = (({ siteName, supportEmail, maintenanceMode, allowRegistrations, themePrimaryColor }) => ({
      siteName, supportEmail, maintenanceMode, allowRegistrations, themePrimaryColor
    }))(req.body || {});

    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create(payload);
    } else {
      Object.assign(settings, payload);
      await settings.save();
    }

    res.status(200).json({ status: 'success', data: { settings } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};


