import React, { useState, useEffect } from 'react';
import { c, r, sh } from '../theme';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from './dashboards/Sidebar';

const REQUIRED = ['name', 'category', 'gst_number', 'contact_phone'];

function isComplete(profile) {
  if (!profile) return false;
  return REQUIRED.every(f => profile[f]?.toString().trim());
}

export default function VendorProfilePage() {
  const { user, updateUser } = useAuth();

  const [profile,  setProfile]  = useState(null);
  const [form,     setForm]     = useState({ name: '', category: '', gst_number: '', contact_phone: '', address: '' });
  const [editing,  setEditing]  = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');
  const [err,      setErr]      = useState('');
  const noProfile  = !loading && !profile;

  useEffect(() => {
    api.get('/api/vendors/me')
      .then(({ data }) => {
        setProfile(data);
        setForm({
          name:          data.name          || '',
          category:      data.category      || '',
          gst_number:    data.gst_number    || '',
          contact_phone: data.contact_phone || '',
          address:       data.address       || '',
        });
      })
      .catch(e => { if (e.response?.status !== 404) setErr('Failed to load profile.'); })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    if (form.contact_phone && form.contact_phone.replace(/\D/g, '').length !== 10)
      return setErr('Phone number must be exactly 10 digits.');
    setSaving(true);
    try {
      if (noProfile) {
        const { data } = await api.post('/api/vendors/me', form);
        updateUser({ vendor_id: data.vendor_id });
        setMsg('Profile submitted! Waiting for admin approval before you can participate.');
      } else {
        await api.put('/api/vendors/me', form);
        setMsg('Profile updated successfully.');
      }
      // Reload profile
      const { data: fresh } = await api.get('/api/vendors/me');
      setProfile(fresh);
      setEditing(false);
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to save profile.');
    } finally { setSaving(false); }
  };

  const complete = isComplete(profile);

  return (
    <div style={s.layout}>
      <Sidebar active="profile" />
      <div style={s.body}>
        <header style={s.header}>
          <div>
            <h1 style={s.title}>Vendor Profile</h1>
            <p style={s.subtitle}>Your business information used in quotations and purchase orders</p>
          </div>
          {profile && !editing && (
            <button style={s.editBtn} onClick={() => { setEditing(true); setMsg(''); setErr(''); }}>Edit Profile</button>
          )}
        </header>

        {/* Status banners */}
        {!loading && !complete && (
          <div style={s.warnBox}>
            <strong>Profile incomplete</strong> — fill in all required fields (*) to unlock quotation submission.
          </div>
        )}
        {!loading && complete && profile?.status === 'Pending' && (
          <div style={s.pendingBox}>
            <strong>⏳ Awaiting Admin Approval</strong> — your profile has been submitted. Once an admin activates your account you'll be able to see RFQs and submit quotations.
          </div>
        )}
        {!loading && complete && profile?.status === 'Active' && (
          <div style={s.successBox}>
            ✓ Profile approved &amp; active — you can submit quotations on open RFQs.
          </div>
        )}

        {msg && <div style={s.successBox}>{msg}</div>}
        {err && <div style={s.errBox}>{err}</div>}

        {loading ? (
          <div style={s.card}><div style={s.empty}>Loading…</div></div>
        ) : (!profile || editing || noProfile) ? (
          /* ── Create / Edit form ─────────────────────────── */
          <div style={s.card}>
            <div style={s.cardTitle}>{noProfile ? 'Create Your Vendor Profile' : 'Edit Profile'}</div>
            {noProfile && (
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 16px' }}>
                Your account isn't linked to a vendor profile yet. Fill in your business details below. Your registered email (<strong>{user?.email}</strong>) will be used as the contact email.
              </p>
            )}
            <form onSubmit={handleSubmit}>
              <div style={s.grid2}>
                <FRow label="Business Name *">
                  <input style={s.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Acme Supplies Pvt Ltd" required />
                </FRow>
                <FRow label="Category *">
                  <input style={s.input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Electronics, Furniture" required />
                </FRow>
                <FRow label="GST Number *">
                  <input style={s.input} value={form.gst_number} onChange={e => setForm({ ...form, gst_number: e.target.value.toUpperCase() })} placeholder="e.g. 29ABCDE1234F1Z5" required />
                </FRow>
                <FRow label="Phone Number *">
                  <input style={s.input} value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} placeholder="e.g. +91 98765 43210" required />
                </FRow>
              </div>
              <FRow label="Contact Email">
                <input style={{ ...s.input, background: '#f9fafb', color: '#6b7280' }} value={user?.email || ''} disabled />
                <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px', display: 'block' }}>Linked from your registered account — cannot be changed here</span>
              </FRow>
              <FRow label="Address (optional)">
                <textarea style={{ ...s.input, resize: 'vertical' }} rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Business address..." />
              </FRow>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" style={s.saveBtn} disabled={saving}>{saving ? 'Saving…' : noProfile ? 'Create Profile' : 'Save Changes'}</button>
                {editing && <button type="button" style={s.cancelBtn} onClick={() => { setEditing(false); setErr(''); }}>Cancel</button>}
              </div>
            </form>
          </div>
        ) : (
          /* ── View mode ──────────────────────────────────── */
          <div style={s.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={s.avatar}>{profile.name?.[0]?.toUpperCase() || 'V'}</div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>{profile.name}</div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{profile.category}</div>
              </div>
              <span style={{ marginLeft: 'auto', ...s.statusChip, ...(profile.status === 'Active' ? { background: '#dcfce7', color: '#15803d' } : { background: '#fef9c3', color: '#a16207' }) }}>
                {profile.status}
              </span>
            </div>

            <div style={s.grid2}>
              <InfoBlock label="GST Number"     value={profile.gst_number}    mono />
              <InfoBlock label="Phone"          value={profile.contact_phone} />
              <InfoBlock label="Contact Email"  value={profile.contact_email} />
              <InfoBlock label="Category"       value={profile.category} />
            </div>
            {profile.address && (
              <div style={{ marginTop: '12px' }}>
                <InfoBlock label="Address" value={profile.address} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FRow({ label, children }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>{label}</label>
      {children}
    </div>
  );
}

function InfoBlock({ label, value, mono }) {
  return (
    <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px 14px' }}>
      <div style={{ fontSize: '10px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', fontFamily: mono ? 'monospace' : 'inherit' }}>{value || '—'}</div>
    </div>
  );
}

const s = {
  layout:     { display: 'flex', minHeight: '100vh', background: c.pageBg, fontFamily: "'Inter',system-ui,sans-serif" },
  body:       { flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'auto' },
  header:     { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  title:      { fontSize: '22px', fontWeight: '700', color: c.gray900, margin: 0 },
  subtitle:   { fontSize: '13px', color: c.gray500, marginTop: '4px' },
  editBtn:    { padding: '9px 20px', borderRadius: r.md, border: `1.5px solid ${c.primary}`, background: c.surface, color: c.primary, fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  warnBox:    { background: c.warnBg, border: `1px solid ${c.warnBorder}`, color: c.warnText, borderRadius: r.md, padding: '10px 16px', fontSize: '13px' },
  pendingBox: { background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c', borderRadius: r.md, padding: '10px 16px', fontSize: '13px' },
  successBox: { background: c.successBg, border: `1px solid ${c.successBorder}`, color: c.successText, borderRadius: r.md, padding: '10px 16px', fontSize: '13px' },
  errBox:     { background: c.errorBg, border: `1px solid ${c.errorBorder}`, color: c.errorText, borderRadius: r.md, padding: '10px 16px', fontSize: '13px' },
  card:       { background: c.surface, borderRadius: r.xl, padding: '24px', boxShadow: sh.sm },
  cardTitle:  { fontSize: '15px', fontWeight: '700', color: c.gray900, marginBottom: '14px' },
  empty:      { padding: '40px', textAlign: 'center', color: c.gray400 },
  grid2:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  input:      { width: '100%', padding: '8px 12px', borderRadius: r.md, border: `1px solid ${c.gray300}`, fontSize: '13px', color: c.gray900, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  saveBtn:    { padding: '9px 22px', borderRadius: r.md, border: 'none', background: c.primary, color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  cancelBtn:  { padding: '9px 18px', borderRadius: r.md, border: `1px solid ${c.gray200}`, background: c.surface, color: c.gray700, fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  avatar:     { width: '48px', height: '48px', borderRadius: r.xl, background: `linear-gradient(135deg,${c.primary},${c.primaryDark})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', flexShrink: 0 },
  statusChip: { padding: '4px 12px', borderRadius: r.full, fontSize: '12px', fontWeight: '600' },
};
