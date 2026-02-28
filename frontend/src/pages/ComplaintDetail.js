import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { complaintsAPI, storageAPI } from '../services/api';

const STATUS_COLORS = { open: '#2196f3', in_progress: '#ff9800', resolved: '#4caf50', closed: '#9e9e9e', rejected: '#f44336' };
const SEVERITY_COLORS = { critical: '#d32f2f', high: '#f57c00', medium: '#fbc02d', low: '#388e3c' };

const s = {
  container: { maxWidth: 1000, margin: '0 auto', padding: 24 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 700, color: '#1e3a5f' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 12, color: '#fff', fontSize: 12, fontWeight: 600 },
  section: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: '#1e3a5f', marginBottom: 12, borderBottom: '2px solid #1e3a5f', paddingBottom: 6 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
  infoItem: { marginBottom: 8 },
  infoLabel: { fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#333' },
  btnPrimary: { padding: '8px 18px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  btnSuccess: { padding: '8px 18px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  btnDanger: { padding: '8px 18px', background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 },
  btnRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  attachment: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f5f5f5', borderRadius: 4, marginBottom: 8, textDecoration: 'none', color: '#1e3a5f', fontSize: 13 },
  statusSelect: { padding: '6px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 },
  loading: { textAlign: 'center', padding: 60, color: '#888' },
};

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [complaint, setComplaint] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, aRes] = await Promise.all([complaintsAPI.getById(id), storageAPI.list(id)]);
        setComplaint(cRes.data);
        setAttachments(aRes.data || []);
        setStatusUpdate(cRes.data.status);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleStatusChange = async () => {
    setUpdatingStatus(true);
    try {
      await complaintsAPI.update(id, { status: statusUpdate });
      setComplaint(c => ({ ...c, status: statusUpdate }));
    } catch (err) { console.error(err); }
    finally { setUpdatingStatus(false); }
  };

  if (loading) return <div style={s.loading}>Loading complaint...</div>;
  if (!complaint) return <div style={s.loading}>Complaint not found.</div>;

  const canEdit = user?.role === 'admin' || user?.role === 'quality_engineer';

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
          <div style={s.title}>{complaint.title}</div>
          <div style={s.subtitle}>#{complaint.complaint_number} &bull; Submitted {new Date(complaint.created_at).toLocaleDateString()} by {complaint.created_by_name || 'Unknown'}</div>
        </div>
        <div style={s.btnRow}>
          {canEdit && <button style={s.btnPrimary} onClick={() => navigate(`/complaints/${id}/8d`)}>8D Report</button>}
          {canEdit && <button style={s.btnPrimary} onClick={() => navigate(`/complaints/${id}/corrective-actions`)}>Corrective Actions</button>}
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}>Complaint Overview</div>
        <div style={s.grid3}>
          <div style={s.infoItem}><div style={s.infoLabel}>Status</div>
            <span style={{ ...s.badge, background: STATUS_COLORS[complaint.status] || '#9e9e9e' }}>{complaint.status?.replace('_', ' ').toUpperCase()}</span>
          </div>
          <div style={s.infoItem}><div style={s.infoLabel}>Severity</div>
            <span style={{ ...s.badge, background: SEVERITY_COLORS[complaint.severity] || '#9e9e9e' }}>{complaint.severity?.toUpperCase()}</span>
          </div>
          <div style={s.infoItem}><div style={s.infoLabel}>Type</div><div style={s.infoValue}>{complaint.complaint_type || '-'}</div></div>
          <div style={s.infoItem}><div style={s.infoLabel}>Source</div><div style={s.infoValue}>{complaint.complaint_source || '-'}</div></div>
          <div style={s.infoItem}><div style={s.infoLabel}>Qty Affected</div><div style={s.infoValue}>{complaint.quantity_affected ?? '-'}</div></div>
          <div style={s.infoItem}><div style={s.infoLabel}>Assigned To</div><div style={s.infoValue}>{complaint.assigned_to_name || 'Unassigned'}</div></div>
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}>Customer Information</div>
        <div style={s.grid2}>
          <div style={s.infoItem}><div style={s.infoLabel}>Customer</div><div style={s.infoValue}>{complaint.customer_name || '-'}</div></div>
          <div style={s.infoItem}><div style={s.infoLabel}>Contact</div><div style={s.infoValue}>{complaint.customer_contact || '-'}</div></div>
          <div style={s.infoItem}><div style={s.infoLabel}>Customer Part #</div><div style={s.infoValue}>{complaint.customer_part_number || '-'}</div></div>
          <div style={s.infoItem}><div style={s.infoLabel}>Internal Part #</div><div style={s.infoValue}>{complaint.internal_part_number || '-'}</div></div>
          <div style={{ ...s.infoItem, gridColumn: '1/-1' }}><div style={s.infoLabel}>Part Description</div><div style={s.infoValue}>{complaint.part_description || '-'}</div></div>
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}>Complaint Description</div>
        <div style={{ fontSize: 14, color: '#333', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{complaint.complaint_description}</div>
        {complaint.detection_method && <><div style={{ ...s.infoLabel, marginTop: 12 }}>Detection Method</div><div style={s.infoValue}>{complaint.detection_method}</div></>}
        {complaint.immediate_action && <><div style={{ ...s.infoLabel, marginTop: 12 }}>Immediate Containment Action</div><div style={{ fontSize: 14, color: '#333', whiteSpace: 'pre-wrap' }}>{complaint.immediate_action}</div></>}
      </div>

      {attachments.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionTitle}>Attachments ({attachments.length})</div>
          {attachments.map((a, i) => (
            <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" style={s.attachment}>
              <span>📎</span><span>{a.filename || a.name}</span>
            </a>
          ))}
        </div>
      )}

      {canEdit && (
        <div style={s.section}>
          <div style={s.sectionTitle}>Update Status</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <select style={s.statusSelect} value={statusUpdate} onChange={e => setStatusUpdate(e.target.value)}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
            </select>
            <button style={s.btnSuccess} onClick={handleStatusChange} disabled={updatingStatus}>{updatingStatus ? 'Saving...' : 'Update Status'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
