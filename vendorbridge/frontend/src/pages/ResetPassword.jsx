import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';

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
  page:    { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#0a1d17 0%,#043b0c 100%)', padding:'24px' },
  card:    { background:'#fff', borderRadius:'16px', padding:'40px', width:'100%', maxWidth:'420px', boxShadow:'0 25px 50px rgba(0,0,0,0.4)' },
  logoRow: { display:'flex', alignItems:'center', gap:'10px', marginBottom:'28px' },
  logoIcon:{ width:'40px', height:'40px', borderRadius:'10px', background:'linear-gradient(135deg,#039b15,#056715)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'700', fontSize:'14px' },
  logoText:{ fontSize:'20px', fontWeight:'700', color:'#0a1d17' },
  title:   { fontSize:'22px', fontWeight:'700', color:'#111827', marginBottom:'6px' },
  subtitle:{ fontSize:'14px', color:'#6b7280', marginBottom:'24px' },
  error:   { background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:'8px', padding:'10px 14px', fontSize:'14px', marginBottom:'16px' },
  success: { background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#15803d', borderRadius:'8px', padding:'10px 14px', fontSize:'14px', marginBottom:'16px' },
  form:    { display:'flex', flexDirection:'column', gap:'6px' },
  label:   { fontSize:'14px', fontWeight:'500', color:'#374151', marginBottom:'4px', marginTop:'10px' },
  input:   { padding:'10px 14px', borderRadius:'8px', border:'1px solid #d1d5db', fontSize:'14px', color:'#111827', outline:'none', width:'100%' },
  btn:     { marginTop:'20px', padding:'12px', borderRadius:'8px', border:'none', background:'linear-gradient(135deg,#039b15,#056715)', color:'#fff', fontWeight:'600', fontSize:'15px', cursor:'pointer', width:'100%' },
  footer:  { marginTop:'20px', textAlign:'center', fontSize:'14px', color:'#6b7280' },
};
