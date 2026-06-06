import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { makeStyles } from './dashboardStyles';

const s = makeStyles('#0891b2');

export default function VendorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <span style={s.brand}>VendorBridge</span>
        <div style={s.navRight}>
          <span style={s.badge}>Vendor</span>
          <span style={s.userName}>{user?.name}</span>
          <button onClick={handleLogout} style={s.logoutBtn}>Logout</button>
        </div>
      </nav>
      <main style={s.main}>
        <h1 style={s.heading}>Vendor Dashboard</h1>
        <p style={s.sub}>Submit quotations, track RFQ status, and view purchase orders.</p>
        <div style={s.grid}>
          {['View RFQs', 'Submit Quotation', 'Track Orders', 'My Profile'].map((item) => (
            <div key={item} style={s.card}>{item}</div>
          ))}
        </div>
      </main>
    </div>
  );
}
