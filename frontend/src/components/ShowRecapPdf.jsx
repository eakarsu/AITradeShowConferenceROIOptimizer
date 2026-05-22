import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function ShowRecapPdf() {
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState('');
  const [recap, setRecap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAll('events').then((rows) => {
      setEvents(rows || []);
      if (rows && rows.length && !selected) setSelected(String(rows[0].id));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(''); setRecap(null);
    const url = selected ? `/api/custom-views/show-recap?eventId=${selected}` : '/api/custom-views/show-recap';
    fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then((r) => r.json())
      .then((d) => { if (alive) { setRecap(d); setLoading(false); } })
      .catch((e) => { if (alive) { setError(e.message); setLoading(false); } });
    return () => { alive = false; };
  }, [selected]);

  const downloadPdf = () => {
    const token = localStorage.getItem('token');
    const eid = recap?.event?.id || selected || 0;
    const url = `/api/custom-views/show-recap.pdf?eventId=${eid}&token=${encodeURIComponent(token)}`;
    window.open(url, '_blank');
  };

  return (
    <div data-testid="show-recap" style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ margin: 0 }}>Show Recap PDF</h3>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
          >
            <option value="">Latest event</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={downloadPdf} disabled={!recap}>Download PDF</button>
        </div>
      </div>

      {loading && <div className="loading"><div className="spinner" /> Generating recap...</div>}
      {error && <div style={{ color: '#ef4444' }}>Error: {error}</div>}
      {recap && (
        <div>
          <div style={{ background: '#f9fafb', padding: 16, borderRadius: 10, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{recap.sections.title}</div>
            <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.5 }}>{recap.sections.summary}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 12 }}>
            <Metric label="Leads" value={recap.totals.leads.toLocaleString()} color="#6366f1" />
            <Metric label="Pipeline" value={`$${(recap.totals.pipeline/1000).toFixed(0)}K`} color="#10b981" />
            <Metric label="Spend" value={`$${(recap.totals.spend/1000).toFixed(0)}K`} color="#f59e0b" />
            <Metric label="ROI" value={`${recap.roi}%`} color="#ec4899" />
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Highlights</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
              {recap.sections.highlights.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div style={{ background: '#fff', border: `2px solid ${color}22`, borderLeft: `4px solid ${color}`, padding: 12, borderRadius: 10 }}>
      <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{value}</div>
    </div>
  );
}
