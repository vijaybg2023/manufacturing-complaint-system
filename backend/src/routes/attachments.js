const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const { pool } = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME || 'complaint-attachments-mfg');

// Use memory storage for multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/gif','application/pdf',
      'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    cb(null, allowed.includes(file.mimetype));
  }
});

router.use(authenticate);

// POST /api/attachments/:complaintId - Upload file
router.post('/:complaintId', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided or file type not allowed' });
  try {
    const ext = req.file.originalname.split('.').pop();
    const filename = `${req.params.complaintId}/${uuidv4()}.${ext}`;
    const gcsFile = bucket.file(filename);
    await gcsFile.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
    });
    const result = await pool.query(
      `INSERT INTO attachments (complaint_id, filename, original_name, gcs_path, file_size, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.params.complaintId, filename, req.file.originalname, `gs://${process.env.GCS_BUCKET_NAME}/${filename}`,
        req.file.size, req.file.mimetype, req.user.id]
    );
    // Generate signed URL for download
    const [signedUrl] = await gcsFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });
    res.status(201).json({ ...result.rows[0], download_url: signedUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attachments/:complaintId/:attachmentId/download - Get signed download URL
router.get('/:complaintId/:attachmentId/download', async (req, res) => {
  try {
    const att = await pool.query('SELECT * FROM attachments WHERE id=$1 AND complaint_id=$2', [req.params.attachmentId, req.params.complaintId]);
    if (!att.rows.length) return res.status(404).json({ error: 'Not found' });
    const gcsFile = bucket.file(att.rows[0].filename);
    const [signedUrl] = await gcsFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000,
    });
    res.json({ url: signedUrl, filename: att.rows[0].original_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/attachments/:complaintId/:attachmentId
router.delete('/:complaintId/:attachmentId', async (req, res) => {
  try {
    const att = await pool.query('SELECT * FROM attachments WHERE id=$1', [req.params.attachmentId]);
    if (!att.rows.length) return res.status(404).json({ error: 'Not found' });
    await bucket.file(att.rows[0].filename).delete().catch(() => {});
    await pool.query('DELETE FROM attachments WHERE id=$1', [req.params.attachmentId]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
