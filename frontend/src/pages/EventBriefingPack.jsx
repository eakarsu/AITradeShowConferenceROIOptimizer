import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';

export default function EventBriefingPack() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(false);
  const [scheduled, setScheduled] = useState([]);
  const [staff, setStaff] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [budgets, setBudgets] = useState([]);

  useEffect(() => {
    api.getAll('events').then(setEvents);
    const stored = JSON.parse(localStorage.getItem('briefing_jobs') || '[]');
    setScheduled(stored);
  }, []);

  useEffect(() => {
    if (!eventId) return;
    api.getAll('staff').then(d => setStaff(d.filter(s => s.event_id === parseInt(eventId))));
    api.getAll('competitors').then(d => setCompetitors(d.filter(c => c.event_id === parseInt(eventId))));
    api.getAll('budgets').then(d => setBudgets(d.filter(b => b.event_id === parseInt(eventId))));
  }, [eventId]);

  const ev = events.find(e => e.id === parseInt(eventId));

  const handleGenerate = async () => {
    if (!ev) return;
    setLoading(true);
    setBriefing('');
    try {
      const ctx = `
Event: ${ev.name} on ${ev.start_date} at ${ev.location} (${ev.venue}). Expected attendees: ${ev.expected_attendees}.
Assigned staff: ${staff.map(s => `${s.name} (${s.role})`).join(', ') || 'none'}.
Known competitors at event: ${competitors.map(c => `${c.company_name} (booth ${c.booth_location}, threat ${c.threat_level})`).join('; ') || 'none'}.
Budget items: ${budgets.map(b => `${b.category}: $${b.planned_amount}`).join(', ') || 'none'}.
Generate a comprehensive 24h pre-event briefing pack including: (1) Executive overview, (2) Target attendee profiles & ICP talking points, (3) Competitive landscape summary, (4) Daily booth schedule with staff assignments, (5) Budget guardrails & spending limits, (6) Top 10 action items.`.trim();
      const res = await api.aiRequest('performance-reporter', ctx);
      setBriefing(res.result);
    } catch (err) {
      alert('Generation failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = () => {
    if (!ev) return;
    const job = {
      id: Date.now(),
      event_id: ev.id,
      event_name: ev.name,
      run_at: new Date(new Date(ev.start_date).getTime() - 24 * 3600 * 1000).toISOString(),
      recipients: staff.map(s => s.email).filter(Boolean),
      status: 'scheduled',
      cron: 'daily check, 24h before event start',
    };
    const next = [job, ...scheduled];
    setScheduled(next);
    localStorage.setItem('briefing_jobs', JSON.stringify(next));
    alert(`Briefing scheduled to auto-generate 24h before ${ev.name} and email ${job.recipients.length} staff`);
  };

  const handleDownloadPDF = () => {
    if (!briefing) return;
    const blob = new Blob([`# Event Briefing — ${ev.name}\n\nGenerated ${new Date().toLocaleString()}\n\n${briefing}`], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `briefing_${ev.name.replace(/\s+/g, '_')}.md`;
    a.click();
  };

  const handleEmailNow = () => {
    const recips = staff.map(s => s.email).filter(Boolean);
    alert(`Demo: would email briefing to ${recips.length} recipients via SMTP/SendGrid: ${recips.join(', ')}`);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>📋 AI Event Briefing Pack</h2>
          <div className="page-header-sub">24h before each event, auto-generate &amp; email a tactical briefing to all assigned staff</div>
        </div>
      </div>

      <div className="detail-panel" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 240, marginBottom: 0 }}>
            <label>Upcoming Event</label>
            <select className="form-control" value={eventId} onChange={e => setEventId(e.target.value)}>
              <option value="">Select event...</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.name} — {new Date(e.start_date).toLocaleDateString()}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={!eventId || loading}>
            {loading ? 'Generating...' : '🤖 Generate Now'}
          </button>
          <button className="btn btn-secondary" onClick={handleSchedule} disabled={!eventId}>
            ⏰ Schedule Auto (T-24h)
          </button>
        </div>
        {ev && (
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, fontSize: 13 }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Staff:</span> <strong>{staff.length}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Competitors tracked:</span> <strong>{competitors.length}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Budget items:</span> <strong>{budgets.length}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Days until:</span> <strong>{Math.max(0, Math.ceil((new Date(ev.start_date) - Date.now()) / 86400000))}</strong></div>
          </div>
        )}
      </div>

      {briefing && (
        <div className="ai-output-container" style={{ marginBottom: 24 }}>
          <div className="ai-output-header">
            <span className="ai-output-badge">Briefing Pack</span>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={handleDownloadPDF}>⬇️ Download</button>
              <button className="btn btn-primary btn-sm" onClick={handleEmailNow}>📧 Email to Staff</button>
            </span>
          </div>
          <div className="ai-output-content">
            <ReactMarkdown>{briefing}</ReactMarkdown>
          </div>
        </div>
      )}

      <div className="detail-panel">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Scheduled Briefing Jobs</h3>
        {scheduled.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No scheduled briefings. Pick an event and click "Schedule Auto".</div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>Event</th><th>Run At (T-24h)</th><th>Recipients</th><th>Status</th></tr></thead>
              <tbody>
                {scheduled.map(j => (
                  <tr key={j.id}>
                    <td>{j.event_name}</td>
                    <td>{new Date(j.run_at).toLocaleString()}</td>
                    <td>{j.recipients.length}</td>
                    <td><span className="badge badge-info">{j.status}</span></td>
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
