import React, { useEffect, useState } from 'react';
import { c, r, sh } from '../../theme';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Sidebar from './Sidebar';

export default function ManagerDashboard() {
  const navigate  = useNavigate();
  const [aStats,   setAStats]   = useState({ pending: 0, approved: 0, rejected: 0 });
  const [vStats,   setVStats]   = useState({ Active: 0, all: 0 });
  const [pending,  setPending]  = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/api/approvals/stats'),
      api.get('/api/vendors/summary'),
      api.get('/api/approvals'),
    ]).then(([a, v, ap]) => {
      setAStats(a.data);
      setVStats(v.data);
      setPending(ap.data.filter(i => !i.approval_id).slice(0, 3));
    }).catch(() => {});
  }, []);

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

  return (
    <div style={s.layout}>
      <Sidebar active="dashboard" />
      <div style={s.body}>
        <header style={s.header}>
          <div>
            <h1 style={s.title}>Manager Dashboard</h1>
            <p style={s.subtitle}>Review procurement requests and monitor workflows</p>
          </div>
          <button style={s.addBtn} onClick={() => navigate('/approvals')}>View All Approvals</button>
        </header>

        <div style={s.statsGrid}>
          <StatCard label="Pending Approvals"  value={aStats.pending}   sub="awaiting your decision" bg="#fef9c3" color="#a16207" onClick={() => navigate('/approvals')} />
          <StatCard label="Approved"           value={aStats.approved}  sub="all time"               bg="#dcfce7" color="#15803d" />
          <StatCard label="Rejected"           value={aStats.rejected}  sub="returned for review"    bg="#fee2e2" color="#dc2626" />
          <StatCard label="Active Vendors"     value={vStats.Active}    sub={`of ${vStats.all} total`} bg="#dbeafe" color="#1d4ed8" onClick={() => navigate('/vendors')} />
        </div>

        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardTitle}>Pending Approvals</span>
            <button style={s.linkBtn} onClick={() => navigate('/approvals')}>View all →</button>
          </div>
          {pending.length === 0
            ? <div style={s.empty}>No pending approvals. Check back after procurement officers submit RFQs.</div>
            : pending.map(item => (
              <div key={item.quotation_id} style={s.pendingItem}>
                <div style={{ flex: 1 }}>
                  <div style={s.itemTitle}>{item.rfq_title}</div>
                  <div style={s.itemMeta}>{item.vendor_name} · by {item.submitted_by}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={s.amount}>{fmt(item.total_amount)}</span>
                  <button style={s.reviewBtn} onClick={() => navigate('/approvals')}>Review →</button>
                </div>
              </div>
            ))}
        </div>

        <div style={s.row}>
          <div style={{ ...s.card, flex: 1 }}>
            <div style={s.cardHeader}>
              <span style={s.cardTitle}>Workflow Navigation</span>
            </div>
            <div style={s.navGrid}>
              {[
                { label: 'Approvals',       desc: 'Approve or reject quotations', path: '/approvals',       color: '#b45309' },
                { label: 'Vendors',         desc: 'View supplier directory',       path: '/vendors',         color: '#039b15' },
                { label: 'Quotations',      desc: 'Review submitted quotes',       path: '/quotations',      color: '#7c3aed' },
                { label: 'Purchase Orders', desc: 'View generated POs',            path: '/purchase-orders', color: '#1d4ed8' },
              ].map(({ label, desc, path, color }) => (
                <div key={label} style={s.navCard} onClick={() => navigate(path)}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color }}>{label}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, bg, color, onClick }) {
  return (
    <div style={{ ...s.statCard, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div style={{ ...s.statBadge, background: bg, color }}>{value ?? '—'}</div>
      <div style={s.statLabel}>{label}</div>
      <div style={s.statSub}>{sub}</div>
    </div>
  );
}

const s = {
  layout:     { display: 'flex', minHeight: '100vh', background: c.pageBg, fontFamily: "'Inter',system-ui,sans-serif" },
  body:       { flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'auto' },
  header:     { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  title:      { fontSize: '22px', fontWeight: '700', color: c.gray900, margin: 0 },
  subtitle:   { fontSize: '13px', color: c.gray500, marginTop: '4px' },
  addBtn:     { padding: '9px 18px', borderRadius: r.md, border: 'none', background: c.orange, color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  statsGrid:  { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' },
  statCard:   { background: c.surface, borderRadius: r.xl, padding: '20px', boxShadow: sh.sm },
  statBadge:  { display: 'inline-block', padding: '4px 12px', borderRadius: r.full, fontWeight: '700', fontSize: '20px', marginBottom: '8px' },
  statLabel:  { fontSize: '13px', fontWeight: '600', color: c.gray700, marginBottom: '2px' },
  statSub:    { fontSize: '11px', color: c.gray400 },
  row:        { display: 'flex', gap: '20px' },
  card:       { background: c.surface, borderRadius: r.xl, padding: '20px', boxShadow: sh.sm },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
  cardTitle:  { fontSize: '14px', fontWeight: '600', color: c.gray900 },
  linkBtn:    { fontSize: '12px', fontWeight: '600', color: c.orange, background: 'none', border: 'none', cursor: 'pointer' },
  empty:      { padding: '24px 0', textAlign: 'center', color: c.gray400, fontSize: '13px' },
  pendingItem:{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${c.gray50}` },
  itemTitle:  { fontSize: '13px', fontWeight: '600', color: c.gray900 },
  itemMeta:   { fontSize: '11px', color: c.gray400, marginTop: '2px' },
  amount:     { fontSize: '14px', fontWeight: '700', color: c.gray900 },
  reviewBtn:  { padding: '5px 12px', borderRadius: r.sm, border: `1.5px solid ${c.orange}`, color: c.orange, background: c.surface, fontWeight: '600', fontSize: '12px', cursor: 'pointer' },
  navGrid:    { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' },
  navCard:    { background: c.gray50, borderRadius: r.lg, padding: '14px 16px', cursor: 'pointer', border: `1px solid ${c.gray200}` },
};
