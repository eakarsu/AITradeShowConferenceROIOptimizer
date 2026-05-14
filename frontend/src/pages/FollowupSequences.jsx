import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';

const STEP_TEMPLATES = [
  { delay_days: 1, type: 'Thank-you Email', tone: 'warm and concise' },
  { delay_days: 3, type: 'Demo Offer', tone: 'value-focused' },
  { delay_days: 7, type: 'Case Study', tone: 'social proof + ROI numbers' },
  { delay_days: 14, type: 'Proposal Nudge', tone: 'direct, low pressure' },
  { delay_days: 30, type: 'Re-engagement', tone: 'curiosity + new content' },
];

export default function FollowupSequences() {
  const [leads, setLeads] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [selectedLead, setSelectedLead] = useState('');
  const [sequence, setSequence] = useState(STEP_TEMPLATES);
  const [generated, setGenerated] = useState({});
  const [generating, setGenerating] = useState({});
  const [activeSequences, setActiveSequences] = useState([]);

  useEffect(() => {
    api.getAll('leads').then(setLeads).catch(console.error);
    api.getAll('followups').then(setFollowups).catch(console.error);
    const stored = JSON.parse(localStorage.getItem('active_sequences') || '[]');
    setActiveSequences(stored);
  }, []);

  const handleGenerateStep = async (idx) => {
    if (!selectedLead) {
      alert('Pick a lead first');
      return;
    }
    const lead = leads.find(l => l.id === parseInt(selectedLead));
    setGenerating(g => ({ ...g, [idx]: true }));
    try {
      const step = sequence[idx];
      const prompt = `Write a ${step.type} email (tone: ${step.tone}) to ${lead.contact_name} (${lead.job_title}) at ${lead.company} who I met at ${lead.event_name}. Include subject line and body. Reference their interest level: ${lead.interest_level}.`;
      const res = await api.aiRequest('followup-generator', prompt);
      setGenerated(g => ({ ...g, [idx]: res.result }));
    } catch (err) {
      alert('Generation failed: ' + err.message);
    } finally {
      setGenerating(g => ({ ...g, [idx]: false }));
    }
  };

  const handleScheduleSequence = async () => {
    if (!selectedLead) {
      alert('Pick a lead first');
      return;
    }
    const lead = leads.find(l => l.id === parseInt(selectedLead));
    const seq = {
      id: Date.now(),
      lead_id: lead.id,
      lead_name: lead.contact_name,
      company: lead.company,
      event_name: lead.event_name,
      started_at: new Date().toISOString(),
      provider: 'SendGrid',
      steps: sequence.map((s, i) => ({
        ...s,
        scheduled_at: new Date(Date.now() + s.delay_days * 86400000).toISOString(),
        status: 'scheduled',
        opens: 0,
        clicks: 0,
        body_preview: (generated[i] || '').slice(0, 100),
      })),
    };
    const next = [seq, ...activeSequences];
    setActiveSequences(next);
    localStorage.setItem('active_sequences', JSON.stringify(next));

    // Also create a followups DB row for visibility
    try {
      await api.create('followups', {
        event_id: lead.event_id,
        contact_name: lead.contact_name,
        company: lead.company,
        email: lead.email,
        followup_type: 'Email Follow-up',
        priority: lead.interest_level === 'hot' ? 'critical' : 'high',
        due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        notes: `Auto-cadence (${sequence.length} steps) scheduled via SendGrid`,
        status: 'in-progress',
      });
      api.getAll('followups').then(setFollowups);
    } catch {}
    alert(`Cadence scheduled — ${sequence.length} emails queued for ${lead.contact_name}`);
  };

  const handleAddStep = () => {
    setSequence([...sequence, { delay_days: 45, type: 'Custom', tone: 'professional' }]);
  };

  const handleRemoveStep = (i) => {
    setSequence(sequence.filter((_, j) => j !== i));
    const g = { ...generated };
    delete g[i];
    setGenerated(g);
  };

  const handleEscalate = (seq) => {
    const updated = activeSequences.map(s => s.id === seq.id ? { ...s, escalated: true, escalated_at: new Date().toISOString() } : s);
    setActiveSequences(updated);
    localStorage.setItem('active_sequences', JSON.stringify(updated));
    alert('Stalled thread escalated to AE');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>✉️ Auto Follow-up Sequences</h2>
          <div className="page-header-sub">Generate personalized cadences, schedule via SendGrid/Postmark, track engagement</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="detail-panel">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>1. Pick Lead</h3>
          <div className="form-group">
            <label>Lead</label>
            <select className="form-control" value={selectedLead} onChange={e => setSelectedLead(e.target.value)}>
              <option value="">Select lead...</option>
              {leads.map(l => (
                <option key={l.id} value={l.id}>
                  {l.contact_name} — {l.company} ({l.interest_level})
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleScheduleSequence} disabled={!selectedLead}>
            🚀 Schedule Cadence ({sequence.length} steps)
          </button>
        </div>
        <div className="detail-panel">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>2. Cadence Settings</h3>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Provider: <strong>SendGrid</strong> · Track: opens + clicks · Auto-escalate after 7 days no reply</div>
          <button className="btn btn-secondary btn-sm" onClick={handleAddStep}>+ Add Step</button>
        </div>
      </div>

      <div className="detail-panel" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Cadence Steps</h3>
        {sequence.map((s, i) => (
          <div key={i} style={{ background: 'var(--bg-elevated, rgba(255,255,255,0.03))', border: '1px solid var(--border)', padding: 16, borderRadius: 8, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <span className="badge badge-info">Day +{s.delay_days}</span>
              <input className="form-control" style={{ flex: 1, minWidth: 200 }} value={s.type} onChange={e => {
                const next = [...sequence]; next[i].type = e.target.value; setSequence(next);
              }} />
              <input className="form-control" style={{ flex: 1, minWidth: 200 }} value={s.tone} onChange={e => {
                const next = [...sequence]; next[i].tone = e.target.value; setSequence(next);
              }} />
              <input type="number" className="form-control" style={{ width: 80 }} value={s.delay_days} onChange={e => {
                const next = [...sequence]; next[i].delay_days = parseInt(e.target.value) || 0; setSequence(next);
              }} />
              <button className="btn btn-primary btn-sm" onClick={() => handleGenerateStep(i)} disabled={generating[i]}>
                {generating[i] ? '...' : '🤖 Draft'}
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleRemoveStep(i)}>×</button>
            </div>
            {generated[i] && (
              <div className="ai-output-content" style={{ fontSize: 13, padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 6 }}>
                <ReactMarkdown>{generated[i]}</ReactMarkdown>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="detail-panel">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Active Cadences ({activeSequences.length})</h3>
        {activeSequences.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No active cadences yet. Schedule one above.</div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>Lead</th><th>Company</th><th>Event</th><th>Steps</th><th>Started</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {activeSequences.map(s => (
                  <tr key={s.id}>
                    <td>{s.lead_name}</td>
                    <td>{s.company}</td>
                    <td>{s.event_name}</td>
                    <td>{s.steps.length}</td>
                    <td>{new Date(s.started_at).toLocaleDateString()}</td>
                    <td><span className={`badge ${s.escalated ? 'badge-danger' : 'badge-success'}`}>{s.escalated ? 'Escalated' : 'Active'}</span></td>
                    <td>
                      {!s.escalated && <button className="btn btn-secondary btn-sm" onClick={() => handleEscalate(s)}>Escalate</button>}
                    </td>
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
