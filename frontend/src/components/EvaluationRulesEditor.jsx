import React, { useEffect, useState } from 'react';

const auth = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function EvaluationRulesEditor() {
  const [rules, setRules] = useState([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({ name: '', weight: 10, threshold: 0, description: '' });

  const load = () => {
    setLoading(true);
    fetch('/api/custom-views/rules', { headers: auth() })
      .then((r) => r.json())
      .then((d) => { setRules(d.rules || []); setTotalWeight(d.totalWeight || 0); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const addRule = async () => {
    if (!draft.name.trim()) return;
    setError('');
    try {
      const res = await fetch('/api/custom-views/rules', { method: 'POST', headers: auth(), body: JSON.stringify(draft) });
      if (!res.ok) throw new Error((await res.json()).error || 'Create failed');
      setDraft({ name: '', weight: 10, threshold: 0, description: '' });
      load();
    } catch (e) { setError(e.message); }
  };

  const updateRule = async (rule) => {
    setError('');
    try {
      const res = await fetch(`/api/custom-views/rules/${rule.id}`, { method: 'PUT', headers: auth(), body: JSON.stringify(rule) });
      if (!res.ok) throw new Error((await res.json()).error || 'Update failed');
      load();
    } catch (e) { setError(e.message); }
  };

  const removeRule = async (id) => {
    setError('');
    try {
      const res = await fetch(`/api/custom-views/rules/${id}`, { method: 'DELETE', headers: auth() });
      if (!res.ok) throw new Error((await res.json()).error || 'Delete failed');
      load();
    } catch (e) { setError(e.message); }
  };

  const setField = (id, field, value) => {
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  return (
    <div data-testid="rules-editor" style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Event Evaluation Rules</h3>
        <span style={{ fontSize: 13, color: totalWeight === 100 ? '#10b981' : '#f59e0b' }}>
          Total weight: <strong>{totalWeight}</strong> {totalWeight === 100 ? '✓' : '(target 100)'}
        </span>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: 10, fontSize: 13 }}>{error}</div>}
      {loading ? <div className="loading"><div className="spinner" /> Loading rules...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rules.map((r) => (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 110px 3fr auto auto', gap: 8, alignItems: 'center', padding: 10, background: '#f9fafb', borderRadius: 8 }}>
              <input value={r.name} onChange={(e) => setField(r.id, 'name', e.target.value)} style={inputStyle} placeholder="Criterion name" />
              <input type="number" value={r.weight} onChange={(e) => setField(r.id, 'weight', Number(e.target.value))} style={inputStyle} placeholder="Wt" />
              <input type="number" value={r.threshold} onChange={(e) => setField(r.id, 'threshold', Number(e.target.value))} style={inputStyle} placeholder="Threshold" />
              <input value={r.description || ''} onChange={(e) => setField(r.id, 'description', e.target.value)} style={inputStyle} placeholder="Description" />
              <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => updateRule(r)}>Save</button>
              <button style={{ ...btnDanger }} onClick={() => removeRule(r.id)}>Delete</button>
            </div>
          ))}
          {rules.length === 0 && <div style={{ color: '#6b7280', fontSize: 13, padding: 20, textAlign: 'center' }}>No scoring criteria defined yet.</div>}
        </div>
      )}

      <div style={{ marginTop: 18, padding: 14, border: '1px dashed #d1d5db', borderRadius: 10 }}>
        <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Add new criterion</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 110px 3fr auto', gap: 8 }}>
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={inputStyle} placeholder="e.g. Demo Requests" />
          <input type="number" value={draft.weight} onChange={(e) => setDraft({ ...draft, weight: Number(e.target.value) })} style={inputStyle} placeholder="Weight" />
          <input type="number" value={draft.threshold} onChange={(e) => setDraft({ ...draft, threshold: Number(e.target.value) })} style={inputStyle} placeholder="Threshold" />
          <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} style={inputStyle} placeholder="Optional description" />
          <button className="btn btn-primary" style={{ padding: '6px 14px' }} onClick={addRule}>Add</button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13,
  background: '#fff',
};
const btnDanger = {
  padding: '6px 12px', fontSize: 12, background: '#fee2e2', color: '#b91c1c',
  border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer',
};
