import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export default function Layout({ children }) {
  const { dbUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch {
      toast.error('Failed to log out');
    }
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: 'grid' },
    { path: '/complaints', label: 'Complaints', icon: 'list' },
    { path: '/complaints/new', label: 'New Complaint', icon: 'plus' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <nav style={{ width: 220, background: '#1e3a5f', color: '#fff', display: 'flex', flexDirection: 'column', padding: '0' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #2d5086' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#90caf9' }}>MFG COMPLAINT</div>
          <div style={{ fontSize: 11, color: '#64b5f6', marginTop: 2 }}>ISO 9001 / IATF 16949</div>
        </div>
        <div style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map(item => (
            <Link key={item.path} to={item.path} style={{
              display: 'block', padding: '10px 16px', color: location.pathname === item.path ? '#fff' : '#90caf9',
              background: location.pathname === item.path ? '#2d5086' : 'transparent',
              textDecoration: 'none', fontSize: 14, borderLeft: location.pathname === item.path ? '3px solid #64b5f6' : '3px solid transparent'
            }}>{item.label}</Link>
          ))}
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid #2d5086' }}>
          <div style={{ fontSize: 12, color: '#90caf9', marginBottom: 4 }}>{dbUser?.display_name || dbUser?.email}</div>
          <div style={{ fontSize: 11, color: '#64b5f6', marginBottom: 8, textTransform: 'uppercase' }}>{dbUser?.role}</div>
          <button onClick={handleLogout} style={{ background: '#c62828', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontSize: 12, width: '100%' }}>Sign Out</button>
        </div>
      </nav>
      {/* Main content */}
      <main style={{ flex: 1, background: '#f5f7fa', overflow: 'auto' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>{children}</div>
      </main>
    </div>
  );
}
