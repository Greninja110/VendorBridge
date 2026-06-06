import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

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
  label:   { fontSize:'14px', fontWeight:'500', color:'#374151', marginBottom:'4px' },
  input:   { padding:'10px 14px', borderRadius:'8px', border:'1px solid #d1d5db', fontSize:'14px', color:'#111827', outline:'none', width:'100%' },
  btn:     { marginTop:'16px', padding:'12px', borderRadius:'8px', border:'none', background:'linear-gradient(135deg,#039b15,#056715)', color:'#fff', fontWeight:'600', fontSize:'15px', cursor:'pointer', width:'100%' },
  footer:  { marginTop:'20px', textAlign:'center', fontSize:'14px', color:'#6b7280' },
};
