const { admin } = require('../config/firebase');
const { pool } = require('../db/pool');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    // Get or create user in DB
    const result = await pool.query(
      `INSERT INTO users (email, display_name, firebase_uid)
       VALUES ($1, $2, $3)
       ON CONFLICT (firebase_uid) DO UPDATE SET email = $1, display_name = $2
       RETURNING *`,
      [decoded.email, decoded.name || decoded.email, decoded.uid]
    );
    req.user = result.rows[0];
    req.firebaseUser = decoded;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
