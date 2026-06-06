import React, { useState, useEffect } from 'react';
import { c, r, sh } from '../theme';
import api from '../api/axios';
import Sidebar from './dashboards/Sidebar';

const fmt  = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtN = (n) => Number(n || 0).toLocaleString('en-IN');

export default function ReportsPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState('');

  useEffect(() => {
    api.get('/api/reports')
      .then(({ data }) => setData(data))
      .catch(() => setErr('Failed to load report data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageShell><div style={s.empty}>Loading reports…</div></PageShell>;
  if (err)     return <PageShell><div style={{ ...s.empty, color: '#dc2626' }}>{err}</div></PageShell>;

  const { summary: sm, byCategory, topVendors } = data;

  return (
    <PageShell>
      {/* ── Top stat cards ─────────────────────────────────────── */}
      <div style={s.grid4}>
        <StatCard label="Total PO Spend"   value={fmt(sm.total_po_spend)}   sub={`${fmtN(sm.total_pos)} purchase orders`}      color="#7c3aed" bg="#ede9fe" />
        <StatCard label="Invoices Paid"    value={fmt(sm.total_paid)}       sub={`${fmtN(sm.invoices_paid)} invoices`}           color="#15803d" bg="#dcfce7" />
        <StatCard label="Pending Invoices" value={fmt(sm.total_pending)}    sub={`${fmtN(sm.invoices_pending)} awaiting payment`} color="#a16207" bg="#fef9c3" />
        <StatCard label="Active Vendors"   value={fmtN(sm.active_vendors)}  sub={`of ${fmtN(sm.total_vendors)} total`}           color="#0369a1" bg="#e0f2fe" />
      </div>

      {/* ── Secondary stat cards ────────────────────────────────── */}
      <div style={s.grid3}>
        <MiniCard label="Total RFQs"       value={fmtN(sm.total_rfqs)}        sub={`${fmtN(sm.open_rfqs)} open`} />
        <MiniCard label="Quotations"       value={fmtN(sm.total_quotations)}   sub="submitted" />
        <MiniCard label="Purchase Orders"  value={fmtN(sm.total_pos)}          sub="generated" />
      </div>

      <div style={s.row2}>
        {/* ── Spend by category ───────────────────────────────── */}
        <div style={{ ...s.card, flex: 1.4 }}>
          <div style={s.cardTitle}>Spend by Category</div>
          {byCategory.length === 0
            ? <div style={s.empty}>No purchase orders yet.</div>
            : (
              <>
                <table style={s.table}>
                  <thead>
                    <tr>{['Category','Vendors','POs','Total Spend','Share'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {byCategory.map((row, i) => {
                      const totalSpend = byCategory.reduce((s, r) => s + Number(r.total_spend), 0);
                      const pct = totalSpend > 0 ? ((Number(row.total_spend) / totalSpend) * 100).toFixed(1) : 0;
                      return (
                        <tr key={i} style={s.tr}>
                          <td style={{ ...s.td, fontWeight: '600', color: c.gray900 }}>{row.category}</td>
                          <td style={{ ...s.td, textAlign: 'center' }}>{row.vendor_count}</td>
                          <td style={{ ...s.td, textAlign: 'center' }}>{row.po_count}</td>
                          <td style={{ ...s.td, fontWeight: '600' }}>{fmt(row.total_spend)}</td>
                          <td style={s.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ flex: 1, height: '6px', background: c.gray100, borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: c.purple, borderRadius: '3px' }} />
                              </div>
                              <span style={{ fontSize: '11px', color: c.gray500, minWidth: '32px' }}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
        </div>

        {/* ── Top vendors ─────────────────────────────────────── */}
        <div style={{ ...s.card, flex: 1 }}>
          <div style={s.cardTitle}>Top Vendors by Spend</div>
          {topVendors.length === 0
            ? <div style={s.empty}>No data yet.</div>
            : topVendors.map((v, i) => {
                const max = Number(topVendors[0].total_spend) || 1;
                const pct = ((Number(v.total_spend) / max) * 100).toFixed(0);
                return (
                  <div key={i} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: r.full, background: c.purple, color: '#fff', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: c.gray900 }}>{v.vendor_name}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: c.purple }}>{fmt(v.total_spend)}</span>
                    </div>
                    <div style={{ height: '5px', background: c.gray100, borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${c.purple},${c.purpleLight})`, borderRadius: '3px' }} />
                    </div>
                    <div style={{ fontSize: '11px', color: c.gray400, marginTop: '2px' }}>{v.po_count} PO{v.po_count !== 1 ? 's' : ''}</div>
                  </div>
                );
              })}
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({ children }) {
  return (
    <div style={s.layout}>
      <Sidebar active="reports" />
      <div style={s.body}>
        <header style={s.header}>
          <div>
            <h1 style={s.title}>Reports & Analytics</h1>
            <p style={s.subtitle}>Procurement spend summary and vendor performance</p>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, bg }) {
  return (
    <div style={{ background: bg, borderRadius: '12px', padding: '18px 20px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: '800', color: c.gray900, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '11px', color: c.gray500, marginTop: '4px' }}>{sub}</div>
    </div>
  );
}

function MiniCard({ label, value, sub }) {
  return (
    <div style={{ background: c.surface, borderRadius: r.xl, padding: '14px 20px', boxShadow: sh.sm, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '13px', color: c.gray500, fontWeight: '500' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '20px', fontWeight: '800', color: c.gray900 }}>{value}</div>
        <div style={{ fontSize: '11px', color: c.gray400 }}>{sub}</div>
      </div>
    </div>
  );
}

const s = {
  layout:    { display: 'flex', minHeight: '100vh', background: c.pageBg, fontFamily: "'Inter',system-ui,sans-serif" },
  body:      { flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '18px', overflow: 'auto' },
  header:    { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  title:     { fontSize: '22px', fontWeight: '700', color: c.gray900, margin: 0 },
  subtitle:  { fontSize: '13px', color: c.gray500, marginTop: '4px' },
  grid4:     { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' },
  grid3:     { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' },
  row2:      { display: 'flex', gap: '18px', alignItems: 'flex-start' },
  card:      { background: c.surface, borderRadius: r.xl, padding: '20px', boxShadow: sh.sm },
  cardTitle: { fontSize: '14px', fontWeight: '700', color: c.gray900, marginBottom: '14px' },
  empty:     { padding: '32px 0', textAlign: 'center', color: c.gray400, fontSize: '14px' },
  table:     { width: '100%', borderCollapse: 'collapse' },
  th:        { padding: '8px 12px', fontSize: '11px', fontWeight: '600', color: c.gray500, textTransform: 'uppercase', textAlign: 'left', borderBottom: `1px solid ${c.gray100}`, background: c.gray150 },
  tr:        { borderBottom: `1px solid ${c.gray50}` },
  td:        { padding: '11px 12px', fontSize: '13px', color: c.gray700 },
};
