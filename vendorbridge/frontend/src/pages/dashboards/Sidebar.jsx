import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROLE_DASH = {
  admin:               '/dashboard/admin',
  vendor:              '/dashboard/vendor',
  procurement_officer: '/dashboard/procurement',
  manager:             '/dashboard/manager',
};

const NAV_ITEMS = [
  { key: 'dashboard',       label: 'Dashboard',       icon: HomeIcon,      path: null },
  { key: 'vendors',         label: 'Vendors',          icon: UsersIcon,     path: '/vendors' },
  { key: 'rfqs',            label: "RFQ's",            icon: DocIcon,       path: '/rfqs' },
  { key: 'quotations',      label: 'Quotations',       icon: ClipboardIcon, path: '/quotations' },
  { key: 'approvals',       label: 'Approvals',        icon: CheckIcon,     path: '/approvals' },
  { key: 'purchase_orders', label: 'Purchase Orders',  icon: CartIcon,      path: '/purchase-orders' },
  { key: 'invoices',        label: 'Invoices',         icon: FileIcon,      path: '/invoices' },
  { key: 'reports',         label: 'Reports',          icon: ChartIcon,     path: null },
  { key: 'activity',        label: 'Activity',         icon: ActivityIcon,  path: null },
];

export default function Sidebar({ active = 'dashboard' }) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [hovered, setHovered] = useState(null);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleNav = (item) => {
    if (item.key === 'dashboard') {
      navigate(ROLE_DASH[user?.role] || '/login');
    } else if (item.path) {
      navigate(item.path);
    }
    // items without a path are not yet implemented — do nothing
  };

  // derive active key from current path
  const currentActive = (() => {
    const p = location.pathname;
    if (p === '/vendors') return 'vendors';
    if (p.startsWith('/rfqs')) return 'rfqs';
    if (p.startsWith('/quotations')) return 'quotations';
    if (p.startsWith('/approvals')) return 'approvals';
    if (p.startsWith('/purchase-orders')) return 'purchase_orders';
    if (p.startsWith('/invoices')) return 'invoices';
    if (p.startsWith('/reports')) return 'reports';
    if (p.startsWith('/activity')) return 'activity';
    if (p.startsWith('/dashboard')) return 'dashboard';
    return active;
  })();

  return (
    <aside style={s.sidebar}>
      <div style={s.brand}>
        <div style={s.logoBox}>VB</div>
        <span style={s.brandName}>VendorBridge</span>
      </div>

      <nav style={s.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive  = currentActive === item.key;
          const isHover   = hovered === item.key;
          const hasRoute  = item.key === 'dashboard' || !!item.path;
          const Icon      = item.icon;
          return (
            <div
              key={item.key}
              title={!hasRoute ? 'Coming soon' : undefined}
              style={{
                ...s.navItem,
                ...(isActive ? s.navActive : isHover ? s.navHover : {}),
                ...(!hasRoute ? { opacity: 0.45, cursor: 'default' } : { cursor: 'pointer' }),
              }}
              onClick={() => hasRoute && handleNav(item)}
              onMouseEnter={() => setHovered(item.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <Icon active={isActive} />
              <span style={{ ...s.navLabel, ...(isActive ? { color: '#fff', fontWeight: '600' } : {}) }}>
                {item.label}
              </span>
            </div>
          );
        })}
      </nav>

      <div style={s.footer}>
        <div style={s.avatarRow}>
          <div style={s.avatar}>{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div style={s.userInfo}>
            <span style={s.userName}>{user?.name}</span>
            <span style={s.userRole}>{formatRole(user?.role)}</span>
          </div>
        </div>
        <button onClick={handleLogout} style={s.logoutBtn}>
          <LogoutIcon /> Logout
        </button>
      </div>
    </aside>
  );
}

function formatRole(role) {
  const map = { admin: 'Admin', vendor: 'Vendor', procurement_officer: 'Procurement Officer', manager: 'Manager' };
  return map[role] || role;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const ip = (active) => ({
  width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none',
  stroke: active ? '#fff' : '#9ca3af', strokeWidth: '2',
  strokeLinecap: 'round', strokeLinejoin: 'round',
  style: { flexShrink: 0 },
});

function HomeIcon({ active }) {
  return <svg {...ip(active)}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function UsersIcon({ active }) {
  return <svg {...ip(active)}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function DocIcon({ active }) {
  return <svg {...ip(active)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
}
function ClipboardIcon({ active }) {
  return <svg {...ip(active)}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>;
}
function CheckIcon({ active }) {
  return <svg {...ip(active)}><polyline points="20 6 9 17 4 12"/></svg>;
}
function CartIcon({ active }) {
  return <svg {...ip(active)}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
}
function FileIcon({ active }) {
  return <svg {...ip(active)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
}
function ChartIcon({ active }) {
  return <svg {...ip(active)}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
function ActivityIcon({ active }) {
  return <svg {...ip(active)}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
}
function LogoutIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}

const s = {
  sidebar:   { width: '220px', minHeight: '100vh', background: '#0a1d17', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  brand:     { display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 16px 16px', borderBottom: '1px solid #1a3a2a' },
  logoBox:   { width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#039b15,#056715)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '12px', flexShrink: 0 },
  brandName: { color: '#fff', fontWeight: '700', fontSize: '15px' },
  nav:       { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' },
  navItem:   { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', transition: 'background 0.15s' },
  navActive: { background: 'rgba(3,155,21,0.25)' },
  navHover:  { background: 'rgba(255,255,255,0.05)' },
  navLabel:  { color: '#9ca3af', fontSize: '13px', fontWeight: '500' },
  footer:    { padding: '12px 12px 16px', borderTop: '1px solid #1a3a2a' },
  avatarRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' },
  avatar:    { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#039b15,#056715)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '13px', flexShrink: 0 },
  userInfo:  { display: 'flex', flexDirection: 'column', minWidth: 0 },
  userName:  { color: '#e5e7eb', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole:  { color: '#6b7280', fontSize: '11px' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: '6px', width: '100%', padding: '7px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid #1a3a2a', borderRadius: '7px', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', fontWeight: '500' },
};
