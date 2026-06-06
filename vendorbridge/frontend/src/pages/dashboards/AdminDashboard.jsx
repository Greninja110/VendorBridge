import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { makeStyles } from './dashboardStyles';

const s = makeStyles('#7c3aed');

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <span style={s.brand}>VendorBridge</span>
        <div style={s.navRight}>
          <span style={s.badge}>Admin</span>
          <span style={s.userName}>{user?.name}</span>
          <button onClick={handleLogout} style={s.logoutBtn}>Logout</button>
        </div>
      </nav>
      <main style={s.main}>
        <h1 style={s.heading}>Admin Dashboard</h1>
        <p style={s.sub}>Manage users, vendors, and view procurement analytics.</p>
        <div style={s.grid}>
          {['Manage Users', 'Manage Vendors', 'View Analytics', 'System Settings'].map((item) => (
            <div key={item} style={s.card}>{item}</div>
          ))}
        </div>
      </main>
    </div>
  );
}
