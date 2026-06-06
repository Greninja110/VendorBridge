import React, { useState, useEffect } from 'react';
import { c, r, sh } from '../theme';
import api from '../api/axios';
import Sidebar from './dashboards/Sidebar';
import { fmtDate } from '../utils/date';

const TYPE_META = {
  rfq:       { label: 'RFQ Created',          bg: c.blueBg,      color: c.infoText },
  quotation: { label: 'Quotation Submitted',   bg: c.purpleBg,    color: c.purple },
  approved:  { label: 'Approved',              bg: c.successBg,   color: c.successText },
  rejected:  { label: 'Rejected',              bg: c.redBg,       color: c.red },
  po:        { label: 'PO Generated',          bg: c.warnBg,      color: c.warnText },
  invoice:   { label: 'Invoice Generated',     bg: c.gray100,     color: c.gray700 },
  paid:      { label: 'Invoice Paid',          bg: c.successBg,   color: c.successText },
};

export default function ActivityPage() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState('');
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    api.get('/api/activity')
      .then(({ data }) => setItems(data))
      .catch(() => setErr('Failed to load activity log.'))
      .finally(() => setLoading(false));
  }, []);

  const types = ['all', 'rfq', 'quotation', 'approved', 'rejected', 'po', 'invoice', 'paid'];

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  // Group items by date
  const grouped = filtered.reduce((acc, item) => {
    const day = item.happened_at ? String(item.happened_at).slice(0, 10) : 'Unknown';
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});

  const days = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div style={s.layout}>
      <Sidebar active="activity" />
      <div style={s.body}>
        <header style={s.header}>
          <div>
            <h1 style={s.title}>Activity Log</h1>
            <p style={s.subtitle}>Chronological record of all procurement actions</p>
          </div>
          <div style={{ fontSize: '13px', color: c.gray500, fontWeight: '500' }}>
            {items.length} events recorded
          </div>
        </header>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{
              padding: '5px 14px', borderRadius: r.full, border: '1.5px solid',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              ...(filter === t
                ? { background: c.gray900, color: '#fff', borderColor: c.gray900 }
                : { background: c.surface, color: c.gray500, borderColor: c.gray200 }),
            }}>
              {t === 'all' ? 'All' : (TYPE_META[t]?.label || t)}
            </button>
          ))}
        </div>

        {loading && <div style={s.empty}>Loading activity…</div>}
        {err     && <div style={{ ...s.empty, color: c.errorText }}>{err}</div>}

        {!loading && !err && filtered.length === 0 && (
          <div style={s.empty}>No activity recorded yet.</div>
        )}

        {!loading && !err && days.map(day => (
          <div key={day}>
            {/* Day separator */}
            <div style={s.dayLabel}>{fmtDate(day)}</div>
            <div style={s.card}>
              {grouped[day].map((item, i) => {
                const meta = TYPE_META[item.type] || { label: item.type, bg: c.gray100, color: c.gray700 };
                return (
                  <div key={i} style={{ ...s.row, ...(i < grouped[day].length - 1 ? { borderBottom: `1px solid ${c.gray100}` } : {}) }}>
                    {/* Timeline dot */}
                    <div style={s.dotCol}>
                      <div style={{ ...s.dot, background: meta.color }} />
                      {i < grouped[day].length - 1 && <div style={s.line} />}
                    </div>
                    {/* Content */}
                    <div style={s.content}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ ...s.badge, background: meta.bg, color: meta.color }}>{meta.label}</span>
                        <span style={s.detail}>{item.detail}</span>
                      </div>
                      <div style={s.actor}>by {item.actor}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  layout:   { display: 'flex', minHeight: '100vh', background: c.pageBg, fontFamily: "'Inter',system-ui,sans-serif" },
  body:     { flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'auto' },
  header:   { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  title:    { fontSize: '22px', fontWeight: '700', color: c.gray900, margin: 0 },
  subtitle: { fontSize: '13px', color: c.gray500, marginTop: '4px' },
  empty:    { padding: '48px', textAlign: 'center', color: c.gray400, fontSize: '14px' },
  dayLabel: { fontSize: '11px', fontWeight: '700', color: c.gray400, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', marginTop: '4px' },
  card:     { background: c.surface, borderRadius: r.xl, padding: '0 16px', boxShadow: sh.sm, overflow: 'hidden' },
  row:      { display: 'flex', gap: '12px', padding: '12px 0', alignItems: 'flex-start' },
  dotCol:   { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4px', width: '16px', flexShrink: 0 },
  dot:      { width: '10px', height: '10px', borderRadius: r.full, flexShrink: 0 },
  line:     { width: '2px', flex: 1, background: c.gray100, marginTop: '4px', minHeight: '16px' },
  content:  { flex: 1, minWidth: 0 },
  badge:    { padding: '2px 10px', borderRadius: r.full, fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' },
  detail:   { fontSize: '13px', fontWeight: '600', color: c.gray900 },
  actor:    { fontSize: '12px', color: c.gray500, marginTop: '3px' },
};
