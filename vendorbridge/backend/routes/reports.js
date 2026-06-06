const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();
router.use(auth);

router.get('/', (req, res) => {
  const summary = new Promise((ok, fail) =>
    db.query(`
      SELECT
        (SELECT COUNT(*) FROM vendors WHERE status='Active')                           AS active_vendors,
        (SELECT COUNT(*) FROM vendors)                                                 AS total_vendors,
        (SELECT COUNT(*) FROM rfqs)                                                    AS total_rfqs,
        (SELECT COUNT(*) FROM rfqs WHERE status='Published')                           AS open_rfqs,
        (SELECT COUNT(*) FROM quotations WHERE status IN ('Submitted','Selected','Rejected')) AS total_quotations,
        (SELECT COUNT(*) FROM purchase_orders)                                         AS total_pos,
        (SELECT COUNT(*) FROM invoices)                                                AS total_invoices,
        (SELECT COALESCE(SUM(total_amount),0) FROM purchase_orders)                   AS total_po_spend,
        (SELECT COALESCE(SUM(total_amount),0) FROM invoices WHERE status='Paid')      AS total_paid,
        (SELECT COALESCE(SUM(total_amount),0) FROM invoices WHERE status='Pending')   AS total_pending,
        (SELECT COUNT(*) FROM invoices WHERE status='Paid')                            AS invoices_paid,
        (SELECT COUNT(*) FROM invoices WHERE status='Pending')                         AS invoices_pending
    `, (err, rows) => err ? fail(err) : ok(rows[0]))
  );

  const byCategory = new Promise((ok, fail) =>
    db.query(`
      SELECT
        COALESCE(vc.name, 'Uncategorized') AS category,
        COUNT(DISTINCT po.po_id)           AS po_count,
        COUNT(DISTINCT v.vendor_id)        AS vendor_count,
        COALESCE(SUM(po.total_amount), 0)  AS total_spend
      FROM purchase_orders po
      JOIN vendors v  ON po.vendor_id  = v.vendor_id
      LEFT JOIN vendor_categories vc ON v.category_id = vc.category_id
      GROUP BY vc.name
      ORDER BY total_spend DESC
    `, (err, rows) => err ? fail(err) : ok(rows))
  );

  const topVendors = new Promise((ok, fail) =>
    db.query(`
      SELECT v.name AS vendor_name,
             COUNT(po.po_id)                  AS po_count,
             COALESCE(SUM(po.total_amount), 0) AS total_spend
      FROM purchase_orders po
      JOIN vendors v ON po.vendor_id = v.vendor_id
      GROUP BY v.vendor_id, v.name
      ORDER BY total_spend DESC
      LIMIT 5
    `, (err, rows) => err ? fail(err) : ok(rows))
  );

  Promise.all([summary, byCategory, topVendors])
    .then(([s, c, t]) => res.json({ summary: s, byCategory: c, topVendors: t }))
    .catch(() => res.status(500).json({ message: 'Database error.' }));
});

module.exports = router;
