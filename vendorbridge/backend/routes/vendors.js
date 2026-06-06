const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/vendors
router.get('/', (req, res) => {
  const { search, status } = req.query;
  let sql = `
    SELECT v.vendor_id, v.name, v.gst_number, v.contact_name, v.contact_email,
           v.contact_phone, v.address, v.status,
           vc.name AS category
    FROM vendors v
    LEFT JOIN vendor_categories vc ON v.category_id = vc.category_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ' AND (v.name LIKE ? OR IFNULL(v.gst_number,"") LIKE ? OR IFNULL(vc.name,"") LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (status && status !== 'all') {
    sql += ' AND v.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY v.vendor_id DESC';

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error.' });

    db.query(
      `SELECT status, COUNT(*) AS count FROM vendors GROUP BY status`,
      (err2, counts) => {
        if (err2) return res.status(500).json({ message: 'Database error.' });
        const summary = { all: 0, Active: 0, Pending: 0, Blocked: 0 };
        counts.forEach(c => { summary[c.status] = Number(c.count); summary.all += Number(c.count); });
        res.json({ vendors: rows, summary });
      }
    );
  });
});

// GET /api/vendors/summary  (for dashboard stat cards)
router.get('/summary', (req, res) => {
  db.query(
    `SELECT status, COUNT(*) AS count FROM vendors GROUP BY status`,
    (err, counts) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      const summary = { all: 0, Active: 0, Pending: 0, Blocked: 0 };
      counts.forEach(c => { summary[c.status] = Number(c.count); summary.all += Number(c.count); });
      res.json(summary);
    }
  );
});

// GET /api/vendors/:id
router.get('/:id', (req, res) => {
  db.query(
    `SELECT v.*, vc.name AS category
     FROM vendors v
     LEFT JOIN vendor_categories vc ON v.category_id = vc.category_id
     WHERE v.vendor_id = ?`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      if (!rows.length) return res.status(404).json({ message: 'Vendor not found.' });
      res.json(rows[0]);
    }
  );
});

// POST /api/vendors  — admin or procurement_officer
router.post('/', (req, res) => {
  if (!['admin', 'procurement_officer'].includes(req.user.role))
    return res.status(403).json({ message: 'Not authorized to add vendors.' });

  const { name, category, gst_number, contact_name, contact_email, contact_phone, address } = req.body;
  if (!name?.trim())         return res.status(400).json({ message: 'Vendor name is required.' });
  if (!category?.trim())     return res.status(400).json({ message: 'Category is required.' });
  if (!gst_number?.trim())   return res.status(400).json({ message: 'GST number is required.' });
  if (!contact_email?.trim())return res.status(400).json({ message: 'Contact email is required.' });
  if (!contact_phone?.trim())return res.status(400).json({ message: 'Contact phone is required.' });

  const doInsert = (categoryId) => {
    db.query(
      `INSERT INTO vendors (name, category_id, gst_number, contact_name, contact_email, contact_phone, address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [name.trim(), categoryId || null, gst_number || null, contact_name || null,
       contact_email || null, contact_phone || null, address || null],
      (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ message: 'Vendor name or GST number already exists.' });
          return res.status(500).json({ message: 'Database error.' });
        }
        const newVendorId = result.insertId;
        // Auto-link any existing user account with the same email
        if (contact_email) {
          db.query(
            'UPDATE users SET vendor_id = ?, role = "vendor" WHERE email = ? AND vendor_id IS NULL',
            [newVendorId, contact_email]
          );
        }
        res.status(201).json({ message: 'Vendor added.', vendor_id: newVendorId });
      }
    );
  };

  if (category && category.trim()) {
    db.query('INSERT IGNORE INTO vendor_categories (name) VALUES (?)', [category.trim()], (err) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      db.query('SELECT category_id FROM vendor_categories WHERE name = ?', [category.trim()], (err2, rows) => {
        if (err2) return res.status(500).json({ message: 'Database error.' });
        doInsert(rows[0]?.category_id);
      });
    });
  } else {
    doInsert(null);
  }
});

// PUT /api/vendors/:id  — admin only
router.put('/:id', (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Only admin can edit vendors.' });

  const { name, category, gst_number, contact_name, contact_email, contact_phone, address } = req.body;
  if (!name?.trim())         return res.status(400).json({ message: 'Vendor name is required.' });
  if (!category?.trim())     return res.status(400).json({ message: 'Category is required.' });
  if (!gst_number?.trim())   return res.status(400).json({ message: 'GST number is required.' });
  if (!contact_email?.trim())return res.status(400).json({ message: 'Contact email is required.' });
  if (!contact_phone?.trim())return res.status(400).json({ message: 'Contact phone is required.' });

  const doUpdate = (categoryId) => {
    db.query(
      `UPDATE vendors SET name=?, category_id=?, gst_number=?, contact_name=?,
       contact_email=?, contact_phone=?, address=? WHERE vendor_id=?`,
      [name.trim(), categoryId || null, gst_number || null, contact_name || null,
       contact_email || null, contact_phone || null, address || null, req.params.id],
      (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error.' });
        if (!result.affectedRows) return res.status(404).json({ message: 'Vendor not found.' });
        res.json({ message: 'Vendor updated.' });
      }
    );
  };

  if (category && category.trim()) {
    db.query('INSERT IGNORE INTO vendor_categories (name) VALUES (?)', [category.trim()], (err) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      db.query('SELECT category_id FROM vendor_categories WHERE name = ?', [category.trim()], (err2, rows) => {
        if (err2) return res.status(500).json({ message: 'Database error.' });
        doUpdate(rows[0]?.category_id);
      });
    });
  } else {
    doUpdate(null);
  }
});

// PATCH /api/vendors/:id/status  — admin only
router.patch('/:id/status', (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Only admin can change vendor status.' });

  const { status } = req.body;
  if (!['Active', 'Pending', 'Blocked'].includes(status))
    return res.status(400).json({ message: 'Invalid status.' });

  db.query('UPDATE vendors SET status = ? WHERE vendor_id = ?', [status, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (!result.affectedRows) return res.status(404).json({ message: 'Vendor not found.' });
    res.json({ message: `Status updated to ${status}.` });
  });
});

// DELETE /api/vendors/:id  — admin only
router.delete('/:id', (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Only admin can delete vendors.' });

  db.query('DELETE FROM vendors WHERE vendor_id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (!result.affectedRows) return res.status(404).json({ message: 'Vendor not found.' });
    res.json({ message: 'Vendor deleted.' });
  });
});

module.exports = router;
