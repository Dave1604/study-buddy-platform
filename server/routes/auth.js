const router = require('express').Router();
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const generateToken = require('../utils/generateToken');
const { protect } = require('../middleware/auth');

// ──────────────────────────────────────────────
// POST /api/auth/register
// ──────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, firstName, lastName, email, password, role } = req.body;

    // Accept either a combined 'name' field or separate first/last
    const fullName = name || `${firstName || ''} ${lastName || ''}`.trim();

    if (!fullName || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters'
      });
    }

    // Check for existing user
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email'
      });
    }

    const hash = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name: fullName,
        email: email.toLowerCase().trim(),
        password_hash: hash,
        role: role || 'student'
      })
      .select('id, name, email, role, avatar_url')
      .single();

    if (error) throw error;

    const token = generateToken(user.id);

    res.status(201).json({
      status: 'success',
      data: { user, token }
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, avatar_url, bio, password_hash, is_active')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        status: 'error',
        message: 'Account has been deactivated'
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    const { password_hash, is_active, ...safeUser } = user;
    const token = generateToken(user.id);

    res.status(200).json({
      status: 'success',
      data: { user: safeUser, token }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/auth/me
// ──────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    // Enrich with enrollment count
    const { count: enrollmentCount } = await supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          ...req.user,
          enrollmentCount: enrollmentCount || 0
        }
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
// PUT /api/auth/profile
// ──────────────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, firstName, lastName, bio, avatar, avatar_url } = req.body;

    const updates = {};
    const fullName = name || (firstName || lastName ? `${firstName || ''} ${lastName || ''}`.trim() : null);
    if (fullName) updates.name = fullName;
    if (bio !== undefined) updates.bio = bio;
    const avatarValue = avatar_url || avatar;
    if (avatarValue !== undefined) updates.avatar_url = avatarValue;
    updates.updated_at = new Date().toISOString();

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, name, email, role, avatar_url, bio')
      .single();

    if (error) throw error;

    res.status(200).json({ status: 'success', data: { user } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
