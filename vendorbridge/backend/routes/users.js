const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();
router.use(auth);

// GET /api/users  (admin only)
router.get('/', (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Admin only.' });
  const { role } = req.query;
  let sql = `SELECT id, first_name, last_name, email, phone, role, country, created_at, last_login FROM users WHERE 1=1`;
  const params = [];
  if (role) { sql += ' AND role=?'; params.push(role); }
  sql += ' ORDER BY id DESC';
  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    res.json(rows);
  });
});

// GET /api/users/stats  (admin)
router.get('/stats', (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Admin only.' });
  db.query(
    `SELECT
       COUNT(*) AS total,
       SUM(role='admin') AS admins,
       SUM(role='vendor') AS vendors,
       SUM(role='procurement_officer') AS procurement_officers,
       SUM(role='manager') AS managers
     FROM users`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      res.json(rows[0]);
    }
  );
});

// PATCH /api/users/:id/role  (admin only)
router.patch('/:id/role', (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Admin only.' });
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ message: 'Cannot change your own role.' });
  const { role } = req.body;
  const valid = ['admin', 'vendor', 'procurement_officer', 'manager'];
  if (!valid.includes(role)) return res.status(400).json({ message: 'Invalid role.' });
  db.query('UPDATE users SET role=? WHERE id=?', [role, req.params.id], (err, r) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (!r.affectedRows) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: `Role updated to ${role}.` });
  });
});

// DELETE /api/users/:id  (admin only)
router.delete('/:id', (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Admin only.' });
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ message: 'Cannot delete your own account.' });
  db.query('DELETE FROM users WHERE id=?', [req.params.id], (err, r) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (!r.affectedRows) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User deleted.' });
  });
});

module.exports = router;
