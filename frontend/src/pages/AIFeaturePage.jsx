import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';

const featureInfo = {
  'roi-predictor': { name: 'AI ROI Predictor', icon: '🔮', placeholder: 'e.g., Predict ROI for CES 2026 based on our historical performance...', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  'lead-scorer': { name: 'AI Lead Scorer', icon: '⭐', placeholder: 'e.g., Score and rank all leads from Hannover Messe by conversion potential...', gradient: 'linear-gradient(135deg, #f59e0b, #f97316)' },
  'budget-optimizer': { name: 'AI Budget Optimizer', icon: '💎', placeholder: 'e.g., How should we reallocate our Q1 2026 budget to maximize ROI?', gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4)' },
  'competitor-analyzer': { name: 'AI Competitor Intelligence', icon: '🕵️', placeholder: 'e.g., Analyze RivalTech and CompeteCorp strategies and suggest counter-measures...', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
  'followup-generator': { name: 'AI Follow-up Email Writer', icon: '✉️', placeholder: 'e.g., Write follow-up emails for our top qualified leads from Dreamforce...', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
  'event-recommender': { name: 'AI Event Recommender', icon: '🎪', placeholder: 'e.g., Which events should we prioritize for 2026 based on lead quality?', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
  'booth-advisor': { name: 'AI Booth Design Advisor', icon: '🎨', placeholder: 'e.g., How can we improve our booth layout to generate more leads at CES?', gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)' },
  'marketing-copy': { name: 'AI Marketing Copy Generator', icon: '📝', placeholder: 'e.g., Write engaging copy for our CES 2026 pre-event email invitation...', gradient: 'linear-gradient(135deg, #14b8a6, #06b6d4)' },
  'staff-optimizer': { name: 'AI Staff Optimizer', icon: '🧩', placeholder: 'e.g., Optimize staff assignments across our Q1 2026 events...', gradient: 'linear-gradient(135deg, #f59e0b, #eab308)' },
  'performance-reporter': { name: 'AI Performance Reporter', icon: '📋', placeholder: 'e.g., Generate an executive summary of all 2025 trade show performance...', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
  'sponsorship-advisor': { name: 'AI Sponsorship Advisor', icon: '💼', placeholder: 'e.g., How should we structure sponsorship tiers for maximum revenue?', gradient: 'linear-gradient(135deg, #84cc16, #22c55e)' },
  'networking-strategy': { name: 'AI Networking Strategy', icon: '🌐', placeholder: 'e.g., Create a networking plan for our top 10 prospects at MWC 2026...', gradient: 'linear-gradient(135deg, #0ea5e9, #6366f1)' },
};

export default function AIFeaturePage() {
  const { feature } = useParams();
  const navigate = useNavigate();
  const info = featureInfo[feature] || { name: 'AI Feature', icon: '🤖', placeholder: 'Enter your prompt...', gradient: 'var(--gradient-primary)' };
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await api.aiRequest(feature, prompt || undefined);
      setResult(data.result);
      setHistory(prev => [{ prompt: prompt || '(default analysis)', result: data.result, time: new Date().toLocaleTimeString() }, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/ai')}>← Back to AI Center</button>

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: info.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28
          }}>
            {info.icon}
          </div>
          <div>
            <h2>{info.name}</h2>
            <div className="page-header-sub">Powered by Claude AI via OpenRouter</div>
          </div>
        </div>
      </div>

      <div className="ai-prompt-box">
        <input
          type="text"
          className="ai-prompt-input"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder={info.placeholder}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {loading && (
        <div className="ai-loading">
          <div className="ai-loading-dots">
            <span></span><span></span><span></span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>AI is analyzing your data...</div>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ color: '#f87171', fontWeight: 600, marginBottom: 4 }}>Error</div>
          <div style={{ color: '#fca5a5', fontSize: 13 }}>{error}</div>
        </div>
      )}

      {result && (
        <div className="ai-output-container">
          <div className="ai-output-header">
            <span className="ai-output-badge">AI Response</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{info.name}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {new Date().toLocaleTimeString()}
            </span>
          </div>
          <div className="ai-output-content">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}

      {history.length > 1 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>Previous Analyses</h3>
          {history.slice(1).map((h, i) => (
            <div key={i} className="ai-output-container" style={{ marginBottom: 16, opacity: 0.7 }}>
              <div className="ai-output-header">
                <span className="ai-output-badge">AI Response</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Prompt: {h.prompt}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>{h.time}</span>
              </div>
              <div className="ai-output-content">
                <ReactMarkdown>{h.result}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
