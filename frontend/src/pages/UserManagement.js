import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';

const ROLES = ['admin', 'quality_engineer', 'supervisor', 'operator', 'viewer'];
const ROLE_COLORS = { admin: '#d32f2f', quality_engineer: '#1565c0', supervisor: '#6a1b9a', operator: '#2e7d32', viewer: '#757575' };

const s = {
  container: { maxWidth: 960, margin: '0 auto', padding: 24 },
  title: { fontSize: 22, fontWeight: 700, color: '#1e3a5f', marginBottom: 24 },
  card: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  userInfo: { display: 'flex', flexDirection: 'column', gap: 4 },
  userName: { fontSize: 15, fontWeight: 600, color: '#222' },
  userEmail: { fontSize: 13, color: '#666' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 600 },
  select: { padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, background: '#fff' },
  btnSave: { padding: '6px 14px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, marginLeft: 8 },
  actions: { display: 'flex', alignItems: 'center', gap: 8 },
  loading: { textAlign: 'center', padding: 60, color: '#888' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 },
  statCard: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, textAlign: 'center' },
  statNum: { fontSize: 24, fontWeight: 700 },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  success: { background: '#e8f5e9', border: '1px solid #4caf50', borderRadius: 4, padding: 10, color: '#2e7d32', marginBottom: 16, fontSize: 13 },
  noAccess: { textAlign: 'center', padding: 60, color: '#888' },
};

export default function UserManagement() {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [roleUpdates, setRoleUpdates] = useState({});

  useEffect(() => {
    if (currentUser?.role !== 'admin') { setLoading(false); return; }
    usersAPI.getAll().then(res => {
      setUsers(res.data || []);
      const initialRoles = {};
      (res.data || []).forEach(u => { initialRoles[u.id] = u.role; });
      setRoleUpdates(initialRoles);
    }).catch(console.error).finally(() => setLoading(false));
  }, [currentUser]);

  const handleRoleUpdate = async (userId) => {
    try {
      await usersAPI.updateRole(userId, roleUpdates[userId]);
      setMessage('Role updated successfully!');
      setTimeout(() => setMessage(null), 3000);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: roleUpdates[userId] } : u));
    } catch (err) { console.error(err); }
  };

  if (loading) return <div style={s.loading}>Loading users...</div>;
  if (currentUser?.role !== 'admin') return <div style={s.noAccess}>Access restricted to administrators only.</div>;

  const roleCounts = ROLES.reduce((acc, r) => { acc[r] = users.filter(u => u.role === r).length; return acc; }, {});

  return (
    <div style={s.container}>
      <div style={s.title}>User Management</div>

      <div style={s.statsRow}>
        {ROLES.map(role => (
          <div key={role} style={s.statCard}>
            <div style={{ ...s.statNum, color: ROLE_COLORS[role] }}>{roleCounts[role] || 0}</div>
            <div style={s.statLabel}>{role.replace('_', ' ')}</div>
          </div>
        ))}
      </div>

      {message && <div style={s.success}>{message}</div>}

      {users.map(u => (
        <div key={u.id} style={s.card}>
          <div style={s.userInfo}>
            <div style={s.userName}>{u.display_name || u.email}</div>
            <div style={s.userEmail}>{u.email}</div>
          </div>
          <div style={s.actions}>
            <span style={{ ...s.badge, background: ROLE_COLORS[u.role] || '#9e9e9e' }}>{u.role}</span>
            {currentUser?.id !== u.id && (
              <>
                <select style={s.select} value={roleUpdates[u.id] || u.role}
                  onChange={e => setRoleUpdates(prev => ({ ...prev, [u.id]: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
                {roleUpdates[u.id] !== u.role && (
                  <button style={s.btnSave} onClick={() => handleRoleUpdate(u.id)}>Save</button>
                )}
              </>
            )}
            {currentUser?.id === u.id && <span style={{ fontSize: 12, color: '#888' }}>(You)</span>}
          </div>
        </div>
      ))}

      {users.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>No users found.</div>}
    </div>
  );
}
