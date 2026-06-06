# VendorBridge

> **Procurement & Vendor Management ERP** — built for the **Odoo Hackathon**

VendorBridge is a full-stack procurement platform that digitises the end-to-end vendor lifecycle: onboarding vendors, raising RFQs, comparing quotations, routing approvals, generating purchase orders, issuing invoices, and downloading audit-ready PDF receipts — all through a single, role-aware interface.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Roles & Capabilities](#roles--capabilities)
- [Features](#features)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Setup Guide](#setup-guide)
- [Cloudflare Tunnel](#cloudflare-tunnel-share-over-internet)
- [Team](#team)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Backend | Node.js, Express.js |
| Database | MySQL (via XAMPP / phpMyAdmin) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Email | Nodemailer (Gmail SMTP) |
| PDF Generation | PDFKit |
| Styling | Inline design system (`theme.js`) |
| Tunnel | Cloudflare Tunnel (optional) |

---

## Roles & Capabilities

| Role | Key Permissions |
|------|----------------|
| **Admin** | Full access — manage users, vendors, RFQs, POs, invoices, reports |
| **Procurement Officer** | Create & publish RFQs, compare quotations, generate POs & invoices |
| **Manager** | Approve or reject quotations forwarded for sign-off |
| **Vendor** | Create own profile, view assigned RFQs, submit quotations, download invoices |

---

## Features

### Authentication & Security
- JWT-based login with token stored in `localStorage`
- Role-based protected routes — each role sees only its own dashboard
- Register with role selection (Vendor / Procurement Officer / Manager / Admin)
- Forgot Password & Reset Password via Gmail email link
- Automatic session expiry detection — 401 responses redirect to `/login?expired=1` with a contextual banner
- 10-digit phone number validation across all forms (frontend + backend)

### Vendor Management
- Admin and Procurement Officers can add, edit, and delete vendors
- Vendor status lifecycle: **Pending → Active → Blocked**
- Vendors self-register their business profile (name, GST, category, phone, address)
- New vendor profile enters **Pending** state; Admin activates to unlock participation
- Category auto-creation and reuse across vendors
- Admin can block/unblock vendors at any time

### RFQ (Request for Quotation)
- Create RFQs with title, category, description, and submission deadline
- **Public** mode — all Active vendors receive the RFQ automatically
- **Private** mode — hand-pick specific vendors from a checkbox list
- Draft → Published workflow; vendors only see Published RFQs
- Visibility badge (🌐 Public / 🔒 Private) shown in table and detail modal

### Quotations
- Vendors submit quotations with line items (description, quantity, unit, unit price)
- Procurement Officers compare all submitted quotations side-by-side
- Select the winning quotation to advance it to approval
- Quotation statuses: Submitted → Selected / Rejected

### Approval Workflow
- Selected quotations are routed to **Managers** for approval
- Managers can Approve or Reject with optional comments
- Approved quotations unlock Purchase Order generation

### Purchase Orders
- Auto-generated from approved quotations — PO number, line items, totals
- Full PO detail view with vendor info and item breakdown
- Marks the procurement as committed

### Invoices
- Generate invoices directly from approved Purchase Orders
- Invoice number, date, and total are auto-populated from the PO
- Mark invoices as **Paid** (Procurement Officer / Admin)
- Admin can cancel or delete invoices
- **PDF Download** — generates a styled A4 PDF via PDFKit containing:
  - VendorBridge branded header
  - Paid/Pending status stamp
  - Bill To / From vendor details (GSTIN, email, address)
  - Invoice number, PO reference, date
  - Line items table (alternating rows)
  - Grand total box (highlighted green when Paid)
  - System-generated footer with date
- Vendors can download PDFs for their own invoices; admins/officers can download any

### Activity Log
- Live feed of all procurement events across the platform:
  RFQ Created → Quotation Submitted → Approved/Rejected → PO Created → Invoice Issued → Invoice Paid
- Uses `Promise.allSettled` — a single broken table never crashes the whole feed
- Shows actor name, event type, timestamp, and colour-coded icon

### Reports
- Summary statistics: total vendors, active RFQs, pending approvals, invoice totals
- Aggregated data cards for quick procurement health overview

### Role-Specific Dashboards
- **Admin Dashboard** — vendor counts, RFQ stats, recent activity
- **Procurement Officer Dashboard** — open RFQs, pending quotations, PO pipeline
- **Manager Dashboard** — quotations awaiting approval
- **Vendor Dashboard** — assigned RFQs, submitted quotations, invoice status

### Sidebar Navigation
- Collapsible sidebar with persistent state (`localStorage`)
- Logo and brand hidden when collapsed — only hamburger icon shown
- Active route highlighted per role

---

## Project Structure

```
odoo-hack/
├── push_to_github.py             # Multi-account GitHub push script
└── vendorbridge/
    ├── database/
    │   ├── init.sql              # Full MySQL schema
    │   └── migrate.sql           # ALTER TABLE migrations (incremental)
    ├── backend/
    │   ├── server.js             # Express entry point (port 5000)
    │   ├── .env                  # Secrets (JWT, DB, Gmail)
    │   ├── config/
    │   │   ├── db.js             # MySQL2 connection pool
    │   │   └── mailer.js         # Nodemailer / Gmail SMTP
    │   └── routes/
    │       ├── auth.js           # Register, Login, Forgot/Reset Password
    │       ├── vendors.js        # Vendor CRUD + self-service /me routes
    │       ├── rfqs.js           # RFQ CRUD + public/private visibility
    │       ├── quotations.js     # Quotation submit, compare, select
    │       ├── approvals.js      # Manager approve/reject workflow
    │       ├── purchase-orders.js# PO generation and listing
    │       ├── invoices.js       # Invoice CRUD + PDF download (PDFKit)
    │       ├── users.js          # User management (admin)
    │       ├── reports.js        # Aggregated stats
    │       └── activity.js       # Live activity feed (Promise.allSettled)
    └── frontend/
        ├── .env                  # VITE_LOCAL_API_URL / VITE_TUNNEL_API_URL
        ├── vite.config.js
        └── src/
            ├── App.jsx           # Route definitions
            ├── theme.js          # Design system (colors, radii, shadows)
            ├── api/axios.js      # Axios instance — auto base URL + JWT + 401 handler
            ├── context/
            │   └── AuthContext.jsx
            ├── components/
            │   └── ProtectedRoute.jsx
            └── pages/
                ├── Login.jsx
                ├── Register.jsx
                ├── ForgotPassword.jsx
                ├── ResetPassword.jsx
                ├── VendorsPage.jsx
                ├── RFQsPage.jsx
                ├── QuotationsPage.jsx
                ├── ApprovalsPage.jsx
                ├── PurchaseOrdersPage.jsx
                ├── InvoicesPage.jsx
                ├── ReportsPage.jsx
                ├── ActivityPage.jsx
                ├── UsersPage.jsx
                ├── VendorProfilePage.jsx
                └── dashboards/
                    ├── Sidebar.jsx
                    ├── AdminDashboard.jsx
                    ├── ProcurementDashboard.jsx
                    ├── ManagerDashboard.jsx
                    └── VendorDashboard.jsx
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create a new user account |
| POST | `/api/auth/login` | Login — returns JWT |
| POST | `/api/auth/forgot-password` | Send password reset email |
| POST | `/api/auth/reset-password` | Reset password via token |

### Vendors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vendors` | List all vendors (with search/status filter) |
| GET | `/api/vendors/summary` | Vendor counts by status |
| GET | `/api/vendors/me` | Vendor: fetch own profile |
| POST | `/api/vendors/me` | Vendor: create own profile |
| PUT | `/api/vendors/me` | Vendor: update own profile |
| GET | `/api/vendors/:id` | Get single vendor |
| POST | `/api/vendors` | Admin: add vendor |
| PUT | `/api/vendors/:id` | Admin: edit vendor |
| PATCH | `/api/vendors/:id/status` | Admin: change status |
| DELETE | `/api/vendors/:id` | Admin: delete vendor |

### RFQs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rfqs` | List RFQs (filtered by role) |
| POST | `/api/rfqs` | Create RFQ (public or private) |
| PUT | `/api/rfqs/:id` | Update RFQ |
| PATCH | `/api/rfqs/:id/publish` | Publish draft RFQ |
| DELETE | `/api/rfqs/:id` | Delete RFQ |

### Quotations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quotations` | List quotations |
| POST | `/api/quotations` | Vendor: submit quotation |
| PATCH | `/api/quotations/:id/select` | Select winning quotation |
| PATCH | `/api/quotations/:id/reject` | Reject quotation |

### Approvals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/approvals` | List approval requests |
| POST | `/api/approvals` | Submit for manager approval |
| PATCH | `/api/approvals/:id/approve` | Manager: approve |
| PATCH | `/api/approvals/:id/reject` | Manager: reject |

### Purchase Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/purchase-orders` | List all POs |
| GET | `/api/purchase-orders/:id` | PO detail with line items |
| POST | `/api/purchase-orders` | Generate PO from approved quotation |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | List invoices |
| GET | `/api/invoices/stats` | Invoice summary stats |
| GET | `/api/invoices/:id` | Invoice detail with line items |
| GET | `/api/invoices/:id/pdf` | Download invoice as PDF |
| POST | `/api/invoices` | Generate invoice from approved PO |
| PATCH | `/api/invoices/:id/mark-paid` | Mark invoice as paid |
| PATCH | `/api/invoices/:id/cancel` | Cancel invoice |
| DELETE | `/api/invoices/:id` | Delete invoice |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Admin: list all users |
| GET | `/api/reports` | Procurement summary stats |
| GET | `/api/activity` | Live activity feed (last 80 events) |

---

## Setup Guide

### 1. Database

1. Start **XAMPP** and enable **MySQL** and **Apache**
2. Open `http://localhost/phpmyadmin`
3. Create a database named `vendorbridge`
4. Open the **SQL** tab, paste and run `database/init.sql`
5. If upgrading an existing install, also run `database/migrate.sql`

---

### 2. Backend

```bash
cd vendorbridge/backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
JWT_SECRET=vendorbridge_super_secret_key_2024

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=vendorbridge

EMAIL_APP_PASSWORD=your_gmail_app_password
EMAIL_SENDER=your_email@gmail.com
```

> **Gmail App Password**: Google Account → Security → 2-Step Verification → App Passwords

```bash
npm run dev
# Backend runs on http://localhost:5000
```

---

### 3. Frontend

```bash
cd vendorbridge/frontend
npm install
```

Create `frontend/.env`:
```env
VITE_LOCAL_API_URL=http://localhost:5000
VITE_TUNNEL_API_URL=https://your-backend-tunnel.trycloudflare.com
```

```bash
npm run dev
# Frontend runs on http://localhost:5173
```

---

## Cloudflare Tunnel (share over internet)

Install [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/), then open two extra terminals:

```bash
# Terminal 3 — expose backend
cloudflared tunnel --url http://localhost:5000

# Terminal 4 — expose frontend
cloudflared tunnel --url http://localhost:5173
```

Copy the backend tunnel URL into `frontend/.env`:
```env
VITE_TUNNEL_API_URL=https://your-backend-tunnel.trycloudflare.com
```

Restart the frontend and share the **frontend tunnel URL**.

> Tunnel URLs regenerate on every restart — update `VITE_TUNNEL_API_URL` accordingly.

---

## Team

This project was built as part of the **Odoo Hackathon** by:

| Name | GitHub | Role |
|------|--------|------|
| Ashutosh Choudhary | [@Ashutosh-k-Choudhary](https://github.com/Ashutosh-k-Choudhary) | Database & Schema Design |
| Greninja | [@Greninja110](https://github.com/Greninja110) | Backend — API, Auth, Business Logic |
| Pritesh Suthar | [@priteshsuthar247](https://github.com/priteshsuthar247) | Frontend — UI, React, UX |

---

<p align="center">
  Built with care for the <strong>Odoo Hackathon</strong> &nbsp;•&nbsp; VendorBridge © 2026
</p>
