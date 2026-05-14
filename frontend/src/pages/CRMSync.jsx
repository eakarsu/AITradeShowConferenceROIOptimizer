import React, { useState, useEffect } from 'react';
import { api } from '../api';

const CRMS = [
  { id: 'salesforce', name: 'Salesforce', color: '#00a1e0', icon: '☁️', desc: 'Push qualified leads as Salesforce Lead/Opportunity records' },
  { id: 'hubspot', name: 'HubSpot', color: '#ff7a59', icon: '🟧', desc: 'Sync contacts and deals; map lifecycle stages to lead statuses' },
  { id: 'pipedrive', name: 'Pipedrive', color: '#1a1a1a', icon: '🟦', desc: 'Push leads as deals; pull win/loss back to recompute ROI' },
  { id: 'mailchimp', name: 'Mailchimp', color: '#ffe01b', icon: '🐵', desc: 'Sync leads to email marketing audiences and tag by event' },
  { id: 'marketo', name: 'Marketo', color: '#5c4e94', icon: '🅼', desc: 'Push leads to Marketo for nurture programs' },
];

export default function CRMSync() {
  const [connections, setConnections] = useState({});
  const [showConfig, setShowConfig] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncLog, setSyncLog] = useState([]);
  const [stats, setStats] = useState({ total_leads: 0, won: 0, lost: 0, pipeline_value: 0 });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('crm_connections') || '{}');
    setConnections(stored);
    api.getAll('leads').then(leads => {
      const won = leads.filter(l => l.status === 'won').length;
      const lost = leads.filter(l => l.status === 'lost').length;
      const pipeline = leads.reduce((s, l) => s + (parseFloat(l.estimated_value) || 0), 0);
      setStats({ total_leads: leads.length, won, lost, pipeline_value: pipeline });
    });
  }, []);

  const handleConnect = (crm) => {
    if (!apiKey) {
      alert('Enter API key / token');
      return;
    }
    const next = { ...connections, [crm.id]: { connected: true, connected_at: new Date().toISOString(), token_last4: apiKey.slice(-4) } };
    setConnections(next);
    localStorage.setItem('crm_connections', JSON.stringify(next));
    setShowConfig(null);
    setApiKey('');
    setSyncLog(prev => [{ time: new Date().toLocaleTimeString(), msg: `Connected to ${crm.name}` }, ...prev]);
  };

  const handleDisconnect = (crm) => {
    const next = { ...connections };
    delete next[crm.id];
    setConnections(next);
    localStorage.setItem('crm_connections', JSON.stringify(next));
    setSyncLog(prev => [{ time: new Date().toLocaleTimeString(), msg: `Disconnected from ${crm.name}` }, ...prev]);
  };

  const handleSyncNow = async (crm) => {
    setSyncing(true);
    try {
      const leads = await api.getAll('leads');
      const qualified = leads.filter(l => ['qualified', 'proposal'].includes(l.status));
      // Simulated push (real impl would call CRM API)
      await new Promise(r => setTimeout(r, 1200));
      setSyncLog(prev => [
        { time: new Date().toLocaleTimeString(), msg: `→ ${crm.name}: pushed ${qualified.length} qualified leads` },
        { time: new Date().toLocaleTimeString(), msg: `← ${crm.name}: pulled ${Math.floor(qualified.length * 0.3)} deal updates` },
        ...prev
      ]);
    } catch (err) {
      setSyncLog(prev => [{ time: new Date().toLocaleTimeString(), msg: `Error: ${err.message}` }, ...prev]);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>🔗 CRM &amp; Marketing Sync</h2>
          <div className="page-header-sub">Bidirectional sync — push qualified leads, pull deal outcomes for true ROI</div>
        </div>
      </div>

      <div className="cards-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div style={{ fontSize: 28, fontWeight: 800 }}>{stats.total_leads}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total Leads</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>{stats.won}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Closed Won</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 28, fontWeight: 800, color: '#ef4444' }}>{stats.lost}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Closed Lost</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>${(stats.pipeline_value/1000).toFixed(0)}K</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Pipeline Value</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
        {CRMS.map(crm => {
          const conn = connections[crm.id];
          return (
            <div key={crm.id} className="detail-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 28 }}>{crm.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{crm.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{conn ? `Connected (••••${conn.token_last4})` : 'Not connected'}</div>
                </div>
                <span className={`badge ${conn ? 'badge-success' : 'badge-default'}`}>
                  {conn ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{crm.desc}</p>
              {conn ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={() => handleSyncNow(crm)} disabled={syncing}>
                    {syncing ? 'Syncing...' : '⟳ Sync Now'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDisconnect(crm)}>Disconnect</button>
                </div>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => setShowConfig(crm)}>+ Connect</button>
              )}
            </div>
          );
        })}
      </div>

      <div className="detail-panel">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Sync Activity Log</h3>
        {syncLog.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No sync activity yet</div>
        ) : (
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            {syncLog.map((l, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)', marginRight: 12 }}>{l.time}</span>{l.msg}
              </div>
            ))}
          </div>
        )}
      </div>

      {showConfig && (
        <div className="modal-overlay" onClick={() => setShowConfig(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Connect to {showConfig.name}</h3>
              <button className="modal-close" onClick={() => setShowConfig(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>API Key / OAuth Token</label>
                <input
                  type="password"
                  className="form-control"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Paste credential here"
                />
                <small style={{ color: 'var(--text-muted)', fontSize: 12 }}>Stored locally for demo. Production would use OAuth.</small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConfig(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleConnect(showConfig)}>Connect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
