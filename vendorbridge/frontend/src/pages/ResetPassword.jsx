import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { c, r, sh } from '../theme';

export default function ResetPassword() {
  const [searchParams]          = useSearchParams();
  const token                   = searchParams.get('token');
  const navigate                = useNavigate();
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [error,     setError]     = useState('');
  const [msg,       setMsg]       = useState('');
  const [loading,   setLoading]   = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    if (password !== confirm) return setError('Passwords do not match.');
    if (password.length < 6)  return setError('Password must be at least 6 characters.');

    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/reset-password', { token, password });
      setMsg(data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={{ color:'#dc2626', textAlign:'center' }}>Invalid reset link.</p>
        <p style={{ textAlign:'center', marginTop:'12px' }}><Link to="/login">Back to Login</Link></p>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>VB</div>
          <span style={styles.logoText}>VendorBridge</span>
        </div>

        <h2 style={styles.title}>Reset Password</h2>
        <p style={styles.subtitle}>Enter your new password below.</p>

        {error && <div style={styles.error}>{error}</div>}
        {msg   && <div style={styles.success}>{msg}</div>}

        <form onSubmit={submit} style={styles.form}>
          <label style={styles.label}>New Password</label>
          <input type="password" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />

          <label style={styles.label}>Confirm Password</label>
          <input type="password" placeholder="Re-enter password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required style={styles.input} />

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p style={styles.footer}><Link to="/login">← Back to Login</Link></p>
      </div>
    </div>
  );
}

const styles = {
  page:    { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${c.sidebar} 0%,${c.primaryDeep} 100%)`, padding:'24px' },
  card:    { background:c.surface, borderRadius:r['2xl'], padding:'40px', width:'100%', maxWidth:'420px', boxShadow:sh.login },
  logoRow: { display:'flex', alignItems:'center', gap:'10px', marginBottom:'28px' },
  logoIcon:{ width:'40px', height:'40px', borderRadius:r.lg, background:`linear-gradient(135deg,${c.primary},${c.primaryDark})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'700', fontSize:'14px' },
  logoText:{ fontSize:'20px', fontWeight:'700', color:c.sidebar },
  title:   { fontSize:'22px', fontWeight:'700', color:c.gray900, marginBottom:'6px' },
  subtitle:{ fontSize:'14px', color:c.gray500, marginBottom:'24px' },
  error:   { background:c.errorBg, border:`1px solid ${c.errorBorder}`, color:c.errorText, borderRadius:r.md, padding:'10px 14px', fontSize:'14px', marginBottom:'16px' },
  success: { background:c.primaryBgSoft, border:`1px solid ${c.primaryBorder}`, color:c.primaryText, borderRadius:r.md, padding:'10px 14px', fontSize:'14px', marginBottom:'16px' },
  form:    { display:'flex', flexDirection:'column', gap:'6px' },
  label:   { fontSize:'14px', fontWeight:'500', color:c.gray700, marginBottom:'4px', marginTop:'10px' },
  input:   { padding:'10px 14px', borderRadius:r.md, border:`1px solid ${c.gray300}`, fontSize:'14px', color:c.gray900, outline:'none', width:'100%' },
  btn:     { marginTop:'20px', padding:'12px', borderRadius:r.md, border:'none', background:`linear-gradient(135deg,${c.primary},${c.primaryDark})`, color:'#fff', fontWeight:'600', fontSize:'15px', cursor:'pointer', width:'100%' },
  footer:  { marginTop:'20px', textAlign:'center', fontSize:'14px', color:c.gray500 },
};
