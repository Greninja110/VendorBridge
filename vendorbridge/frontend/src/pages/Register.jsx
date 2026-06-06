import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const ROLES = [
  { value: 'vendor',              label: 'Vendor' },
  { value: 'procurement_officer', label: 'Procurement Officer' },
  { value: 'manager',             label: 'Manager / Approver' },
  { value: 'admin',               label: 'Admin' },
];

const EyeIcon = ({ visible }) => visible ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    phone: '', country: '', additional_info: '', password: '', confirm: '', role: '',
  });
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 6)       return setError('Password must be at least 6 characters.');

    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        first_name:      form.first_name,
        last_name:       form.last_name,
        email:           form.email,
        phone:           form.phone,
        country:         form.country,
        additional_info: form.additional_info,
        password:        form.password,
        role:            form.role,
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
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logoRow}>
          <div style={s.logoIcon}>VB</div>
          <span style={s.logoText}>VendorBridge</span>
        </div>

        <h2 style={s.title}>Create your account</h2>
        <p style={s.subtitle}>Join the procurement platform</p>

        {error   && <div style={s.error}>{error}</div>}
        {success && <div style={s.success}>{success}</div>}

        <form onSubmit={submit} style={s.form}>
          <div style={s.row}>
            <div style={s.col}>
              <label style={s.label}>First Name</label>
              <input name="first_name" placeholder="John" value={form.first_name} onChange={handle} required style={s.input} />
            </div>
            <div style={s.col}>
              <label style={s.label}>Last Name</label>
              <input name="last_name" placeholder="Doe" value={form.last_name} onChange={handle} required style={s.input} />
            </div>
          </div>

          <label style={s.label}>Email Address</label>
          <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handle} required style={s.input} />

          <label style={s.label}>Phone Number <span style={s.optional}>(optional)</span></label>
          <input name="phone" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={handle} style={s.input} />

          <label style={s.label}>Country <span style={s.optional}>(optional)</span></label>
          <input name="country" placeholder="e.g. India" value={form.country} onChange={handle} style={s.input} />

          <label style={s.label}>Additional Information <span style={s.optional}>(optional)</span></label>
          <textarea name="additional_info" placeholder="Any additional details about yourself or your organization..." value={form.additional_info} onChange={handle} rows={3} style={s.textarea} />

          <label style={s.label}>Role</label>
          <select name="role" value={form.role} onChange={handle} required style={s.select}>
            <option value="">Select your role</option>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>

          <label style={s.label}>Password</label>
          <div style={s.inputWrap}>
            <input name="password" type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password} onChange={handle} required style={s.inputInner} />
            <button type="button" onClick={() => setShowPass(!showPass)} style={s.eyeBtn}>
              <EyeIcon visible={showPass} />
            </button>
          </div>

          <label style={s.label}>Confirm Password</label>
          <div style={s.inputWrap}>
            <input name="confirm" type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password" value={form.confirm} onChange={handle} required style={s.inputInner} />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={s.eyeBtn}>
              <EyeIcon visible={showConfirm} />
            </button>
          </div>

          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p style={s.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page:       { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#0a1d17 0%,#043b0c 100%)', padding:'24px' },
  card:       { background:'#fff', borderRadius:'16px', padding:'40px', width:'100%', maxWidth:'480px', boxShadow:'0 25px 50px rgba(0,0,0,0.4)' },
  logoRow:    { display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px' },
  logoIcon:   { width:'40px', height:'40px', borderRadius:'10px', background:'linear-gradient(135deg,#039b15,#056715)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'700', fontSize:'14px' },
  logoText:   { fontSize:'20px', fontWeight:'700', color:'#0a1d17' },
  title:      { fontSize:'22px', fontWeight:'700', color:'#111827', marginBottom:'4px' },
  subtitle:   { fontSize:'14px', color:'#6b7280', marginBottom:'24px' },
  error:      { background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:'8px', padding:'10px 14px', fontSize:'14px', marginBottom:'14px' },
  success:    { background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#15803d', borderRadius:'8px', padding:'10px 14px', fontSize:'14px', marginBottom:'14px' },
  form:       { display:'flex', flexDirection:'column', gap:'4px' },
  row:        { display:'flex', gap:'12px' },
  col:        { flex:1, display:'flex', flexDirection:'column' },
  label:      { fontSize:'13px', fontWeight:'500', color:'#374151', marginBottom:'4px', marginTop:'10px' },
  optional:   { fontWeight:'400', color:'#9ca3af', fontSize:'12px' },
  input:      { padding:'10px 12px', borderRadius:'8px', border:'1px solid #d1d5db', fontSize:'14px', color:'#111827', outline:'none', width:'100%' },
  inputWrap:  { position:'relative', display:'flex', alignItems:'center' },
  inputInner: { padding:'10px 40px 10px 12px', borderRadius:'8px', border:'1px solid #d1d5db', fontSize:'14px', color:'#111827', outline:'none', width:'100%' },
  eyeBtn:     { position:'absolute', right:'10px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', padding:'0' },
  select:     { padding:'10px 12px', borderRadius:'8px', border:'1px solid #d1d5db', fontSize:'14px', color:'#111827', background:'#fff', outline:'none', width:'100%', cursor:'pointer' },
  textarea:   { padding:'10px 12px', borderRadius:'8px', border:'1px solid #d1d5db', fontSize:'14px', color:'#111827', outline:'none', width:'100%', resize:'vertical', fontFamily:'Inter,sans-serif' },
  btn:        { marginTop:'20px', padding:'12px', borderRadius:'8px', border:'none', background:'linear-gradient(135deg,#039b15,#056715)', color:'#fff', fontWeight:'600', fontSize:'15px', cursor:'pointer', width:'100%' },
  footer:     { marginTop:'20px', textAlign:'center', fontSize:'14px', color:'#6b7280' },
};
