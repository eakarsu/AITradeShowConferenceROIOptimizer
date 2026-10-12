import FormattedAIReport from "../components/FormattedAIReport";
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';

export default function PostEventSentiment() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    event_id: '',
    survey_responses: '',
    social_mentions: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  useEffect(() => { api.getAll('events').then(setEvents).catch(() => setEvents([])); }, []);
  const presets = [
    { label: 'Product launch', values: { survey_responses: '["The demo was clear and useful", "I need pricing before deciding"]', social_mentions: '["The launch was engaging", "Long queue at the booth"]' } },
    { label: 'Technical session', values: { survey_responses: '["Strong technical content", "Need more time for questions"]', social_mentions: '["Useful architecture talk", "Slides should be shared"]' } },
    { label: 'Customer forum', values: { survey_responses: '["Good networking", "Follow-up took too long"]', social_mentions: '["Helpful customer stories", "More workshops next year"]' } },
  ];
  const fillPreset = (values) => setForm((current) => ({ ...current, ...values, event_id: current.event_id || (events[0] ? String(events[0].id) : '') }));


  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError(''); setLoading(true); setResult(null);
    try {
      const tryParse = (s) => { try { return s ? JSON.parse(s) : undefined; } catch { return s; } };
      const payload = {
        ...(form.event_id ? { event_id: Number(form.event_id) } : {}),
        survey_responses: tryParse(form.survey_responses),
        social_mentions: tryParse(form.social_mentions),
      };
      const data = await api.aiPost('post-event-sentiment', payload);
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
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #ec4899, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>💬</div>
          <div>
            <h2>Post-Event Sentiment</h2>
            <div className="page-header-sub">Sentiment analysis + close-probability uplift from attendee feedback.</div>
          </div>
        </div>
      </div>

      <div className="ai-prompt-box" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
        <div className="ai-preset-bar"><strong>Fill every field</strong><div className="ai-actions">{presets.map((preset) => <button type="button" className="btn btn-secondary" key={preset.label} onClick={() => fillPreset(preset.values)} disabled={loading}>{preset.label}</button>)}</div></div>
        {!form.event_id && !events.length && <p className="ai-muted">No event reference is available; select an existing event when one is available.</p>}
        <select className="ai-prompt-input" aria-label="Event (optional)" value={form.event_id} onChange={(e) => handleChange('event_id', e.target.value)}><option value="">No event selected</option>{events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select>
        <textarea className="ai-prompt-input" rows={4} placeholder='Survey responses (JSON array or text)' value={form.survey_responses} onChange={(e) => handleChange('survey_responses', e.target.value)} />
        <textarea className="ai-prompt-input" rows={4} placeholder='Social mentions (JSON array or text)' value={form.social_mentions} onChange={(e) => handleChange('social_mentions', e.target.value)} />
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Sentiment'}
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}

      {result !== null && (
        <div className="ai-result-box" style={{ marginTop: 16 }}>
          <h3>Analysis</h3>
          <FormattedAIReport response={result} />
        </div>
      )}
    </div>
  );
}
