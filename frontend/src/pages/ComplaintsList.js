import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../services/api';
import { toast } from 'react-toastify';

const severityColor = { critical: '#ef5350', high: '#ff7043', medium: '#ffa726', low: '#66bb6a' };
const statusColor = { open: '#ef5350', in_progress: '#ff9800', pending_approval: '#ab47bc', closed: '#66bb6a', rejected: '#78909c' };

export default function ComplaintsList() {
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', severity: '', page: 1 });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await complaintsApi.list(filters);
        setComplaints(res.data.data);
        setTotal(res.data.total);
      } catch (e) { toast.error('Failed to load complaints'); }
      setLoading(false);
    }
    load();
  }, [filters]);

  const s = {
    hdr: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    btn: { background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-block' },
    filter: { padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, marginRight: 8 },
    table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
    th: { background: '#1e3a5f', color: '#fff', padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600 },
    td: { padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #f0f0f0' },
    badge: (color) => ({ background: color + '20', color, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }),
  };

  return (
    <div>
      <div style={s.hdr}>
        <h2 style={{ margin: 0, color: '#1e3a5f', fontSize: 22 }}>Complaints ({total})</h2>
        <Link to="/complaints/new" style={s.btn}>+ New Complaint</Link>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 16 }}>
        <select style={s.filter} value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="closed">Closed</option>
          <option value="rejected">Rejected</option>
        </select>
        <select style={s.filter} value={filters.severity} onChange={e => setFilters({ ...filters, severity: e.target.value, page: 1 })}>
          <option value="">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              {['#', 'Title', 'Customer', 'Type', 'Severity', 'Status', 'Date', 'Assigned To'].map(h => <th key={h} style={s.th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {complaints.length === 0 ? (
              <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', color: '#999' }}>No complaints found</td></tr>
            ) : complaints.map(c => (
              <tr key={c.id} style={{ cursor: 'pointer' }}>
                <td style={s.td}><Link to={`/complaints/${c.id}`} style={{ color: '#1e3a5f', fontWeight: 600 }}>{c.complaint_number}</Link></td>
                <td style={s.td}><Link to={`/complaints/${c.id}`} style={{ color: '#333', textDecoration: 'none' }}>{c.title?.substring(0, 50)}</Link></td>
                <td style={s.td}>{c.customer_name || '-'}</td>
                <td style={s.td}>{c.complaint_type || '-'}</td>
                <td style={s.td}><span style={s.badge(severityColor[c.severity] || '#90caf9')}>{c.severity}</span></td>
                <td style={s.td}><span style={s.badge(statusColor[c.status] || '#90caf9')}>{c.status?.replace('_', ' ')}</span></td>
                <td style={s.td}>{new Date(c.created_at).toLocaleDateString()}</td>
                <td style={s.td}>{c.assigned_to_name || 'Unassigned'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
