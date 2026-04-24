import React from 'react';
import { useNavigate } from 'react-router-dom';

const aiFeatures = [
  {
    id: 'roi-predictor',
    name: 'AI ROI Predictor',
    description: 'Predict return on investment for upcoming trade shows using historical data and AI analysis. Get specific percentages and dollar amount forecasts.',
    icon: '🔮',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    category: 'Analytics',
  },
  {
    id: 'lead-scorer',
    name: 'AI Lead Scorer',
    description: 'Score and prioritize leads from 1-100 based on potential value, interest level, and company profile. Focus on the highest-value prospects.',
    icon: '⭐',
    gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
    category: 'Sales',
  },
  {
    id: 'budget-optimizer',
    name: 'AI Budget Optimizer',
    description: 'Analyze spending patterns and get AI recommendations for optimal budget allocation across events, booths, travel, and marketing.',
    icon: '💎',
    gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
    category: 'Finance',
  },
  {
    id: 'competitor-analyzer',
    name: 'AI Competitor Intelligence',
    description: 'Analyze competitor booth strategies, marketing tactics, and market positioning. Get counter-strategy recommendations.',
    icon: '🕵️',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
    category: 'Strategy',
  },
  {
    id: 'followup-generator',
    name: 'AI Follow-up Email Writer',
    description: 'Generate personalized, professional follow-up emails for trade show contacts. Reference specific events and interactions.',
    icon: '✉️',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    category: 'Communication',
  },
  {
    id: 'event-recommender',
    name: 'AI Event Recommender',
    description: 'Get AI recommendations on which events to attend, skip, or increase investment based on historical ROI performance.',
    icon: '🎪',
    gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    category: 'Strategy',
  },
  {
    id: 'booth-advisor',
    name: 'AI Booth Design Advisor',
    description: 'Receive expert recommendations on booth design, layout, placement, and visitor engagement strategies to maximize lead generation.',
    icon: '🎨',
    gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    category: 'Design',
  },
  {
    id: 'marketing-copy',
    name: 'AI Marketing Copy Generator',
    description: 'Generate compelling marketing copy for brochures, banners, email invitations, and social media posts for upcoming events.',
    icon: '📝',
    gradient: 'linear-gradient(135deg, #14b8a6, #06b6d4)',
    category: 'Marketing',
  },
  {
    id: 'staff-optimizer',
    name: 'AI Staff Optimizer',
    description: 'Optimize team allocation across events considering skills, travel costs, expertise, and event importance.',
    icon: '🧩',
    gradient: 'linear-gradient(135deg, #f59e0b, #eab308)',
    category: 'Operations',
  },
  {
    id: 'performance-reporter',
    name: 'AI Performance Reporter',
    description: 'Generate comprehensive executive-level performance reports with KPIs, trends, and strategic recommendations.',
    icon: '📋',
    gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    category: 'Analytics',
  },
  {
    id: 'sponsorship-advisor',
    name: 'AI Sponsorship Advisor',
    description: 'Get strategic advice on sponsorship pricing tiers, benefits packages, and acquisition strategies to maximize sponsor value.',
    icon: '💼',
    gradient: 'linear-gradient(135deg, #84cc16, #22c55e)',
    category: 'Finance',
  },
  {
    id: 'networking-strategy',
    name: 'AI Networking Strategy',
    description: 'Create detailed networking plans including who to target, conversation starters, and relationship-building tactics for events.',
    icon: '🌐',
    gradient: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
    category: 'Networking',
  },
];

export default function AICenter() {
  const navigate = useNavigate();

  const categories = [...new Set(aiFeatures.map(f => f.category))];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>AI Command Center</h2>
          <div className="page-header-sub">12 AI-powered tools to optimize your trade show performance</div>
        </div>
      </div>

      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>{cat}</h3>
          <div className="ai-features-grid">
            {aiFeatures.filter(f => f.category === cat).map(feature => (
              <div
                key={feature.id}
                className="ai-feature-card"
                onClick={() => navigate(`/ai/${feature.id}`)}
              >
                <div className="ai-feature-card-icon" style={{ background: feature.gradient }}>
                  {feature.icon}
                </div>
                <h3>{feature.name}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
