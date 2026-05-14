import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';

export default function CompetitorWinLoss() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    event_id: '',
    deals_won: '',
    deals_lost: '',
    narrative: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const parseList = (raw) => {
    if (!raw || !raw.trim()) return undefined;
    // Try JSON array first
    try {
      const v = JSON.parse(raw);
      if (Array.isArray(v)) return v;
    } catch (_) {}
    // Fallback: comma- or newline-separated strings
    return raw.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
  };

  const handleSubmit = async () => {
    setError(''); setLoading(true); setResult(null);
    try {
      const payload = {
        ...(form.event_id ? { event_id: Number(form.event_id) } : {}),
        ...(form.deals_won ? { deals_won: parseList(form.deals_won) } : {}),
        ...(form.deals_lost ? { deals_lost: parseList(form.deals_lost) } : {}),
        ...(form.narrative ? { narrative: form.narrative } : {}),
      };
      const data = await api.aiPost('competitor-winloss', payload);
      setResult(data.result);
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/ai')}>&larr; Back to AI Center</button>

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #ef4444, #b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>⚔️</div>
          <div>
            <h2>Competitor Win/Loss Analysis</h2>
            <div className="page-header-sub">Compare wins and losses against competitors and generate battle-card recommendations.</div>
          </div>
        </div>
      </div>

      <div className="ai-prompt-box" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
        <input className="ai-prompt-input" type="number" placeholder="Event ID (optional)" value={form.event_id} onChange={(e) => handleChange('event_id', e.target.value)} />
        <textarea className="ai-prompt-input" rows={4} placeholder="Deals Won (one per line, or JSON array of objects)" value={form.deals_won} onChange={(e) => handleChange('deals_won', e.target.value)} />
        <textarea className="ai-prompt-input" rows={4} placeholder="Deals Lost (one per line, or JSON array of objects)" value={form.deals_lost} onChange={(e) => handleChange('deals_lost', e.target.value)} />
        <textarea className="ai-prompt-input" rows={3} placeholder="Narrative / additional context (optional)" value={form.narrative} onChange={(e) => handleChange('narrative', e.target.value)} />
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Analyzing...' : 'Run Win/Loss Analysis'}
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}

      {result && (
        <div className="ai-result-box" style={{ marginTop: 16 }}>
          <h3>Win/Loss Insights</h3>
          {typeof result === 'string' ? <ReactMarkdown>{result}</ReactMarkdown> : (
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}
