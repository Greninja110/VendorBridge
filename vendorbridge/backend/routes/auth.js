const express  = require('express');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const crypto    = require('crypto');
const db        = require('../config/db');
const sendMail  = require('../config/mailer');

const router     = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'vendorbridge_secret_key';


// ─── REGISTER ────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { first_name, last_name, email, phone, password, role, country, additional_info } = req.body;

  if (!first_name || !last_name || !email || !password || !role)
    return res.status(400).json({ message: 'All required fields must be filled.' });

  const validRoles = ['admin', 'vendor', 'procurement_officer', 'manager'];
  if (!validRoles.includes(role))
    return res.status(400).json({ message: 'Invalid role selected.' });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO users
      (first_name, last_name, email, phone, password, role, country, additional_info)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [first_name, last_name, email, phone || null, hashed, role, country || null, additional_info || null],
      async (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ message: 'Email already registered.' });
          return res.status(500).json({ message: 'Database error.' });
        }

        const newUserId = result.insertId;

        // Auto-link vendor record if contact_email matches
        db.query(
          'SELECT vendor_id FROM vendors WHERE contact_email = ? LIMIT 1',
          [email],
          (vErr, vRows) => {
            if (!vErr && vRows.length > 0) {
              db.query(
                'UPDATE users SET vendor_id = ?, role = "vendor" WHERE id = ?',
                [vRows[0].vendor_id, newUserId]
              );
            }
          }
        );

        // Welcome email
        const roleLabels = {
          admin: 'Admin', vendor: 'Vendor',
          procurement_officer: 'Procurement Officer', manager: 'Manager',
        };
        await sendMail({
          to: email,
          subject: 'Welcome to VendorBridge!',
          html: `
            <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;background:linear-gradient(135deg,#039b15,#056715);color:#fff;font-weight:700;font-size:18px;padding:10px 20px;border-radius:10px;">VendorBridge</div>
              </div>
              <h2 style="color:#0a1d17;">Welcome, ${first_name}!</h2>
              <p style="color:#374151;">Your account has been successfully created.</p>
              <table style="width:100%;background:#fff;border-radius:8px;padding:16px;margin:20px 0;border:1px solid #e5e7eb;">
                <tr><td style="color:#6b7280;padding:6px 0;">Name</td><td style="font-weight:600;color:#111827;">${first_name} ${last_name}</td></tr>
                <tr><td style="color:#6b7280;padding:6px 0;">Email</td><td style="font-weight:600;color:#111827;">${email}</td></tr>
                <tr><td style="color:#6b7280;padding:6px 0;">Role</td><td style="font-weight:600;color:#111827;">${roleLabels[role]}</td></tr>
              </table>
              <a href="${req.headers.origin || 'http://localhost:5173'}/login" style="display:block;text-align:center;background:linear-gradient(135deg,#039b15,#056715);color:#fff;padding:12px;border-radius:8px;text-decoration:none;font-weight:600;">Login to VendorBridge</a>
              <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:20px;">VendorBridge · Procurement & Vendor Management ERP</p>
            </div>`,
        }).catch(() => {}); // don't fail registration if email fails

        res.status(201).json({ message: 'Registered successfully.' });
      }
    );
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err)              return res.status(500).json({ message: 'Database error.' });
    if (!results.length)  return res.status(401).json({ message: 'Invalid email or password.' });

    const user  = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password.' });

    db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: `${user.first_name} ${user.last_name}`, vendor_id: user.vendor_id || null },
      JWT_SECRET,
      { expiresIn: '30m' }
    );

    res.json({
      token,
      user: { id: user.id, name: `${user.first_name} ${user.last_name}`, email: user.email, role: user.role, vendor_id: user.vendor_id || null },
    });
  });
});

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error.' });

    // Always return success so we don't reveal if email exists
    if (!results.length)
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });

    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    db.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
      [token, expires, email],
      async (err2) => {
        if (err2) return res.status(500).json({ message: 'Database error.' });

        const frontendUrl = req.headers.origin || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password?token=${token}`;
        await sendMail({
          to: email,
          subject: 'VendorBridge — Reset Your Password',
          html: `
            <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;background:linear-gradient(135deg,#039b15,#056715);color:#fff;font-weight:700;font-size:18px;padding:10px 20px;border-radius:10px;">VendorBridge</div>
              </div>
              <h2 style="color:#0a1d17;">Password Reset Request</h2>
              <p style="color:#374151;">Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
              <a href="${resetLink}" style="display:block;text-align:center;background:linear-gradient(135deg,#039b15,#056715);color:#fff;padding:12px;border-radius:8px;text-decoration:none;font-weight:600;margin:24px 0;">Reset Password</a>
              <p style="color:#6b7280;font-size:13px;">If you didn't request this, ignore this email — your password won't change.</p>
              <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:20px;">VendorBridge · Procurement & Vendor Management ERP</p>
            </div>`,
        }).catch(() => {});

        res.json({ message: 'If that email is registered, a reset link has been sent.' });
      }
    );
  });
});

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password)
    return res.status(400).json({ message: 'Token and new password are required.' });
  if (password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });

  db.query(
    'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
    [token],
    async (err, results) => {
      if (err)             return res.status(500).json({ message: 'Database error.' });
      if (!results.length) return res.status(400).json({ message: 'Invalid or expired reset link.' });

      const hashed = await bcrypt.hash(password, 10);
      db.query(
        'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
        [hashed, results[0].id],
        (err2) => {
          if (err2) return res.status(500).json({ message: 'Database error.' });
          res.json({ message: 'Password reset successfully. You can now log in.' });
        }
      );
    }
  );
});

module.exports = router;
