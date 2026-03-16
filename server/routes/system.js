const router = require('express').Router();
const supabase = require('../config/supabase');
const { protect, authorize } = require('../middleware/auth');

const SETTINGS_KEY = 'global';

// ──────────────────────────────────────────────
// GET /api/system/settings  (admin only)
// ──────────────────────────────────────────────
router.get('/settings', protect, authorize('admin'), async (req, res) => {
  try {
    const { data: row, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    if (error) throw error;

    // Default settings if none exist yet
    const defaults = {
      siteName: 'StudyBuddy',
      supportEmail: 'support@studybuddy.com',
      maintenanceMode: false,
      allowRegistrations: true,
      themePrimaryColor: '#0891B2'
    };

    const settings = row ? { ...defaults, ...row.value } : defaults;

    res.status(200).json({ status: 'success', data: { settings } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// PUT /api/system/settings  (admin only)
// ──────────────────────────────────────────────
router.put('/settings', protect, authorize('admin'), async (req, res) => {
  try {
    const { siteName, supportEmail, maintenanceMode, allowRegistrations, themePrimaryColor } = req.body;
    const payload = {};
    if (siteName !== undefined) payload.siteName = siteName;
    if (supportEmail !== undefined) payload.supportEmail = supportEmail;
    if (maintenanceMode !== undefined) payload.maintenanceMode = maintenanceMode;
    if (allowRegistrations !== undefined) payload.allowRegistrations = allowRegistrations;
    if (themePrimaryColor !== undefined) payload.themePrimaryColor = themePrimaryColor;

    // Get existing value to merge
    const { data: existing } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    const mergedValue = { ...(existing?.value || {}), ...payload };

    const { data: row, error } = await supabase
      .from('system_settings')
      .upsert({ key: SETTINGS_KEY, value: mergedValue, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select('*')
      .single();

    if (error) throw error;

    res.status(200).json({ status: 'success', data: { settings: row.value } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
