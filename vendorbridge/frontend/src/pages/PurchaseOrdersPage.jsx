import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from './dashboards/Sidebar';

const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

export default function PurchaseOrdersPage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const isAdmin   = user?.role === 'admin';
  const [pos,     setPos]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail,  setDetail]  = useState(null);
  const [genMsg,  setGenMsg]  = useState('');
  const [genBusy, setGenBusy] = useState(null);

  useEffect(() => {
    api.get('/api/purchase-orders').then(({ data }) => setPos(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const openDetail = (po) => {
    api.get(`/api/purchase-orders/${po.po_id}`).then(({ data }) => setDetail(data)).catch(() => {});
  };

  const deletePO = async (poId) => {
    if (!window.confirm('Delete this purchase order? This cannot be undone.')) return;
    try {
      await api.delete(`/api/purchase-orders/${poId}`);
      setDetail(null);
      api.get('/api/purchase-orders').then(({ data }) => setPos(data)).catch(() => {});
    } catch (e) { alert(e.response?.data?.message || 'Error deleting PO.'); }
  };

  const generateInvoice = async (poId) => {
    setGenBusy(poId);
    setGenMsg('');
    try {
      await api.post('/api/invoices', { po_id: poId });
      setGenMsg('Invoice generated! Go to Invoices page to view it.');
      api.get('/api/purchase-orders').then(({ data }) => setPos(data)).catch(() => {});
    } catch (e) {
      setGenMsg(e.response?.data?.message || 'Error generating invoice.');
    } finally { setGenBusy(null); }
  };

  return (
    <div style={s.layout}>
      <Sidebar active="purchase_orders" />
      <div style={s.body}>
        <header style={s.header}>
          <div>
            <h1 style={s.title}>Purchase Orders</h1>
            <p style={s.subtitle}>Auto-generated after manager approval</p>
          </div>
          <button style={s.outlineBtn} onClick={() => navigate('/invoices')}>View Invoices →</button>
        </header>

        {genMsg && <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '8px', padding: '10px 16px', fontSize: '13px' }}>{genMsg}</div>}

        <div style={s.card}>
          {loading ? <div style={s.empty}>Loading...</div>
            : pos.length === 0
            ? <div style={s.empty}>No purchase orders yet. POs are auto-generated when a manager approves a quotation.</div>
            : (
              <table style={s.table}>
                <thead>
                  <tr>{['PO Number','Vendor','RFQ','Amount','Date','Invoice','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {pos.map(po => (
                    <tr key={po.po_id} style={s.tr}>
                      <td style={{ ...s.td, fontFamily: 'monospace', fontWeight: '700', color: '#111827' }}>{po.po_number}</td>
                      <td style={s.td}>{po.vendor_name}</td>
                      <td style={s.td}>{po.rfq_title || '—'}</td>
                      <td style={{ ...s.td, fontWeight: '600' }}>{fmt(po.total_amount)}</td>
                      <td style={s.td}>{po.order_date}</td>
                      <td style={s.td}>
                        {po.invoice_count > 0
                          ? <span style={{ ...s.chip, background: '#dcfce7', color: '#15803d' }}>Generated</span>
                          : <span style={{ ...s.chip, background: '#f3f4f6', color: '#6b7280' }}>None</span>}
                      </td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button style={s.viewBtn} onClick={() => openDetail(po)}>View</button>
                          {po.invoice_count === 0 && (
                            <button style={{ ...s.viewBtn, borderColor: '#7c3aed', color: '#7c3aed' }}
                              disabled={genBusy === po.po_id}
                              onClick={() => generateInvoice(po.po_id)}>
                              {genBusy === po.po_id ? '...' : 'Gen Invoice'}
                            </button>
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

      {/* PO Detail Modal */}
      {detail && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div>
                <div style={s.modalTitle}>Purchase Order</div>
                <div style={{ fontFamily: 'monospace', fontWeight: '700', color: '#7c3aed', fontSize: '14px' }}>{detail.po_number}</div>
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
                  <div style={s.billTitle}>Vendor</div>
                  <div style={s.billText}>{detail.vendor_name}</div>
                  {detail.vendor_gst && <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>GST: {detail.vendor_gst}</div>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', fontSize: '12px' }}>
                <InfoKV k="PO Number"   v={detail.po_number} />
                <InfoKV k="Order Date"  v={detail.order_date} />
                <InfoKV k="Created by"  v={detail.created_by_name} />
                <InfoKV k="RFQ"         v={detail.rfq_title || '—'} />
              </div>

              {detail.lines?.length > 0 ? (
                <table style={s.table}>
                  <thead><tr>{['Item','Qty','Unit','Unit Price','Total'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {detail.lines.map((l, i) => (
                      <tr key={i} style={s.tr}>
                        <td style={s.td}>{l.item_description || l.base_item || '—'}</td>
                        <td style={{ ...s.td, textAlign: 'center' }}>{l.quantity}</td>
                        <td style={s.td}>{l.unit || '—'}</td>
                        <td style={s.td}>{fmt(l.unit_price)}</td>
                        <td style={{ ...s.td, fontWeight: '600' }}>{fmt(l.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No line items recorded.</div>
              )}

              <div style={{ marginTop: '12px', background: '#f9fafb', borderRadius: '8px', padding: '12px 16px', width: '220px', marginLeft: 'auto' }}>
                <TotalRow k="Grand Total" v={fmt(detail.total_amount)} bold />
              </div>
            </div>
            <div style={s.modalFooter}>
              {isAdmin && <button style={{ ...s.cancelBtn, borderColor: '#dc2626', color: '#dc2626', marginRight: 'auto' }} onClick={() => deletePO(detail.po_id)}>Delete PO</button>}
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
function TotalRow({ k, v, bold }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: bold ? '14px' : '12px', fontWeight: bold ? '700' : '400', color: '#111827' }}>
    <span>{k}</span><span>{v}</span>
  </div>;
}

const s = {
  layout:    { display: 'flex', minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Inter,system-ui,sans-serif' },
  body:      { flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '18px', overflow: 'auto' },
  header:    { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  title:     { fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 },
  subtitle:  { fontSize: '13px', color: '#6b7280', marginTop: '4px' },
  outlineBtn:{ padding: '9px 18px', borderRadius: '8px', border: '1.5px solid #7c3aed', background: '#fff', color: '#7c3aed', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  card:      { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' },
  empty:     { padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' },
  table:     { width: '100%', borderCollapse: 'collapse' },
  th:        { padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #f3f4f6', background: '#fafafa' },
  tr:        { borderBottom: '1px solid #f9fafb' },
  td:        { padding: '12px 14px', fontSize: '13px', color: '#374151' },
  chip:      { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'inline-block' },
  viewBtn:   { padding: '4px 12px', borderRadius: '6px', border: '1.5px solid #039b15', color: '#039b15', background: '#fff', fontWeight: '600', fontSize: '11px', cursor: 'pointer' },
  overlay:   { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:     { background: '#fff', borderRadius: '16px', width: '600px', maxWidth: '95vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 24px', borderBottom: '1px solid #f3f4f6' },
  modalTitle: { fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' },
  closeBtn:   { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '18px' },
  modalBody: { padding: '20px 24px', overflowY: 'auto' },
  modalFooter:{ display: 'flex', justifyContent: 'flex-end', padding: '14px 24px', borderTop: '1px solid #f3f4f6' },
  cancelBtn: { padding: '8px 18px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  billBox:   { background: '#f9fafb', borderRadius: '8px', padding: '12px 14px' },
  billTitle: { fontSize: '10px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' },
  billText:  { fontSize: '13px', fontWeight: '600', color: '#111827' },
};
