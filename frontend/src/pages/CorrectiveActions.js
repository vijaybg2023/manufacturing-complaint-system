import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { correctiveActionsAPI } from '../services/api';

const PRIORITIES = ['critical', 'high', 'medium', 'low'];
const STATUSES = ['open', 'in_progress', 'completed', 'verified', 'closed'];
const STATUS_COLORS = { open: '#2196f3', in_progress: '#ff9800', completed: '#4caf50', verified: '#9c27b0', closed: '#9e9e9e' };

const s = {
  container: { maxWidth: 960, margin: '0 auto', padding: 24 },
  title: { fontSize: 22, fontWeight: 700, color: '#1e3a5f', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  addSection: { background: '#f5f7fa', border: '1px solid #e0e0e0', borderRadius: 8, padding: 20, marginBottom: 24 },
  addTitle: { fontSize: 15, fontWeight: 600, color: '#1e3a5f', marginBottom: 16 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' },
  input: { width: '100%', padding: '7px 11px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' },
  select: { width: '100%', padding: '7px 11px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, background: '#fff', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '7px 11px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, minHeight: 70, resize: 'vertical', boxSizing: 'border-box' },
  btnPrimary: { padding: '8px 20px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  btnSmall: { padding: '4px 10px', background: '#fff', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  btnDanger: { padding: '4px 10px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  card: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#222' },
  badge: { display: 'inline-block', padding: '2px 8px', borderRadius: 10, color: '#fff', fontSize: 11, fontWeight: 600 },
  cardMeta: { fontSize: 12, color: '#888', marginTop: 4 },
  cardActions: { display: 'flex', gap: 8, marginTop: 10 },
  empty: { textAlign: 'center', padding: 40, color: '#888', background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0' },
  success: { background: '#e8f5e9', border: '1px solid #4caf50', borderRadius: 4, padding: 10, color: '#2e7d32', marginBottom: 12, fontSize: 13 },
};

const emptyForm = { action_description: '', responsible_person: '', due_date: '', priority: 'medium', action_type: '', verification_method: '' };

export default function CorrectiveActions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [actions, setActions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadActions = async () => {
    try {
      const res = await correctiveActionsAPI.getByComplaint(id);
      setActions(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadActions(); }, [id]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload = { ...form, complaint_id: parseInt(id) };
      if (editId) {
        await correctiveActionsAPI.update(editId, payload);
        setMessage('Corrective action updated successfully!');
      } else {
        await correctiveActionsAPI.create(payload);
        setMessage('Corrective action added successfully!');
      }
      setForm(emptyForm);
      setEditId(null);
      setShowForm(false);
      loadActions();
    } catch (err) { setMessage('Error: ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };

  const handleEdit = (action) => {
    setForm({ action_description: action.action_description || '', responsible_person: action.responsible_person || '',
      due_date: action.due_date ? action.due_date.split('T')[0] : '', priority: action.priority || 'medium',
      action_type: action.action_type || '', verification_method: action.verification_method || '' });
    setEditId(action.id);
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleStatusChange = async (actionId, newStatus) => {
    try {
      await correctiveActionsAPI.update(actionId, { status: newStatus });
      loadActions();
    } catch (err) { console.error(err); }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'quality_engineer';

  return (
    <div style={s.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={s.title}>Corrective Actions</div>
        {canEdit && <button style={s.btnPrimary} onClick={() => { setShowForm(true); setForm(emptyForm); setEditId(null); }}>+ Add Action</button>}
      </div>
      <div style={s.subtitle}>Complaint #{id} - Corrective & Preventive Actions (CAPA)</div>

      {message && <div style={s.success}>{message}</div>}

      {showForm && canEdit && (
        <div style={s.addSection}>
          <div style={s.addTitle}>{editId ? 'Edit Corrective Action' : 'New Corrective Action'}</div>
          <form onSubmit={handleSubmit}>
            <div style={s.field}>
              <label style={s.label}>Action Description *</label>
              <textarea style={s.textarea} name="action_description" value={form.action_description} onChange={handleChange} required placeholder="Describe the corrective action..." />
            </div>
            <div style={s.grid2}>
              <div style={s.field}>
                <label style={s.label}>Responsible Person</label>
                <input style={s.input} name="responsible_person" value={form.responsible_person} onChange={handleChange} placeholder="Name / Department" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Due Date</label>
                <input style={s.input} type="date" name="due_date" value={form.due_date} onChange={handleChange} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Priority</label>
                <select style={s.select} name="priority" value={form.priority} onChange={handleChange}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Action Type</label>
                <input style={s.input} name="action_type" value={form.action_type} onChange={handleChange} placeholder="Corrective / Preventive / Systemic" />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Verification Method</label>
              <input style={s.input} name="verification_method" value={form.verification_method} onChange={handleChange} placeholder="How will effectiveness be verified?" />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button type="submit" style={s.btnPrimary} disabled={saving}>{saving ? 'Saving...' : editId ? 'Update' : 'Add Action'}</button>
              <button type="button" style={s.btnSmall} onClick={() => { setShowForm(false); setForm(emptyForm); setEditId(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div> :
        actions.length === 0 ? <div style={s.empty}>No corrective actions yet. Add one above.</div> :
        actions.map(action => (
          <div key={action.id} style={s.card}>
            <div style={s.cardHeader}>
              <div>
                <div style={s.cardTitle}>{action.action_description}</div>
                <div style={s.cardMeta}>
                  {action.action_type && <span>{action.action_type} &bull; </span>}
                  Responsible: {action.responsible_person || 'TBD'} &bull;
                  Due: {action.due_date ? new Date(action.due_date).toLocaleDateString() : 'Not set'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ ...s.badge, background: STATUS_COLORS[action.status] || '#9e9e9e' }}>{action.status?.replace('_', ' ').toUpperCase()}</span>
              </div>
            </div>
            {action.verification_method && <div style={{ fontSize: 12, color: '#666' }}>Verification: {action.verification_method}</div>}
            <div style={s.cardActions}>
              {canEdit && (
                <>
                  <select style={{ ...s.select, width: 'auto', fontSize: 12, padding: '3px 8px' }}
                    value={action.status} onChange={e => handleStatusChange(action.id, e.target.value)}>
                    {STATUSES.map(st => <option key={st} value={st}>{st.replace('_', ' ')}</option>)}
                  </select>
                  <button style={s.btnSmall} onClick={() => handleEdit(action)}>Edit</button>
                </>
              )}
            </div>
          </div>
        ))
      }

      <div style={{ marginTop: 20 }}>
        <button style={s.btnSmall} onClick={() => navigate(`/complaints/${id}`)}>← Back to Complaint</button>
      </div>
    </div>
  );
}
