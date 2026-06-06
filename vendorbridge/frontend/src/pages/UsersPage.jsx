import React, { useState, useEffect } from 'react';
import { c, r, sh } from '../theme';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from './dashboards/Sidebar';
import { fmtDateTime } from '../utils/date';

const ROLE_LABELS = { admin: 'Admin', vendor: 'Vendor', procurement_officer: 'Procurement Officer', manager: 'Manager' };
const ROLE_COLORS = {
  admin:               { bg: '#ede9fe', color: '#7c3aed' },
  vendor:              { bg: '#dbeafe', color: '#1d4ed8' },
  procurement_officer: { bg: '#dcfce7', color: '#15803d' },
  manager:             { bg: '#fef9c3', color: '#a16207' },
};

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users,   setUsers]   = useState([]);
  const [stats,   setStats]   = useState({ total: 0, admins: 0, vendors: 0, procurement_officers: 0, managers: 0 });
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [msg,     setMsg]     = useState('');
  const [busy,    setBusy]    = useState(null);

  const fetch = (role = roleFilter) => {
    setLoading(true);
    const params = role !== 'all' ? { role } : {};
    Promise.all([
      api.get('/api/users', { params }),
      api.get('/api/users/stats'),
    ]).then(([u, s]) => { setUsers(u.data); setStats(s.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch('all'); }, []);

  const changeRole = async (userId, newRole) => {
    setBusy(userId);
    setMsg('');
    try {
      await api.patch(`/api/users/${userId}/role`, { role: newRole });
      setMsg('Role updated.');
      fetch(roleFilter);
    } catch (e) { setMsg(e.response?.data?.message || 'Error.'); }
    finally { setBusy(null); }
  };

  const deleteUser = async (userId, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setBusy(userId);
    try {
      await api.delete(`/api/users/${userId}`);
      setMsg('User deleted.');
      fetch(roleFilter);
    } catch (e) { setMsg(e.response?.data?.message || 'Error.'); }
    finally { setBusy(null); }
  };

  const handleTab = (role) => { setRoleFilter(role); fetch(role); };

  const TABS = [
    { key: 'all',                label: `All (${stats.total})` },
    { key: 'admin',              label: `Admins (${stats.admins})` },
    { key: 'procurement_officer',label: `Procurement (${stats.procurement_officers})` },
    { key: 'manager',            label: `Managers (${stats.managers})` },
    { key: 'vendor',             label: `Vendors (${stats.vendors})` },
  ];

  return (
    <div style={s.layout}>
      <Sidebar active="dashboard" />
      <div style={s.body}>
        <header style={s.header}>
          <div>
            <h1 style={s.title}>User Management</h1>
            <p style={s.subtitle}>View and manage all registered accounts</p>
          </div>
        </header>

        {/* Stats */}
        <div style={s.statsGrid}>
          <StatCard label="Total Users"          value={stats.total}                 bg="#ede9fe" color="#7c3aed" />
          <StatCard label="Procurement Officers" value={stats.procurement_officers}  bg="#dcfce7" color="#15803d" />
          <StatCard label="Managers"             value={stats.managers}              bg="#fef9c3" color="#a16207" />
          <StatCard label="Vendors"              value={stats.vendors}               bg="#dbeafe" color="#1d4ed8" />
        </div>

        {msg && <div style={s.msgBox}>{msg}</div>}

        <div style={s.tabRow}>
          {TABS.map(({ key, label }) => (
            <button key={key} style={{ ...s.tab, ...(roleFilter === key ? s.tabActive : {}) }} onClick={() => handleTab(key)}>{label}</button>
          ))}
        </div>

        <div style={s.card}>
          {loading ? <div style={s.empty}>Loading...</div>
            : users.length === 0 ? <div style={s.empty}>No users found.</div>
            : (
              <table style={s.table}>
                <thead>
                  <tr>{['Name','Email','Role','Country','Joined','Last Login','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ ...s.tr, ...(u.id === me?.id ? { background: '#fafafa' } : {}) }}>
                      <td style={{ ...s.td, fontWeight: '600', color: '#111827' }}>
                        {u.first_name} {u.last_name}
                        {u.id === me?.id && <span style={{ fontSize: '10px', color: '#9ca3af', marginLeft: '6px' }}>(you)</span>}
                      </td>
                      <td style={s.td}>{u.email}</td>
                      <td style={s.td}>
                        {u.id === me?.id
                          ? <span style={{ ...s.chip, ...ROLE_COLORS[u.role] }}>{ROLE_LABELS[u.role]}</span>
                          : (
                            <select
                              value={u.role}
                              disabled={busy === u.id}
                              onChange={e => changeRole(u.id, e.target.value)}
                              style={{ ...s.roleSelect, ...ROLE_COLORS[u.role] }}
                            >
                              {Object.entries(ROLE_LABELS).map(([val, lbl]) => (
                                <option key={val} value={val}>{lbl}</option>
                              ))}
                            </select>
                          )}
                      </td>
                      <td style={s.td}>{u.country || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                      <td style={s.td}>{fmtDateTime(u.created_at)}</td>
                      <td style={s.td}>{u.last_login ? fmtDateTime(u.last_login) : <span style={{ color: '#d1d5db' }}>Never</span>}</td>
                      <td style={s.td}>
                        {u.id !== me?.id && (
                          <button style={s.deleteBtn} disabled={busy === u.id} onClick={() => deleteUser(u.id, `${u.first_name} ${u.last_name}`)}>
                            {busy === u.id ? '...' : 'Delete'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, bg, color }) {
  return (
    <div style={s.statCard}>
      <div style={{ ...s.statBadge, background: bg, color }}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

const s = {
  layout:    { display: 'flex', minHeight: '100vh', background: c.pageBg, fontFamily: "'Inter',system-ui,sans-serif" },
  body:      { flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '18px', overflow: 'auto' },
  header:    { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  title:     { fontSize: '22px', fontWeight: '700', color: c.gray900, margin: 0 },
  subtitle:  { fontSize: '13px', color: c.gray500, marginTop: '4px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' },
  statCard:  { background: c.surface, borderRadius: r.xl, padding: '16px 18px', boxShadow: sh.sm },
  statBadge: { display: 'inline-block', padding: '3px 12px', borderRadius: r.full, fontWeight: '700', fontSize: '18px', marginBottom: '6px' },
  statLabel: { fontSize: '12px', fontWeight: '600', color: c.gray500 },
  msgBox:    { background: c.successBg, border: `1px solid ${c.successBorder}`, color: c.successText, borderRadius: r.md, padding: '10px 16px', fontSize: '13px' },
  tabRow:    { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  tab:       { padding: '6px 14px', borderRadius: r.full, border: `1px solid ${c.gray200}`, background: c.surface, fontSize: '12px', fontWeight: '500', color: c.gray500, cursor: 'pointer' },
  tabActive: { background: c.purple, color: '#fff', border: `1px solid ${c.purple}` },
  card:      { background: c.surface, borderRadius: r.xl, overflow: 'hidden', boxShadow: sh.sm },
  empty:     { padding: '48px', textAlign: 'center', color: c.gray400, fontSize: '14px' },
  table:     { width: '100%', borderCollapse: 'collapse' },
  th:        { padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: c.gray500, textTransform: 'uppercase', textAlign: 'left', borderBottom: `1px solid ${c.gray100}`, background: c.gray150 },
  tr:        { borderBottom: `1px solid ${c.gray50}` },
  td:        { padding: '11px 14px', fontSize: '13px', color: c.gray700 },
  chip:      { padding: '3px 10px', borderRadius: r.full, fontSize: '11px', fontWeight: '600', display: 'inline-block' },
  roleSelect:{ padding: '3px 8px', borderRadius: r.full, border: 'none', fontSize: '11px', fontWeight: '600', cursor: 'pointer', outline: 'none' },
  deleteBtn: { padding: '4px 12px', borderRadius: r.sm, border: `1.5px solid ${c.red}`, color: c.red, background: c.surface, fontWeight: '600', fontSize: '11px', cursor: 'pointer' },
};
