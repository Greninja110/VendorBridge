import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const ROLES = [
  { value: 'vendor',               label: 'Vendor' },
  { value: 'procurement_officer',  label: 'Procurement Officer' },
  { value: 'manager',              label: 'Manager / Approver' },
  { value: 'admin',                label: 'Admin' },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    phone: '', country: '', additional_info: '', password: '', confirm: '', role: '',
  });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirm) {
      return setError('Passwords do not match.');
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        first_name: form.first_name,
        last_name:  form.last_name,
        email:      form.email,
        phone:      form.phone,
        country:         form.country,
        additional_info: form.additional_info,
        password:        form.password,
        role:       form.role,
      });
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>VB</div>
          <span style={styles.logoText}>VendorBridge</span>
        </div>

        <h2 style={styles.title}>Create your account</h2>
        <p style={styles.subtitle}>Join the procurement platform</p>

        {error   && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <form onSubmit={submit} style={styles.form}>
          <div style={styles.row}>
            <div style={styles.col}>
              <label style={styles.label}>First Name</label>
              <input name="first_name" placeholder="John" value={form.first_name} onChange={handle} required style={styles.input} />
            </div>
            <div style={styles.col}>
              <label style={styles.label}>Last Name</label>
              <input name="last_name" placeholder="Doe" value={form.last_name} onChange={handle} required style={styles.input} />
            </div>
          </div>

          <label style={styles.label}>Email Address</label>
          <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handle} required style={styles.input} />

          <label style={styles.label}>Phone Number <span style={styles.optional}>(optional)</span></label>
          <input name="phone" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={handle} style={styles.input} />

          <label style={styles.label}>Country <span style={styles.optional}>(optional)</span></label>
          <input name="country" type="text" placeholder="e.g. India" value={form.country} onChange={handle} style={styles.input} />

          <label style={styles.label}>Additional Information <span style={styles.optional}>(optional)</span></label>
          <textarea
            name="additional_info"
            placeholder="Any additional details about yourself or your organization..."
            value={form.additional_info}
            onChange={handle}
            rows={3}
            style={styles.textarea}
          />

          <label style={styles.label}>Role</label>
          <select name="role" value={form.role} onChange={handle} required style={styles.select}>
            <option value="">Select your role</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          <label style={styles.label}>Password</label>
          <input name="password" type="password" placeholder="Min. 6 characters" value={form.password} onChange={handle} required style={styles.input} />

          <label style={styles.label}>Confirm Password</label>
          <input name="confirm" type="password" placeholder="Re-enter password" value={form.confirm} onChange={handle} required style={styles.input} />

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a1d17 0%, #043b0c 100%)',
    padding: '24px',
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '24px',
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #039b15, #056715)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: '14px',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0a1d17',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '24px',
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    marginBottom: '14px',
  },
  success: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#15803d',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    marginBottom: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  col: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '4px',
    marginTop: '10px',
  },
  optional: {
    fontWeight: '400',
    color: '#9ca3af',
    fontSize: '12px',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    color: '#111827',
    outline: 'none',
    width: '100%',
  },
  select: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    color: '#111827',
    background: '#fff',
    outline: 'none',
    width: '100%',
    cursor: 'pointer',
  },
  textarea: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    color: '#111827',
    outline: 'none',
    width: '100%',
    resize: 'vertical',
    fontFamily: 'Inter, sans-serif',
  },
  btn: {
    marginTop: '20px',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #039b15, #056715)',
    color: '#fff',
    fontWeight: '600',
    fontSize: '15px',
    cursor: 'pointer',
    width: '100%',
  },
  footer: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#6b7280',
  },
};
