import React, { useEffect, useState } from 'react';
import { c, r, sh } from '../../theme';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Sidebar from './Sidebar';

export default function ProcurementDashboard() {
  const navigate = useNavigate();
  const [rfqStats, setRfqStats]   = useState({ total: 0, published: 0 });
  const [poStats,  setPoStats]    = useState({ total: 0, total_value: 0 });
  const [invStats, setInvStats]   = useState({ pending: 0 });
  const [vStats,   setVStats]     = useState({ Active: 0 });
  const [pos,      setPos]        = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/api/rfqs/stats'),
      api.get('/api/purchase-orders/stats'),
      api.get('/api/invoices/stats'),
      api.get('/api/vendors/summary'),
      api.get('/api/purchase-orders'),
    ]).then(([r, p, i, v, poList]) => {
      setRfqStats(r.data);
      setPoStats(p.data);
      setInvStats(i.data);
      setVStats(v.data);
      setPos(poList.data.slice(0, 5));
    }).catch(() => {});
  }, []);

  const fmt = (n) => n > 0 ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';

  const PO_STATUS_COLORS = {
    1: { bg: '#dcfce7', color: '#15803d', label: 'Approved' },
    0: { bg: '#fef9c3', color: '#a16207', label: 'Pending'  },
  };

  return (
    <div style={s.layout}>
      <Sidebar active="dashboard" />
      <div style={s.body}>
        <header style={s.header}>
          <div>
            <h1 style={s.title}>Dashboard</h1>
            <p style={s.subtitle}>Welcome back, Procurement Officer — Today's Overview</p>
          </div>
          <button style={s.addBtn} onClick={() => navigate('/rfqs')}>+ Create RFQ</button>
        </header>

        <div style={s.statsGrid}>
          <StatCard label="Active RFQs"      value={rfqStats.published} sub="currently published"  bg="#dcfce7" color="#15803d" onClick={() => navigate('/rfqs')} />
          <StatCard label="Total RFQs"       value={rfqStats.total}     sub="all time"             bg="#f0fdf4" color="#059669" onClick={() => navigate('/rfqs')} />
          <StatCard label="Purchase Orders"  value={poStats.total}      sub={fmt(poStats.total_value)} bg="#dbeafe" color="#1d4ed8" onClick={() => navigate('/purchase-orders')} />
          <StatCard label="Pending Invoices" value={invStats.pending}   sub="awaiting payment"     bg="#fef9c3" color="#a16207" onClick={() => navigate('/invoices')} />
        </div>

        <div style={s.row}>
          <div style={{ ...s.card, flex: 1 }}>
            <div style={s.cardHeader}>
              <span style={s.cardTitle}>Recent Purchase Orders</span>
              <button style={s.linkBtn} onClick={() => navigate('/purchase-orders')}>View all</button>
            </div>
            {pos.length === 0
              ? <div style={s.empty}>No purchase orders yet.</div>
              : (
                <table style={s.table}>
                  <thead><tr>{['PO #','Vendor','Amount','Status'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {pos.map(po => {
                      const sc = PO_STATUS_COLORS[po.approved] || PO_STATUS_COLORS[0];
                      return (
                        <tr key={po.po_id} style={s.tr}>
                          <td style={{ ...s.td, fontFamily: 'monospace', fontWeight: '700' }}>{po.po_number}</td>
                          <td style={s.td}>{po.vendor_name}</td>
                          <td style={{ ...s.td, fontWeight: '600' }}>₹{Number(po.total_amount).toLocaleString('en-IN')}</td>
                          <td style={s.td}><span style={{ ...s.chip, ...sc }}>{sc.label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
          </div>

          <div style={{ ...s.card, width: '200px' }}>
            <div style={{ ...s.cardHeader, marginBottom: '12px' }}><span style={s.cardTitle}>Quick Actions</span></div>
            {[
              { label: '+ New RFQ',       color: '#039b15', path: '/rfqs' },
              { label: 'Vendors',         color: '#2563eb', path: '/vendors' },
              { label: 'Quotations',      color: '#7c3aed', path: '/quotations' },
              { label: 'Purchase Orders', color: '#b45309', path: '/purchase-orders' },
              { label: 'Invoices',        color: '#dc2626', path: '/invoices' },
            ].map(({ label, color, path }) => (
              <button key={label} style={{ ...s.qaBtn, borderColor: color, color, marginBottom: '8px' }} onClick={() => navigate(path)}>{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, bg, color, onClick }) {
  return (
    <div style={{ ...s.statCard, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div style={{ ...s.statBadge, background: bg, color }}>{value}</div>
      <div style={s.statLabel}>{label}</div>
      <div style={s.statSub}>{sub}</div>
    </div>
  );
}

const s = {
  layout:    { display: 'flex', minHeight: '100vh', background: c.pageBg, fontFamily: "'Inter',system-ui,sans-serif" },
  body:      { flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'auto' },
  header:    { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  title:     { fontSize: '22px', fontWeight: '700', color: c.gray900, margin: 0 },
  subtitle:  { fontSize: '13px', color: c.gray500, marginTop: '4px' },
  addBtn:    { padding: '9px 18px', borderRadius: r.md, border: 'none', background: c.primary, color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' },
  statCard:  { background: c.surface, borderRadius: r.xl, padding: '20px', boxShadow: sh.sm, transition: 'box-shadow 0.15s' },
  statBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: r.full, fontWeight: '700', fontSize: '20px', marginBottom: '8px' },
  statLabel: { fontSize: '13px', fontWeight: '600', color: c.gray700, marginBottom: '2px' },
  statSub:   { fontSize: '11px', color: c.gray400 },
  row:       { display: 'flex', gap: '20px' },
  card:      { background: c.surface, borderRadius: r.xl, padding: '20px', boxShadow: sh.sm },
  cardHeader:{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
  cardTitle: { fontSize: '14px', fontWeight: '600', color: c.gray900 },
  linkBtn:   { fontSize: '12px', fontWeight: '600', color: c.primary, background: 'none', border: 'none', cursor: 'pointer' },
  empty:     { padding: '24px 0', textAlign: 'center', color: c.gray400, fontSize: '13px' },
  table:     { width: '100%', borderCollapse: 'collapse' },
  th:        { padding: '8px 10px', fontSize: '11px', fontWeight: '600', color: c.gray500, textTransform: 'uppercase', textAlign: 'left', borderBottom: `1px solid ${c.gray100}`, background: c.gray150 },
  tr:        { borderBottom: `1px solid ${c.gray50}` },
  td:        { padding: '10px 10px', fontSize: '13px', color: c.gray700 },
  chip:      { padding: '3px 10px', borderRadius: r.full, fontSize: '11px', fontWeight: '600' },
  qaBtn:     { display: 'block', width: '100%', padding: '9px 12px', borderRadius: r.md, border: '1.5px solid', background: c.surface, fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left' },
};
