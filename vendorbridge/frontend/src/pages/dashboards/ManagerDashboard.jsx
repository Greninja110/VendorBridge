import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { makeStyles } from './dashboardStyles';

const s = makeStyles('#b45309');

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <span style={s.brand}>VendorBridge</span>
        <div style={s.navRight}>
          <span style={s.badge}>Manager</span>
          <span style={s.userName}>{user?.name}</span>
          <button onClick={handleLogout} style={s.logoutBtn}>Logout</button>
        </div>
      </nav>
      <main style={s.main}>
        <h1 style={s.heading}>Manager Dashboard</h1>
        <p style={s.sub}>Approve or reject procurement requests and monitor workflows.</p>
        <div style={s.grid}>
          {['Pending Approvals', 'Approval History', 'Procurement Reports', 'Activity Logs'].map((item) => (
            <div key={item} style={s.card}>{item}</div>
          ))}
        </div>
      </main>
    </div>
  );
}
