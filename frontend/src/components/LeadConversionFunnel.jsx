import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function LeadConversionFunnel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    fetch('/api/custom-views/lead-funnel', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then((r) => r.json())
      .then((d) => { if (alive) { setData(d); setLoading(false); } })
      .catch((e) => { if (alive) { setError(e.message); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /> Loading funnel...</div>;
  if (error) return <div style={{ color: '#ef4444' }}>Error: {error}</div>;
  if (!data) return null;

  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div data-testid="lead-funnel" style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Lead Conversion Funnel</h3>
        <span style={{ fontSize: 13, color: '#6b7280' }}>Overall conversion: <strong style={{ color: '#10b981' }}>{data.overallConversionPct}%</strong></span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.stages.map((s, i) => (
          <div key={s.stage} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 130, fontSize: 13, color: '#374151', fontWeight: 500 }}>{s.stage}</div>
            <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 8, height: 28, position: 'relative', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.max(s.pct, 2)}%`,
                  height: '100%',
                  background: colors[i % colors.length],
                  borderRadius: 8,
                  transition: 'width 0.5s',
                  display: 'flex', alignItems: 'center', paddingLeft: 10, color: '#fff', fontWeight: 600, fontSize: 13,
                }}
              >
                {s.count.toLocaleString()}
              </div>
            </div>
            <div style={{ width: 60, fontSize: 12, color: '#6b7280', textAlign: 'right' }}>{s.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
