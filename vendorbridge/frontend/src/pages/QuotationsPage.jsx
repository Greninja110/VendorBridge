import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { c, r, sh } from '../theme';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from './dashboards/Sidebar';
import { fmtDate } from '../utils/date';

const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
const EMPTY_LINE = { item_description: '', quantity: 1, unit_price: 0, unit: 'NOS' };

export default function QuotationsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOk,     setProfileOk]     = useState(true);
  const [vendorStatus,  setVendorStatus]  = useState('Active'); // 'Pending' | 'Active' | 'Blocked'
  const rfqFilter = new URLSearchParams(location.search).get('rfq_id');

  const isVendor   = user?.role === 'vendor';
  const isAdmin    = user?.role === 'admin';
  const canCompare = ['admin','procurement_officer'].includes(user?.role);

  const [rfqId,      setRfqId]      = useState(rfqFilter || '');
  const [rfqs,       setRfqs]       = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [compare,    setCompare]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [mode,       setMode]       = useState(rfqFilter ? 'compare' : 'list'); // 'list' | 'compare' | 'submit'
  const [submitForm, setSubmitForm] = useState({ rfq_id: '', tax_rate: 18, delivery_days: '', notes: '', payment_terms: '', lines: [], status: 'Submitted' });
  const [saving,     setSaving]     = useState(false);
  const [formErr,    setFormErr]    = useState('');
  const [success,    setSuccess]    = useState('');
  const [detail,     setDetail]     = useState(null);

  useEffect(() => {
    api.get('/api/rfqs', { params: { status: 'Published' } }).then(({ data }) => setRfqs(data)).catch(() => {});
    fetchQuotations();
    if (isVendor) {
      api.get('/api/vendors/me')
        .then(({ data }) => {
          const required = ['name', 'category', 'gst_number', 'contact_phone'];
          setProfileOk(required.every(f => data[f]?.toString().trim()));
          setVendorStatus(data.status || 'Pending');
        })
        .catch(() => { setProfileOk(false); setVendorStatus('Pending'); });
    }
  }, []);

  useEffect(() => {
    if (rfqFilter) { loadCompare(rfqFilter); }
  }, [rfqFilter]);

  const fetchQuotations = () => {
    setLoading(true);
    api.get('/api/quotations').then(({ data }) => setQuotations(data)).catch(() => {}).finally(() => setLoading(false));
  };

  const loadCompare = (id) => {
    setRfqId(id);
    setMode('compare');
    setLoading(true);
    api.get(`/api/quotations/compare/${id}`).then(({ data }) => setCompare(data)).catch(() => {}).finally(() => setLoading(false));
  };

  const deleteQuotation = async (qId) => {
    if (!window.confirm('Delete this quotation? This cannot be undone.')) return;
    try {
      await api.delete(`/api/quotations/${qId}`);
      setDetail(null);
      fetchQuotations();
      if (mode === 'compare') loadCompare(rfqId);
    } catch (e) { alert(e.response?.data?.message || 'Error deleting quotation.'); }
  };

  const selectQuotation = async (qId) => {
    if (!window.confirm('Select this quotation? Others will be rejected and RFQ will be closed.')) return;
    try {
      await api.patch(`/api/quotations/${qId}/select`);
      setSuccess('Quotation selected. Sent for manager approval.');
      loadCompare(rfqId);
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  // Submit quotation (vendor)
  const openSubmit = () => {
    setSubmitForm({ rfq_id: rfqs[0]?.rfq_id || '', tax_rate: 18, delivery_days: '', notes: '', payment_terms: '', lines: [{ ...EMPTY_LINE }], status: 'Submitted' });
    setFormErr(''); setSuccess('');
    setMode('submit');
  };

  const loadRFQLines = (id) => {
    if (!id) return;
    api.get(`/api/rfqs/${id}`).then(({ data }) => {
      const lines = (data.lines || []).map(l => ({ item_description: l.item_description, quantity: l.quantity, unit: l.unit, unit_price: 0, rfq_line_id: l.rfq_line_id }));
      setSubmitForm(f => ({ ...f, rfq_id: id, lines: lines.length ? lines : [{ ...EMPTY_LINE }] }));
    }).catch(() => {});
  };

  const setFormLine = (i, field, val) => {
    const lines = [...submitForm.lines];
    lines[i] = { ...lines[i], [field]: val };
    setSubmitForm({ ...submitForm, lines });
  };

  const subtotal = submitForm.lines.reduce((s, l) => s + (parseFloat(l.unit_price) || 0) * (parseInt(l.quantity) || 1), 0);
  const gstAmt   = subtotal * (parseFloat(submitForm.tax_rate) / 100);
  const grandTotal = subtotal + gstAmt;

  const submitQuotation = async (e) => {
    e.preventDefault();
    setFormErr(''); setSaving(true);
    try {
      await api.post('/api/quotations', submitForm);
      setSuccess('Quotation submitted successfully!');
      setMode('list');
      fetchQuotations();
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Failed to submit quotation.');
    } finally { setSaving(false); }
  };

  const STATUS_COLORS = {
    Draft:     { bg: '#f3f4f6', color: '#6b7280' },
    Submitted: { bg: '#dbeafe', color: '#1d4ed8' },
    Selected:  { bg: '#dcfce7', color: '#15803d' },
    Rejected:  { bg: '#fee2e2', color: '#dc2626' },
  };

  return (
    <div style={s.layout}>
      <Sidebar active="quotations" />
      <div style={s.body}>
        <header style={s.header}>
          <div>
            <h1 style={s.title}>Quotations</h1>
            <p style={s.subtitle}>{isVendor ? 'Submit quotations for assigned RFQs' : 'Compare and select the best quotation'}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {isVendor && vendorStatus === 'Active' && profileOk && (
              <button style={s.addBtn} onClick={openSubmit}>+ Submit Quotation</button>
            )}
            {isVendor && vendorStatus === 'Pending' && (
              <button style={{ ...s.addBtn, background: '#c2410c', cursor: 'default' }}>
                ⏳ Pending Admin Approval
              </button>
            )}
            {isVendor && vendorStatus === 'Active' && !profileOk && (
              <button style={{ ...s.addBtn, background: '#f59e0b' }} onClick={() => navigate('/vendor-profile')}>
                ⚠ Complete Profile to Submit
              </button>
            )}
            {mode !== 'list' && <button style={s.outlineBtn} onClick={() => { setMode('list'); setSuccess(''); }}>← Back to List</button>}
          </div>
        </header>

        {success && <div style={s.successBox}>{success}</div>}

        {/* LIST MODE */}
        {mode === 'list' && (
          <>
            {/* VENDOR: show open RFQ requests prominently */}
            {isVendor && vendorStatus === 'Pending' && (
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c', borderRadius: r.xl, padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
                <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Account Pending Approval</div>
                <div style={{ fontSize: '13px' }}>An admin needs to approve your vendor account before you can see RFQs or submit quotations. You'll be notified once you're activated.</div>
                <button style={{ marginTop: '14px', padding: '8px 18px', borderRadius: r.md, border: '1.5px solid #c2410c', background: '#fff', color: '#c2410c', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }} onClick={() => navigate('/vendor-profile')}>
                  View My Profile →
                </button>
              </div>
            )}

            {isVendor && vendorStatus === 'Active' && (
              <div style={s.card}>
                <div style={s.cardTitle}>Open Quotation Requests</div>
                {rfqs.length === 0 ? (
                  <div style={s.empty}>No open RFQs right now. Check back later.</div>
                ) : (
                  <>
                    <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 12px' }}>
                      These RFQs have been assigned to you. Submit a quotation before the deadline.
                    </p>
                    <table style={s.table}>
                      <thead><tr>{['RFQ Title','Category','Deadline','Status'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {rfqs.map(r => {
                          const alreadySubmitted = quotations.some(q => q.rfq_id === r.rfq_id);
                          const isOverdue = new Date(r.deadline) < new Date();
                          return (
                            <tr key={r.rfq_id} style={s.tr}>
                              <td style={{ ...s.td, fontWeight: '600', color: c.gray900 }}>{r.title}</td>
                              <td style={s.td}>{r.category || '—'}</td>
                              <td style={{ ...s.td, color: isOverdue ? c.red : c.gray700, fontWeight: isOverdue ? '600' : '400' }}>
                                {fmtDate(r.deadline)}{isOverdue ? ' ⚠ Overdue' : ''}
                              </td>
                              <td style={s.td}>
                                {alreadySubmitted
                                  ? <span style={{ ...s.chip, background: c.successBg, color: c.successText }}>Submitted ✓</span>
                                  : profileOk
                                  ? <button style={{ ...s.addBtn, padding: '5px 14px', fontSize: '12px' }}
                                      onClick={() => {
                                        setSubmitForm({ rfq_id: r.rfq_id, tax_rate: 18, delivery_days: '', notes: '', payment_terms: '', lines: [{ ...EMPTY_LINE }], status: 'Submitted' });
                                        setFormErr(''); setSuccess('');
                                        setMode('submit');
                                        loadRFQLines(r.rfq_id);
                                      }}>
                                      Submit Quote
                                    </button>
                                  : <button style={{ ...s.addBtn, padding: '5px 14px', fontSize: '12px', background: c.amber }} onClick={() => navigate('/vendor-profile')}>
                                      Complete Profile First
                                    </button>
                                }
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            )}

            {canCompare && rfqs.length > 0 && (
              <div style={s.card}>
                <div style={s.cardTitle}>Compare Quotations</div>
                <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 12px' }}>Select an RFQ to compare all submitted quotations side-by-side.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {rfqs.map(r => (
                    <button key={r.rfq_id} style={{ ...s.rfqChip, ...(r.quotation_count > 0 ? {} : { opacity: 0.5 }) }}
                      onClick={() => r.quotation_count > 0 && loadCompare(r.rfq_id)}>
                      {r.title} ({r.quotation_count} quotes)
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={s.card}>
              <div style={s.cardTitle}>All Quotations</div>
              {loading ? <div style={s.empty}>Loading...</div>
                : quotations.length === 0 ? <div style={s.empty}>No quotations yet.</div>
                : (
                  <table style={s.table}>
                    <thead><tr>{['RFQ','Vendor','Total','Delivery','Status',''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {quotations.map(q => (
                        <tr key={q.quotation_id} style={s.tr}>
                          <td style={s.td}>{q.rfq_title}</td>
                          <td style={s.td}>{q.vendor_name}</td>
                          <td style={{ ...s.td, fontWeight: '600' }}>{fmt(q.total_amount)}</td>
                          <td style={s.td}>{q.delivery_days ? `${q.delivery_days} days` : '—'}</td>
                          <td style={s.td}><span style={{ ...s.chip, ...STATUS_COLORS[q.status] }}>{q.status}</span></td>
                          <td style={s.td}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button style={s.viewBtn} onClick={() => api.get(`/api/quotations/${q.quotation_id}`).then(({ data }) => setDetail(data))}>View</button>
                              {isAdmin && <button style={{ ...s.viewBtn, borderColor: '#dc2626', color: '#dc2626' }} onClick={() => deleteQuotation(q.quotation_id)}>Delete</button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          </>
        )}

        {/* COMPARE MODE */}
        {mode === 'compare' && (
          <div style={s.card}>
            <div style={s.cardTitle}>Quotation Comparison</div>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
              Green = lowest price. Selecting a vendor closes the RFQ and sends for approval.
            </p>
            {loading ? <div style={s.empty}>Loading...</div>
              : compare.length === 0 ? <div style={s.empty}>No submitted quotations for this RFQ yet.</div>
              : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ ...s.table, tableLayout: 'fixed' }}>
                    <thead>
                      <tr>
                        <th style={{ ...s.th, width: '140px' }}>Criteria</th>
                        {compare.map((q, i) => (
                          <th key={q.quotation_id} style={{ ...s.th, background: i === 0 ? '#dcfce7' : '#fafafa', color: i === 0 ? '#15803d' : '#6b7280' }}>
                            {q.vendor_name}{i === 0 && <span style={{ fontSize: '10px', marginLeft: '4px' }}>(Lowest)</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Grand Total', key: q => fmt(q.total_amount) },
                        { label: 'GST %',       key: q => `${q.tax_rate}%` },
                        { label: 'Delivery',    key: q => q.delivery_days ? `${q.delivery_days} days` : '—' },
                        { label: 'Payment',     key: q => q.payment_terms || '—' },
                        { label: 'Notes',       key: q => q.notes || '—' },
                        { label: 'Status',      key: q => q.status },
                      ].map(({ label, key }) => (
                        <tr key={label} style={s.tr}>
                          <td style={{ ...s.td, fontWeight: '600', color: '#374151', fontSize: '12px' }}>{label}</td>
                          {compare.map((q, i) => (
                            <td key={q.quotation_id} style={{ ...s.td, background: i === 0 ? '#f0fdf4' : 'transparent', fontWeight: label === 'Grand Total' ? '700' : '400' }}>
                              {key(q)}
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr>
                        <td style={s.td} />
                        {compare.map((q, i) => (
                          <td key={q.quotation_id} style={{ ...s.td, background: i === 0 ? '#f0fdf4' : 'transparent' }}>
                            {q.status === 'Selected'
                              ? <span style={{ ...s.chip, background: '#dcfce7', color: '#15803d' }}>Selected ✓</span>
                              : q.status === 'Rejected'
                              ? <span style={{ ...s.chip, background: '#fee2e2', color: '#dc2626' }}>Rejected</span>
                              : canCompare
                              ? <button style={{ ...s.addBtn, padding: '6px 14px', fontSize: '12px', background: i === 0 ? '#15803d' : '#374151' }}
                                  onClick={() => selectQuotation(q.quotation_id)}>
                                  {i === 0 ? 'Select & Approve' : 'Select'}
                                </button>
                              : null}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}

        {/* SUBMIT MODE (vendor) */}
        {mode === 'submit' && (
          <div style={s.card}>
            <div style={s.cardTitle}>Submit Quotation</div>
            <form onSubmit={submitQuotation}>
              {formErr && <div style={s.errBox}>{formErr}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <FRow label="Select RFQ *">
                  <select style={s.input} value={submitForm.rfq_id} onChange={e => { setSubmitForm({ ...submitForm, rfq_id: e.target.value }); loadRFQLines(e.target.value); }} required>
                    <option value="">— Choose an RFQ —</option>
                    {rfqs.map(r => <option key={r.rfq_id} value={r.rfq_id}>{r.title} (due {fmtDate(r.deadline)})</option>)}
                  </select>
                </FRow>
                <FRow label="Tax / GST %">
                  <input style={s.input} type="number" min="0" max="100" value={submitForm.tax_rate} onChange={e => setSubmitForm({ ...submitForm, tax_rate: e.target.value })} />
                </FRow>
                <FRow label="Delivery Days">
                  <input style={s.input} type="number" min="1" value={submitForm.delivery_days} onChange={e => setSubmitForm({ ...submitForm, delivery_days: e.target.value })} placeholder="e.g. 10" />
                </FRow>
                <FRow label="Payment Terms">
                  <input style={s.input} value={submitForm.payment_terms} onChange={e => setSubmitForm({ ...submitForm, payment_terms: e.target.value })} placeholder="e.g. 30 days net" />
                </FRow>
              </div>
              <FRow label="Notes / Terms">
                <textarea style={{ ...s.input, resize: 'vertical' }} rows={2} value={submitForm.notes} onChange={e => setSubmitForm({ ...submitForm, notes: e.target.value })} placeholder="Additional terms or conditions..." />
              </FRow>

              <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '16px 0 8px' }}>Your Quotation Items</div>
              <table style={s.table}>
                <thead><tr>{['Item Description','Qty','Unit','Unit Price (₹)'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {submitForm.lines.map((l, i) => (
                    <tr key={i}>
                      <td style={{ padding: '4px 6px' }}><input style={s.input} value={l.item_description} onChange={e => setFormLine(i, 'item_description', e.target.value)} placeholder="Item name" /></td>
                      <td style={{ padding: '4px 6px', width: '80px' }}><input style={s.input} type="number" min="1" value={l.quantity} onChange={e => setFormLine(i, 'quantity', e.target.value)} /></td>
                      <td style={{ padding: '4px 6px', width: '80px' }}><input style={s.input} value={l.unit} onChange={e => setFormLine(i, 'unit', e.target.value)} /></td>
                      <td style={{ padding: '4px 6px', width: '120px' }}><input style={s.input} type="number" min="0" step="0.01" value={l.unit_price} onChange={e => setFormLine(i, 'unit_price', e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" style={s.addLineBtn} onClick={() => setSubmitForm({ ...submitForm, lines: [...submitForm.lines, { ...EMPTY_LINE }] })}>+ Add Line</button>

              <div style={s.totalBox}>
                <div style={s.totalRow}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                <div style={s.totalRow}><span>GST ({submitForm.tax_rate}%)</span><span>{fmt(gstAmt)}</span></div>
                <div style={{ ...s.totalRow, fontWeight: '700', fontSize: '15px', borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginTop: '4px' }}><span>Grand Total</span><span>{fmt(grandTotal)}</span></div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button type="submit" style={s.addBtn} disabled={saving}>{saving ? 'Submitting...' : 'Submit Quotation'}</button>
                <button type="button" style={s.outlineBtn} onClick={() => setSubmitForm({ ...submitForm, status: 'Draft' })}>Save Draft</button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div style={{ ...s.modal, width: '480px' }}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>Quotation #{detail.quotation_id}</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {isAdmin && <button style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }} onClick={() => deleteQuotation(detail.quotation_id)}>Delete</button>}
                <button style={s.closeBtn} onClick={() => setDetail(null)}>✕</button>
              </div>
            </div>
            <div style={s.modalBody}>
              {[['RFQ', detail.rfq_title],['Vendor', detail.vendor_name],['Total', fmt(detail.total_amount)],['GST', `${detail.tax_rate}%`],['Delivery', detail.delivery_days ? `${detail.delivery_days} days` : '—'],['Payment', detail.payment_terms || '—'],['Notes', detail.notes || '—'],['Status', detail.status]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', padding: '7px 0', borderBottom: '1px solid #f9fafb' }}>
                  <span style={{ width: '110px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>{k}</span>
                  <span style={{ fontSize: '13px', color: '#111827' }}>{v}</span>
                </div>
              ))}
              {detail.lines?.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Line Items</div>
                  <table style={s.table}>
                    <thead><tr>{['Item','Qty','Unit','Price','Total'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {detail.lines.map((l, i) => (
                        <tr key={i} style={s.tr}>
                          <td style={s.td}>{l.item_description || l.rfq_item || '—'}</td>
                          <td style={{ ...s.td, textAlign: 'center' }}>{l.quantity}</td>
                          <td style={s.td}>{l.unit}</td>
                          <td style={s.td}>{fmt(l.unit_price)}</td>
                          <td style={{ ...s.td, fontWeight: '600' }}>{fmt(l.unit_price * l.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FRow({ label, children }) {
  return <div style={{ marginBottom: '12px' }}><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>{label}</label>{children}</div>;
}

const s = {
  layout:    { display: 'flex', minHeight: '100vh', background: c.pageBg, fontFamily: "'Inter',system-ui,sans-serif" },
  body:      { flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '18px', overflow: 'auto' },
  header:    { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  title:     { fontSize: '22px', fontWeight: '700', color: c.gray900, margin: 0 },
  subtitle:  { fontSize: '13px', color: c.gray500, marginTop: '4px' },
  addBtn:    { padding: '9px 18px', borderRadius: r.md, border: 'none', background: c.primary, color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  outlineBtn:{ padding: '9px 18px', borderRadius: r.md, border: `1.5px solid ${c.gray500}`, background: c.surface, color: c.gray700, fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  successBox:{ background: c.successBg, border: `1px solid ${c.successBorder}`, color: c.successText, borderRadius: r.md, padding: '10px 16px', fontSize: '13px' },
  card:      { background: c.surface, borderRadius: r.xl, padding: '20px', boxShadow: sh.sm },
  cardTitle: { fontSize: '14px', fontWeight: '700', color: c.gray900, marginBottom: '12px' },
  empty:     { padding: '32px 0', textAlign: 'center', color: c.gray400, fontSize: '13px' },
  table:     { width: '100%', borderCollapse: 'collapse' },
  th:        { padding: '8px 12px', fontSize: '11px', fontWeight: '600', color: c.gray500, textTransform: 'uppercase', textAlign: 'left', borderBottom: `1px solid ${c.gray100}`, background: c.gray150 },
  tr:        { borderBottom: `1px solid ${c.gray50}` },
  td:        { padding: '11px 12px', fontSize: '13px', color: c.gray700 },
  chip:      { padding: '3px 10px', borderRadius: r.full, fontSize: '11px', fontWeight: '600' },
  viewBtn:   { padding: '4px 12px', borderRadius: r.sm, border: `1.5px solid ${c.primary}`, color: c.primary, background: c.surface, fontWeight: '600', fontSize: '11px', cursor: 'pointer' },
  rfqChip:   { padding: '6px 14px', borderRadius: r.full, border: `1.5px solid ${c.gray300}`, background: c.surface, fontSize: '12px', fontWeight: '600', color: c.gray700, cursor: 'pointer' },
  input:     { width: '100%', padding: '8px 12px', borderRadius: r.md, border: `1px solid ${c.gray300}`, fontSize: '13px', color: c.gray900, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  errBox:    { background: c.errorBg, border: `1px solid ${c.errorBorder}`, color: c.errorText, borderRadius: r.md, padding: '10px', fontSize: '13px', marginBottom: '12px' },
  addLineBtn:{ padding: '6px 14px', borderRadius: r.sm, border: `1px dashed ${c.primary}`, color: c.primary, background: c.primaryBgSoft, fontSize: '12px', cursor: 'pointer', fontWeight: '600', marginTop: '8px' },
  totalBox:  { background: c.gray50, borderRadius: r.lg, padding: '14px 16px', marginTop: '16px', width: '260px', marginLeft: 'auto' },
  totalRow:  { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: c.gray700, padding: '4px 0' },
  overlay:   { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:     { background: c.surface, borderRadius: r['2xl'], width: '500px', maxWidth: '95vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: sh.modal },
  modalHeader:{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${c.gray100}` },
  modalTitle: { fontSize: '15px', fontWeight: '700', color: c.gray900 },
  closeBtn:   { background: 'none', border: 'none', cursor: 'pointer', color: c.gray400, fontSize: '18px' },
  modalBody: { padding: '18px 20px', overflowY: 'auto' },
};
