const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();
router.use(auth);

// GET /api/approvals
router.get('/', (req, res) => {
  db.query(
    `SELECT q.quotation_id, q.rfq_id, q.vendor_id, q.total_amount, q.tax_rate,
       q.delivery_days, q.payment_terms, q.notes, q.status AS q_status,
       v.name AS vendor_name,
       r.title AS rfq_title, r.category AS rfq_category,
       CONCAT(u.first_name,' ',u.last_name) AS submitted_by,
       a.approval_id, a.approved AS a_approved, a.remarks, a.created_at AS decided_at,
       CONCAT(ua.first_name,' ',ua.last_name) AS decided_by
     FROM quotations q
     JOIN vendors v ON q.vendor_id=v.vendor_id
     JOIN rfqs r ON q.rfq_id=r.rfq_id
     JOIN users u ON r.created_by=u.id
     LEFT JOIN approvals a ON a.rfq_id=q.rfq_id
     LEFT JOIN users ua ON a.user_id=ua.id
     WHERE q.selected=1
     ORDER BY q.quotation_id DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      res.json(rows);
    }
  );
});

// GET /api/approvals/stats
router.get('/stats', (req, res) => {
  db.query(
    `SELECT
       SUM(q.selected=1 AND a.approval_id IS NULL) AS pending,
       SUM(a.approved=1) AS approved,
       SUM(a.approved=0) AS rejected
     FROM quotations q
     LEFT JOIN approvals a ON a.rfq_id=q.rfq_id
     WHERE q.selected=1`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      res.json(rows[0]);
    }
  );
});

// POST /api/approvals/:quotationId/approve
router.post('/:quotationId/approve', (req, res) => {
  if (!['admin', 'manager'].includes(req.user.role))
    return res.status(403).json({ message: 'Not authorized.' });

  const { remarks } = req.body;
  db.query('SELECT * FROM quotations WHERE quotation_id=? AND selected=1', [req.params.quotationId], (err, rows) => {
    if (err || !rows.length) return res.status(404).json({ message: 'Quotation not found or not selected.' });
    const q = rows[0];

    db.query(
      'INSERT INTO approvals (user_id,rfq_id,approved,remarks) VALUES (?,?,1,?)',
      [req.user.id, q.rfq_id, remarks || null],
      (e2) => {
        if (e2) return res.status(500).json({ message: 'Database error.' });

        // Generate PO (po_number set by trigger)
        db.query(
          `INSERT INTO purchase_orders (quotation_id,vendor_id,created_by,po_number,order_date,total_amount,approved,approved_by)
           VALUES (?,?,?,'',CURDATE(),?,1,?)`,
          [q.quotation_id, q.vendor_id, req.user.id, q.total_amount, req.user.id],
          (e3, poResult) => {
            if (e3) return res.status(500).json({ message: 'Approval saved but PO generation failed.' });
            const poId = poResult.insertId;

            // Copy quotation lines → PO lines
            db.query('SELECT * FROM quotation_lines WHERE quotation_id=?', [q.quotation_id], (e4, qLines) => {
              if (e4 || !qLines.length)
                return res.json({ message: 'Approved & PO generated.', po_id: poId });
              const vals = qLines.map(l => [
                poId, l.item_description, l.quotation_line_id,
                l.quantity, l.unit, l.unit_price, (l.unit_price * l.quantity)
              ]);
              db.query(
                `INSERT INTO purchase_order_lines
                 (po_id,item_description,quotation_line_id,quantity,unit,unit_price,line_total) VALUES ?`,
                [vals],
                () => res.json({ message: 'Approved & PO generated.', po_id: poId })
              );
            });
          }
        );
      }
    );
  });
});

// POST /api/approvals/:quotationId/reject
router.post('/:quotationId/reject', (req, res) => {
  if (!['admin', 'manager'].includes(req.user.role))
    return res.status(403).json({ message: 'Not authorized.' });

  const { remarks } = req.body;
  db.query('SELECT * FROM quotations WHERE quotation_id=? AND selected=1', [req.params.quotationId], (err, rows) => {
    if (err || !rows.length) return res.status(404).json({ message: 'Not found.' });
    const q = rows[0];
    db.query('INSERT INTO approvals (user_id,rfq_id,approved,remarks) VALUES (?,?,0,?)', [req.user.id, q.rfq_id, remarks || null], (e2) => {
      if (e2) return res.status(500).json({ message: 'Database error.' });
      // Mark the selected quotation as rejected
      db.query('UPDATE quotations SET selected=0, status="Rejected" WHERE quotation_id=?', [q.quotation_id], () => {
        // Restore all OTHER quotations for this RFQ that were auto-rejected (when this one was selected)
        // back to "Submitted" so those vendors can re-apply
        db.query(
          'UPDATE quotations SET status="Submitted" WHERE rfq_id=? AND quotation_id!=? AND status="Rejected"',
          [q.rfq_id, q.quotation_id],
          () => {
            db.query('UPDATE rfqs SET status="Published" WHERE rfq_id=?', [q.rfq_id], () => {
              res.json({ message: 'Rejected. Other quotations restored. RFQ reopened.' });
            });
          }
        );
      });
    });
  });
});

module.exports = router;
