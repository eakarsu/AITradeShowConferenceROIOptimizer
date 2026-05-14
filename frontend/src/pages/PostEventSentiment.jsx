import React, { useState } from 'react';
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
        <input className="ai-prompt-input" type="number" placeholder="Event ID (optional)" value={form.event_id} onChange={(e) => handleChange('event_id', e.target.value)} />
        <textarea className="ai-prompt-input" rows={4} placeholder='Survey responses (JSON array or text)' value={form.survey_responses} onChange={(e) => handleChange('survey_responses', e.target.value)} />
        <textarea className="ai-prompt-input" rows={4} placeholder='Social mentions (JSON array or text)' value={form.social_mentions} onChange={(e) => handleChange('social_mentions', e.target.value)} />
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Sentiment'}
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}

      {result && (
        <div className="ai-result-box" style={{ marginTop: 16 }}>
          <h3>Analysis</h3>
          {typeof result === 'string' ? <ReactMarkdown>{result}</ReactMarkdown> : (
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}
