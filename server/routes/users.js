const router = require('express').Router();
const supabase = require('../config/supabase');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// ──────────────────────────────────────────────
// GET /api/users  (admin only)
// ──────────────────────────────────────────────
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, is_active, avatar_url, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json({ status: 'success', results: users.length, data: { users } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/users/:id
// ──────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    // Allow own profile or admin
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Not authorised.' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, avatar_url, bio, is_active, created_at')
      .eq('id', req.params.id)
      .single();
    if (error || !user) return res.status(404).json({ status: 'error', message: 'User not found.' });
    res.status(200).json({ status: 'success', data: { user } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// PUT /api/users/:id  (admin only)
// ──────────────────────────────────────────────
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const allowed = ['name', 'email', 'role', 'is_active', 'bio', 'avatar_url'];
    const updates = { updated_at: new Date().toISOString() };
    Object.entries(req.body).forEach(([key, val]) => {
      if (allowed.includes(key)) updates[key] = val;
    });

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, name, email, role, is_active, avatar_url, bio, created_at')
      .single();
    if (error) throw error;
    res.status(200).json({ status: 'success', data: { user } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// DELETE /api/users/:id  (admin only)
// ──────────────────────────────────────────────
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(200).json({ status: 'success', data: {} });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
