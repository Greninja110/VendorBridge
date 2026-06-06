const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();
router.use(auth);

// GET /api/invoices
router.get('/', (req, res) => {
  db.query(
    `SELECT i.invoice_id, i.invoice_number, i.invoice_date, i.total_amount, i.status,
       v.name AS vendor_name,
       po.po_number,
       CONCAT(u.first_name,' ',u.last_name) AS created_by_name
     FROM invoices i
     JOIN vendors v ON i.vendor_id=v.vendor_id
     JOIN purchase_orders po ON i.po_id=po.po_id
     JOIN users u ON i.created_by=u.id
     ORDER BY i.invoice_id DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      res.json(rows);
    }
  );
});

// GET /api/invoices/stats
router.get('/stats', (req, res) => {
  db.query(
    `SELECT
       COUNT(*) AS total,
       SUM(status='Pending') AS pending,
       SUM(status='Paid') AS paid,
       COALESCE(SUM(total_amount),0) AS total_value
     FROM invoices`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      res.json(rows[0]);
    }
  );
});

// GET /api/invoices/:id
router.get('/:id', (req, res) => {
  db.query(
    `SELECT i.*,
       v.name AS vendor_name, v.gst_number AS vendor_gst, v.address AS vendor_address,
       po.po_number, po.order_date
     FROM invoices i
     JOIN vendors v ON i.vendor_id=v.vendor_id
     JOIN purchase_orders po ON i.po_id=po.po_id
     WHERE i.invoice_id=?`,
    [req.params.id],
    (err, rows) => {
      if (err || !rows.length) return res.status(404).json({ message: 'Invoice not found.' });
      const inv = rows[0];
      // Get PO lines for display
      db.query(
        `SELECT pol.item_description, pol.quantity, pol.unit, pol.unit_price, pol.line_total
         FROM purchase_order_lines pol WHERE pol.po_id=?`,
        [inv.po_id],
        (e2, lines) => {
          if (e2) return res.status(500).json({ message: 'Database error.' });
          res.json({ ...inv, lines });
        }
      );
    }
  );
});

// POST /api/invoices  (generate from PO)
router.post('/', (req, res) => {
  if (!['admin', 'procurement_officer'].includes(req.user.role))
    return res.status(403).json({ message: 'Not authorized.' });

  const { po_id } = req.body;
  if (!po_id) return res.status(400).json({ message: 'PO ID is required.' });

  db.query('SELECT * FROM purchase_orders WHERE po_id=? AND approved=1', [po_id], (err, rows) => {
    if (err || !rows.length) return res.status(404).json({ message: 'PO not found or not approved.' });
    const po = rows[0];

    // Check no existing invoice for this PO
    db.query('SELECT invoice_id FROM invoices WHERE po_id=?', [po_id], (e2, existing) => {
      if (e2) return res.status(500).json({ message: 'Database error.' });
      if (existing.length) return res.status(409).json({ message: 'Invoice already generated for this PO.' });

      db.query(
        `INSERT INTO invoices (po_id,vendor_id,created_by,invoice_number,invoice_date,total_amount,status)
         VALUES (?  ,?,?,'',CURDATE(),?,'Pending')`,
        [po_id, po.vendor_id, req.user.id, po.total_amount],
        (e3, result) => {
          if (e3) return res.status(500).json({ message: 'Database error.' });
          res.status(201).json({ message: 'Invoice generated.', invoice_id: result.insertId });
        }
      );
    });
  });
});

// PATCH /api/invoices/:id/mark-paid
router.patch('/:id/mark-paid', (req, res) => {
  if (!['admin', 'procurement_officer'].includes(req.user.role))
    return res.status(403).json({ message: 'Not authorized.' });
  db.query('UPDATE invoices SET status="Paid" WHERE invoice_id=?', [req.params.id], (err, r) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (!r.affectedRows) return res.status(404).json({ message: 'Invoice not found.' });
    res.json({ message: 'Marked as paid.' });
  });
});

// PATCH /api/invoices/:id/cancel  — admin only
router.patch('/:id/cancel', (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Only admin can cancel invoices.' });
  db.query('UPDATE invoices SET status="Cancelled" WHERE invoice_id=? AND status="Pending"', [req.params.id], (err, r) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (!r.affectedRows) return res.status(404).json({ message: 'Invoice not found or already paid/cancelled.' });
    res.json({ message: 'Invoice cancelled.' });
  });
});

// DELETE /api/invoices/:id  — admin only
router.delete('/:id', (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Only admin can delete invoices.' });
  db.query('DELETE FROM invoices WHERE invoice_id=?', [req.params.id], (err, r) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (!r.affectedRows) return res.status(404).json({ message: 'Invoice not found.' });
    res.json({ message: 'Invoice deleted.' });
  });
});

module.exports = router;
