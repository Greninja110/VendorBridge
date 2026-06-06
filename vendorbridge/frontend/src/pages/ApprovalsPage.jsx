import React, { useState, useEffect, useCallback } from 'react';
import { c, r, sh } from '../theme';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from './dashboards/Sidebar';
import { fmtDateTime } from '../utils/date';

const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
const STEPS = ['Submitted', 'L1 Review', 'L2 Approval', 'Generate PO'];

export default function ApprovalsPage() {
  const { user } = useAuth();
  const canDecide = ['admin', 'manager'].includes(user?.role);

  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [remarks,  setRemarks]  = useState({});
  const [busy,     setBusy]     = useState(null);
  const [msg,      setMsg]      = useState('');

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/api/approvals').then(({ data }) => setItems(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, []);

  const decide = async (quotationId, action) => {
    setBusy(quotationId);
    setMsg('');
    try {
      const { data } = await api.post(`/api/approvals/${quotationId}/${action}`, { remarks: remarks[quotationId] || '' });
      setMsg(data.message);
      fetch();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Error.');
    } finally { setBusy(null); }
  };

  const pending  = items.filter(i => !i.approval_id);
  const decided  = items.filter(i =>  i.approval_id);

  return (
    <div style={s.layout}>
      <Sidebar active="approvals" />
      <div style={s.body}>
        <header style={s.header}>
          <div>
            <h1 style={s.title}>Approval Workflow</h1>
            <p style={s.subtitle}>Review and approve procurement quotations</p>
          </div>
          <div style={s.headerStats}>
            <StatPill label="Pending"  value={pending.length}  bg="#fef9c3" color="#a16207" />
            <StatPill label="Decided"  value={decided.length}  bg="#dcfce7" color="#15803d" />
          </div>
        </header>

        {/* Approval chain stepper */}
        <div style={s.card}>
          <div style={s.cardTitle}>Approval Chain</div>
          <div style={s.chainRow}>
            {STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <div style={s.stepCol}>
                  <div style={{ ...s.dot, background: i <= 1 ? '#b45309' : '#e5e7eb', color: i <= 1 ? '#fff' : '#9ca3af' }}>{i + 1}</div>
                  <span style={{ ...s.stepLabel, color: i <= 1 ? '#111827' : '#9ca3af' }}>{step}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ ...s.line, background: i < 1 ? '#b45309' : '#e5e7eb' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {msg && <div style={s.msgBox}>{msg}</div>}

        {/* Pending */}
        <div style={s.sectionHeader}>Pending Approvals ({pending.length})</div>
        {loading ? <div style={s.empty}>Loading...</div>
          : pending.length === 0 ? <div style={s.empty}>No pending approvals.</div>
          : pending.map(item => (
            <ApprovalCard
              key={item.quotation_id}
              item={item}
              expanded={expanded === item.quotation_id}
              onToggle={() => setExpanded(expanded === item.quotation_id ? null : item.quotation_id)}
              remark={remarks[item.quotation_id] || ''}
              onRemark={(v) => setRemarks({ ...remarks, [item.quotation_id]: v })}
              canDecide={canDecide}
              busy={busy === item.quotation_id}
              onApprove={() => decide(item.quotation_id, 'approve')}
              onReject={() => decide(item.quotation_id, 'reject')}
            />
          ))}

        {/* Decided */}
        {decided.length > 0 && (
          <>
            <div style={{ ...s.sectionHeader, marginTop: '8px' }}>Decided ({decided.length})</div>
            {decided.map(item => (
              <div key={item.quotation_id} style={{ ...s.itemCard, border: `1.5px solid ${item.a_approved ? '#bbf7d0' : '#fecaca'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={s.itemTitle}>{item.rfq_title}</span>
                    <span style={s.itemMeta}> · {item.vendor_name} · {fmt(item.total_amount)}</span>
                  </div>
                  <span style={{ ...s.chip, background: item.a_approved ? '#dcfce7' : '#fee2e2', color: item.a_approved ? '#15803d' : '#dc2626' }}>
                    {item.a_approved ? '✓ Approved' : '✕ Rejected'}
                  </span>
                </div>
                {item.remarks && <div style={s.remarksDisplay}>"{item.remarks}"</div>}
                <div style={s.decidedMeta}>by {item.decided_by} · {fmtDateTime(item.decided_at)}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function ApprovalCard({ item, expanded, onToggle, remark, onRemark, canDecide, busy, onApprove, onReject }) {
  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
  return (
    <div style={{ ...s.itemCard, border: '1.5px solid #fbbf24', cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} onClick={onToggle}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={s.itemTitle}>{item.rfq_title}</span>
            {item.rfq_category && <span style={{ ...s.chip, background: '#f3f4f6', color: '#6b7280' }}>{item.rfq_category}</span>}
            <span style={{ ...s.chip, background: '#fef9c3', color: '#a16207' }}>Pending</span>
          </div>
          <div style={s.itemMeta}>{item.vendor_name} · submitted by {item.submitted_by}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={s.amount}>{fmt(item.total_amount)}</span>
          <span style={{ color: '#9ca3af', fontSize: '14px' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div style={s.expandBody}>
          <div style={s.summaryGrid}>
            <SumRow k="Vendor"   v={item.vendor_name} />
            <SumRow k="Total"    v={fmt(item.total_amount)} />
            <SumRow k="GST"      v={`${item.tax_rate}%`} />
            <SumRow k="Delivery" v={item.delivery_days ? `${item.delivery_days} days` : '—'} />
            <SumRow k="Payment"  v={item.payment_terms || '—'} />
            {item.notes && <SumRow k="Notes" v={item.notes} />}
          </div>
          {canDecide && (
            <div style={s.actionArea}>
              <div style={{ flex: 1 }}>
                <label style={s.remarkLabel}>Approval Remarks</label>
                <textarea
                  value={remark}
                  onChange={e => onRemark(e.target.value)}
                  placeholder="Add comments or conditions..."
                  rows={2}
                  style={s.remarkInput}
                />
              </div>
              <div style={s.actionBtns}>
                <button style={s.approveBtn} disabled={busy} onClick={onApprove}>{busy ? '...' : '✓ Approve'}</button>
                <button style={s.rejectBtn}  disabled={busy} onClick={onReject}>{busy ? '...' : '✕ Reject'}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, bg, color }) {
  return <div style={{ background: bg, color, borderRadius: '8px', padding: '8px 16px', textAlign: 'center' }}>
    <div style={{ fontSize: '20px', fontWeight: '700' }}>{value}</div>
    <div style={{ fontSize: '11px', fontWeight: '500' }}>{label}</div>
  </div>;
}
function SumRow({ k, v }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
    <span style={{ fontSize: '12px', color: '#6b7280' }}>{k}</span>
    <span style={{ fontSize: '12px', color: '#111827', fontWeight: '500' }}>{v}</span>
  </div>;
}

const s = {
  layout:      { display: 'flex', minHeight: '100vh', background: c.pageBg, fontFamily: "'Inter',system-ui,sans-serif" },
  body:        { flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'auto' },
  header:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  headerStats: { display: 'flex', gap: '10px' },
  title:       { fontSize: '22px', fontWeight: '700', color: c.gray900, margin: 0 },
  subtitle:    { fontSize: '13px', color: c.gray500, marginTop: '4px' },
  card:        { background: c.surface, borderRadius: r.xl, padding: '18px 20px', boxShadow: sh.sm },
  cardTitle:   { fontSize: '13px', fontWeight: '700', color: c.gray900, marginBottom: '14px' },
  chainRow:    { display: 'flex', alignItems: 'center' },
  stepCol:     { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  dot:         { width: '30px', height: '30px', borderRadius: r.full, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px' },
  stepLabel:   { fontSize: '11px', fontWeight: '500', whiteSpace: 'nowrap' },
  line:        { height: '2px', flex: 1, margin: '0 6px 16px' },
  msgBox:      { background: c.successBg, border: `1px solid ${c.successBorder}`, color: c.successText, borderRadius: r.md, padding: '10px 16px', fontSize: '13px' },
  sectionHeader: { fontSize: '13px', fontWeight: '700', color: c.gray700 },
  empty:       { padding: '32px', textAlign: 'center', color: c.gray400, fontSize: '14px', background: c.surface, borderRadius: r.xl },
  itemCard:    { background: c.surface, borderRadius: r.lg, padding: '16px 18px', boxShadow: sh.sm },
  itemTitle:   { fontSize: '14px', fontWeight: '600', color: c.gray900 },
  itemMeta:    { fontSize: '12px', color: c.gray500, marginTop: '3px' },
  amount:      { fontSize: '16px', fontWeight: '700', color: c.gray900 },
  chip:        { padding: '2px 8px', borderRadius: r.full, fontSize: '11px', fontWeight: '600' },
  expandBody:  { marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${c.gray100}` },
  summaryGrid: { background: c.gray50, borderRadius: r.md, padding: '12px 14px', marginBottom: '14px' },
  actionArea:  { display: 'flex', gap: '16px', alignItems: 'flex-start' },
  remarkLabel: { fontSize: '12px', fontWeight: '600', color: c.gray700, marginBottom: '6px', display: 'block' },
  remarkInput: { width: '100%', padding: '9px 12px', borderRadius: r.md, border: `1px solid ${c.gray300}`, fontSize: '13px', color: c.gray900, resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  actionBtns:  { display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 },
  approveBtn:  { padding: '9px 20px', borderRadius: r.md, border: 'none', background: c.primaryText, color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  rejectBtn:   { padding: '9px 20px', borderRadius: r.md, border: 'none', background: c.red, color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  remarksDisplay: { fontSize: '12px', color: c.gray500, fontStyle: 'italic', marginTop: '8px', paddingLeft: '4px' },
  decidedMeta: { fontSize: '11px', color: c.gray400, marginTop: '4px' },
};
