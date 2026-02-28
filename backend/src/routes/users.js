const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// GET /api/users - List users (admin only)
router.get('/', requireRole('admin', 'quality_engineer'), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, display_name, role, created_at FROM users ORDER BY display_name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/me - Get current user profile
router.get('/me', async (req, res) => {
  res.json(req.user);
});

// PUT /api/users/me - Update own profile
router.put('/me', async (req, res) => {
  try {
    const { display_name } = req.body;
    const result = await pool.query(
      'UPDATE users SET display_name=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [display_name, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/role - Update user role (admin only)
router.put('/:id/role', requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    const result = await pool.query(
      'UPDATE users SET role=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [role, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
