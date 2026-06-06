const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();
router.use(auth);

// GET /api/rfqs
router.get('/', (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT r.rfq_id, r.title, r.category, r.deadline, r.status, r.created_date,
      IFNULL(r.visibility,'public') AS visibility,
      CONCAT(u.first_name,' ',u.last_name) AS created_by_name,
      (SELECT COUNT(*) FROM rfq_vendors rv WHERE rv.rfq_id = r.rfq_id) AS vendor_count,
      (SELECT COUNT(*) FROM rfq_lines rl WHERE rl.rfq_id = r.rfq_id)   AS line_count,
      (SELECT COUNT(*) FROM quotations q WHERE q.rfq_id = r.rfq_id)    AS quotation_count
    FROM rfqs r
    LEFT JOIN users u ON r.created_by = u.id
    WHERE 1=1`;
  const params = [];

  if (req.user.role === 'vendor') {
    if (!status) sql += ` AND r.status = 'Published'`;
    // Only Active vendors can see RFQs
    sql += ` AND EXISTS (
      SELECT 1 FROM vendors v JOIN users u ON u.vendor_id = v.vendor_id
      WHERE u.id = ? AND v.status = 'Active'
    )`;
    params.push(req.user.id);
    // Public RFQs visible to all; private only to assigned vendors
    sql += ` AND (IFNULL(r.visibility,'public') = 'public' OR EXISTS (
      SELECT 1 FROM rfq_vendors rv
      JOIN vendors v2 ON rv.vendor_id = v2.vendor_id
      JOIN users u2 ON u2.vendor_id = v2.vendor_id
      WHERE rv.rfq_id = r.rfq_id AND u2.id = ?
    ))`;
    params.push(req.user.id);
  }
  if (status) { sql += ' AND r.status = ?'; params.push(status); }
  sql += ' ORDER BY r.rfq_id DESC';

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    res.json(rows);
  });
});

// GET /api/rfqs/stats
router.get('/stats', (req, res) => {
  db.query(
    `SELECT
      COUNT(*) AS total,
      SUM(status='Draft') AS draft,
      SUM(status='Published') AS published,
      SUM(status='Closed') AS closed
    FROM rfqs`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      res.json(rows[0]);
    }
  );
});

// GET /api/rfqs/:id  (detail with lines + vendors)
router.get('/:id', (req, res) => {
  db.query(
    `SELECT r.*, CONCAT(u.first_name,' ',u.last_name) AS created_by_name
     FROM rfqs r LEFT JOIN users u ON r.created_by = u.id WHERE r.rfq_id = ?`,
    [req.params.id],
    (err, rows) => {
      if (err || !rows.length) return res.status(404).json({ message: 'RFQ not found.' });
      const rfq = rows[0];
      db.query('SELECT * FROM rfq_lines WHERE rfq_id = ? ORDER BY line_no', [rfq.rfq_id], (e2, lines) => {
        if (e2) return res.status(500).json({ message: 'Database error.' });
        db.query(
          `SELECT v.vendor_id, v.name, v.contact_phone, vc.name AS category
           FROM rfq_vendors rv
           JOIN vendors v ON rv.vendor_id = v.vendor_id
           LEFT JOIN vendor_categories vc ON v.category_id = vc.category_id
           WHERE rv.rfq_id = ?`,
          [rfq.rfq_id],
          (e3, vendors) => {
            if (e3) return res.status(500).json({ message: 'Database error.' });
            res.json({ ...rfq, lines, vendors });
          }
        );
      });
    }
  );
});

// POST /api/rfqs
router.post('/', (req, res) => {
  if (!['admin', 'procurement_officer'].includes(req.user.role))
    return res.status(403).json({ message: 'Not authorized.' });

  const { title, category, deadline, description, lines = [], vendor_ids = [], status = 'Draft', visibility = 'public' } = req.body;
  if (!title || !deadline) return res.status(400).json({ message: 'Title and deadline are required.' });

  db.query(
    'INSERT INTO rfqs (title, category, description, created_by, deadline, status, visibility) VALUES (?,?,?,?,?,?,?)',
    [title.trim(), category || null, description || null, req.user.id, deadline, status, visibility],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      const rfqId = result.insertId;

      const doLines = (cb) => {
        if (!lines.length) return cb();
        const vals = lines.map((l, i) => [rfqId, i + 1, l.item_description, parseInt(l.quantity) || 1, l.unit || 'NOS']);
        db.query('INSERT INTO rfq_lines (rfq_id,line_no,item_description,quantity,unit) VALUES ?', [vals], cb);
      };
      const doVendors = (cb) => {
        if (!vendor_ids.length) return cb();
        const vals = vendor_ids.map(id => [rfqId, id]);
        db.query('INSERT INTO rfq_vendors (rfq_id,vendor_id) VALUES ?', [vals], cb);
      };

      doLines(() => doVendors(() => res.status(201).json({ message: 'RFQ created.', rfq_id: rfqId })));
    }
  );
});

// PUT /api/rfqs/:id  — admin or procurement_officer
router.put('/:id', (req, res) => {
  if (!['admin', 'procurement_officer'].includes(req.user.role))
    return res.status(403).json({ message: 'Not authorized.' });
  const { title, category, deadline, description, status } = req.body;
  if (!title || !deadline) return res.status(400).json({ message: 'Title and deadline are required.' });
  db.query(
    'UPDATE rfqs SET title=?, category=?, deadline=?, description=?, status=? WHERE rfq_id=?',
    [title.trim(), category || null, deadline, description || null, status || 'Draft', req.params.id],
    (err, r) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      if (!r.affectedRows) return res.status(404).json({ message: 'RFQ not found.' });
      res.json({ message: 'RFQ updated.' });
    }
  );
});

// PATCH /api/rfqs/:id/status
router.patch('/:id/status', (req, res) => {
  if (!['admin', 'procurement_officer'].includes(req.user.role))
    return res.status(403).json({ message: 'Not authorized.' });
  const { status } = req.body;
  if (!['Draft', 'Published', 'Closed'].includes(status))
    return res.status(400).json({ message: 'Invalid status.' });
  db.query('UPDATE rfqs SET status=? WHERE rfq_id=?', [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    res.json({ message: `Status updated to ${status}.` });
  });
});

// DELETE /api/rfqs/:id
router.delete('/:id', (req, res) => {
  if (!['admin', 'procurement_officer'].includes(req.user.role))
    return res.status(403).json({ message: 'Not authorized.' });
  db.query('DELETE FROM rfqs WHERE rfq_id=?', [req.params.id], (err, r) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (!r.affectedRows) return res.status(404).json({ message: 'RFQ not found.' });
    res.json({ message: 'RFQ deleted.' });
  });
});

module.exports = router;
