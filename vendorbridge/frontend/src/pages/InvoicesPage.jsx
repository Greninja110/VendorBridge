import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from './dashboards/Sidebar';

const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
const STATUS_COLORS = {
  Pending:   { bg: '#fef9c3', color: '#a16207' },
  Paid:      { bg: '#dcfce7', color: '#15803d' },
  Cancelled: { bg: '#fee2e2', color: '#dc2626' },
};

export default function InvoicesPage() {
  const { user }   = useAuth();
  const isAdmin    = user?.role === 'admin';
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [detail,   setDetail]   = useState(null);
  const [busyPay,  setBusyPay]  = useState(null);
  const [msg,      setMsg]      = useState('');

  const fetch = () => {
    setLoading(true);
    api.get('/api/invoices').then(({ data }) => setInvoices(data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const openDetail = (inv) => {
    api.get(`/api/invoices/${inv.invoice_id}`).then(({ data }) => setDetail(data)).catch(() => {});
  };

  const cancelInvoice = async (invId) => {
    if (!window.confirm('Cancel this invoice?')) return;
    try {
      await api.patch(`/api/invoices/${invId}/cancel`);
      setMsg('Invoice cancelled.');
      fetch();
      if (detail?.invoice_id === invId) setDetail({ ...detail, status: 'Cancelled' });
    } catch (e) { setMsg(e.response?.data?.message || 'Error.'); }
  };

  const deleteInvoice = async (invId) => {
    if (!window.confirm('Delete this invoice permanently?')) return;
    try {
      await api.delete(`/api/invoices/${invId}`);
      setDetail(null);
      fetch();
    } catch (e) { setMsg(e.response?.data?.message || 'Error.'); }
  };

  const markPaid = async (invId) => {
    setBusyPay(invId);
    try {
      await api.patch(`/api/invoices/${invId}/mark-paid`);
      setMsg('Invoice marked as paid.');
      fetch();
      if (detail?.invoice_id === invId) setDetail({ ...detail, status: 'Paid' });
    } catch (e) { setMsg(e.response?.data?.message || 'Error.'); }
    finally { setBusyPay(null); }
  };

  return (
    <div style={s.layout}>
      <Sidebar active="invoices" />
      <div style={s.body}>
        <header style={s.header}>
          <div>
            <h1 style={s.title}>Invoices</h1>
            <p style={s.subtitle}>Generate and manage invoices from approved purchase orders</p>
          </div>
        </header>

        {msg && <div style={s.msgBox}>{msg}</div>}

        <div style={s.card}>
          {loading ? <div style={s.empty}>Loading...</div>
            : invoices.length === 0
            ? <div style={s.empty}>No invoices yet. Generate an invoice from the Purchase Orders page.</div>
            : (
              <table style={s.table}>
                <thead>
                  <tr>{['Invoice #','PO Number','Vendor','Amount','Date','Status','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.invoice_id} style={s.tr}>
                      <td style={{ ...s.td, fontFamily: 'monospace', fontWeight: '700', color: '#111827' }}>{inv.invoice_number}</td>
                      <td style={{ ...s.td, fontFamily: 'monospace' }}>{inv.po_number}</td>
                      <td style={s.td}>{inv.vendor_name}</td>
                      <td style={{ ...s.td, fontWeight: '600' }}>{fmt(inv.total_amount)}</td>
                      <td style={s.td}>{inv.invoice_date}</td>
                      <td style={s.td}><span style={{ ...s.chip, ...STATUS_COLORS[inv.status] }}>{inv.status}</span></td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button style={s.viewBtn} onClick={() => openDetail(inv)}>View</button>
                          {inv.status === 'Pending' && (
                            <button style={{ ...s.viewBtn, borderColor: '#15803d', color: '#15803d' }}
                              disabled={busyPay === inv.invoice_id}
                              onClick={() => markPaid(inv.invoice_id)}>
                              {busyPay === inv.invoice_id ? '...' : 'Mark Paid'}
                            </button>
                          )}
                          {isAdmin && inv.status === 'Pending' && (
                            <button style={{ ...s.viewBtn, borderColor: '#f59e0b', color: '#f59e0b' }} onClick={() => cancelInvoice(inv.invoice_id)}>Cancel</button>
                          )}
                          {isAdmin && (
                            <button style={{ ...s.viewBtn, borderColor: '#dc2626', color: '#dc2626' }} onClick={() => deleteInvoice(inv.invoice_id)}>Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {detail && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div>
                <div style={s.modalSub}>INVOICE</div>
                <div style={s.modalTitle}>{detail.invoice_number}</div>
              </div>
              <button style={s.closeBtn} onClick={() => setDetail(null)}>✕</button>
            </div>
            <div style={s.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={s.billBox}>
                  <div style={s.billTitle}>Bill To</div>
                  <div style={s.billText}>Your Organization</div>
                </div>
                <div style={s.billBox}>
                  <div style={s.billTitle}>From (Vendor)</div>
                  <div style={s.billText}>{detail.vendor_name}</div>
                  {detail.vendor_gst && <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>GSTIN: {detail.vendor_gst}</div>}
                  {detail.vendor_address && <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{detail.vendor_address}</div>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '16px', fontSize: '12px' }}>
                <InfoKV k="Invoice #"    v={detail.invoice_number} />
                <InfoKV k="PO Number"    v={detail.po_number} />
                <InfoKV k="Invoice Date" v={detail.invoice_date} />
              </div>

              {detail.lines?.length > 0 ? (
                <>
                  <table style={s.table}>
                    <thead><tr>{['Item','Qty','Unit','Unit Price','Total'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {detail.lines.map((l, i) => (
                        <tr key={i} style={s.tr}>
                          <td style={s.td}>{l.item_description || '—'}</td>
                          <td style={{ ...s.td, textAlign: 'center' }}>{l.quantity}</td>
                          <td style={s.td}>{l.unit || '—'}</td>
                          <td style={s.td}>{fmt(l.unit_price)}</td>
                          <td style={{ ...s.td, fontWeight: '600' }}>{fmt(l.line_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No line items.</div>
              )}

              <div style={{ marginTop: '12px', background: '#f9fafb', borderRadius: '8px', padding: '14px 16px', width: '240px', marginLeft: 'auto' }}>
                <TRow k="Grand Total" v={fmt(detail.total_amount)} bold />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Status:</span>
                  <span style={{ ...s.chip, ...STATUS_COLORS[detail.status] }}>{detail.status}</span>
                </div>
                {detail.status === 'Pending' && (
                  <button style={s.payBtn} disabled={busyPay === detail.invoice_id} onClick={() => markPaid(detail.invoice_id)}>
                    {busyPay === detail.invoice_id ? 'Processing...' : 'Mark as Paid'}
                  </button>
                )}
              </div>
            </div>
            <div style={s.modalFooter}>
              {isAdmin && detail.status === 'Pending' && (
                <button style={{ ...s.cancelBtn, borderColor: '#f59e0b', color: '#f59e0b', marginRight: 'auto' }} onClick={() => cancelInvoice(detail.invoice_id)}>Cancel Invoice</button>
              )}
              {isAdmin && (
                <button style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }} onClick={() => deleteInvoice(detail.invoice_id)}>Delete</button>
              )}
              <button style={s.cancelBtn} onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoKV({ k, v }) {
  return <div style={{ background: '#f9fafb', borderRadius: '6px', padding: '8px 12px' }}>
    <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>{k}</div>
    <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>{v}</div>
  </div>;
}
function TRow({ k, v, bold }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: bold ? '14px' : '12px', fontWeight: bold ? '700' : '400', color: '#111827' }}>
    <span>{k}</span><span>{v}</span>
  </div>;
}

const s = {
  layout:    { display: 'flex', minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Inter,system-ui,sans-serif' },
  body:      { flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '18px', overflow: 'auto' },
  header:    { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  title:     { fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 },
  subtitle:  { fontSize: '13px', color: '#6b7280', marginTop: '4px' },
  msgBox:    { background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '8px', padding: '10px 16px', fontSize: '13px' },
  card:      { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' },
  empty:     { padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' },
  table:     { width: '100%', borderCollapse: 'collapse' },
  th:        { padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #f3f4f6', background: '#fafafa' },
  tr:        { borderBottom: '1px solid #f9fafb' },
  td:        { padding: '12px 14px', fontSize: '13px', color: '#374151' },
  chip:      { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'inline-block' },
  viewBtn:   { padding: '4px 12px', borderRadius: '6px', border: '1.5px solid #039b15', color: '#039b15', background: '#fff', fontWeight: '600', fontSize: '11px', cursor: 'pointer' },
  payBtn:    { padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#15803d', color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  overlay:   { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:     { background: '#fff', borderRadius: '16px', width: '620px', maxWidth: '95vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 24px', borderBottom: '1px solid #f3f4f6' },
  modalSub:  { fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' },
  modalTitle:{ fontSize: '16px', fontWeight: '700', color: '#7c3aed', fontFamily: 'monospace' },
  closeBtn:  { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '18px' },
  modalBody: { padding: '20px 24px', overflowY: 'auto' },
  modalFooter:{ display: 'flex', justifyContent: 'flex-end', padding: '14px 24px', borderTop: '1px solid #f3f4f6' },
  cancelBtn: { padding: '8px 18px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  billBox:   { background: '#f9fafb', borderRadius: '8px', padding: '12px 14px' },
  billTitle: { fontSize: '10px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' },
  billText:  { fontSize: '13px', fontWeight: '600', color: '#111827' },
};
