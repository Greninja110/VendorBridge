import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Sidebar from './Sidebar';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [uStats, setUStats] = useState({ total: 0, vendors: 0, procurement_officers: 0, managers: 0 });
  const [vStats, setVStats] = useState({ all: 0, Active: 0, Pending: 0, Blocked: 0 });
  const [poStats,setPoStats]= useState({ total: 0, total_value: 0 });
  const [invStats,setInvStats]= useState({ total: 0, pending: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/api/users/stats'),
      api.get('/api/vendors/summary'),
      api.get('/api/purchase-orders/stats'),
      api.get('/api/invoices/stats'),
    ]).then(([u, v, p, i]) => {
      setUStats(u.data);
      setVStats(v.data);
      setPoStats(p.data);
      setInvStats(i.data);
    }).catch(() => {});
  }, []);

  const fmt = (n) => n > 0 ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';

  return (
    <div style={s.layout}>
      <Sidebar active="dashboard" />
      <div style={s.body}>
        <header style={s.header}>
          <div>
            <h1 style={s.title}>Admin Dashboard</h1>
            <p style={s.subtitle}>System overview — users, vendors, and procurement analytics</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={s.outlineBtn} onClick={() => navigate('/users')}>Manage Users</button>
            <button style={s.addBtn}     onClick={() => navigate('/vendors')}>Manage Vendors</button>
          </div>
        </header>

        {/* Users stats */}
        <div style={s.sectionLabel}>Users</div>
        <div style={s.statsGrid}>
          <StatCard label="Total Users"          value={uStats.total}                 bg="#ede9fe" color="#7c3aed" onClick={() => navigate('/users')} />
          <StatCard label="Procurement Officers" value={uStats.procurement_officers}  bg="#dcfce7" color="#15803d" onClick={() => navigate('/users')} />
          <StatCard label="Managers"             value={uStats.managers}              bg="#fef9c3" color="#a16207" onClick={() => navigate('/users')} />
          <StatCard label="Vendor Accounts"      value={uStats.vendors}               bg="#dbeafe" color="#1d4ed8" onClick={() => navigate('/users')} />
        </div>

        {/* Vendors stats */}
        <div style={s.sectionLabel}>Vendors</div>
        <div style={s.statsGrid}>
          <StatCard label="Total Vendors"  value={vStats.all}     bg="#ede9fe" color="#7c3aed" onClick={() => navigate('/vendors')} />
          <StatCard label="Active"         value={vStats.Active}  bg="#dcfce7" color="#15803d" onClick={() => navigate('/vendors')} />
          <StatCard label="Pending"        value={vStats.Pending} bg="#fef9c3" color="#a16207" onClick={() => navigate('/vendors')} />
          <StatCard label="Blocked"        value={vStats.Blocked} bg="#fee2e2" color="#dc2626" onClick={() => navigate('/vendors')} />
        </div>

        {/* Procurement analytics */}
        <div style={s.sectionLabel}>Procurement Analytics</div>
        <div style={s.statsGrid}>
          <StatCard label="Total POs"       value={poStats.total}     bg="#dbeafe" color="#1d4ed8" onClick={() => navigate('/purchase-orders')} />
          <StatCard label="PO Value"        value={fmt(poStats.total_value)} bg="#dcfce7" color="#15803d" onClick={() => navigate('/purchase-orders')} />
          <StatCard label="Total Invoices"  value={invStats.total}    bg="#f3f4f6" color="#374151" onClick={() => navigate('/invoices')} />
          <StatCard label="Pending Payment" value={invStats.pending}  bg="#fef9c3" color="#a16207" onClick={() => navigate('/invoices')} />
        </div>

        {/* Navigation grid */}
        <div style={s.navGrid}>
          {[
            { label: 'User Management',  desc: 'Manage roles, add/remove users',        path: '/users',          color: '#7c3aed' },
            { label: 'Vendors',          desc: 'Approve, block, manage suppliers',       path: '/vendors',        color: '#039b15' },
            { label: 'RFQs',             desc: 'All procurement requests',              path: '/rfqs',            color: '#2563eb' },
            { label: 'Quotations',       desc: 'Compare and review quotations',         path: '/quotations',      color: '#0891b2' },
            { label: 'Approvals',        desc: 'Approve procurement workflows',         path: '/approvals',       color: '#b45309' },
            { label: 'Purchase Orders',  desc: 'View auto-generated POs',              path: '/purchase-orders', color: '#6d28d9' },
            { label: 'Invoices',         desc: 'Track payments and invoices',           path: '/invoices',        color: '#dc2626' },
          ].map(({ label, desc, path, color }) => (
            <div key={label} style={s.navCard} onClick={() => navigate(path)}>
              <div style={{ fontSize: '13px', fontWeight: '700', color }}>{label}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, bg, color, onClick }) {
  return (
    <div style={{ ...s.statCard, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div style={{ ...s.statBadge, background: bg, color }}>{value ?? '—'}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

const s = {
  layout:      { display: 'flex', minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Inter,system-ui,sans-serif' },
  body:        { flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'auto' },
  header:      { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' },
  title:       { fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 },
  subtitle:    { fontSize: '13px', color: '#6b7280', marginTop: '4px' },
  addBtn:      { padding: '9px 18px', borderRadius: '8px', border: 'none', background: '#7c3aed', color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  outlineBtn:  { padding: '9px 18px', borderRadius: '8px', border: '1.5px solid #7c3aed', background: '#fff', color: '#7c3aed', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  sectionLabel:{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px' },
  statsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' },
  statCard:    { background: '#fff', borderRadius: '10px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' },
  statBadge:   { display: 'inline-block', padding: '3px 12px', borderRadius: '20px', fontWeight: '700', fontSize: '18px', marginBottom: '6px' },
  statLabel:   { fontSize: '12px', fontWeight: '600', color: '#6b7280' },
  navGrid:     { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginTop: '4px' },
  navCard:     { background: '#fff', borderRadius: '10px', padding: '14px 16px', cursor: 'pointer', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
};
