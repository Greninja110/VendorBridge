const IST = 'Asia/Kolkata';

// DATE-only fields (YYYY-MM-DD) — e.g. deadline, invoice_date, order_date
export function fmtDate(val) {
  if (!val) return '—';
  // Parse date-only strings as UTC midnight; IST (+5:30) stays on the same calendar day.
  const d = typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)
    ? new Date(val + 'T00:00:00Z')
    : new Date(val);
  if (isNaN(d)) return String(val);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: IST });
}

// DATETIME fields (YYYY-MM-DD HH:MM:SS from MySQL) — e.g. decided_at, created_at, last_login
// MySQL DATETIME is timezone-unaware; we assume the server runs in IST (XAMPP local).
export function fmtDateTime(val) {
  if (!val) return '—';
  const normalized = typeof val === 'string' ? val.replace(' ', 'T') : val;
  const d = new Date(normalized);
  if (isNaN(d)) return String(val);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: IST,
  });
}
