import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { c, r, sh } from '../theme';

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('');
  const [msg,     setMsg]     = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/forgot-password', { email });
      setMsg(data.message);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>VB</div>
          <span style={styles.logoText}>VendorBridge</span>
        </div>

        <h2 style={styles.title}>Forgot Password</h2>
        <p style={styles.subtitle}>Enter your email and we'll send you a reset link.</p>

        {error && <div style={styles.error}>{error}</div>}
        {msg   && <div style={styles.success}>{msg}</div>}

        <form onSubmit={submit} style={styles.form}>
          <label style={styles.label}>Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p style={styles.footer}>
          <Link to="/login">← Back to Login</Link>
        </p>
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
  label:   { fontSize:'14px', fontWeight:'500', color:c.gray700, marginBottom:'4px' },
  input:   { padding:'10px 14px', borderRadius:r.md, border:`1px solid ${c.gray300}`, fontSize:'14px', color:c.gray900, outline:'none', width:'100%' },
  btn:     { marginTop:'16px', padding:'12px', borderRadius:r.md, border:'none', background:`linear-gradient(135deg,${c.primary},${c.primaryDark})`, color:'#fff', fontWeight:'600', fontSize:'15px', cursor:'pointer', width:'100%' },
  footer:  { marginTop:'20px', textAlign:'center', fontSize:'14px', color:c.gray500 },
};
