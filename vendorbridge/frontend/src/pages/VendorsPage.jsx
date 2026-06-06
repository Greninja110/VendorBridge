import React, { useState, useEffect, useCallback, useRef } from 'react';
import { c, r, sh } from '../theme';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from './dashboards/Sidebar';

const STATUS_COLORS = {
  Active:  { bg: '#dcfce7', color: '#15803d' },
  Pending: { bg: '#fef9c3', color: '#a16207' },
  Blocked: { bg: '#fee2e2', color: '#dc2626' },
};

const EMPTY_FORM = {
  name: '', category: '', gst_number: '',
  contact_name: '', contact_email: '', contact_phone: '', address: '',
};

export default function VendorsPage() {
  const { user } = useAuth();
  const isAdmin       = user?.role === 'admin';
  const canAdd        = isAdmin || user?.role === 'procurement_officer';

  const [vendors,   setVendors]   = useState([]);
  const [summary,   setSummary]   = useState({ all: 0, Active: 0, Pending: 0, Blocked: 0 });
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const [addOpen,   setAddOpen]   = useState(false);
  const [viewVendor,setViewVendor]= useState(null);
  const [editMode,  setEditMode]  = useState(false);

  const [form,      setForm]      = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving,    setSaving]    = useState(false);

  const searchTimer = useRef(null);

  const fetchVendors = useCallback((searchVal = search, tab = activeTab) => {
    setLoading(true);
    setError('');
    const params = {};
    if (searchVal.trim()) params.search = searchVal.trim();
    if (tab !== 'all') params.status = tab;

    api.get('/api/vendors', { params })
      .then(({ data }) => {
        setVendors(data.vendors);
        setSummary(data.summary);
      })
      .catch(() => setError('Failed to load vendors.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchVendors('', 'all'); }, []);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchVendors(val, activeTab), 350);
  };

  const handleTab = (tab) => {
    setActiveTab(tab);
    fetchVendors(search, tab);
  };

  // ── Add vendor ─────────────────────────────────────────────────────────────
  const openAdd = () => { setForm(EMPTY_FORM); setFormError(''); setAddOpen(true); };
  const closeAdd = () => { setAddOpen(false); setFormError(''); };

  const submitAdd = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await api.post('/api/vendors', form);
      closeAdd();
      fetchVendors(search, activeTab);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add vendor.');
    } finally {
      setSaving(false);
    }
  };

  // ── View / Edit vendor ─────────────────────────────────────────────────────
  const openView = (v) => {
    setViewVendor(v);
    setForm({
      name: v.name || '', category: v.category || '',
      gst_number: v.gst_number || '', contact_name: v.contact_name || '',
      contact_email: v.contact_email || '', contact_phone: v.contact_phone || '',
      address: v.address || '',
    });
    setFormError('');
    setEditMode(false);
  };
  const closeView = () => { setViewVendor(null); setEditMode(false); setFormError(''); };

  const submitEdit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await api.put(`/api/vendors/${viewVendor.vendor_id}`, form);
      closeView();
      fetchVendors(search, activeTab);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update vendor.');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (vendorId, status) => {
    try {
      await api.patch(`/api/vendors/${vendorId}/status`, { status });
      if (viewVendor?.vendor_id === vendorId) setViewVendor({ ...viewVendor, status });
      fetchVendors(search, activeTab);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const deleteVendor = async (vendorId) => {
    if (!window.confirm('Delete this vendor? This cannot be undone.')) return;
    try {
      await api.delete(`/api/vendors/${vendorId}`);
      closeView();
      fetchVendors(search, activeTab);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete vendor.');
    }
  };

  const TABS = [
    { key: 'all',     label: `All (${summary.all})` },
    { key: 'Active',  label: `Active (${summary.Active})` },
    { key: 'Pending', label: `Pending (${summary.Pending})` },
    { key: 'Blocked', label: `Blocked (${summary.Blocked})` },
  ];

  return (
    <div style={s.layout}>
      <Sidebar active="vendors" />

      <div style={s.body}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Vendors</h1>
            <p style={s.subtitle}>Manage supplier profiles and registrations</p>
          </div>
          {canAdd && (
            <button style={s.addBtn} onClick={openAdd}>+ Add Vendor</button>
          )}
        </div>

        {/* Search */}
        <div style={s.searchWrap}>
          <SearchIcon />
          <input
            style={s.searchInput}
            placeholder="Search by name, GST number, category..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {search && (
            <button style={s.clearBtn} onClick={() => handleSearch('')}>✕</button>
          )}
        </div>

        {/* Filter tabs */}
        <div style={s.tabRow}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              style={{ ...s.tab, ...(activeTab === key ? s.tabActive : {}) }}
              onClick={() => handleTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={s.card}>
          {error && <div style={s.errorBox}>{error}</div>}

          {loading ? (
            <div style={s.emptyState}>Loading vendors...</div>
          ) : vendors.length === 0 ? (
            <div style={s.emptyState}>
              {search ? 'No vendors match your search.' : 'No vendors yet. Click "+ Add Vendor" to add one.'}
            </div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  {['Vendor Name', 'Category', 'GST No.', 'Contact No.', 'Status', 'Action'].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.vendor_id} style={s.tr}>
                    <td style={{ ...s.td, fontWeight: '600', color: '#111827' }}>{v.name}</td>
                    <td style={s.td}>{v.category || <span style={s.na}>—</span>}</td>
                    <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '12px' }}>
                      {v.gst_number || <span style={s.na}>—</span>}
                    </td>
                    <td style={s.td}>{v.contact_phone || v.contact_email || <span style={s.na}>—</span>}</td>
                    <td style={s.td}>
                      {isAdmin ? (
                        <select
                          value={v.status}
                          onChange={(e) => changeStatus(v.vendor_id, e.target.value)}
                          style={{ ...s.statusSelect, ...STATUS_COLORS[v.status] }}
                        >
                          <option value="Active">Active</option>
                          <option value="Pending">Pending</option>
                          <option value="Blocked">Blocked</option>
                        </select>
                      ) : (
                        <span style={{ ...s.chip, ...STATUS_COLORS[v.status] }}>{v.status}</span>
                      )}
                    </td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={s.viewBtn} onClick={() => openView(v)}>View</button>
                        {isAdmin && (
                          <button style={s.deleteBtn} onClick={() => deleteVendor(v.vendor_id)}>Delete</button>
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

      {/* Add Vendor Modal */}
      {addOpen && (
        <Modal title="Add New Vendor" onClose={closeAdd}>
          <form onSubmit={submitAdd}>
            {formError && <div style={s.formError}>{formError}</div>}
            <VendorFormFields form={form} setForm={setForm} />
            <div style={s.modalFooter}>
              <button type="button" style={s.cancelBtn} onClick={closeAdd}>Cancel</button>
              <button type="submit" style={s.submitBtn} disabled={saving}>
                {saving ? 'Adding...' : 'Add Vendor'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View / Edit Vendor Modal */}
      {viewVendor && (
        <Modal
          title={editMode ? 'Edit Vendor' : 'Vendor Details'}
          onClose={closeView}
        >
          {editMode ? (
            <form onSubmit={submitEdit}>
              {formError && <div style={s.formError}>{formError}</div>}
              <VendorFormFields form={form} setForm={setForm} />
              <div style={s.modalFooter}>
                <button type="button" style={s.cancelBtn} onClick={() => setEditMode(false)}>Cancel</button>
                <button type="submit" style={s.submitBtn} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <VendorDetail vendor={viewVendor} />
              <div style={s.modalFooter}>
                {isAdmin && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>Status:</span>
                      <select
                        value={viewVendor.status}
                        onChange={(e) => changeStatus(viewVendor.vendor_id, e.target.value)}
                        style={s.statusSelectModal}
                      >
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                    </div>
                    <button style={s.editBtn} onClick={() => setEditMode(true)}>Edit</button>
                    <button style={s.deleteBtnModal} onClick={() => deleteVendor(viewVendor.vendor_id)}>Delete</button>
                  </>
                )}
                <button style={s.cancelBtn} onClick={closeView}>Close</button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <span style={s.modalTitle}>{title}</span>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={s.modalBody}>{children}</div>
      </div>
    </div>
  );
}

function VendorFormFields({ form, setForm }) {
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <FormRow label="Vendor Name *">
        <input style={s.input} placeholder="e.g. Infra Supplies Pvt Ltd" value={form.name} onChange={set('name')} required />
      </FormRow>
      <FormRow label="Category *">
        <input style={s.input} placeholder="e.g. IT, Logistics, Furniture" value={form.category} onChange={set('category')} required />
      </FormRow>
      <FormRow label="GST Number *">
        <input style={s.input} placeholder="27AABCS1429BZ0" value={form.gst_number} onChange={set('gst_number')} required />
      </FormRow>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <FormRow label="Contact Name">
          <input style={s.input} placeholder="Full name" value={form.contact_name} onChange={set('contact_name')} />
        </FormRow>
        <FormRow label="Contact Phone *">
          <input style={s.input} placeholder="+91 98765 43210" value={form.contact_phone} onChange={set('contact_phone')} required />
        </FormRow>
      </div>
      <FormRow label="Contact Email *">
        <input style={s.input} type="email" placeholder="vendor@example.com" value={form.contact_email} onChange={set('contact_email')} required />
      </FormRow>
      <FormRow label="Address">
        <textarea style={{ ...s.input, resize: 'vertical' }} rows={2} placeholder="Full address (optional)" value={form.address} onChange={set('address')} />
      </FormRow>
    </div>
  );
}

function FormRow({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>{label}</label>
      {children}
    </div>
  );
}

function VendorDetail({ vendor }) {
  const rows = [
    ['Vendor Name',    vendor.name],
    ['Category',       vendor.category || '—'],
    ['GST Number',     vendor.gst_number || '—'],
    ['Contact Name',   vendor.contact_name || '—'],
    ['Contact Email',  vendor.contact_email || '—'],
    ['Contact Phone',  vendor.contact_phone || '—'],
    ['Address',        vendor.address || '—'],
    ['Status',         vendor.status],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {rows.map(([key, val]) => (
        <div key={key} style={s.detailRow}>
          <span style={s.detailKey}>{key}</span>
          <span style={{ ...s.detailVal, ...(key === 'Status' ? STATUS_COLORS[val] : {}) }}>
            {key === 'Status'
              ? <span style={{ ...s.chip, ...STATUS_COLORS[val], fontSize: '12px' }}>{val}</span>
              : val}
          </span>
        </div>
      ))}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  layout:      { display: 'flex', minHeight: '100vh', background: c.pageBg, fontFamily: "'Inter',system-ui,sans-serif" },
  body:        { flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '18px', overflow: 'auto' },
  header:      { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  title:       { fontSize: '22px', fontWeight: '700', color: c.gray900, margin: 0 },
  subtitle:    { fontSize: '13px', color: c.gray500, marginTop: '4px' },
  addBtn:      { padding: '9px 18px', borderRadius: r.md, border: 'none', background: c.primary, color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },

  searchWrap:  { position: 'relative', display: 'flex', alignItems: 'center' },
  searchInput: { width: '100%', padding: '10px 40px', borderRadius: r.lg, border: `1px solid ${c.gray200}`, background: c.surface, fontSize: '13px', color: c.gray900, outline: 'none', boxSizing: 'border-box' },
  clearBtn:    { position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: c.gray400, fontSize: '14px' },

  tabRow:      { display: 'flex', gap: '8px' },
  tab:         { padding: '6px 16px', borderRadius: r.full, border: `1px solid ${c.gray200}`, background: c.surface, fontSize: '13px', fontWeight: '500', color: c.gray500, cursor: 'pointer' },
  tabActive:   { background: c.primary, color: '#fff', border: `1px solid ${c.primary}` },

  card:        { background: c.surface, borderRadius: r.xl, padding: '0', boxShadow: sh.sm, overflow: 'hidden' },
  errorBox:    { padding: '14px 20px', background: c.errorBg, color: c.errorText, fontSize: '13px' },
  emptyState:  { padding: '48px', textAlign: 'center', color: c.gray400, fontSize: '14px' },

  table:       { width: '100%', borderCollapse: 'collapse' },
  th:          { padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: c.gray500, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', borderBottom: `1px solid ${c.gray100}`, background: c.gray150 },
  tr:          { borderBottom: `1px solid ${c.gray50}` },
  td:          { padding: '13px 16px', fontSize: '13px', color: c.gray700 },
  na:          { color: c.gray300 },

  chip:        { padding: '3px 10px', borderRadius: r.full, fontSize: '11px', fontWeight: '600', display: 'inline-block' },
  statusSelect:{ padding: '3px 8px', borderRadius: r.full, fontSize: '11px', fontWeight: '600', border: 'none', cursor: 'pointer', outline: 'none' },
  viewBtn:     { padding: '5px 14px', borderRadius: r.sm, border: `1.5px solid ${c.primary}`, color: c.primary, background: c.surface, fontWeight: '600', fontSize: '12px', cursor: 'pointer' },
  deleteBtn:   { padding: '5px 14px', borderRadius: r.sm, border: `1.5px solid ${c.red}`, color: c.red, background: c.surface, fontWeight: '600', fontSize: '12px', cursor: 'pointer' },

  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:       { background: c.surface, borderRadius: r['2xl'], width: '520px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: sh.modal },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${c.gray100}` },
  modalTitle:  { fontSize: '16px', fontWeight: '700', color: c.gray900 },
  closeBtn:    { background: 'none', border: 'none', cursor: 'pointer', color: c.gray400, fontSize: '18px', lineHeight: 1 },
  modalBody:   { padding: '20px 24px', overflowY: 'auto' },
  modalFooter: { display: 'flex', gap: '10px', alignItems: 'center', padding: '16px 24px', borderTop: `1px solid ${c.gray100}` },

  formError:   { background: c.errorBg, border: `1px solid ${c.errorBorder}`, color: c.errorText, borderRadius: r.md, padding: '10px 14px', fontSize: '13px', marginBottom: '12px' },
  input:       { padding: '9px 12px', borderRadius: r.md, border: `1px solid ${c.gray300}`, fontSize: '13px', color: c.gray900, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' },

  cancelBtn:   { padding: '8px 18px', borderRadius: r.md, border: `1px solid ${c.gray200}`, background: c.surface, color: c.gray700, fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  submitBtn:   { padding: '8px 20px', borderRadius: r.md, border: 'none', background: c.primary, color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  editBtn:     { padding: '8px 18px', borderRadius: r.md, border: `1px solid ${c.blue}`, background: c.surface, color: c.blue, fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  deleteBtnModal: { padding: '8px 18px', borderRadius: r.md, border: 'none', background: c.red, color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  statusSelectModal: { padding: '6px 10px', borderRadius: r.md, border: `1px solid ${c.gray300}`, fontSize: '13px', color: c.gray700, outline: 'none', cursor: 'pointer' },

  detailRow:   { display: 'flex', padding: '10px 0', borderBottom: `1px solid ${c.gray50}` },
  detailKey:   { width: '130px', fontSize: '12px', fontWeight: '600', color: c.gray500, flexShrink: 0 },
  detailVal:   { fontSize: '13px', color: c.gray900, flex: 1 },
};
