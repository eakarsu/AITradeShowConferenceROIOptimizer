import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';

export default function PortfolioOptimizer() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fiscal_year: '',
    total_budget_usd: '',
    strategic_goals: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError(''); setLoading(true); setResult(null);
    try {
      const goals = form.strategic_goals
        ? form.strategic_goals.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
        : undefined;
      const payload = {
        ...(form.fiscal_year ? { fiscal_year: form.fiscal_year } : {}),
        ...(form.total_budget_usd ? { total_budget_usd: Number(form.total_budget_usd) } : {}),
        ...(goals ? { strategic_goals: goals } : {}),
      };
      const data = await api.aiPost('portfolio-optimizer', payload);
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
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #10b981, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📊</div>
          <div>
            <h2>Multi-Event Portfolio Optimizer</h2>
            <div className="page-header-sub">Optimize event spend across the portfolio using past performance and strategic goals.</div>
          </div>
        </div>
      </div>

      <div className="ai-prompt-box" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
        <input className="ai-prompt-input" type="text" placeholder="Fiscal Year (e.g., FY2026)" value={form.fiscal_year} onChange={(e) => handleChange('fiscal_year', e.target.value)} />
        <input className="ai-prompt-input" type="number" placeholder="Total Budget (USD)" value={form.total_budget_usd} onChange={(e) => handleChange('total_budget_usd', e.target.value)} />
        <textarea className="ai-prompt-input" rows={4} placeholder="Strategic Goals (one per line)" value={form.strategic_goals} onChange={(e) => handleChange('strategic_goals', e.target.value)} />
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Optimizing...' : 'Run Portfolio Optimization'}
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}

      {result && (
        <div className="ai-result-box" style={{ marginTop: 16 }}>
          <h3>Portfolio Recommendations</h3>
          {typeof result === 'string' ? <ReactMarkdown>{result}</ReactMarkdown> : (
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}
