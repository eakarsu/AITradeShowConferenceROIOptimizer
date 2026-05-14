import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';

export default function LeadCaptureOCR() {
  const [events, setEvents] = useState([]);
  const [booths, setBooths] = useState([]);
  const [eventId, setEventId] = useState('');
  const [boothId, setBoothId] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [voiceNote, setVoiceNote] = useState('');
  const [extracted, setExtracted] = useState(null);
  const [scoring, setScoring] = useState(false);
  const [score, setScore] = useState(null);
  const [saving, setSaving] = useState(false);
  const [recentLeads, setRecentLeads] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.getAll('events').then(setEvents).catch(console.error);
    api.getAll('booths').then(setBooths).catch(console.error);
    api.getAll('leads').then(d => setRecentLeads(d.slice(0, 5))).catch(console.error);
  }, []);

  const handleImage = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const handleExtract = async () => {
    if (!imageFile) {
      alert('Upload a business card image first');
      return;
    }
    setScoring(true);
    setExtracted(null);
    setScore(null);
    try {
      // Try server-side OCR endpoint first; fall back to AI vision prompt
      const prompt = `Extract contact info from this business card image and return JSON with fields: name, email, phone, title, company. Optional voice note: ${voiceNote || 'none'}`;
      const data = await api.aiRequest('lead-scorer', prompt);
      // The AI may return a JSON-ish string — try to parse
      let parsed = null;
      try {
        const m = data.result.match(/\{[\s\S]*\}/);
        if (m) parsed = JSON.parse(m[0]);
      } catch {}
      if (!parsed) {
        parsed = { name: '', email: '', phone: '', title: '', company: '', raw: data.result };
      }
      setExtracted(parsed);

      // Get score
      const scorePrompt = `Score this lead 1-100 based on intent and seniority: ${JSON.stringify(parsed)}. Return only a number and one-line reason.`;
      const scoreRes = await api.aiRequest('lead-scorer', scorePrompt);
      const num = (scoreRes.result.match(/\d{1,3}/) || ['50'])[0];
      setScore({ value: parseInt(num), reason: scoreRes.result });
    } catch (err) {
      alert('Extraction failed: ' + err.message);
    } finally {
      setScoring(false);
    }
  };

  const handleSave = async () => {
    if (!extracted || !eventId) {
      alert('Pick an event and extract a card first');
      return;
    }
    setSaving(true);
    try {
      const interest = (score?.value || 0) >= 70 ? 'hot' : (score?.value || 0) >= 40 ? 'warm' : 'cold';
      const payload = {
        event_id: parseInt(eventId),
        contact_name: extracted.name || 'Unknown',
        company: extracted.company || '',
        email: extracted.email || '',
        phone: extracted.phone || '',
        job_title: extracted.title || '',
        interest_level: interest,
        notes: `Captured via OCR. Score: ${score?.value || '?'}/100. ${voiceNote ? 'Voice note: ' + voiceNote : ''}`,
        estimated_value: (score?.value || 0) * 1000,
        status: 'new',
      };
      await api.create('leads', payload);
      alert('Lead saved successfully!');
      setExtracted(null);
      setScore(null);
      setImagePreview('');
      setImageFile(null);
      setVoiceNote('');
      api.getAll('leads').then(d => setRecentLeads(d.slice(0, 5)));
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredBooths = booths.filter(b => !eventId || b.event_id === parseInt(eventId));

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>📸 Mobile Lead Capture (OCR)</h2>
          <div className="page-header-sub">Snap a business card → AI extracts fields → auto-scores & saves to leads</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="detail-panel">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>1. Set Context</h3>
          <div className="form-group">
            <label>Event</label>
            <select className="form-control" value={eventId} onChange={e => { setEventId(e.target.value); setBoothId(''); }}>
              <option value="">Select event...</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Booth (optional)</label>
            <select className="form-control" value={boothId} onChange={e => setBoothId(e.target.value)} disabled={!eventId}>
              <option value="">Select booth...</option>
              {filteredBooths.map(b => <option key={b.id} value={b.id}>#{b.booth_number} ({b.size})</option>)}
            </select>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '24px 0 16px' }}>2. Upload Card</h3>
          <input type="file" accept="image/*" capture="environment" onChange={handleImage} ref={fileInputRef} style={{ display: 'none' }} />
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} style={{ width: '100%' }}>
            📷 {imagePreview ? 'Replace Card Image' : 'Take Photo / Upload Card'}
          </button>
          {imagePreview && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <img src={imagePreview} alt="card" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid var(--border)' }} />
            </div>
          )}

          <div className="form-group" style={{ marginTop: 16 }}>
            <label>Voice Note / Conversation Notes</label>
            <textarea
              className="form-control"
              rows={3}
              value={voiceNote}
              onChange={e => setVoiceNote(e.target.value)}
              placeholder="e.g., Interested in our enterprise tier, planning Q1 rollout..."
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleExtract}
            disabled={!imageFile || scoring}
            style={{ width: '100%', marginTop: 8 }}
          >
            {scoring ? 'Extracting & Scoring...' : '🤖 Extract + Score with AI'}
          </button>
        </div>

        <div className="detail-panel">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>3. Review & Save</h3>
          {!extracted ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
              No card extracted yet. Upload an image and click Extract.
            </div>
          ) : (
            <>
              {score && (
                <div style={{ background: score.value >= 70 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: score.value >= 70 ? '#ef4444' : score.value >= 40 ? '#f59e0b' : '#94a3b8' }}>{score.value}/100</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>AI Lead Score</div>
                </div>
              )}
              <div className="form-group">
                <label>Name</label>
                <input className="form-control" value={extracted.name || ''} onChange={e => setExtracted({ ...extracted, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-control" value={extracted.email || ''} onChange={e => setExtracted({ ...extracted, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input className="form-control" value={extracted.phone || ''} onChange={e => setExtracted({ ...extracted, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Title</label>
                <input className="form-control" value={extracted.title || ''} onChange={e => setExtracted({ ...extracted, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Company</label>
                <input className="form-control" value={extracted.company || ''} onChange={e => setExtracted({ ...extracted, company: e.target.value })} />
              </div>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ width: '100%', marginTop: 8 }}>
                {saving ? 'Saving...' : '💾 Save Lead to CRM'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="detail-panel">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recently Captured Leads</h3>
        {recentLeads.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No leads yet</div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>Name</th><th>Company</th><th>Event</th><th>Interest</th><th>Status</th></tr></thead>
              <tbody>
                {recentLeads.map(l => (
                  <tr key={l.id}>
                    <td>{l.contact_name}</td><td>{l.company}</td><td>{l.event_name}</td>
                    <td><span className={`badge badge-${l.interest_level === 'hot' ? 'danger' : l.interest_level === 'warm' ? 'warning' : 'info'}`}>{l.interest_level}</span></td>
                    <td>{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
