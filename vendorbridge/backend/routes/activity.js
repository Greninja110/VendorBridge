const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();
router.use(auth);

router.get('/', (req, res) => {
  const sql = `
    (SELECT 'RFQ Created'        AS action,
            r.title              AS detail,
            CONCAT(u.first_name,' ',u.last_name) AS actor,
            r.created_date       AS happened_at,
            r.rfq_id             AS sort_id,
            'rfq'                AS type
     FROM rfqs r JOIN users u ON r.created_by = u.id)

    UNION ALL

    (SELECT 'Quotation Submitted',
            CONCAT('For: ', r.title),
            v.name,
            q.quotation_date,
            q.quotation_id,
            'quotation'
     FROM quotations q
     JOIN rfqs r    ON q.rfq_id    = r.rfq_id
     JOIN vendors v ON q.vendor_id = v.vendor_id
     WHERE q.status IN ('Submitted','Selected','Rejected'))

    UNION ALL

    (SELECT 'Approval Decision',
            CONCAT(CASE WHEN a.approved THEN 'Approved' ELSE 'Rejected' END, ': ', r.title),
            CONCAT(u.first_name,' ',u.last_name),
            DATE(a.created_at),
            a.approval_id,
            CASE WHEN a.approved THEN 'approved' ELSE 'rejected' END
     FROM approvals a
     JOIN rfqs r  ON a.rfq_id  = r.rfq_id
     JOIN users u ON a.user_id = u.id
     WHERE a.rfq_id IS NOT NULL)

    UNION ALL

    (SELECT 'PO Generated',
            po.po_number,
            CONCAT(u.first_name,' ',u.last_name),
            po.order_date,
            po.po_id,
            'po'
     FROM purchase_orders po JOIN users u ON po.created_by = u.id)

    UNION ALL

    (SELECT 'Invoice Generated',
            i.invoice_number,
            v.name,
            i.invoice_date,
            i.invoice_id,
            'invoice'
     FROM invoices i JOIN vendors v ON i.vendor_id = v.vendor_id)

    UNION ALL

    (SELECT 'Invoice Paid',
            i.invoice_number,
            v.name,
            i.invoice_date,
            i.invoice_id + 100000,
            'paid'
     FROM invoices i JOIN vendors v ON i.vendor_id = v.vendor_id
     WHERE i.status = 'Paid')

    ORDER BY happened_at DESC, sort_id DESC
    LIMIT 80
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    res.json(rows);
  });
});

module.exports = router;
