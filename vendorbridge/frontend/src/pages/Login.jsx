import React, { useState } from 'react';
import { useNavigate, Link, Navigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { c, r, sh } from '../theme';

const ROLE_ROUTES = {
  admin: '/dashboard/admin',
  vendor: '/dashboard/vendor',
  procurement_officer: '/dashboard/procurement',
  manager: '/dashboard/manager',
};

const EyeIcon = ({ visible }) => visible ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Already logged in — send to their dashboard immediately
  if (user) {
    const dest = ROLE_ROUTES[user.role] || '/';
    return <Navigate to={dest} replace />;
  }
  const [searchParams]          = useSearchParams();
  const sessionExpired          = searchParams.get('expired') === '1';
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', form);
      login(data.user, data.token);
      navigate(ROLE_ROUTES[data.user.role] || '/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Try again.');
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

        <h2 style={styles.title}>Welcome back</h2>
        <p style={styles.subtitle}>Sign in to your account</p>

        {sessionExpired && (
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#c2410c', fontWeight: '500' }}>
            Your session has expired. Please sign in again.
          </div>
        )}
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={submit} style={styles.form}>
          <label style={styles.label}>Email address</label>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handle}
            required
            style={styles.input}
          />

          <label style={styles.label}>Password</label>
          <div style={styles.inputWrap}>
            <input
              name="password"
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={handle}
              required
              style={styles.inputInner}
            />
            <button type="button" onClick={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <EyeIcon visible={showPass} />
            </button>
          </div>

          <div style={{ textAlign: 'right', marginTop: '6px' }}>
            <Link to="/forgot-password" style={{ fontSize: '13px', color: '#056715' }}>Forgot password?</Link>
          </div>

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page:       { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${c.sidebar} 0%,${c.primaryDeep} 100%)`, padding:'24px' },
  card:       { background:c.surface, borderRadius:r['2xl'], padding:'40px', width:'100%', maxWidth:'420px', boxShadow:sh.login },
  logoRow:    { display:'flex', alignItems:'center', gap:'10px', marginBottom:'28px' },
  logoIcon:   { width:'40px', height:'40px', borderRadius:r.lg, background:`linear-gradient(135deg,${c.primary},${c.primaryDark})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'700', fontSize:'14px' },
  logoText:   { fontSize:'20px', fontWeight:'700', color:c.sidebar },
  title:      { fontSize:'24px', fontWeight:'700', color:c.gray900, marginBottom:'6px' },
  subtitle:   { fontSize:'14px', color:c.gray500, marginBottom:'28px' },
  error:      { background:c.errorBg, border:`1px solid ${c.errorBorder}`, color:c.errorText, borderRadius:r.md, padding:'10px 14px', fontSize:'14px', marginBottom:'16px' },
  form:       { display:'flex', flexDirection:'column', gap:'6px' },
  label:      { fontSize:'14px', fontWeight:'500', color:c.gray700, marginBottom:'4px', marginTop:'10px' },
  input:      { padding:'10px 14px', borderRadius:r.md, border:`1px solid ${c.gray300}`, fontSize:'14px', color:c.gray900, outline:'none', width:'100%' },
  inputWrap:  { position:'relative', display:'flex', alignItems:'center' },
  inputInner: { padding:'10px 40px 10px 14px', borderRadius:r.md, border:`1px solid ${c.gray300}`, fontSize:'14px', color:c.gray900, outline:'none', width:'100%' },
  eyeBtn:     { position:'absolute', right:'10px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', padding:'0' },
  btn:        { marginTop:'20px', padding:'12px', borderRadius:r.md, border:'none', background:`linear-gradient(135deg,${c.primary},${c.primaryDark})`, color:'#fff', fontWeight:'600', fontSize:'15px', cursor:'pointer', width:'100%' },
  footer:     { marginTop:'24px', textAlign:'center', fontSize:'14px', color:c.gray500 },
};
