const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();
router.use(auth);

const q = (sql, params = []) => new Promise((res, rej) =>
  db.query(sql, params, (err, rows) => err ? rej(err) : res(rows))
);

router.get('/', async (req, res) => {
  try {
    const results = await Promise.allSettled([

      // RFQs created
      q(`SELECT 'RFQ Created' AS action, r.title AS detail,
                CONCAT(u.first_name,' ',u.last_name) AS actor,
                r.created_date AS happened_at, r.rfq_id AS sort_id, 'rfq' AS type
         FROM rfqs r JOIN users u ON r.created_by = u.id`),

      // Quotations submitted
      q(`SELECT 'Quotation Submitted' AS action,
                CONCAT('For: ', r.title) AS detail,
                v.name AS actor,
                q.quotation_date AS happened_at, q.quotation_id AS sort_id, 'quotation' AS type
         FROM quotations q
         JOIN rfqs r    ON q.rfq_id    = r.rfq_id
         JOIN vendors v ON q.vendor_id = v.vendor_id
         WHERE q.status IN ('Submitted','Selected','Rejected')`),

      // Approvals
      q(`SELECT CASE WHEN a.approved THEN 'Approved' ELSE 'Rejected' END AS action,
                CONCAT(CASE WHEN a.approved THEN 'Approved' ELSE 'Rejected' END, ': ', r.title) AS detail,
                CONCAT(u.first_name,' ',u.last_name) AS actor,
                DATE(a.created_at) AS happened_at, a.approval_id AS sort_id,
                CASE WHEN a.approved THEN 'approved' ELSE 'rejected' END AS type
         FROM approvals a
         JOIN rfqs r  ON a.rfq_id  = r.rfq_id
         JOIN users u ON a.user_id = u.id
         WHERE a.rfq_id IS NOT NULL`),

      // POs generated
      q(`SELECT 'PO Generated' AS action, po.po_number AS detail,
                CONCAT(u.first_name,' ',u.last_name) AS actor,
                po.order_date AS happened_at, po.po_id AS sort_id, 'po' AS type
         FROM purchase_orders po JOIN users u ON po.created_by = u.id`),

      // Invoices
      q(`SELECT 'Invoice Generated' AS action, i.invoice_number AS detail,
                v.name AS actor,
                i.invoice_date AS happened_at, i.invoice_id AS sort_id, 'invoice' AS type
         FROM invoices i JOIN vendors v ON i.vendor_id = v.vendor_id`),

      // Invoices paid
      q(`SELECT 'Invoice Paid' AS action, i.invoice_number AS detail,
                v.name AS actor,
                i.invoice_date AS happened_at, (i.invoice_id + 100000) AS sort_id, 'paid' AS type
         FROM invoices i JOIN vendors v ON i.vendor_id = v.vendor_id
         WHERE i.status = 'Paid'`),
    ]);

    // Merge fulfilled results, skip failed ones
    let rows = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') rows = rows.concat(r.value);
    });

    // Sort by date desc, then sort_id desc
    rows.sort((a, b) => {
      const da = a.happened_at ? new Date(a.happened_at) : new Date(0);
      const db_ = b.happened_at ? new Date(b.happened_at) : new Date(0);
      if (db_ - da !== 0) return db_ - da;
      return (b.sort_id || 0) - (a.sort_id || 0);
    });

    res.json(rows.slice(0, 80));
  } catch (err) {
    res.status(500).json({ message: err.sqlMessage || err.message || 'Database error.' });
  }
});

module.exports = router;
