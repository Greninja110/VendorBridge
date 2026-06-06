const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();
router.use(auth);

// GET /api/quotations
router.get('/', (req, res) => {
  const { rfq_id } = req.query;
  let sql = `
    SELECT q.*, v.name AS vendor_name, r.title AS rfq_title, r.deadline AS rfq_deadline
    FROM quotations q
    JOIN vendors v ON q.vendor_id = v.vendor_id
    JOIN rfqs r ON q.rfq_id = r.rfq_id
    WHERE 1=1`;
  const params = [];
  if (rfq_id) { sql += ' AND q.rfq_id=?'; params.push(rfq_id); }
  if (req.user.role === 'vendor') {
    sql += ' AND q.vendor_id=(SELECT vendor_id FROM users WHERE id=?)';
    params.push(req.user.id);
  }
  sql += ' ORDER BY q.quotation_id DESC';
  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    res.json(rows);
  });
});

// GET /api/quotations/compare/:rfqId
router.get('/compare/:rfqId', (req, res) => {
  db.query(
    `SELECT q.quotation_id, q.vendor_id, q.tax_rate, q.delivery_days, q.total_amount,
       q.payment_terms, q.notes, q.status, q.selected,
       v.name AS vendor_name
     FROM quotations q
     JOIN vendors v ON q.vendor_id = v.vendor_id
     WHERE q.rfq_id=? AND q.status IN ('Submitted','Selected','Rejected')
     ORDER BY q.total_amount ASC`,
    [req.params.rfqId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      res.json(rows);
    }
  );
});

// GET /api/quotations/:id
router.get('/:id', (req, res) => {
  db.query(
    `SELECT q.*, v.name AS vendor_name, r.title AS rfq_title
     FROM quotations q
     JOIN vendors v ON q.vendor_id=v.vendor_id
     JOIN rfqs r ON q.rfq_id=r.rfq_id
     WHERE q.quotation_id=?`,
    [req.params.id],
    (err, rows) => {
      if (err || !rows.length) return res.status(404).json({ message: 'Not found.' });
      db.query(
        `SELECT ql.*, rl.item_description AS rfq_item, rl.unit AS rfq_unit
         FROM quotation_lines ql
         LEFT JOIN rfq_lines rl ON ql.rfq_line_id=rl.rfq_line_id
         WHERE ql.quotation_id=?`,
        [rows[0].quotation_id],
        (e2, lines) => {
          if (e2) return res.status(500).json({ message: 'Database error.' });
          res.json({ ...rows[0], lines });
        }
      );
    }
  );
});

// POST /api/quotations  (vendor submits)
router.post('/', (req, res) => {
  if (!['vendor', 'admin'].includes(req.user.role))
    return res.status(403).json({ message: 'Only vendors can submit quotations.' });

  const { rfq_id, tax_rate = 18, delivery_days, notes, payment_terms, lines = [], status = 'Draft' } = req.body;
  if (!rfq_id) return res.status(400).json({ message: 'RFQ ID is required.' });

  db.query('SELECT vendor_id FROM users WHERE id=?', [req.user.id], (err, uRows) => {
    if (err || !uRows[0]?.vendor_id)
      return res.status(400).json({ message: 'Your account is not linked to a vendor profile.' });
    const vendorId = uRows[0].vendor_id;

    const subtotal = lines.reduce((s, l) => s + (parseFloat(l.unit_price) || 0) * (parseInt(l.quantity) || 1), 0);
    const total_amount = subtotal * (1 + parseFloat(tax_rate) / 100);

    db.query(
      `INSERT INTO quotations (rfq_id,vendor_id,notes,tax_rate,delivery_days,total_amount,status,payment_terms)
       VALUES (?,?,?,?,?,?,?,?)`,
      [rfq_id, vendorId, notes || null, tax_rate, delivery_days || null, total_amount, status, payment_terms || null],
      (err2, result) => {
        if (err2) return res.status(500).json({ message: 'Database error.' });
        const qId = result.insertId;
        if (!lines.length) return res.status(201).json({ message: 'Quotation saved.', quotation_id: qId });
        const vals = lines.map(l => [qId, l.item_description || null, l.rfq_line_id || null, parseFloat(l.unit_price) || 0, parseInt(l.quantity) || 1, l.unit || 'NOS']);
        db.query('INSERT INTO quotation_lines (quotation_id,item_description,rfq_line_id,unit_price,quantity,unit) VALUES ?', [vals], (e3) => {
          if (e3) return res.status(500).json({ message: 'Database error.' });
          res.status(201).json({ message: 'Quotation submitted.', quotation_id: qId });
        });
      }
    );
  });
});

// PATCH /api/quotations/:id/select  (procurement selects)
router.patch('/:id/select', (req, res) => {
  if (!['admin', 'procurement_officer'].includes(req.user.role))
    return res.status(403).json({ message: 'Not authorized.' });
  db.query('SELECT * FROM quotations WHERE quotation_id=?', [req.params.id], (err, rows) => {
    if (err || !rows.length) return res.status(404).json({ message: 'Quotation not found.' });
    const rfqId = rows[0].rfq_id;
    db.query('UPDATE quotations SET status="Rejected", selected=0 WHERE rfq_id=? AND quotation_id!=?', [rfqId, req.params.id], (e2) => {
      if (e2) return res.status(500).json({ message: 'Database error.' });
      db.query('UPDATE quotations SET status="Selected", selected=1 WHERE quotation_id=?', [req.params.id], (e3) => {
        if (e3) return res.status(500).json({ message: 'Database error.' });
        db.query('UPDATE rfqs SET status="Closed" WHERE rfq_id=?', [rfqId], () => {
          res.json({ message: 'Quotation selected. Pending manager approval.' });
        });
      });
    });
  });
});

// DELETE /api/quotations/:id  — admin only
router.delete('/:id', (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Only admin can delete quotations.' });
  db.query('DELETE FROM quotations WHERE quotation_id=?', [req.params.id], (err, r) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (!r.affectedRows) return res.status(404).json({ message: 'Quotation not found.' });
    res.json({ message: 'Quotation deleted.' });
  });
});

module.exports = router;
