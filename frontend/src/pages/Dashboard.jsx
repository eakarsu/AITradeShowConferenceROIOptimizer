import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /> Loading dashboard...</div>;
  if (!stats) return <div className="loading">Failed to load dashboard</div>;

  const cards = [
    { label: 'Total Events', value: stats.events.total, icon: '📅', color: 'var(--gradient-primary)', change: `${stats.events.upcoming} upcoming`, path: '/events' },
    { label: 'Total Leads', value: stats.leads.total, icon: '🎯', color: 'var(--gradient-secondary)', change: `$${(stats.leads.total_value/1000).toFixed(0)}K pipeline`, path: '/leads' },
    { label: 'Total Expenses', value: `$${(stats.expenses.total_spent/1000).toFixed(0)}K`, icon: '💰', color: 'var(--gradient-accent)', change: 'All events combined', path: '/expenses' },
    { label: 'Overall ROI', value: `${stats.roi}%`, icon: '📈', color: 'var(--gradient-success)', change: 'Based on lead value vs spend', path: '/budgets' },
    { label: 'Active Staff', value: stats.staff.total, icon: '👥', color: 'var(--gradient-primary)', change: 'Assigned to events', path: '/staff' },
    { label: 'Active Booths', value: stats.booths.total, icon: '🏪', color: 'var(--gradient-secondary)', change: 'Across all events', path: '/booths' },
    { label: 'Sponsorship Revenue', value: `$${(stats.sponsors.total_sponsorship/1000).toFixed(0)}K`, icon: '🤝', color: 'var(--gradient-accent)', change: 'Total secured', path: '/sponsors' },
    { label: 'Completed Events', value: stats.events.completed, icon: '✅', color: 'var(--gradient-success)', change: 'With full analytics', path: '/events' },
  ];

  const aiQuickActions = [
    { label: 'Capture Lead (OCR)', desc: 'Snap a card → auto-create lead', icon: '📸', path: '/workflow/lead-capture' },
    { label: 'CRM Sync', desc: 'Push qualified leads, pull deals', icon: '🔗', path: '/workflow/crm-sync' },
    { label: 'Email Cadences', desc: 'Schedule auto-followups', icon: '✉️', path: '/workflow/cadences' },
    { label: 'Booth Heatmap', desc: 'Floor-plan foot traffic', icon: '🗺️', path: '/workflow/heatmap' },
    { label: 'Event Briefing', desc: 'T-24h pre-event AI pack', icon: '📋', path: '/workflow/briefing' },
    { label: 'Predict ROI', desc: 'AI-powered ROI forecasting', icon: '🔮', path: '/ai/roi-predictor' },
    { label: 'Score Leads', desc: 'Prioritize your best leads', icon: '⭐', path: '/ai/lead-scorer' },
    { label: 'Optimize Budget', desc: 'Smart budget allocation', icon: '💎', path: '/ai/budget-optimizer' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <div className="page-header-sub">AI Trade Show & Conference ROI Overview</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/ai')}>
          🤖 AI Center
        </button>
      </div>

      <div className="cards-grid" style={{ marginBottom: 24 }}>
        {cards.map((card, i) => (
          <div key={i} className="stat-card" onClick={() => navigate(card.path)}>
            <div className="stat-card-header">
              <span className="stat-card-label">{card.label}</span>
              <div className="stat-card-icon" style={{ background: card.color }}>{card.icon}</div>
            </div>
            <div className="stat-card-value">{card.value}</div>
            <div className="stat-card-change">{card.change}</div>
          </div>
        ))}
      </div>

      <div className="page-header" style={{ marginTop: 8 }}>
        <div>
          <h2 style={{ fontSize: 18 }}>AI Quick Actions</h2>
          <div className="page-header-sub">Powered by Claude AI via OpenRouter</div>
        </div>
      </div>

      <div className="cards-grid">
        {aiQuickActions.map((action, i) => (
          <div key={i} className="ai-feature-card" onClick={() => navigate(action.path)}>
            <div className="ai-feature-card-icon" style={{ background: 'var(--gradient-primary)' }}>
              {action.icon}
            </div>
            <h3>{action.label}</h3>
            <p>{action.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
