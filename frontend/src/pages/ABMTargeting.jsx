import FormattedAIReport from '../components/FormattedAIReport';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';

export default function ABMTargeting() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    event_id: '',
    target_industries: '',
    deal_size_min_usd: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  useEffect(() => { api.getAll('events').then(setEvents).catch(() => setEvents([])); }, []);
  const presets = [
    { label: 'SaaS accounts', values: { target_industries: 'Enterprise software, cybersecurity', deal_size_min_usd: '75000' } },
    { label: 'Manufacturing buyers', values: { target_industries: 'Industrial automation, manufacturing', deal_size_min_usd: '125000' } },
    { label: 'Healthcare outreach', values: { target_industries: 'Healthcare technology, medical devices', deal_size_min_usd: '100000' } },
  ];
  const fillPreset = (values) => setForm((current) => ({ ...current, ...values, event_id: current.event_id || (events[0] ? String(events[0].id) : '') }));


  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError(''); setLoading(true); setResult(null);
    try {
      const industries = form.target_industries
        ? form.target_industries.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;
      const payload = {
        ...(form.event_id ? { event_id: Number(form.event_id) } : {}),
        ...(industries ? { target_industries: industries } : {}),
        ...(form.deal_size_min_usd ? { deal_size_min_usd: Number(form.deal_size_min_usd) } : {}),
      };
      const data = await api.aiPost('abm-targeting', payload);
      setResult(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/ai')}>&larr; Back to AI Center</button>

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🎯</div>
          <div>
            <h2>ABM Targeting</h2>
            <div className="page-header-sub">Identify high-value accounts and outreach sequences from event leads.</div>
          </div>
        </div>
      </div>

      <div className="ai-prompt-box" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
        <div className="ai-preset-bar"><strong>Fill every field</strong><div className="ai-actions">{presets.map((preset) => <button type="button" className="btn btn-secondary" key={preset.label} onClick={() => fillPreset(preset.values)} disabled={loading}>{preset.label}</button>)}</div></div>
        {!form.event_id && !events.length && <p className="ai-muted">No event reference is available; select an existing event when one is available.</p>}
        <select className="ai-prompt-input" aria-label="Event (optional)" value={form.event_id} onChange={(e) => handleChange('event_id', e.target.value)}><option value="">No event selected</option>{events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select>
        <input className="ai-prompt-input" type="text" placeholder="Target Industries (comma-separated)" value={form.target_industries} onChange={(e) => handleChange('target_industries', e.target.value)} />
        <input className="ai-prompt-input" type="number" placeholder="Min Deal Size (USD)" value={form.deal_size_min_usd} onChange={(e) => handleChange('deal_size_min_usd', e.target.value)} />
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Analyzing...' : 'Run ABM Targeting'}
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}

      {result !== null && (
        <div className="ai-result-box" style={{ marginTop: 16 }}>
          <h3>Targeting Recommendations</h3>
          <FormattedAIReport response={result} />
        </div>
      )}
    </div>
  );
}
