const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();
router.use(auth);

// GET /api/purchase-orders
router.get('/', (req, res) => {
  const isVendor = req.user.role === 'vendor';
  const params   = [];
  let sql = `
    SELECT po.po_id, po.po_number, po.order_date, po.total_amount, po.approved,
       v.name AS vendor_name, v.gst_number AS vendor_gst,
       r.title AS rfq_title,
       CONCAT(u.first_name,' ',u.last_name) AS created_by_name,
       (SELECT COUNT(*) FROM invoices i WHERE i.po_id=po.po_id) AS invoice_count
     FROM purchase_orders po
     JOIN vendors v ON po.vendor_id=v.vendor_id
     LEFT JOIN quotations q ON po.quotation_id=q.quotation_id
     LEFT JOIN rfqs r ON q.rfq_id=r.rfq_id
     LEFT JOIN users u ON po.created_by=u.id
     WHERE 1=1`;
  if (isVendor) {
    sql += ` AND po.vendor_id = (SELECT vendor_id FROM users WHERE id = ? LIMIT 1)`;
    params.push(req.user.id);
  }
  sql += ` ORDER BY po.po_id DESC`;
  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    res.json(rows);
  });
});

// GET /api/purchase-orders/stats
router.get('/stats', (req, res) => {
  db.query(
    `SELECT COUNT(*) AS total, COALESCE(SUM(total_amount),0) AS total_value FROM purchase_orders`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      res.json(rows[0]);
    }
  );
});

// GET /api/purchase-orders/:id
router.get('/:id', (req, res) => {
  db.query(
    `SELECT po.*,
       v.name AS vendor_name, v.gst_number AS vendor_gst, v.address AS vendor_address, v.contact_email AS vendor_email,
       r.title AS rfq_title, r.category AS rfq_category,
       CONCAT(u.first_name,' ',u.last_name) AS created_by_name,
       CONCAT(ua.first_name,' ',ua.last_name) AS approved_by_name
     FROM purchase_orders po
     JOIN vendors v ON po.vendor_id=v.vendor_id
     LEFT JOIN quotations q ON po.quotation_id=q.quotation_id
     LEFT JOIN rfqs r ON q.rfq_id=r.rfq_id
     LEFT JOIN users u ON po.created_by=u.id
     LEFT JOIN users ua ON po.approved_by=ua.id
     WHERE po.po_id=?`,
    [req.params.id],
    (err, rows) => {
      if (err || !rows.length) return res.status(404).json({ message: 'PO not found.' });
      const po = rows[0];
      db.query(
        `SELECT pol.*, rl.item_description AS base_item
         FROM purchase_order_lines pol
         LEFT JOIN quotation_lines ql ON pol.quotation_line_id=ql.quotation_line_id
         LEFT JOIN rfq_lines rl ON ql.rfq_line_id=rl.rfq_line_id
         WHERE pol.po_id=?`,
        [po.po_id],
        (e2, lines) => {
          if (e2) return res.status(500).json({ message: 'Database error.' });
          res.json({ ...po, lines });
        }
      );
    }
  );
});

// DELETE /api/purchase-orders/:id  — admin only
router.delete('/:id', (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Only admin can delete purchase orders.' });
  db.query('DELETE FROM purchase_orders WHERE po_id=?', [req.params.id], (err, r) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (!r.affectedRows) return res.status(404).json({ message: 'PO not found.' });
    res.json({ message: 'Purchase order deleted.' });
  });
});

module.exports = router;
