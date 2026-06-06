import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from './dashboards/Sidebar';
import { fmtDate } from '../utils/date';

import { c, r, sh } from '../theme';
const ACCENT = c.primary;
const STATUS_COLORS = {
  Draft:     { bg: '#f3f4f6', color: '#6b7280' },
  Published: { bg: '#dcfce7', color: '#15803d' },
  Closed:    { bg: '#dbeafe', color: '#1d4ed8' },
};
const EMPTY_FORM = { title: '', category: '', deadline: '', description: '', lines: [], vendor_ids: [], status: 'Draft', visibility: 'public' };
const EMPTY_LINE = { item_description: '', quantity: 1, unit: 'NOS' };

export default function RFQsPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const canManage = ['admin','procurement_officer'].includes(user?.role);

  const [rfqs,     setRfqs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('all');
  const [detail,   setDetail]   = useState(null);
  const [create,   setCreate]   = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [vendors,  setVendors]  = useState([]);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [formErr,  setFormErr]  = useState('');

  const fetchRFQs = useCallback((status = tab) => {
    setLoading(true);
    const params = status !== 'all' ? { status } : {};
    api.get('/api/rfqs', { params })
      .then(({ data }) => setRfqs(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchRFQs('all'); }, []);

  useEffect(() => {
    if (create) {
      api.get('/api/vendors')
        .then(({ data }) => setVendors((data.vendors || []).filter(v => v.status !== 'Blocked')))
        .catch(() => {});
    }
  }, [create]);

  const handleTab = (t) => { setTab(t); fetchRFQs(t); };

  const openDetail = (rfq) => {
    api.get(`/api/rfqs/${rfq.rfq_id}`).then(({ data }) => setDetail(data)).catch(() => {});
  };

  const changeStatus = (rfqId, status) => {
    api.patch(`/api/rfqs/${rfqId}/status`, { status })
      .then(() => { fetchRFQs(tab); if (detail?.rfq_id === rfqId) setDetail({ ...detail, status }); })
      .catch((e) => alert(e.response?.data?.message || 'Error'));
  };

  const deleteRFQ = (rfqId) => {
    if (!window.confirm('Delete this RFQ?')) return;
    api.delete(`/api/rfqs/${rfqId}`).then(() => { setDetail(null); fetchRFQs(tab); }).catch((e) => alert(e.response?.data?.message || 'Error'));
  };

  const openEdit = (rfq) => {
    setEditForm({ title: rfq.title || '', category: rfq.category || '', deadline: rfq.deadline || '', description: rfq.description || '', status: rfq.status || 'Draft', lines: [], vendor_ids: [] });
    setFormErr('');
    setEditOpen(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setFormErr('');
    setSaving(true);
    try {
      await api.put(`/api/rfqs/${detail.rfq_id}`, editForm);
      setEditOpen(false);
      const updated = await api.get(`/api/rfqs/${detail.rfq_id}`);
      setDetail(updated.data);
      fetchRFQs(tab);
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Failed to update RFQ.');
    } finally { setSaving(false); }
  };

  // Form helpers
  const addLine = () => setForm({ ...form, lines: [...form.lines, { ...EMPTY_LINE }] });
  const setLine = (i, field, val) => {
    const lines = [...form.lines];
    lines[i] = { ...lines[i], [field]: val };
    setForm({ ...form, lines });
  };
  const removeLine = (i) => setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) });
  const toggleVendor = (id) => {
    const ids = form.vendor_ids.includes(id) ? form.vendor_ids.filter(v => v !== id) : [...form.vendor_ids, id];
    setForm({ ...form, vendor_ids: ids });
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    setFormErr('');
    setSaving(true);
    try {
      await api.post('/api/rfqs', form);
      setCreate(false);
      setForm(EMPTY_FORM);
      fetchRFQs(tab);
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Failed to create RFQ.');
    } finally { setSaving(false); }
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'Draft', label: 'Draft' },
    { key: 'Published', label: 'Published' },
    { key: 'Closed', label: 'Closed' },
  ];

  return (
    <div style={s.layout}>
      <Sidebar active="rfqs" />
      <div style={s.body}>
        <header style={s.header}>
          <div>
            <h1 style={s.title}>RFQs</h1>
            <p style={s.subtitle}>Request for Quotations — create and manage procurement requests</p>
          </div>
          {canManage && <button style={s.addBtn} onClick={() => { setForm(EMPTY_FORM); setFormErr(''); setCreate(true); }}>+ Create RFQ</button>}
        </header>

        <div style={s.tabRow}>
          {tabs.map(({ key, label }) => (
            <button key={key} style={{ ...s.tab, ...(tab === key ? s.tabActive : {}) }} onClick={() => handleTab(key)}>{label}</button>
          ))}
        </div>

        <div style={s.card}>
          {loading ? (
            <div style={s.empty}>Loading...</div>
          ) : rfqs.length === 0 ? (
            <div style={s.empty}>No RFQs yet. {canManage && 'Click "+ Create RFQ" to get started.'}</div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>{['Title','Category','Deadline','Vendors','Quotations','Status','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {rfqs.map(r => (
                  <tr key={r.rfq_id} style={s.tr}>
                    <td style={{ ...s.td, fontWeight: '600', color: '#111827', cursor: 'pointer' }} onClick={() => openDetail(r)}>{r.title}</td>
                    <td style={s.td}>{r.category || <Na />}</td>
                    <td style={s.td}>{fmtDate(r.deadline)}</td>
                    <td style={{ ...s.td, textAlign: 'center' }}>
                      {r.visibility === 'public'
                        ? <span style={{ background: c.primaryBg, color: c.primaryText, borderRadius: r.full, padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>All</span>
                        : r.vendor_count}
                    </td>
                    <td style={{ ...s.td, textAlign: 'center' }}>{r.quotation_count}</td>
                    <td style={s.td}><span style={{ ...s.chip, ...STATUS_COLORS[r.status] }}>{r.status}</span></td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={s.viewBtn} onClick={() => openDetail(r)}>View</button>
                        {canManage && r.status !== 'Closed' && (
                          <button style={{ ...s.viewBtn, borderColor: '#2563eb', color: '#2563eb' }}
                            onClick={() => changeStatus(r.rfq_id, r.status === 'Draft' ? 'Published' : 'Draft')}>
                            {r.status === 'Draft' ? 'Publish' : 'Draft'}
                          </button>
                        )}
                        {r.quotation_count > 0 && ['admin','procurement_officer'].includes(user?.role) && (
                          <button style={{ ...s.viewBtn, borderColor: '#7c3aed', color: '#7c3aed' }}
                            onClick={() => navigate(`/quotations?rfq_id=${r.rfq_id}`)}>Compare</button>
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

      {/* Detail Modal */}
      {detail && (
        <Modal title={detail.title} onClose={() => setDetail(null)}>
          <InfoRow label="Category"    val={detail.category || '—'} />
          <InfoRow label="Deadline"    val={fmtDate(detail.deadline)} />
          <InfoRow label="Status"      val={
            canManage
              ? <select value={detail.status} onChange={(e) => changeStatus(detail.rfq_id, e.target.value)} style={s.inlineSelect}>
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                  <option value="Closed">Closed</option>
                </select>
              : <span style={{ ...s.chip, ...STATUS_COLORS[detail.status] }}>{detail.status}</span>
          } />
          <InfoRow label="Visibility"   val={
            detail.visibility === 'private'
              ? <span style={{ background: c.blueBg, color: c.blue, borderRadius: r.full, padding: '2px 10px', fontSize: '11px', fontWeight: '700' }}>🔒 Private</span>
              : <span style={{ background: c.primaryBg, color: c.primaryText, borderRadius: r.full, padding: '2px 10px', fontSize: '11px', fontWeight: '700' }}>🌐 Public</span>
          } />
          <InfoRow label="Description" val={detail.description || '—'} />
          <InfoRow label="Created by"  val={detail.created_by_name} />

          {detail.lines?.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={s.sectionTitle}>Line Items</div>
              <table style={s.table}>
                <thead><tr>{['Item','Qty','Unit'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {detail.lines.map((l, i) => (
                    <tr key={i} style={s.tr}>
                      <td style={s.td}>{l.item_description}</td>
                      <td style={{ ...s.td, textAlign: 'center' }}>{l.quantity}</td>
                      <td style={s.td}>{l.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {detail.vendors?.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={s.sectionTitle}>Assigned Vendors ({detail.vendors.length})</div>
              {detail.vendors.map(v => (
                <div key={v.vendor_id} style={s.vendorRow}>
                  <span style={{ fontWeight: '600', fontSize: '13px' }}>{v.name}</span>
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>{v.category}</span>
                </div>
              ))}
            </div>
          )}

          <div style={s.modalFooter}>
            {canManage && <button style={s.deleteBtn} onClick={() => deleteRFQ(detail.rfq_id)}>Delete</button>}
            {canManage && <button style={{ ...s.cancelBtn, borderColor: '#2563eb', color: '#2563eb' }} onClick={() => openEdit(detail)}>Edit</button>}
            {detail.quotation_count > 0 && ['admin','procurement_officer'].includes(user?.role) && (
              <button style={{ ...s.submitBtn, background: '#7c3aed' }} onClick={() => { setDetail(null); navigate(`/quotations?rfq_id=${detail.rfq_id}`); }}>
                Compare Quotations
              </button>
            )}
            <button style={s.cancelBtn} onClick={() => setDetail(null)}>Close</button>
          </div>
        </Modal>
      )}

      {/* Edit RFQ Modal */}
      {editOpen && detail && (
        <Modal title={`Edit RFQ — ${detail.title}`} onClose={() => setEditOpen(false)}>
          <form onSubmit={submitEdit}>
            {formErr && <div style={s.formErr}>{formErr}</div>}
            <FRow label="RFQ Title *"><input style={s.input} value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} required /></FRow>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FRow label="Category"><input style={s.input} value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} placeholder="e.g. Furniture" /></FRow>
              <FRow label="Deadline *"><input style={s.input} type="date" value={editForm.deadline} onChange={e => setEditForm({ ...editForm, deadline: e.target.value })} required /></FRow>
            </div>
            <FRow label="Description"><textarea style={{ ...s.input, resize: 'vertical' }} rows={2} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></FRow>
            <FRow label="Status">
              <select style={s.input} value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Closed">Closed</option>
              </select>
            </FRow>
            <div style={s.modalFooter}>
              <button type="button" style={s.cancelBtn} onClick={() => setEditOpen(false)}>Cancel</button>
              <button type="submit" style={s.submitBtn} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Modal */}
      {create && (
        <Modal title="Create New RFQ" onClose={() => setCreate(false)}>
          <form onSubmit={submitCreate}>
            {formErr && <div style={s.formErr}>{formErr}</div>}
            <FRow label="RFQ Title *"><input style={s.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Office Furniture Procurement Q2" /></FRow>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FRow label="Category"><input style={s.input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Furniture" /></FRow>
              <FRow label="Deadline *"><input style={s.input} type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required /></FRow>
            </div>
            <FRow label="Description"><textarea style={{ ...s.input, resize: 'vertical' }} rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Details about this procurement..." /></FRow>
            <FRow label="Status">
              <select style={s.input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="Draft">Save as Draft</option>
                <option value="Published">Publish immediately</option>
              </select>
            </FRow>

            <div style={s.sectionTitle}>Line Items</div>
            {form.lines.map((l, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 32px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <input style={s.input} placeholder="Item description" value={l.item_description} onChange={e => setLine(i, 'item_description', e.target.value)} />
                <input style={s.input} type="number" min="1" placeholder="Qty" value={l.quantity} onChange={e => setLine(i, 'quantity', e.target.value)} />
                <input style={s.input} placeholder="Unit" value={l.unit} onChange={e => setLine(i, 'unit', e.target.value)} />
                <button type="button" style={s.removeBtn} onClick={() => removeLine(i)}>✕</button>
              </div>
            ))}
            <button type="button" style={s.addLineBtn} onClick={addLine}>+ Add Line Item</button>

            <div style={s.sectionTitle}>Vendor Visibility</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <button type="button" onClick={() => setForm({ ...form, visibility: 'public', vendor_ids: [] })} style={{
                padding: '10px 12px', borderRadius: r.md, cursor: 'pointer', textAlign: 'left',
                border: form.visibility === 'public' ? `2px solid ${ACCENT}` : `1.5px solid ${c.gray200}`,
                background: form.visibility === 'public' ? c.primaryBg : c.surface,
                transition: 'all 0.15s',
              }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: form.visibility === 'public' ? c.primaryText : c.gray700 }}>🌐 Public</div>
                <div style={{ fontSize: '11px', marginTop: '2px', color: form.visibility === 'public' ? c.primaryText : c.gray400 }}>All active vendors receive this RFQ</div>
              </button>
              <button type="button" onClick={() => setForm({ ...form, visibility: 'private' })} style={{
                padding: '10px 12px', borderRadius: r.md, cursor: 'pointer', textAlign: 'left',
                border: form.visibility === 'private' ? `2px solid ${c.blue}` : `1.5px solid ${c.gray200}`,
                background: form.visibility === 'private' ? c.blueBg : c.surface,
                transition: 'all 0.15s',
              }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: form.visibility === 'private' ? c.blue : c.gray700 }}>🔒 Private</div>
                <div style={{ fontSize: '11px', marginTop: '2px', color: form.visibility === 'private' ? c.blue : c.gray400 }}>Select specific vendors only</div>
              </button>
            </div>

            {form.visibility === 'public' && (
              <div style={{ background: c.primaryBgSoft, border: `1px solid ${c.primaryBorder}`, borderRadius: r.md, padding: '10px 14px', fontSize: '13px', color: c.primaryText }}>
                ✓ All active vendors will receive this RFQ when published.
              </div>
            )}

            {form.visibility === 'private' && (
              <>
                <div style={{ fontSize: '12px', color: c.gray500, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Select which vendors can see and respond to this RFQ.
                  {form.vendor_ids.length > 0 && (
                    <span style={{ background: ACCENT, color: '#fff', borderRadius: '12px', padding: '1px 8px', fontSize: '10px', fontWeight: '700' }}>
                      {form.vendor_ids.length} selected
                    </span>
                  )}
                </div>
                {vendors.length === 0 ? (
                  <div style={{ fontSize: '12px', color: c.gray400, padding: '10px', background: c.gray50, borderRadius: r.md }}>No active vendors found. Activate vendors first.</div>
                ) : (
                  <div style={{ border: `1px solid ${c.gray200}`, borderRadius: r.md, overflow: 'hidden', maxHeight: '200px', overflowY: 'auto' }}>
                    {vendors.map((v, i) => {
                      const checked = form.vendor_ids.includes(v.vendor_id);
                      return (
                        <label key={v.vendor_id} onClick={() => toggleVendor(v.vendor_id)} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '9px 12px', cursor: 'pointer',
                          background: checked ? c.primaryBgSoft : c.surface,
                          borderBottom: i < vendors.length - 1 ? `1px solid ${c.gray50}` : 'none',
                          transition: 'background 0.1s',
                        }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleVendor(v.vendor_id)}
                            onClick={e => e.stopPropagation()}
                            style={{ width: '15px', height: '15px', accentColor: ACCENT, cursor: 'pointer', flexShrink: 0 }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: c.gray900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</div>
                            <div style={{ fontSize: '11px', color: c.gray500, marginTop: '1px' }}>{v.category || 'No category'}{v.contact_email ? ` · ${v.contact_email}` : ''}</div>
                          </div>
                          {checked && <span style={{ fontSize: '13px', color: ACCENT, fontWeight: '700', flexShrink: 0 }}>✓</span>}
                        </label>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            <div style={s.modalFooter}>
              <button type="button" style={s.cancelBtn} onClick={() => setCreate(false)}>Cancel</button>
              <button type="submit" style={s.submitBtn} disabled={saving}>{saving ? 'Creating...' : 'Create RFQ'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.modalHeader}><span style={s.modalTitle}>{title}</span><button style={s.closeBtn} onClick={onClose}>✕</button></div>
        <div style={s.modalBody}>{children}</div>
      </div>
    </div>
  );
}
function InfoRow({ label, val }) {
  return <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid #f9fafb' }}>
    <span style={{ width: '120px', fontSize: '12px', fontWeight: '600', color: '#6b7280', flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: '13px', color: '#111827', flex: 1 }}>{val}</span>
  </div>;
}
function FRow({ label, children }) {
  return <div style={{ marginBottom: '12px' }}><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>{label}</label>{children}</div>;
}
function Na() { return <span style={{ color: '#d1d5db' }}>—</span>; }

const s = {
  layout:    { display: 'flex', minHeight: '100vh', background: c.pageBg, fontFamily: "'Inter',system-ui,sans-serif" },
  body:      { flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '18px', overflow: 'auto' },
  header:    { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  title:     { fontSize: '22px', fontWeight: '700', color: c.gray900, margin: 0 },
  subtitle:  { fontSize: '13px', color: c.gray500, marginTop: '4px' },
  addBtn:    { padding: '9px 18px', borderRadius: r.md, border: 'none', background: ACCENT, color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  tabRow:    { display: 'flex', gap: '8px' },
  tab:       { padding: '6px 16px', borderRadius: r.full, border: `1px solid ${c.gray200}`, background: c.surface, fontSize: '13px', fontWeight: '500', color: c.gray500, cursor: 'pointer' },
  tabActive: { background: ACCENT, color: '#fff', border: `1px solid ${ACCENT}` },
  card:      { background: c.surface, borderRadius: r.xl, overflow: 'hidden', boxShadow: sh.sm },
  empty:     { padding: '48px', textAlign: 'center', color: c.gray400, fontSize: '14px' },
  table:     { width: '100%', borderCollapse: 'collapse' },
  th:        { padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: c.gray500, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', borderBottom: `1px solid ${c.gray100}`, background: c.gray150 },
  tr:        { borderBottom: `1px solid ${c.gray50}` },
  td:        { padding: '12px 14px', fontSize: '13px', color: c.gray700 },
  chip:      { padding: '3px 10px', borderRadius: r.full, fontSize: '11px', fontWeight: '600', display: 'inline-block' },
  viewBtn:   { padding: '4px 12px', borderRadius: r.sm, border: `1.5px solid ${ACCENT}`, color: ACCENT, background: c.surface, fontWeight: '600', fontSize: '11px', cursor: 'pointer' },
  overlay:   { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:     { background: c.surface, borderRadius: r['2xl'], width: '600px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: sh.modal },
  modalHeader:{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${c.gray100}` },
  modalTitle: { fontSize: '16px', fontWeight: '700', color: c.gray900 },
  closeBtn:   { background: 'none', border: 'none', cursor: 'pointer', color: c.gray400, fontSize: '18px' },
  modalBody: { padding: '20px 24px', overflowY: 'auto' },
  modalFooter:{ display: 'flex', gap: '10px', justifyContent: 'flex-end', padding: '14px 24px', borderTop: `1px solid ${c.gray100}` },
  cancelBtn: { padding: '8px 18px', borderRadius: r.md, border: `1px solid ${c.gray200}`, background: c.surface, color: c.gray700, fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  submitBtn: { padding: '8px 20px', borderRadius: r.md, border: 'none', background: ACCENT, color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  deleteBtn: { padding: '8px 18px', borderRadius: r.md, border: 'none', background: c.red, color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer', marginRight: 'auto' },
  sectionTitle: { fontSize: '11px', fontWeight: '700', color: c.gray500, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '16px', marginBottom: '8px' },
  vendorRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${c.gray50}` },
  input:     { width: '100%', padding: '8px 12px', borderRadius: r.md, border: `1px solid ${c.gray300}`, fontSize: '13px', color: c.gray900, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  formErr:   { background: c.errorBg, border: `1px solid ${c.errorBorder}`, color: c.errorText, borderRadius: r.md, padding: '10px', fontSize: '13px', marginBottom: '12px' },
  addLineBtn:{ padding: '6px 14px', borderRadius: r.sm, border: `1px dashed ${ACCENT}`, color: ACCENT, background: c.primaryBgSoft, fontSize: '12px', cursor: 'pointer', fontWeight: '600', marginBottom: '4px' },
  removeBtn: { width: '32px', height: '32px', borderRadius: r.sm, border: `1px solid ${c.errorBorder}`, background: c.errorBg, color: c.red, cursor: 'pointer', fontWeight: '700', fontSize: '12px' },
  inlineSelect:{ padding: '4px 8px', borderRadius: r.sm, border: `1px solid ${c.gray300}`, fontSize: '12px', cursor: 'pointer' },
};
