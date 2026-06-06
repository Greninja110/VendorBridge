import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { c, r, sh, font } from '../theme';

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
    if (form.phone && form.phone.replace(/\D/g, '').length !== 10)
      return setError('Phone number must be exactly 10 digits.');

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
  page:       { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${c.sidebar} 0%,${c.primaryDeep} 100%)`, padding:'24px' },
  card:       { background:c.surface, borderRadius:r['2xl'], padding:'40px', width:'100%', maxWidth:'480px', boxShadow:sh.login },
  logoRow:    { display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px' },
  logoIcon:   { width:'40px', height:'40px', borderRadius:r.lg, background:`linear-gradient(135deg,${c.primary},${c.primaryDark})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'700', fontSize:'14px' },
  logoText:   { fontSize:'20px', fontWeight:'700', color:c.sidebar },
  title:      { fontSize:font['2xl'], fontWeight:'700', color:c.gray900, marginBottom:'4px' },
  subtitle:   { fontSize:font.md, color:c.gray500, marginBottom:'24px' },
  error:      { background:c.errorBg, border:`1px solid ${c.errorBorder}`, color:c.errorText, borderRadius:r.md, padding:'10px 14px', fontSize:font.md, marginBottom:'14px' },
  success:    { background:c.primaryBgSoft, border:`1px solid ${c.primaryBorder}`, color:c.primaryText, borderRadius:r.md, padding:'10px 14px', fontSize:font.md, marginBottom:'14px' },
  form:       { display:'flex', flexDirection:'column', gap:'4px' },
  row:        { display:'flex', gap:'12px' },
  col:        { flex:1, display:'flex', flexDirection:'column' },
  label:      { fontSize:font.base, fontWeight:'500', color:c.gray700, marginBottom:'4px', marginTop:'10px' },
  optional:   { fontWeight:'400', color:c.gray400, fontSize:font.sm },
  input:      { padding:'10px 12px', borderRadius:r.md, border:`1px solid ${c.gray300}`, fontSize:font.md, color:c.gray900, outline:'none', width:'100%' },
  inputWrap:  { position:'relative', display:'flex', alignItems:'center' },
  inputInner: { padding:`10px 40px 10px 12px`, borderRadius:r.md, border:`1px solid ${c.gray300}`, fontSize:font.md, color:c.gray900, outline:'none', width:'100%' },
  eyeBtn:     { position:'absolute', right:'10px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', padding:'0' },
  select:     { padding:'10px 12px', borderRadius:r.md, border:`1px solid ${c.gray300}`, fontSize:font.md, color:c.gray900, background:c.surface, outline:'none', width:'100%', cursor:'pointer' },
  textarea:   { padding:'10px 12px', borderRadius:r.md, border:`1px solid ${c.gray300}`, fontSize:font.md, color:c.gray900, outline:'none', width:'100%', resize:'vertical', fontFamily:'Inter,sans-serif' },
  btn:        { marginTop:'20px', padding:'12px', borderRadius:r.md, border:'none', background:`linear-gradient(135deg,${c.primary},${c.primaryDark})`, color:'#fff', fontWeight:'600', fontSize:font.lg, cursor:'pointer', width:'100%' },
  footer:     { marginTop:'20px', textAlign:'center', fontSize:font.md, color:c.gray500 },
};
