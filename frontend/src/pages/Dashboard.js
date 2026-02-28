import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../services/api';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend);

const card = { background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 16 };
const kpiCard = { ...card, textAlign: 'center', flex: '1 1 160px', minWidth: 140 };

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [topIssues, setTopIssues] = useState([]);
  const [actionsDue, setActionsDue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, t, i, a] = await Promise.all([
          dashboardApi.summary(),
          dashboardApi.trends(12),
          dashboardApi.topIssues(),
          dashboardApi.actionsDue(),
        ]);
        setSummary(s.data);
        setTrends(t.data);
        setTopIssues(i.data);
        setActionsDue(a.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading dashboard...</div>;

  const statusColors = { open: '#ef5350', in_progress: '#ff9800', pending_approval: '#ab47bc', closed: '#66bb6a', rejected: '#78909c' };

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', color: '#1e3a5f', fontSize: 22 }}>Dashboard</h2>

      {/* KPI Cards */}
      {summary && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <div style={kpiCard}><div style={{ fontSize: 32, fontWeight: 700, color: '#1e3a5f' }}>{summary.total}</div><div style={{ fontSize: 13, color: '#666' }}>Total Complaints</div></div>
          {summary.by_status?.map(s => (
            <div key={s.status} style={{ ...kpiCard, borderTop: `3px solid ${statusColors[s.status] || '#90caf9'}` }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: statusColors[s.status] }}>{s.count}</div>
              <div style={{ fontSize: 12, color: '#666', textTransform: 'capitalize' }}>{s.status.replace('_', ' ')}</div>
            </div>
          ))}
          <div style={{ ...kpiCard, borderTop: '3px solid #ef5350' }}><div style={{ fontSize: 32, fontWeight: 700, color: '#ef5350' }}>{summary.overdue_actions}</div><div style={{ fontSize: 13, color: '#666' }}>Overdue Actions</div></div>
          <div style={kpiCard}><div style={{ fontSize: 32, fontWeight: 700, color: '#1e3a5f' }}>{summary.avg_resolution_days}d</div><div style={{ fontSize: 13, color: '#666' }}>Avg Resolution</div></div>
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={card}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#444' }}>Monthly Complaint Trends</h3>
          {trends.length > 0 ? (
            <Line data={{
              labels: trends.map(t => t.month),
              datasets: [
                { label: 'Total', data: trends.map(t => parseInt(t.total)), borderColor: '#1e3a5f', tension: 0.3 },
                { label: 'Closed', data: trends.map(t => parseInt(t.closed)), borderColor: '#66bb6a', tension: 0.3 },
                { label: 'Critical', data: trends.map(t => parseInt(t.critical)), borderColor: '#ef5350', tension: 0.3 },
              ]
            }} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          ) : <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>No data yet</div>}
        </div>
        <div style={card}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#444' }}>By Type</h3>
          {summary?.by_type?.length > 0 ? (
            <Doughnut data={{
              labels: summary.by_type.map(t => t.complaint_type),
              datasets: [{ data: summary.by_type.map(t => parseInt(t.count)), backgroundColor: ['#1e3a5f','#42a5f5','#66bb6a','#ff9800'] }]
            }} options={{ plugins: { legend: { position: 'bottom' } } }} />
          ) : <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>No data yet</div>}
        </div>
      </div>

      {/* Top Issues + Actions Due */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#444' }}>Top Defect Categories</h3>
          {topIssues.length > 0 ? topIssues.map(i => (
            <div key={i.defect_category} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
              <span>{i.defect_category}</span>
              <span style={{ color: '#1e3a5f', fontWeight: 600 }}>{i.count} ({i.percentage}%)</span>
            </div>
          )) : <div style={{ color: '#999', fontSize: 13 }}>No data yet</div>}
        </div>
        <div style={card}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#444' }}>Actions Due / Overdue</h3>
          {actionsDue.length > 0 ? actionsDue.slice(0, 8).map(a => (
            <div key={a.id} style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: 12 }}>
              <div style={{ fontWeight: 600 }}>{a.complaint_number}: {a.title?.substring(0, 40)}</div>
              <div style={{ color: new Date(a.target_date) < new Date() ? '#ef5350' : '#666' }}>Due: {new Date(a.target_date).toLocaleDateString()} - {a.responsible_name}</div>
            </div>
          )) : <div style={{ color: '#999', fontSize: 13 }}>No pending actions</div>}
        </div>
      </div>
    </div>
  );
}
