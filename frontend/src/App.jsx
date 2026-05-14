import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ResourcePage from './pages/ResourcePage';
import AICenter from './pages/AICenter';
import AIFeaturePage from './pages/AIFeaturePage';
import LeadCaptureOCR from './pages/LeadCaptureOCR';
import CRMSync from './pages/CRMSync';
import FollowupSequences from './pages/FollowupSequences';
import BoothHeatmap from './pages/BoothHeatmap';
import EventBriefingPack from './pages/EventBriefingPack';
import PostEventSentiment from './pages/PostEventSentiment';
import ABMTargeting from './pages/ABMTargeting';
import CompetitorWinLoss from './pages/CompetitorWinLoss';
import PortfolioOptimizer from './pages/PortfolioOptimizer';
// === Batch 08 Gaps & Frontend Mounts ===
import CfAttendeeSentimentTrackingViaPostEventSurveys from './pages/CfAttendeeSentimentTrackingViaPostEventSurveys'
import CfAccountBasedMarketingTargetingPersonalizingOutreachTo from './pages/CfAccountBasedMarketingTargetingPersonalizingOutreachTo'
import CfRealTimeBoothTrafficHeatmappingForOn from './pages/CfRealTimeBoothTrafficHeatmappingForOn'
import CfCompetitorWinLossAnalysisTiedToShared from './pages/CfCompetitorWinLossAnalysisTiedToShared'
import CfMultiEventPortfolioOptimizationAcrossCalendarYear from './pages/CfMultiEventPortfolioOptimizationAcrossCalendarYear'
import CfBadgeScanIntegrationForLiveLeadIngestion from './pages/CfBadgeScanIntegrationForLiveLeadIngestion'
import GapNoAiPostEventSentimentAnalysisOf from './pages/GapNoAiPostEventSentimentAnalysisOf'
import GapNoAiLeadQualityClustering from './pages/GapNoAiLeadQualityClustering'
import GapNoAiBoothTrafficAnomalyDetection from './pages/GapNoAiBoothTrafficAnomalyDetection'
import GapLimitedCrmIntegrationSingleIntegrationModuleNot from './pages/GapLimitedCrmIntegrationSingleIntegrationModuleNot'
import GapNoEmailCampaignPlatformIntegration from './pages/GapNoEmailCampaignPlatformIntegration'
import GapNoAttendeeBadgeIntegrationForRealTime from './pages/GapNoAttendeeBadgeIntegrationForRealTime'
import GapNoPostEventSurveyAutomation from './pages/GapNoPostEventSurveyAutomation'
import GapNoWebhooks from './pages/GapNoWebhooks'
import GapNoNotificationsSubsystem from './pages/GapNoNotificationsSubsystem'
import GapNoAuditLogging from './pages/GapNoAuditLogging'

const sidebarSections = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/' },
    ]
  },
  {
    title: 'Workflows',
    items: [
      { id: 'lead-capture', label: 'Lead Capture (OCR)', icon: '📸', path: '/workflow/lead-capture' },
      { id: 'crm-sync', label: 'CRM Sync', icon: '🔗', path: '/workflow/crm-sync' },
      { id: 'cadences', label: 'Email Cadences', icon: '✉️', path: '/workflow/cadences' },
      { id: 'heatmap', label: 'Booth Heatmap', icon: '🗺️', path: '/workflow/heatmap' },
      { id: 'briefing', label: 'Event Briefing', icon: '📋', path: '/workflow/briefing' },
    ]
  },
  {
    title: 'Management',
    items: [
      { id: 'events', label: 'Events', icon: '📅', path: '/events' },
      { id: 'booths', label: 'Booths', icon: '🏪', path: '/booths' },
      { id: 'leads', label: 'Leads', icon: '🎯', path: '/leads' },
      { id: 'expenses', label: 'Expenses', icon: '💰', path: '/expenses' },
      { id: 'staff', label: 'Staff', icon: '👥', path: '/staff' },
      { id: 'sponsors', label: 'Sponsors', icon: '🤝', path: '/sponsors' },
      { id: 'materials', label: 'Materials', icon: '📦', path: '/materials' },
      { id: 'competitors', label: 'Competitors', icon: '⚔️', path: '/competitors' },
      { id: 'followups', label: 'Follow-ups', icon: '📧', path: '/followups' },
      { id: 'budgets', label: 'Budgets', icon: '📈', path: '/budgets' },
    ]
  },
  {
    title: 'AI Center',
    items: [
      { id: 'ai-center', label: 'AI Hub', icon: '🤖', path: '/ai' },
      { id: 'ai-roi', label: 'ROI Predictor', icon: '🔮', path: '/ai/roi-predictor' },
      { id: 'ai-leads', label: 'Lead Scorer', icon: '⭐', path: '/ai/lead-scorer' },
      { id: 'ai-budget', label: 'Budget Optimizer', icon: '💎', path: '/ai/budget-optimizer' },
      { id: 'ai-competitor', label: 'Competitor Intel', icon: '🕵️', path: '/ai/competitor-analyzer' },
      { id: 'ai-followup', label: 'Follow-up Writer', icon: '✉️', path: '/ai/followup-generator' },
      { id: 'ai-events', label: 'Event Recommender', icon: '🎪', path: '/ai/event-recommender' },
      { id: 'ai-booth', label: 'Booth Advisor', icon: '🎨', path: '/ai/booth-advisor' },
      { id: 'ai-marketing', label: 'Marketing Copy', icon: '📝', path: '/ai/marketing-copy' },
      { id: 'ai-staff', label: 'Staff Optimizer', icon: '🧩', path: '/ai/staff-optimizer' },
      { id: 'ai-report', label: 'Performance Report', icon: '📋', path: '/ai/performance-reporter' },
      { id: 'ai-sponsor', label: 'Sponsorship Advisor', icon: '💼', path: '/ai/sponsorship-advisor' },
      { id: 'ai-network', label: 'Networking Strategy', icon: '🌐', path: '/ai/networking-strategy' },
      { id: 'ai-sentiment', label: 'Post-Event Sentiment', icon: '💬', path: '/ai/post-event-sentiment' },
      { id: 'ai-abm', label: 'ABM Targeting', icon: '🎯', path: '/ai/abm-targeting' },
      { id: 'ai-winloss', label: 'Competitor Win/Loss', icon: '⚔️', path: '/ai/competitor-winloss' },
      { id: 'ai-portfolio', label: 'Portfolio Optimizer', icon: '📊', path: '/ai/portfolio-optimizer' },
    ]
  }
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>TradeShow ROI</h1>
        <p>AI-Powered Optimizer</p>
      </div>
      {sidebarSections.map(section => (
        <div key={section.title} className="sidebar-section">
          <div className="sidebar-section-title">{section.title}</div>
          {section.items.map(item => (
            <div
              key={item.id}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      ))}
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">{(user.name || 'U')[0]}</div>
        <div className="sidebar-user-info">
          <div className="name">{user.name || 'User'}</div>
          <div className="role">{user.role || 'user'}</div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout} title="Logout">
          ⏻
        </button>
      </div>
    </div>
  );
}

function ProtectedLayout() {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/events" element={<ResourcePage resource="events" title="Events" />} />
          <Route path="/booths" element={<ResourcePage resource="booths" title="Booths" />} />
          <Route path="/leads" element={<ResourcePage resource="leads" title="Leads" />} />
          <Route path="/expenses" element={<ResourcePage resource="expenses" title="Expenses" />} />
          <Route path="/staff" element={<ResourcePage resource="staff" title="Staff" />} />
          <Route path="/sponsors" element={<ResourcePage resource="sponsors" title="Sponsors" />} />
          <Route path="/materials" element={<ResourcePage resource="materials" title="Materials" />} />
          <Route path="/competitors" element={<ResourcePage resource="competitors" title="Competitors" />} />
          <Route path="/followups" element={<ResourcePage resource="followups" title="Follow-ups" />} />
          <Route path="/budgets" element={<ResourcePage resource="budgets" title="Budgets" />} />
          <Route path="/ai" element={<AICenter />} />
          <Route path="/ai/post-event-sentiment" element={<PostEventSentiment />} />
          <Route path="/ai/abm-targeting" element={<ABMTargeting />} />
          <Route path="/ai/competitor-winloss" element={<CompetitorWinLoss />} />
          <Route path="/ai/portfolio-optimizer" element={<PortfolioOptimizer />} />
          <Route path="/ai/:feature" element={<AIFeaturePage />} />
          <Route path="/workflow/lead-capture" element={<LeadCaptureOCR />} />
          <Route path="/workflow/crm-sync" element={<CRMSync />} />
          <Route path="/workflow/cadences" element={<FollowupSequences />} />
          <Route path="/workflow/heatmap" element={<BoothHeatmap />} />
          <Route path="/workflow/briefing" element={<EventBriefingPack />} />
        {/* // === Batch 08 Gaps & Frontend Mounts === */}
      <Route path="/cf-attendee-sentiment-tracking-via-post-event-surveys-to-predict" element={<ProtectedRoute><CfAttendeeSentimentTrackingViaPostEventSurveys /></ProtectedRoute>} />
      <Route path="/cf-account-based-marketing-targeting-personalizing-outreach-to-high-value-attendees" element={<ProtectedRoute><CfAccountBasedMarketingTargetingPersonalizingOutreachTo /></ProtectedRoute>} />
      <Route path="/cf-real-time-booth-traffic-heatmapping-for-on-the-spot-optimization" element={<ProtectedRoute><CfRealTimeBoothTrafficHeatmappingForOn /></ProtectedRoute>} />
      <Route path="/cf-competitor-win-loss-analysis-tied-to-shared-events" element={<ProtectedRoute><CfCompetitorWinLossAnalysisTiedToShared /></ProtectedRoute>} />
      <Route path="/cf-multi-event-portfolio-optimization-across-calendar-year" element={<ProtectedRoute><CfMultiEventPortfolioOptimizationAcrossCalendarYear /></ProtectedRoute>} />
      <Route path="/cf-badge-scan-integration-for-live-lead-ingestion" element={<ProtectedRoute><CfBadgeScanIntegrationForLiveLeadIngestion /></ProtectedRoute>} />
      <Route path="/gap-no-ai-post-event-sentiment-analysis-of-attendees" element={<ProtectedRoute><GapNoAiPostEventSentimentAnalysisOf /></ProtectedRoute>} />
      <Route path="/gap-no-ai-lead-quality-clustering" element={<ProtectedRoute><GapNoAiLeadQualityClustering /></ProtectedRoute>} />
      <Route path="/gap-no-ai-booth-traffic-anomaly-detection" element={<ProtectedRoute><GapNoAiBoothTrafficAnomalyDetection /></ProtectedRoute>} />
      <Route path="/gap-limited-crm-integration-single-integration-module-not-salesforce" element={<ProtectedRoute><GapLimitedCrmIntegrationSingleIntegrationModuleNot /></ProtectedRoute>} />
      <Route path="/gap-no-email-campaign-platform-integration" element={<ProtectedRoute><GapNoEmailCampaignPlatformIntegration /></ProtectedRoute>} />
      <Route path="/gap-no-attendee-badge-integration-for-real-time-tracking" element={<ProtectedRoute><GapNoAttendeeBadgeIntegrationForRealTime /></ProtectedRoute>} />
      <Route path="/gap-no-post-event-survey-automation" element={<ProtectedRoute><GapNoPostEventSurveyAutomation /></ProtectedRoute>} />
      <Route path="/gap-no-webhooks" element={<ProtectedRoute><GapNoWebhooks /></ProtectedRoute>} />
      <Route path="/gap-no-notifications-subsystem" element={<ProtectedRoute><GapNoNotificationsSubsystem /></ProtectedRoute>} />
      <Route path="/gap-no-audit-logging" element={<ProtectedRoute><GapNoAuditLogging /></ProtectedRoute>} />
      </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
