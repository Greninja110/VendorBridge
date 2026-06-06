// ─── VendorBridge Design System ──────────────────────────────────────────────
// Edit ONLY this file to retheme the entire app.
// Every color, border-radius, shadow, and font size used across all pages
// is derived from the values defined below.

// ── Colors ───────────────────────────────────────────────────────────────────
export const colors = {
  // Brand (green) — change these two to recolor the whole app
  primary:       '#039b15',   // main buttons, active nav, primary CTA
  primaryDark:   '#056715',   // gradient end, hover states
  primaryDeep:   '#043b0c',   // login/register page gradient bg

  // Derived from primary — light bg variants
  primaryBg:     '#dcfce7',   // light green chip/badge background
  primaryBgSoft: '#f0fdf4',   // very light green (dashed add-line buttons)
  primaryBorder: '#bbf7d0',   // border for success/green boxes
  primaryText:   '#15803d',   // green text on light green bg

  // Sidebar dark surface
  sidebar:       '#0a1d17',   // sidebar background
  sidebarBorder: '#1a3a2a',   // sidebar dividers & borders

  // Page surfaces
  pageBg:  '#f3f4f6',         // outer page / body background
  surface: '#ffffff',         // cards, modals, dropdowns

  // Gray scale (Tailwind-compatible)
  gray50:  '#f9fafb',
  gray100: '#f3f4f6',
  gray150: '#fafafa',         // table header background
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray700: '#374151',
  gray900: '#111827',

  // Semantic: success (green)
  successBg:     '#dcfce7',
  successBorder: '#bbf7d0',
  successText:   '#15803d',

  // Semantic: warning (yellow)
  warnBg:     '#fef9c3',
  warnBorder: '#fde68a',
  warnText:   '#a16207',

  // Semantic: error (red)
  errorBg:     '#fef2f2',
  errorBorder: '#fecaca',
  errorText:   '#dc2626',

  // Semantic: info (blue)
  infoBg:     '#dbeafe',
  infoBorder: '#bfdbfe',
  infoText:   '#1d4ed8',

  // Accent palette — used in dashboards, stat cards, and badges
  red:      '#dc2626',
  redBg:    '#fee2e2',
  blue:     '#2563eb',
  blueBg:   '#dbeafe',
  cyan:     '#0891b2',
  cyanBg:   '#e0f2fe',
  purple:      '#7c3aed',
  purpleLight: '#a78bfa',
  purpleBg:    '#ede9fe',
  indigo:      '#6d28d9',
  amber:    '#f59e0b',
  amberBg:  '#fef3c7',
  orange:   '#b45309',
  teal:     '#059669',
  tealBg:   '#d1fae5',
};

// Short alias for use inside style objects
export const c = colors;

// ── Border Radius ─────────────────────────────────────────────────────────────
export const radius = {
  sm:   '6px',
  md:   '8px',
  lg:   '10px',
  xl:   '12px',
  '2xl':'16px',
  full: '9999px',
};

export const r = radius;

// ── Shadows ───────────────────────────────────────────────────────────────────
export const shadow = {
  xs:    '0 1px 2px rgba(0,0,0,0.05)',
  sm:    '0 1px 3px rgba(0,0,0,0.07)',
  md:    '0 4px 12px rgba(0,0,0,0.08)',
  modal: '0 20px 60px rgba(0,0,0,0.3)',
  login: '0 25px 50px rgba(0,0,0,0.4)',
};

export const sh = shadow;

// ── Typography ────────────────────────────────────────────────────────────────
export const font = {
  family: "'Inter', system-ui, -apple-system, sans-serif",
  xs:    '11px',
  sm:    '12px',
  base:  '13px',
  md:    '14px',
  lg:    '15px',
  xl:    '18px',
  '2xl': '22px',
  '3xl': '24px',
};

export default { colors, c, radius, r, shadow, sh, font };
