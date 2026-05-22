import React, { useEffect, useState } from 'react';

export default function EventRoiHeatmap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    fetch('/api/custom-views/roi-heatmap', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then((r) => r.json())
      .then((d) => { if (alive) { setData(d); setLoading(false); } })
      .catch((e) => { if (alive) { setError(e.message); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /> Loading heatmap...</div>;
  if (error) return <div style={{ color: '#ef4444' }}>Error: {error}</div>;
  if (!data) return null;

  const colorFor = (v) => {
    const t = Math.max(0, Math.min(100, v)) / 100;
    // green-blue gradient based on intensity
    const r = Math.round(239 - t * 180);
    const g = Math.round(246 - t * 60);
    const b = Math.round(255 - t * 100);
    return `rgb(${r},${g},${b})`;
  };
  const textColor = (v) => (v > 55 ? '#ffffff' : '#111827');

  return (
    <div data-testid="roi-heatmap" style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Event ROI Heatmap (Event × KPI)</h3>
        <span style={{ fontSize: 13, color: '#6b7280' }}>{data.events.length} events · {data.kpis.length} KPIs</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 4 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 12, color: '#6b7280' }}>Event</th>
              {data.kpis.map((k) => (
                <th key={k} style={{ padding: '6px 10px', fontSize: 12, color: '#6b7280' }}>{k}</th>
              ))}
              <th style={{ padding: '6px 10px', fontSize: 12, color: '#6b7280' }}>Avg</th>
            </tr>
          </thead>
          <tbody>
            {data.events.map((e) => (
              <tr key={e.eventId}>
                <td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 500, color: '#111827', whiteSpace: 'nowrap' }}>{e.eventName}</td>
                {e.scores.map((s, idx) => (
                  <td key={idx} style={{
                    padding: '12px 14px', textAlign: 'center', borderRadius: 6,
                    background: colorFor(s), color: textColor(s), fontWeight: 600, fontSize: 13, minWidth: 64,
                  }}>{s.toFixed(1)}</td>
                ))}
                <td style={{ padding: '12px 14px', textAlign: 'center', background: '#f3f4f6', borderRadius: 6, fontWeight: 700, fontSize: 13 }}>{e.average.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6b7280' }}>
        <span>Low</span>
        <div style={{ width: 200, height: 10, borderRadius: 5, background: 'linear-gradient(to right, rgb(239,246,255), rgb(59,130,155))' }} />
        <span>High</span>
      </div>
    </div>
  );
}
