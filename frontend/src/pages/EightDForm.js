import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eightDAPI } from '../services/api';

const s = {
  container: { maxWidth: 960, margin: '0 auto', padding: 24 },
  title: { fontSize: 22, fontWeight: 700, color: '#1e3a5f', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  section: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: '#1e3a5f', marginBottom: 12, borderBottom: '2px solid #1e3a5f', paddingBottom: 6 },
  stepBadge: { display: 'inline-block', background: '#1e3a5f', color: '#fff', borderRadius: '50%', width: 24, height: 24, lineHeight: '24px', textAlign: 'center', fontSize: 12, fontWeight: 700, marginRight: 8 },
  label: { fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' },
  textarea: { width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, minHeight: 80, resize: 'vertical', boxSizing: 'border-box' },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' },
  field: { marginBottom: 16 },
  btnPrimary: { padding: '10px 24px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  btnSecondary: { padding: '10px 24px', background: '#fff', color: '#1e3a5f', border: '1px solid #1e3a5f', borderRadius: 4, cursor: 'pointer', fontSize: 14 },
  btnRow: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 },
  success: { background: '#e8f5e9', border: '1px solid #4caf50', borderRadius: 4, padding: 12, color: '#2e7d32', marginBottom: 16 },
  error: { background: '#ffebee', border: '1px solid #f44336', borderRadius: 4, padding: 12, color: '#c62828', marginBottom: 16 },
  teamRow: { display: 'flex', gap: 8, marginBottom: 8 },
  teamInput: { flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 },
  addBtn: { padding: '6px 12px', background: '#e3f2fd', color: '#1e3a5f', border: '1px solid #90caf9', borderRadius: 4, cursor: 'pointer', fontSize: 13 },
  removeBtn: { padding: '6px 10px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 },
};

const D_FIELDS = [
  { key: 'd1_team_members', label: 'D1 - Team Members', placeholder: 'List team members responsible for solving this problem...', isTeam: true },
  { key: 'd2_problem_description', label: 'D2 - Problem Description', placeholder: 'Describe the problem in specific, measurable terms (5W2H: Who, What, When, Where, Why, How, How Many)...' },
  { key: 'd3_containment_actions', label: 'D3 - Containment Actions', placeholder: 'Describe interim containment actions taken to protect the customer...' },
  { key: 'd4_root_cause', label: 'D4 - Root Cause Analysis', placeholder: 'Identify the root cause(s) using methods like 5-Why, Fishbone/Ishikawa diagram...' },
  { key: 'd5_corrective_actions', label: 'D5 - Corrective Actions (Chosen)', placeholder: 'List and verify corrective actions that address the root cause...' },
  { key: 'd6_implementation', label: 'D6 - Implementation & Validation', placeholder: 'Describe how corrective actions were implemented and validated...' },
  { key: 'd7_prevention', label: 'D7 - Recurrence Prevention', placeholder: 'Describe systemic changes to prevent recurrence (FMEA, Control Plan updates, procedures)...' },
  { key: 'd8_team_recognition', label: 'D8 - Team & Individual Recognition', placeholder: 'Acknowledge team contributions and document lessons learned...' },
];

export default function EightDForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({});
  const [teamMembers, setTeamMembers] = useState(['']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [reportId, setReportId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await eightDAPI.getByComplaint(id);
        if (res.data && res.data.id) {
          const r = res.data;
          setReportId(r.id);
          setForm({
            d2_problem_description: r.d2_problem_description || '',
            d3_containment_actions: r.d3_containment_actions || '',
            d4_root_cause: r.d4_root_cause || '',
            d5_corrective_actions: r.d5_corrective_actions || '',
            d6_implementation: r.d6_implementation || '',
            d7_prevention: r.d7_prevention || '',
            d8_team_recognition: r.d8_team_recognition || '',
          });
          if (r.d1_team_members) {
            const members = Array.isArray(r.d1_team_members) ? r.d1_team_members : r.d1_team_members.split(',');
            setTeamMembers(members.length ? members : ['']);
          }
        }
      } catch (err) { /* new report */ }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload = { ...form, complaint_id: parseInt(id), d1_team_members: teamMembers.filter(m => m.trim()) };
      if (reportId) {
        await eightDAPI.update(reportId, payload);
      } else {
        const res = await eightDAPI.create(payload);
        setReportId(res.data.id);
      }
      setMessage({ type: 'success', text: '8D Report saved successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save 8D Report' });
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}>Loading 8D Report...</div>;

  return (
    <div style={s.container}>
      <div style={s.title}>8D Problem Solving Report</div>
      <div style={s.subtitle}>IATF 16949 / ISO 9001 Corrective Action - Complaint #{id}</div>

      {message && <div style={message.type === 'success' ? s.success : s.error}>{message.text}</div>}

      <form onSubmit={handleSubmit}>
        {/* D1 - Team */}
        <div style={s.section}>
          <div style={s.sectionTitle}><span style={s.stepBadge}>D1</span>Team Members</div>
          {teamMembers.map((m, i) => (
            <div key={i} style={s.teamRow}>
              <input style={s.teamInput} value={m} placeholder={`Member ${i + 1} name and role`}
                onChange={e => { const t = [...teamMembers]; t[i] = e.target.value; setTeamMembers(t); }} />
              {teamMembers.length > 1 && <button type="button" style={s.removeBtn} onClick={() => setTeamMembers(t => t.filter((_, j) => j !== i))}>Remove</button>}
            </div>
          ))}
          <button type="button" style={s.addBtn} onClick={() => setTeamMembers(t => [...t, ''])}>+ Add Member</button>
        </div>

        {/* D2 - D8 */}
        {D_FIELDS.slice(1).map(field => (
          <div key={field.key} style={s.section}>
            <div style={s.sectionTitle}>
              <span style={s.stepBadge}>{field.label.split(' - ')[0]}</span>
              {field.label.split(' - ')[1]}
            </div>
            <div style={s.field}>
              <textarea style={s.textarea} name={field.key} value={form[field.key] || ''}
                onChange={handleChange} placeholder={field.placeholder} />
            </div>
          </div>
        ))}

        <div style={s.btnRow}>
          <button type="button" style={s.btnSecondary} onClick={() => navigate(`/complaints/${id}`)}>Back to Complaint</button>
          <button type="submit" style={s.btnPrimary} disabled={saving}>{saving ? 'Saving...' : reportId ? 'Update 8D Report' : 'Save 8D Report'}</button>
        </div>
      </form>
    </div>
  );
}
