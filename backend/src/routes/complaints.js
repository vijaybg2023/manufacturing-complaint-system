const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// All routes require auth
router.use(authenticate);

// GET /api/complaints - List all complaints with filters
router.get('/', async (req, res) => {
  try {
    const { status, severity, type, assigned_to, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = `
      SELECT c.*, 
        u1.display_name as created_by_name,
        u2.display_name as assigned_to_name
      FROM complaints c
      LEFT JOIN users u1 ON c.created_by = u1.id
      LEFT JOIN users u2 ON c.assigned_to = u2.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { params.push(status); query += ` AND c.status = $${params.length}`; }
    if (severity) { params.push(severity); query += ` AND c.severity = $${params.length}`; }
    if (type) { params.push(type); query += ` AND c.complaint_type = $${params.length}`; }
    if (assigned_to) { params.push(assigned_to); query += ` AND c.assigned_to = $${params.length}`; }
    query += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM complaints');
    res.json({ data: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/complaints/:id - Get single complaint with 8D report and actions
router.get('/:id', async (req, res) => {
  try {
    const complaint = await pool.query(
      `SELECT c.*, u1.display_name as created_by_name, u2.display_name as assigned_to_name
       FROM complaints c
       LEFT JOIN users u1 ON c.created_by = u1.id
       LEFT JOIN users u2 ON c.assigned_to = u2.id
       WHERE c.id = $1`, [req.params.id]
    );
    if (!complaint.rows.length) return res.status(404).json({ error: 'Not found' });
    const eightD = await pool.query('SELECT * FROM eight_d_reports WHERE complaint_id = $1', [req.params.id]);
    const actions = await pool.query(
      `SELECT ca.*, u.display_name as responsible_name FROM corrective_actions ca
       LEFT JOIN users u ON ca.responsible_person = u.id
       WHERE ca.complaint_id = $1 ORDER BY ca.created_at`, [req.params.id]
    );
    const attachments = await pool.query('SELECT * FROM attachments WHERE complaint_id = $1', [req.params.id]);
    res.json({ ...complaint.rows[0], eight_d: eightD.rows[0] || null, corrective_actions: actions.rows, attachments: attachments.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/complaints - Create complaint
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const num = await client.query("SELECT 'COMP-' || LPAD(nextval('complaint_seq')::text, 6, '0') as num");
    const { title, description, customer_name, customer_part_number, internal_part_number,
      complaint_date, severity, complaint_type, defect_category, defect_quantity,
      total_quantity, production_date, lot_number, assigned_to } = req.body;
    const result = await client.query(
      `INSERT INTO complaints (complaint_number, title, description, customer_name, customer_part_number,
        internal_part_number, complaint_date, severity, complaint_type, defect_category, defect_quantity,
        total_quantity, production_date, lot_number, assigned_to, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [num.rows[0].num, title, description, customer_name, customer_part_number, internal_part_number,
        complaint_date || new Date(), severity || 'medium', complaint_type, defect_category,
        defect_quantity, total_quantity, production_date, lot_number, assigned_to, req.user.id]
    );
    // Auto-create 8D report shell
    await client.query(
      'INSERT INTO eight_d_reports (complaint_id, created_by) VALUES ($1, $2)',
      [result.rows[0].id, req.user.id]
    );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT /api/complaints/:id - Update complaint
router.put('/:id', async (req, res) => {
  try {
    const { title, description, status, severity, assigned_to, defect_category,
      defect_quantity, total_quantity, customer_name } = req.body;
    const result = await pool.query(
      `UPDATE complaints SET title=$1, description=$2, status=$3, severity=$4, assigned_to=$5,
        defect_category=$6, defect_quantity=$7, total_quantity=$8, customer_name=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [title, description, status, severity, assigned_to, defect_category, defect_quantity, total_quantity, customer_name, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/complaints/:id/8d - Update 8D report
router.put('/:id/8d', async (req, res) => {
  try {
    const { d1_team_members, d2_problem_description, d3_containment_actions, d3_containment_date,
      d4_root_cause, d4_ishikawa_data, d5_corrective_actions, d6_implementation_date,
      d6_effectiveness_evidence, d7_preventive_actions, d7_documents_updated,
      d8_team_recognition, d8_closure_date, status } = req.body;
    const result = await pool.query(
      `UPDATE eight_d_reports SET
        d1_team_members=$1, d2_problem_description=$2, d3_containment_actions=$3,
        d3_containment_date=$4, d4_root_cause=$5, d4_ishikawa_data=$6,
        d5_corrective_actions=$7, d6_implementation_date=$8, d6_effectiveness_evidence=$9,
        d7_preventive_actions=$10, d7_documents_updated=$11,
        d8_team_recognition=$12, d8_closure_date=$13, status=$14,
        updated_by=$15, updated_at=NOW()
       WHERE complaint_id=$16 RETURNING *`,
      [d1_team_members, d2_problem_description, d3_containment_actions, d3_containment_date,
        d4_root_cause, d4_ishikawa_data ? JSON.stringify(d4_ishikawa_data) : null,
        d5_corrective_actions, d6_implementation_date, d6_effectiveness_evidence,
        d7_preventive_actions, d7_documents_updated, d8_team_recognition, d8_closure_date,
        status, req.user.id, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/complaints/:id/actions - Add corrective action
router.post('/:id/actions', async (req, res) => {
  try {
    const { action_type, description, responsible_person, target_date } = req.body;
    const result = await pool.query(
      `INSERT INTO corrective_actions (complaint_id, action_type, description, responsible_person, target_date)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, action_type, description, responsible_person, target_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/complaints/:id/actions/:actionId - Update action status
router.put('/:id/actions/:actionId', async (req, res) => {
  try {
    const { status, completion_date, effectiveness_rating, verification_notes } = req.body;
    const result = await pool.query(
      `UPDATE corrective_actions SET status=$1, completion_date=$2, effectiveness_rating=$3,
        verification_notes=$4, updated_at=NOW() WHERE id=$5 AND complaint_id=$6 RETURNING *`,
      [status, completion_date, effectiveness_rating, verification_notes, req.params.actionId, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
