const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/dashboard/summary - KPI summary
router.get('/summary', async (req, res) => {
  try {
    const [total, byStatus, bySeverity, byType, overdue, avgResolution] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM complaints'),
      pool.query(`SELECT status, COUNT(*) as count FROM complaints GROUP BY status ORDER BY count DESC`),
      pool.query(`SELECT severity, COUNT(*) as count FROM complaints GROUP BY severity ORDER BY count DESC`),
      pool.query(`SELECT complaint_type, COUNT(*) as count FROM complaints WHERE complaint_type IS NOT NULL GROUP BY complaint_type`),
      pool.query(`SELECT COUNT(*) as count FROM corrective_actions WHERE status NOT IN ('completed','verified') AND target_date < NOW()`),
      pool.query(`SELECT ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/86400)::numeric, 1) as avg_days FROM complaints WHERE status = 'closed'`),
    ]);
    res.json({
      total: parseInt(total.rows[0].total),
      by_status: byStatus.rows,
      by_severity: bySeverity.rows,
      by_type: byType.rows,
      overdue_actions: parseInt(overdue.rows[0].count),
      avg_resolution_days: parseFloat(avgResolution.rows[0].avg_days) || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/trends - Monthly trend data
router.get('/trends', async (req, res) => {
  try {
    const months = parseInt(req.query.months || 12);
    const result = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'closed') as closed,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical,
        COUNT(*) FILTER (WHERE severity = 'high') as high
      FROM complaints
      WHERE created_at >= NOW() - INTERVAL '${months} months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/top-issues - Top defect categories
router.get('/top-issues', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT defect_category, COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
      FROM complaints
      WHERE defect_category IS NOT NULL
      GROUP BY defect_category
      ORDER BY count DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/actions-due - Upcoming/overdue actions
router.get('/actions-due', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ca.*, c.complaint_number, c.title, u.display_name as responsible_name
      FROM corrective_actions ca
      JOIN complaints c ON ca.complaint_id = c.id
      LEFT JOIN users u ON ca.responsible_person = u.id
      WHERE ca.status NOT IN ('completed','verified')
        AND ca.target_date <= NOW() + INTERVAL '7 days'
      ORDER BY ca.target_date ASC
      LIMIT 20
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
