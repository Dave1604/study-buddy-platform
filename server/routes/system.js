const router = require('express').Router();
const supabase = require('../config/supabase');
const { protect, authorize } = require('../middleware/auth');

// ──────────────────────────────────────────────
// GET /api/system/settings  (admin only)
// Returns site-wide settings. Falls back to defaults if the
// system_settings table doesn't exist yet.
// ──────────────────────────────────────────────
router.get('/settings', protect, authorize('admin'), async (req, res) => {
  try {
    const defaults = {
      siteName: 'StudyBuddy',
      supportEmail: 'support@studybuddy.com',
      maintenanceMode: false,
      allowRegistrations: true,
      themePrimaryColor: '#0891B2'
    };

    const { data: row, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      // Table may not exist — return defaults
      return res.status(200).json({ status: 'success', data: { settings: defaults } });
    }

    const settings = row ? {
      siteName: row.site_name || defaults.siteName,
      supportEmail: row.support_email || defaults.supportEmail,
      maintenanceMode: row.maintenance_mode || defaults.maintenanceMode,
      allowRegistrations: row.allow_registrations !== undefined ? row.allow_registrations : defaults.allowRegistrations,
      themePrimaryColor: row.theme_primary_color || defaults.themePrimaryColor
    } : defaults;

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

    const updates = { updated_at: new Date().toISOString() };
    if (siteName !== undefined) updates.site_name = siteName;
    if (supportEmail !== undefined) updates.support_email = supportEmail;
    if (maintenanceMode !== undefined) updates.maintenance_mode = maintenanceMode;
    if (allowRegistrations !== undefined) updates.allow_registrations = allowRegistrations;
    if (themePrimaryColor !== undefined) updates.theme_primary_color = themePrimaryColor;

    const { data: row, error } = await supabase
      .from('system_settings')
      .upsert({ id: 1, ...updates }, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) throw error;

    const settings = {
      siteName: row.site_name,
      supportEmail: row.support_email,
      maintenanceMode: row.maintenance_mode,
      allowRegistrations: row.allow_registrations,
      themePrimaryColor: row.theme_primary_color
    };

    res.status(200).json({ status: 'success', data: { settings } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
