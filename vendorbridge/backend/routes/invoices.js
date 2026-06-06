const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const PDFDoc  = require('pdfkit');
const router  = express.Router();
router.use(auth);

// GET /api/invoices
router.get('/', (req, res) => {
  const isVendor = req.user.role === 'vendor';
  const params   = [];
  let sql = `
    SELECT i.invoice_id, i.invoice_number, i.invoice_date, i.total_amount, i.status,
       v.name AS vendor_name,
       po.po_number,
       CONCAT(u.first_name,' ',u.last_name) AS created_by_name
     FROM invoices i
     JOIN vendors v ON i.vendor_id=v.vendor_id
     JOIN purchase_orders po ON i.po_id=po.po_id
     JOIN users u ON i.created_by=u.id
     WHERE 1=1`;
  if (isVendor) {
    sql += ` AND i.vendor_id = (SELECT vendor_id FROM users WHERE id = ? LIMIT 1)`;
    params.push(req.user.id);
  }
  sql += ` ORDER BY i.invoice_id DESC`;
  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    res.json(rows);
  });
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

// GET /api/invoices/:id/pdf  — download PDF
router.get('/:id/pdf', (req, res) => {
  const isVendor = req.user.role === 'vendor';

  db.query(
    `SELECT i.*,
       v.name AS vendor_name, v.gst_number AS vendor_gst,
       v.address AS vendor_address, v.contact_email AS vendor_email, v.contact_phone AS vendor_phone,
       po.po_number, po.order_date
     FROM invoices i
     JOIN vendors v ON i.vendor_id=v.vendor_id
     JOIN purchase_orders po ON i.po_id=po.po_id
     WHERE i.invoice_id=?`,
    [req.params.id],
    (err, rows) => {
      if (err || !rows.length) return res.status(404).json({ message: 'Invoice not found.' });
      const inv = rows[0];

      // Vendor can only download their own invoice
      if (isVendor && inv.vendor_id !== undefined) {
        db.query('SELECT vendor_id FROM users WHERE id=?', [req.user.id], (e, ur) => {
          if (e || !ur.length || ur[0].vendor_id !== inv.vendor_id)
            return res.status(403).json({ message: 'Not authorized.' });
          fetchLinesAndBuild(inv);
        });
      } else {
        fetchLinesAndBuild(inv);
      }
    }
  );

  function fetchLinesAndBuild(inv) {
    db.query(
      `SELECT item_description, quantity, unit, unit_price, line_total
       FROM purchase_order_lines WHERE po_id=?`,
      [inv.po_id],
      (e, lines) => {
        if (e) return res.status(500).json({ message: 'Database error.' });
        buildPdf(res, inv, lines || []);
      }
    );
  }
});

function fmtAmount(n) {
  if (n == null) return 'N/A';
  return 'Rs. ' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDateStr(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildPdf(res, inv, lines) {
  const BLUE   = '#1e40af';
  const DARK   = '#111827';
  const GRAY   = '#6b7280';
  const LIGHT  = '#f3f4f6';
  const GREEN  = '#15803d';
  const PAID   = inv.status === 'Paid';

  const doc = new PDFDoc({ margin: 50, size: 'A4' });
  const filename = `Invoice_${inv.invoice_number || inv.invoice_id}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  const W = doc.page.width - 100; // usable width

  // ── Header bar ────────────────────────────────────────────────────────────
  doc.rect(50, 40, W, 56).fill(BLUE);
  doc.fillColor('#fff').fontSize(22).font('Helvetica-Bold')
     .text('VendorBridge', 65, 52);
  doc.fontSize(9).font('Helvetica')
     .text('Procurement Management Platform', 65, 77);

  // Invoice label on the right
  doc.fontSize(18).font('Helvetica-Bold')
     .text('INVOICE', 50, 52, { width: W, align: 'right' });
  doc.fontSize(9).font('Helvetica')
     .text(inv.invoice_number || `INV-${inv.invoice_id}`, 50, 77, { width: W, align: 'right' });

  // Status stamp
  const stampColor = PAID ? GREEN : '#b45309';
  doc.fillColor(stampColor).fontSize(20).font('Helvetica-Bold')
     .text(inv.status.toUpperCase(), 50, 105, { width: W, align: 'right' });

  // ── Bill To / From grid ───────────────────────────────────────────────────
  const boxTop = 145;
  const halfW  = (W - 12) / 2;

  // Left box — Bill To
  doc.rect(50, boxTop, halfW, 80).fillAndStroke(LIGHT, '#e5e7eb');
  doc.fillColor(GRAY).fontSize(8).font('Helvetica-Bold')
     .text('BILL TO', 60, boxTop + 10);
  doc.fillColor(DARK).fontSize(12).font('Helvetica-Bold')
     .text('Your Organization', 60, boxTop + 24);
  doc.fillColor(GRAY).fontSize(9).font('Helvetica')
     .text('Internal Procurement Department', 60, boxTop + 40);

  // Right box — Vendor
  const rx = 50 + halfW + 12;
  doc.rect(rx, boxTop, halfW, 80).fillAndStroke(LIGHT, '#e5e7eb');
  doc.fillColor(GRAY).fontSize(8).font('Helvetica-Bold')
     .text('FROM (VENDOR)', rx + 10, boxTop + 10);
  doc.fillColor(DARK).fontSize(12).font('Helvetica-Bold')
     .text(inv.vendor_name || '—', rx + 10, boxTop + 24, { width: halfW - 20 });
  let ry = boxTop + 40;
  if (inv.vendor_gst) {
    doc.fillColor(GRAY).fontSize(9).font('Helvetica').text(`GSTIN: ${inv.vendor_gst}`, rx + 10, ry, { width: halfW - 20 }); ry += 14;
  }
  if (inv.vendor_email) {
    doc.fillColor(GRAY).fontSize(9).font('Helvetica').text(inv.vendor_email, rx + 10, ry, { width: halfW - 20 }); ry += 14;
  }

  // ── Meta row ──────────────────────────────────────────────────────────────
  const metaTop = boxTop + 96;
  const cellW   = W / 3;
  [
    ['INVOICE NUMBER', inv.invoice_number || `INV-${inv.invoice_id}`],
    ['PO NUMBER',      inv.po_number || '—'],
    ['INVOICE DATE',   fmtDateStr(inv.invoice_date)],
  ].forEach(([label, value], i) => {
    const mx = 50 + i * cellW;
    doc.fillColor(GRAY).fontSize(8).font('Helvetica-Bold').text(label, mx, metaTop);
    doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text(value, mx, metaTop + 13, { width: cellW - 4 });
  });

  // ── Line items table ───────────────────────────────────────────────────────
  const tblTop   = metaTop + 46;
  const COL      = [0, 200, 250, 290, 370];  // offsets from left margin (50)
  const HEADS    = ['ITEM DESCRIPTION', 'QTY', 'UNIT', 'UNIT PRICE', 'TOTAL'];

  // Header row
  doc.rect(50, tblTop, W, 22).fill(BLUE);
  doc.fillColor('#fff').fontSize(8).font('Helvetica-Bold');
  HEADS.forEach((h, i) => {
    const align = i > 0 ? 'right' : 'left';
    const colX  = 50 + COL[i];
    const colW  = i < HEADS.length - 1 ? COL[i + 1] - COL[i] - 4 : W - COL[i];
    doc.text(h, colX + 4, tblTop + 7, { width: colW, align });
  });

  let rowY = tblTop + 22;
  if (lines.length === 0) {
    doc.rect(50, rowY, W, 24).fillAndStroke('#fafafa', '#e5e7eb');
    doc.fillColor(GRAY).fontSize(10).font('Helvetica').text('No line items.', 54, rowY + 7);
    rowY += 24;
  } else {
    lines.forEach((l, idx) => {
      const rowH = 24;
      doc.rect(50, rowY, W, rowH).fillAndStroke(idx % 2 === 0 ? '#fff' : LIGHT, '#e5e7eb');
      doc.fillColor(DARK).fontSize(9).font('Helvetica');
      const vals = [
        l.item_description || '—',
        String(l.quantity ?? '—'),
        l.unit || '—',
        fmtAmount(l.unit_price),
        fmtAmount(l.line_total),
      ];
      vals.forEach((v, i) => {
        const align = i > 0 ? 'right' : 'left';
        const colX  = 50 + COL[i];
        const colW  = i < vals.length - 1 ? COL[i + 1] - COL[i] - 4 : W - COL[i];
        doc.text(v, colX + 4, rowY + 7, { width: colW, align });
      });
      rowY += rowH;
    });
  }

  // ── Total box ─────────────────────────────────────────────────────────────
  const totalTop = rowY + 12;
  const totalW   = 200;
  doc.rect(50 + W - totalW, totalTop, totalW, 36).fill(PAID ? '#dcfce7' : LIGHT);
  doc.fillColor(GRAY).fontSize(9).font('Helvetica-Bold')
     .text('GRAND TOTAL', 50 + W - totalW + 12, totalTop + 8);
  doc.fillColor(PAID ? GREEN : DARK).fontSize(14).font('Helvetica-Bold')
     .text(fmtAmount(inv.total_amount), 50 + W - totalW + 12, totalTop + 18, { width: totalW - 24, align: 'right' });

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = doc.page.height - 60;
  doc.moveTo(50, footerY).lineTo(50 + W, footerY).strokeColor('#e5e7eb').stroke();
  doc.fillColor(GRAY).fontSize(8).font('Helvetica')
     .text('Generated by VendorBridge  •  This is a system-generated document.', 50, footerY + 8, { width: W, align: 'center' });
  doc.text(`Generated on ${fmtDateStr(new Date())}`, 50, footerY + 20, { width: W, align: 'center' });

  doc.end();
}

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
