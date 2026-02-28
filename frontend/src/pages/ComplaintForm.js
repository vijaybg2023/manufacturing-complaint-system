import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { complaintsAPI, storageAPI } from '../services/api';

const s = {
  container: { maxWidth: 900, margin: '0 auto', padding: 24 },
  title: { fontSize: 24, fontWeight: 700, color: '#1e3a5f', marginBottom: 24 },
  section: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 24, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#1e3a5f', marginBottom: 16, borderBottom: '2px solid #1e3a5f', paddingBottom: 8 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  field: { display: 'flex', flexDirection: 'column', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 },
  input: { padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 },
  textarea: { padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, minHeight: 80, resize: 'vertical' },
  select: { padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, background: '#fff' },
  required: { color: '#e53935', marginLeft: 2 },
  buttonRow: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 },
  btnPrimary: { padding: '10px 24px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  btnSecondary: { padding: '10px 24px', background: '#fff', color: '#1e3a5f', border: '1px solid #1e3a5f', borderRadius: 4, cursor: 'pointer', fontSize: 14 },
  error: { color: '#e53935', fontSize: 13, marginTop: 4 },
  fileInput: { padding: '8px 0', fontSize: 14 },
};

const TYPES = ['Dimensional', 'Visual/Cosmetic', 'Functional', 'Material', 'Process', 'Documentation', 'Packaging', 'Other'];
const SEVERITIES = ['critical', 'high', 'medium', 'low'];
const SOURCES = ['Customer Complaint', 'Internal Audit', 'Incoming Inspection', 'In-Process', 'Final Inspection', 'Field Return'];

export default function ComplaintForm() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({
    title: '', customer_name: '', customer_contact: '', customer_part_number: '',
    internal_part_number: '', part_description: '', complaint_type: '',
    severity: 'medium', complaint_source: '', quantity_affected: '',
    complaint_description: '', immediate_action: '', detection_method: '',
  });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.complaint_description.trim()) errs.complaint_description = 'Description is required';
    if (!form.complaint_type) errs.complaint_type = 'Type is required';
    if (!form.severity) errs.severity = 'Severity is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { ...form, quantity_affected: form.quantity_affected ? parseInt(form.quantity_affected) : null };
      const res = await complaintsAPI.create(payload);
      const complaintId = res.data.id;
      if (files.length > 0) {
        for (const file of files) {
          const fd = new FormData();
          fd.append('file', file);
          await storageAPI.upload(complaintId, fd);
        }
      }
      navigate(`/complaints/${complaintId}`);
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Failed to submit complaint' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.title}>New Complaint - ISO 9001 / IATF 16949</div>
      <form onSubmit={handleSubmit}>
        <div style={s.section}>
          <div style={s.sectionTitle}>1. Complaint Identification</div>
          <div style={s.field}>
            <label style={s.label}>Title <span style={s.required}>*</span></label>
            <input style={s.input} name="title" value={form.title} onChange={handleChange} placeholder="Brief complaint title" />
            {errors.title && <span style={s.error}>{errors.title}</span>}
          </div>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Complaint Type <span style={s.required}>*</span></label>
              <select style={s.select} name="complaint_type" value={form.complaint_type} onChange={handleChange}>
                <option value="">Select type...</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.complaint_type && <span style={s.error}>{errors.complaint_type}</span>}
            </div>
            <div style={s.field}>
              <label style={s.label}>Severity <span style={s.required}>*</span></label>
              <select style={s.select} name="severity" value={form.severity} onChange={handleChange}>
                {SEVERITIES.map(sv => <option key={sv} value={sv}>{sv.charAt(0).toUpperCase() + sv.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Source</label>
              <select style={s.select} name="complaint_source" value={form.complaint_source} onChange={handleChange}>
                <option value="">Select source...</option>
                {SOURCES.map(src => <option key={src} value={src}>{src}</option>)}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>Quantity Affected</label>
              <input style={s.input} name="quantity_affected" type="number" value={form.quantity_affected} onChange={handleChange} placeholder="0" />
            </div>
          </div>
        </div>

        <div style={s.section}>
          <div style={s.sectionTitle}>2. Customer Information</div>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Customer Name</label>
              <input style={s.input} name="customer_name" value={form.customer_name} onChange={handleChange} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Customer Contact</label>
              <input style={s.input} name="customer_contact" value={form.customer_contact} onChange={handleChange} />
            </div>
          </div>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Customer Part Number</label>
              <input style={s.input} name="customer_part_number" value={form.customer_part_number} onChange={handleChange} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Internal Part Number</label>
              <input style={s.input} name="internal_part_number" value={form.internal_part_number} onChange={handleChange} />
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Part Description</label>
            <input style={s.input} name="part_description" value={form.part_description} onChange={handleChange} />
          </div>
        </div>

        <div style={s.section}>
          <div style={s.sectionTitle}>3. Complaint Details</div>
          <div style={s.field}>
            <label style={s.label}>Complaint Description <span style={s.required}>*</span></label>
            <textarea style={s.textarea} name="complaint_description" value={form.complaint_description} onChange={handleChange} placeholder="Describe the nonconformance in detail..." />
            {errors.complaint_description && <span style={s.error}>{errors.complaint_description}</span>}
          </div>
          <div style={s.field}>
            <label style={s.label}>Detection Method</label>
            <input style={s.input} name="detection_method" value={form.detection_method} onChange={handleChange} placeholder="How was the issue detected?" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Immediate Containment Action</label>
            <textarea style={s.textarea} name="immediate_action" value={form.immediate_action} onChange={handleChange} placeholder="Describe immediate actions taken..." />
          </div>
        </div>

        <div style={s.section}>
          <div style={s.sectionTitle}>4. Attachments</div>
          <div style={s.field}>
            <label style={s.label}>Upload Files (photos, reports, etc.)</label>
            <input style={s.fileInput} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={e => setFiles(Array.from(e.target.files))} />
            {files.length > 0 && <span style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{files.length} file(s) selected</span>}
          </div>
        </div>

        {errors.submit && <div style={{ ...s.error, marginBottom: 16, fontSize: 14 }}>{errors.submit}</div>}
        <div style={s.buttonRow}>
          <button type="button" style={s.btnSecondary} onClick={() => navigate('/complaints')}>Cancel</button>
          <button type="submit" style={s.btnPrimary} disabled={loading}>{loading ? 'Submitting...' : 'Submit Complaint'}</button>
        </div>
      </form>
    </div>
  );
}
