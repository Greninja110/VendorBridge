# VendorBridge
**Procurement & Vendor Management ERP**

Role-based authentication system built with React, Node.js, Express, and MySQL.

---

## Roles
| Role | Dashboard |
|------|-----------|
| Admin | Manage users, vendors, analytics |
| Vendor | Submit quotations, track RFQs |
| Procurement Officer | Create RFQs, compare quotes, generate POs |
| Manager | Approve/reject procurement requests |

---

## Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [XAMPP](https://www.apachefriends.org/) (MySQL + Apache)
- [Cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) *(optional, for internet access)*

---

## Setup

### 1. Database
1. Start **XAMPP** and turn on **MySQL** and **Apache**
2. Open `http://localhost/phpmyadmin`
3. Click the **SQL** tab
4. Paste and run the contents of `database/init.sql`

> If the table already exists and you need to add reset password columns:
> ```sql
> ALTER TABLE users
>   ADD COLUMN reset_token         VARCHAR(255),
>   ADD COLUMN reset_token_expires DATETIME;
> ```

---

### 2. Backend

```bash
cd backend
npm install
```

Edit `backend/.env`:
```env
PORT=5000
JWT_SECRET=vendorbridge_super_secret_key_2024

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=           # leave empty for XAMPP default
DB_NAME=vendorbridge

EMAIL_APP_PASSWORD=your_gmail_app_password
EMAIL_SENDER=your_email@gmail.com
```

> To get a Gmail App Password: Google Account → Security → 2-Step Verification → App Passwords

Start the backend:
```bash
npm run dev
```
Backend runs on `http://localhost:5000`

---

### 3. Frontend

```bash
cd frontend
npm install
```

Edit `frontend/.env`:
```env
VITE_LOCAL_API_URL=http://localhost:5000
VITE_TUNNEL_API_URL=https://your-backend-tunnel.trycloudflare.com
```

Start the frontend:
```bash
npm run dev
```
Frontend runs on `http://localhost:5173`

---

## Cloudflare Tunnel (share over internet)

Install [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/), then open two extra terminals:

```bash
# Terminal 3 — expose backend
cloudflared tunnel --url http://localhost:5000

# Terminal 4 — expose frontend
cloudflared tunnel --url http://localhost:5173
```

Copy the backend tunnel URL and paste it into `frontend/.env`:
```env
VITE_TUNNEL_API_URL=https://your-backend-tunnel.trycloudflare.com
```

Restart the frontend. Share the **frontend tunnel URL** with anyone.

> Tunnel URLs change every time cloudflared restarts. Update `VITE_TUNNEL_API_URL` and restart the frontend when that happens.

---

## Project Structure

```
vendorbridge/
├── database/
│   └── init.sql                  # MySQL schema
├── backend/
│   ├── .env                      # Environment variables
│   ├── server.js                 # Express entry point
│   ├── config/
│   │   ├── db.js                 # MySQL connection
│   │   └── mailer.js             # Nodemailer (Gmail)
│   └── routes/
│       └── auth.js               # Register, Login, Forgot/Reset Password
└── frontend/
    ├── .env                      # API URLs
    ├── vite.config.js
    └── src/
        ├── App.jsx               # Routes
        ├── api/axios.js          # Auto-selects local or tunnel URL
        ├── context/AuthContext.jsx
        ├── components/ProtectedRoute.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── ForgotPassword.jsx
            ├── ResetPassword.jsx
            └── dashboards/
                ├── AdminDashboard.jsx
                ├── VendorDashboard.jsx
                ├── ProcurementDashboard.jsx
                └── ManagerDashboard.jsx
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| POST | `/api/auth/forgot-password` | Send password reset email |
| POST | `/api/auth/reset-password` | Reset password via token |

---

## Users Table

| Column | Type | Required |
|--------|------|----------|
| id | INT AUTO_INCREMENT | — |
| first_name | VARCHAR(100) | Yes |
| last_name | VARCHAR(100) | Yes |
| email | VARCHAR(255) UNIQUE | Yes |
| phone | VARCHAR(20) | No |
| password | VARCHAR(255) | Yes (hashed) |
| role | ENUM | Yes |
| country | VARCHAR(100) | No |
| additional_info | TEXT | No |
| reset_token | VARCHAR(255) | — |
| reset_token_expires | DATETIME | — |
| created_at | TIMESTAMP | — |
