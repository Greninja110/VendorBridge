import React, { useEffect, useState } from 'react';
import { c, r, sh } from '../../theme';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import { fmtDate } from '../../utils/date';

export default function VendorDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [rfqs,          setRfqs]          = useState([]);
  const [quotes,        setQuotes]        = useState([]);
  const [vendorStatus,  setVendorStatus]  = useState(null); // null=loading, 'Pending', 'Active', 'Blocked'

  useEffect(() => {
    // Fetch vendor status first
    api.get('/api/vendors/me')
      .then(({ data }) => setVendorStatus(data.status || 'Pending'))
      .catch(() => setVendorStatus('Pending'));

    Promise.all([
      api.get('/api/rfqs', { params: { status: 'Published' } }),
      api.get('/api/quotations'),
    ]).then(([r, q]) => { setRfqs(r.data.slice(0, 5)); setQuotes(q.data.slice(0, 5)); })
      .catch(() => {});
  }, []);

  const STATUS_COLORS = {
    Draft:     { bg: '#f3f4f6', color: '#6b7280' },
    Submitted: { bg: '#dbeafe', color: '#1d4ed8' },
    Selected:  { bg: '#dcfce7', color: '#15803d' },
    Rejected:  { bg: '#fee2e2', color: '#dc2626' },
  };

  const submittedCount = quotes.filter(q => q.status === 'Submitted' || q.status === 'Selected').length;
  const acceptedCount  = quotes.filter(q => q.status === 'Selected').length;

  return (
    <div style={s.layout}>
      <Sidebar active="dashboard" />
      <div style={s.body}>
        <header style={s.header}>
          <div>
            <h1 style={s.title}>Vendor Dashboard</h1>
            <p style={s.subtitle}>Welcome, {user?.name} — manage your quotations and track orders</p>
          </div>
          {vendorStatus === 'Active' && (
            <button style={s.addBtn} onClick={() => navigate('/quotations')}>+ Submit Quotation</button>
          )}
          {vendorStatus === 'Pending' && (
            <button style={{ ...s.addBtn, background: '#c2410c', cursor: 'default' }}>⏳ Pending Approval</button>
          )}
        </header>

        {/* Pending approval banner */}
        {vendorStatus === 'Pending' && (
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: r.xl, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#c2410c', marginBottom: '4px' }}>⏳ Account Pending Admin Approval</div>
              <div style={{ fontSize: '13px', color: '#9a3412' }}>Your vendor profile has been submitted. An admin must approve your account before you can see RFQs and submit quotations.</div>
            </div>
            <button style={{ flexShrink: 0, padding: '8px 16px', borderRadius: r.md, border: '1.5px solid #c2410c', background: '#fff', color: '#c2410c', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }} onClick={() => navigate('/vendor-profile')}>
              View Profile
            </button>
          </div>
        )}

        <div style={s.statsGrid}>
          <StatCard label="Open RFQs"           value={rfqs.length}     sub="assigned to you"   bg="#dbeafe" color="#1d4ed8" onClick={() => navigate('/rfqs')} />
          <StatCard label="Submitted Quotes"    value={submittedCount}  sub="all time"          bg="#dcfce7" color="#15803d" onClick={() => navigate('/quotations')} />
          <StatCard label="Accepted Quotes"     value={acceptedCount}   sub="selected by buyer" bg="#f0fdf4" color="#059669" onClick={() => navigate('/quotations')} />
          <StatCard label="My Quotations"       value={quotes.length}   sub="total submitted"   bg="#fef9c3" color="#a16207" onClick={() => navigate('/quotations')} />
        </div>

        <div style={s.row}>
          <div style={{ ...s.card, flex: 1 }}>
            <div style={s.cardHeader}>
              <span style={s.cardTitle}>Open RFQs Assigned to You</span>
              <button style={s.linkBtn} onClick={() => navigate('/rfqs')}>View all →</button>
            </div>
            {rfqs.length === 0
              ? <div style={s.empty}>{vendorStatus === 'Pending' ? 'Your account is pending approval. RFQs will appear here once an admin activates you.' : 'No open RFQs right now. Check back later.'}</div>
              : (
                <table style={s.table}>
                  <thead><tr>{['RFQ Title','Category','Deadline','Action'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {rfqs.map(r => (
                      <tr key={r.rfq_id} style={s.tr}>
                        <td style={{ ...s.td, fontWeight: '600', color: '#111827' }}>{r.title}</td>
                        <td style={s.td}>{r.category || '—'}</td>
                        <td style={s.td}>{fmtDate(r.deadline)}</td>
                        <td style={s.td}>
                          <button style={s.submitBtn} onClick={() => navigate('/quotations')}>Submit Quote</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>

          <div style={{ ...s.card, flex: 1 }}>
            <div style={s.cardHeader}>
              <span style={s.cardTitle}>My Recent Quotations</span>
              <button style={s.linkBtn} onClick={() => navigate('/quotations')}>View all →</button>
            </div>
            {quotes.length === 0
              ? <div style={s.empty}>No quotations submitted yet.</div>
              : (
                <table style={s.table}>
                  <thead><tr>{['RFQ','Total','Status'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {quotes.map(q => (
                      <tr key={q.quotation_id} style={s.tr}>
                        <td style={s.td}>{q.rfq_title}</td>
                        <td style={{ ...s.td, fontWeight: '600' }}>₹{Number(q.total_amount).toLocaleString('en-IN')}</td>
                        <td style={s.td}><span style={{ ...s.chip, ...STATUS_COLORS[q.status] }}>{q.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
  addBtn:    { padding: '9px 18px', borderRadius: r.md, border: 'none', background: c.cyan, color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' },
  statCard:  { background: c.surface, borderRadius: r.xl, padding: '20px', boxShadow: sh.sm },
  statBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: r.full, fontWeight: '700', fontSize: '20px', marginBottom: '8px' },
  statLabel: { fontSize: '13px', fontWeight: '600', color: c.gray700, marginBottom: '2px' },
  statSub:   { fontSize: '11px', color: c.gray400 },
  row:       { display: 'flex', gap: '20px' },
  card:      { background: c.surface, borderRadius: r.xl, padding: '20px', boxShadow: sh.sm },
  cardHeader:{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
  cardTitle: { fontSize: '14px', fontWeight: '600', color: c.gray900 },
  linkBtn:   { fontSize: '12px', fontWeight: '600', color: c.cyan, background: 'none', border: 'none', cursor: 'pointer' },
  empty:     { padding: '24px 0', textAlign: 'center', color: c.gray400, fontSize: '13px' },
  table:     { width: '100%', borderCollapse: 'collapse' },
  th:        { padding: '8px 10px', fontSize: '11px', fontWeight: '600', color: c.gray500, textTransform: 'uppercase', textAlign: 'left', borderBottom: `1px solid ${c.gray100}`, background: c.gray150 },
  tr:        { borderBottom: `1px solid ${c.gray50}` },
  td:        { padding: '10px 10px', fontSize: '13px', color: c.gray700 },
  chip:      { padding: '3px 10px', borderRadius: r.full, fontSize: '11px', fontWeight: '600' },
  submitBtn: { padding: '4px 12px', borderRadius: r.sm, border: `1.5px solid ${c.cyan}`, color: c.cyan, background: c.surface, fontWeight: '600', fontSize: '11px', cursor: 'pointer' },
};
