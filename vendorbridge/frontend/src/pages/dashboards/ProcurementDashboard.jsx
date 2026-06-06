import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { makeStyles } from './dashboardStyles';

const s = makeStyles('#039b15');

export default function ProcurementDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <span style={s.brand}>VendorBridge</span>
        <div style={s.navRight}>
          <span style={s.badge}>Procurement Officer</span>
          <span style={s.userName}>{user?.name}</span>
          <button onClick={handleLogout} style={s.logoutBtn}>Logout</button>
        </div>
      </nav>
      <main style={s.main}>
        <h1 style={s.heading}>Procurement Dashboard</h1>
        <p style={s.sub}>Create RFQs, compare quotations, and generate purchase orders.</p>
        <div style={s.grid}>
          {['Create RFQ', 'Compare Quotations', 'Purchase Orders', 'Invoices'].map((item) => (
            <div key={item} style={s.card}>{item}</div>
          ))}
        </div>
      </main>
    </div>
  );
}
