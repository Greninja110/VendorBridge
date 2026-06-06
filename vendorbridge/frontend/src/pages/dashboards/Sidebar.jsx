import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { c, r } from '../../theme';

const ROLE_DASH = {
  admin:               '/dashboard/admin',
  vendor:              '/dashboard/vendor',
  procurement_officer: '/dashboard/procurement',
  manager:             '/dashboard/manager',
};

const NAV_ITEMS = [
  { key: 'dashboard',       label: 'Dashboard',       icon: HomeIcon,      path: null,                roles: null },
  { key: 'vendors',         label: 'Vendors',          icon: UsersIcon,     path: '/vendors',          roles: null },
  { key: 'rfqs',            label: "RFQ's",            icon: DocIcon,       path: '/rfqs',             roles: null },
  { key: 'quotations',      label: 'Quotations',       icon: ClipboardIcon, path: '/quotations',       roles: null },
  { key: 'approvals',       label: 'Approvals',        icon: CheckIcon,     path: '/approvals',        roles: ['admin','manager','procurement_officer'] },
  { key: 'purchase_orders', label: 'Purchase Orders',  icon: CartIcon,      path: '/purchase-orders',  roles: null },
  { key: 'invoices',        label: 'Invoices',         icon: FileIcon,      path: '/invoices',         roles: null },
  { key: 'reports',         label: 'Reports',          icon: ChartIcon,     path: '/reports',          roles: ['admin','manager','procurement_officer'] },
  { key: 'activity',        label: 'Activity',         icon: ActivityIcon,  path: '/activity',         roles: ['admin','manager','procurement_officer'] },
  { key: 'profile',         label: 'My Profile',       icon: ProfileIcon,   path: '/vendor-profile',   roles: ['vendor'] },
];

export default function Sidebar({ active = 'dashboard' }) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [hovered,   setHovered]   = useState(null);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('vb_sidebar') === '1'; } catch { return false; }
  });

  const toggle = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('vb_sidebar', next ? '1' : '0'); } catch {}
      return next;
    });
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleNav = (item) => {
    if (item.key === 'dashboard') {
      navigate(ROLE_DASH[user?.role] || '/login');
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const currentActive = (() => {
    const p = location.pathname;
    if (p === '/vendors')              return 'vendors';
    if (p.startsWith('/rfqs'))         return 'rfqs';
    if (p.startsWith('/quotations'))   return 'quotations';
    if (p.startsWith('/approvals'))    return 'approvals';
    if (p.startsWith('/purchase-orders')) return 'purchase_orders';
    if (p.startsWith('/invoices'))     return 'invoices';
    if (p.startsWith('/reports'))      return 'reports';
    if (p.startsWith('/activity'))     return 'activity';
    if (p.startsWith('/vendor-profile')) return 'profile';
    if (p.startsWith('/dashboard'))    return 'dashboard';
    return active;
  })();

  const W = collapsed ? '68px' : '224px';

  return (
    <aside style={{ ...s.sidebar, width: W, minWidth: W }}>

      {/* ── Brand / Toggle ────────────────────────────── */}
      <div style={{ ...s.brand, justifyContent: collapsed ? 'center' : 'space-between' }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div style={s.logoBox}>VB</div>
            <span style={s.brandName}>VendorBridge</span>
          </div>
        )}
        <button
          onClick={toggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={s.hamburger}
        >
          {collapsed ? <MenuOpenIcon /> : <MenuCloseIcon />}
        </button>
      </div>

      {/* ── Nav items ─────────────────────────────────── */}
      <nav style={s.nav}>
        {NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user?.role)).map((item) => {
          const isActive = currentActive === item.key;
          const isHover  = hovered === item.key;
          const hasRoute = item.key === 'dashboard' || !!item.path;
          const Icon     = item.icon;
          return (
            <div
              key={item.key}
              title={collapsed ? item.label : (!hasRoute ? 'Coming soon' : undefined)}
              style={{
                ...s.navItem,
                justifyContent: collapsed ? 'center' : 'flex-start',
                ...(isActive ? s.navActive : isHover ? s.navHover : {}),
                ...(!hasRoute ? { opacity: 0.45, cursor: 'default' } : { cursor: 'pointer' }),
              }}
              onClick={() => hasRoute && handleNav(item)}
              onMouseEnter={() => setHovered(item.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <Icon active={isActive} />
              {!collapsed && (
                <span style={{ ...s.navLabel, ...(isActive ? { color: '#fff', fontWeight: '600' } : {}) }}>
                  {item.label}
                </span>
              )}
              {/* Active indicator dot when collapsed */}
              {collapsed && isActive && (
                <span style={{ position: 'absolute', right: '6px', width: '4px', height: '4px', borderRadius: '50%', background: c.primary }} />
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Footer ────────────────────────────────────── */}
      <div style={{ ...s.footer, alignItems: collapsed ? 'center' : 'stretch' }}>
        {collapsed ? (
          /* Collapsed: just avatar with tooltip */
          <div
            title={`${user?.name} · ${formatRole(user?.role)}`}
            style={{ ...s.avatar, margin: '0 auto 8px', cursor: 'default' }}
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        ) : (
          <div style={s.avatarRow}>
            <div style={s.avatar}>{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <div style={s.userInfo}>
              <span style={s.userName}>{user?.name}</span>
              <span style={s.userRole}>{formatRole(user?.role)}</span>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title="Logout"
          style={{ ...s.logoutBtn, justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '7px' : '7px 10px' }}
        >
          <LogoutIcon />
          {!collapsed && <span>Logout</span>}
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
  width: '17', height: '17', viewBox: '0 0 24 24', fill: 'none',
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
function ProfileIcon({ active }) {
  return <svg {...ip(active)}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function LogoutIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function MenuCloseIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
}
function MenuOpenIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
}

const s = {
  sidebar:   {
    minHeight: '100vh', background: c.sidebar,
    display: 'flex', flexDirection: 'column', flexShrink: 0,
    transition: 'width 0.22s ease, min-width 0.22s ease',
    overflow: 'hidden',
  },
  brand:     {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '16px 12px', borderBottom: `1px solid ${c.sidebarBorder}`,
    minHeight: '60px',
  },
  logoBox:   {
    width: '32px', height: '32px', borderRadius: r.md, flexShrink: 0,
    background: `linear-gradient(135deg,${c.primary},${c.primaryDark})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: '700', fontSize: '12px',
  },
  brandName: { color: '#fff', fontWeight: '700', fontSize: '15px', whiteSpace: 'nowrap' },
  hamburger: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '4px', borderRadius: r.sm, display: 'flex', alignItems: 'center',
    flexShrink: 0,
    transition: 'background 0.15s',
  },
  nav:       { flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' },
  navItem:   {
    position: 'relative',
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '9px 10px', borderRadius: r.md,
    transition: 'background 0.15s',
    whiteSpace: 'nowrap',
  },
  navActive: { background: 'rgba(3,155,21,0.25)' },
  navHover:  { background: 'rgba(255,255,255,0.06)' },
  navLabel:  { color: c.gray400, fontSize: '13px', fontWeight: '500' },
  footer:    { padding: '10px 10px 14px', borderTop: `1px solid ${c.sidebarBorder}`, display: 'flex', flexDirection: 'column', gap: '8px' },
  avatarRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar:    {
    width: '32px', height: '32px', borderRadius: r.full, flexShrink: 0,
    background: `linear-gradient(135deg,${c.primary},${c.primaryDark})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: '700', fontSize: '13px',
  },
  userInfo:  { display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 },
  userName:  { color: '#e5e7eb', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole:  { color: c.gray500, fontSize: '11px', whiteSpace: 'nowrap' },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    width: '100%', padding: '7px 10px',
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${c.sidebarBorder}`,
    borderRadius: '7px', color: c.gray400, fontSize: '12px',
    cursor: 'pointer', fontWeight: '500', transition: 'background 0.15s',
  },
};
