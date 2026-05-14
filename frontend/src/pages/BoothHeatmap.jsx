import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';

export default function BoothHeatmap() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [floorPlan, setFloorPlan] = useState('');
  const [booths, setBooths] = useState([]);
  const [scans, setScans] = useState([]);
  const [selectedHour, setSelectedHour] = useState('all');
  const [showAddBooth, setShowAddBooth] = useState(false);
  const [pendingBooth, setPendingBooth] = useState(null);
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const fileRef = useRef(null);
  const planRef = useRef(null);

  useEffect(() => {
    api.getAll('events').then(setEvents).catch(console.error);
  }, []);

  useEffect(() => {
    if (!eventId) {
      setBooths([]);
      setScans([]);
      return;
    }
    const stored = JSON.parse(localStorage.getItem(`heatmap_${eventId}`) || '{}');
    setFloorPlan(stored.floorPlan || '');
    setBooths(stored.booths || []);
    setScans(stored.scans || []);
  }, [eventId]);

  const persist = (next) => {
    localStorage.setItem(`heatmap_${eventId}`, JSON.stringify(next));
  };

  const handleUploadPlan = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      const data = ev.target.result;
      setFloorPlan(data);
      const next = { floorPlan: data, booths, scans };
      persist(next);
    };
    r.readAsDataURL(f);
  };

  const handlePlanClick = (e) => {
    if (!floorPlan) return;
    const rect = planRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingBooth({ x, y });
    setShowAddBooth(true);
  };

  const handleAddBooth = (form) => {
    const b = { id: Date.now(), ...pendingBooth, ...form };
    const next = [...booths, b];
    setBooths(next);
    persist({ floorPlan, booths: next, scans });
    setPendingBooth(null);
    setShowAddBooth(false);
  };

  const handleScan = (boothId) => {
    const hour = parseInt(prompt('Hour of day (0-23)?', new Date().getHours().toString())) || 12;
    const dwell = parseInt(prompt('Dwell time (seconds)?', '120')) || 120;
    const scan = { id: Date.now(), booth_id: boothId, hour, dwell, timestamp: new Date().toISOString() };
    const next = [...scans, scan];
    setScans(next);
    persist({ floorPlan, booths, scans: next });
  };

  const filteredScans = selectedHour === 'all' ? scans : scans.filter(s => s.hour === parseInt(selectedHour));
  const heatmapData = booths.map(b => {
    const boothScans = filteredScans.filter(s => s.booth_id === b.id);
    return {
      ...b,
      count: boothScans.length,
      avg_dwell: boothScans.length ? Math.round(boothScans.reduce((a, s) => a + s.dwell, 0) / boothScans.length) : 0,
    };
  });
  const maxCount = Math.max(1, ...heatmapData.map(h => h.count));

  const handleAIInsight = async () => {
    setAiLoading(true);
    try {
      const summary = heatmapData.map(b => `${b.label}: ${b.count} scans, ${b.avg_dwell}s dwell`).join('; ');
      const prompt = `Booth foot-traffic data: ${summary}. Identify the high/low performers, dead zones, and recommend booth placement / engagement changes for next event.`;
      const res = await api.aiRequest('booth-advisor', prompt);
      setAiInsight(res.result);
    } catch (err) {
      alert('AI analysis failed: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>🗺️ Floor-Plan &amp; Booth Heatmap</h2>
          <div className="page-header-sub">Upload floor plan → place booths → log scans → see foot-traffic heatmap by hour</div>
        </div>
      </div>

      <div className="detail-panel" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
            <label>Event</label>
            <select className="form-control" value={eventId} onChange={e => setEventId(e.target.value)}>
              <option value="">Select event...</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Filter by Hour</label>
            <select className="form-control" value={selectedHour} onChange={e => setSelectedHour(e.target.value)}>
              <option value="all">All Hours</option>
              {Array.from({ length: 24 }).map((_, i) => <option key={i} value={i}>{i}:00</option>)}
            </select>
          </div>
          <input type="file" accept="image/*" ref={fileRef} onChange={handleUploadPlan} style={{ display: 'none' }} />
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()} disabled={!eventId}>
            📐 Upload Floor Plan
          </button>
          <button className="btn btn-primary" onClick={handleAIInsight} disabled={!booths.length || aiLoading}>
            {aiLoading ? 'Analyzing...' : '🤖 AI Insights'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div className="detail-panel" style={{ padding: 0, overflow: 'hidden' }}>
          {!floorPlan ? (
            <div style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              {eventId ? 'Upload a floor plan to begin' : 'Pick an event to start'}
            </div>
          ) : (
            <div style={{ position: 'relative', cursor: 'crosshair' }} ref={planRef} onClick={handlePlanClick}>
              <img src={floorPlan} alt="floor plan" style={{ width: '100%', display: 'block' }} />
              {heatmapData.map(b => {
                const intensity = maxCount ? b.count / maxCount : 0;
                const size = 30 + intensity * 60;
                return (
                  <div key={b.id} style={{
                    position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, transform: 'translate(-50%, -50%)',
                    width: size, height: size, borderRadius: '50%',
                    background: `radial-gradient(circle, rgba(239,68,68,${0.3 + intensity * 0.5}) 0%, rgba(239,68,68,0) 70%)`,
                    pointerEvents: 'none',
                  }} />
                );
              })}
              {heatmapData.map(b => (
                <div key={`pin_${b.id}`} style={{
                  position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, transform: 'translate(-50%, -50%)',
                  background: '#0f172a', color: '#fff', padding: '4px 8px', borderRadius: 6, fontSize: 11,
                  border: '2px solid #6366f1', cursor: 'pointer', whiteSpace: 'nowrap',
                }} onClick={(e) => { e.stopPropagation(); handleScan(b.id); }}>
                  {b.label} · {b.count}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="detail-panel" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Booth Performance</h3>
            {heatmapData.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Click on the floor plan to place booths</div>
            ) : (
              <div>
                {heatmapData.sort((a, b) => b.count - a.count).map(b => (
                  <div key={b.id} style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 13 }}>{b.label}</strong>
                      <span className="badge badge-info">{b.count} scans</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      Avg dwell {b.avg_dwell}s · Conv: {b.count ? Math.round(b.avg_dwell / 6) : 0}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {aiInsight && (
            <div className="detail-panel">
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🤖 AI Recommendations</h3>
              <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{aiInsight}</div>
            </div>
          )}
        </div>
      </div>

      {showAddBooth && (
        <BoothModal onSave={handleAddBooth} onClose={() => { setShowAddBooth(false); setPendingBooth(null); }} />
      )}
    </div>
  );
}

function BoothModal({ onSave, onClose }) {
  const [form, setForm] = useState({ label: '', size: '10x10', booth_type: 'Inline' });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Place Booth</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Label / Number</label>
            <input className="form-control" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Size</label>
            <input className="form-control" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select className="form-control" value={form.booth_type} onChange={e => setForm({ ...form, booth_type: e.target.value })}>
              <option>Inline</option><option>Corner</option><option>Peninsula</option><option>Island</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => form.label && onSave(form)}>Place</button>
        </div>
      </div>
    </div>
  );
}
