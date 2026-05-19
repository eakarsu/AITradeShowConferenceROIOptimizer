const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/booths', require('./routes/booths'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/sponsors', require('./routes/sponsors'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/competitors', require('./routes/competitors'));
app.use('/api/followups', require('./routes/followups'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/custom-views', require('./routes/customViews'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.use('/api/attendee-sentiment', require('./routes/attendeeSentiment')); app.use('/api/abm-targeting', require('./routes/abmTargeting')); app.use('/api/live-booth-heatmap', require('./routes/liveBoothHeatmap')); app.use('/api/competitor-winloss', require('./routes/competitorWinloss')); app.use('/api/portfolio-event-optimizer', require('./routes/portfolioEventOptimizer')); app.use('/api/badge-scan-integration', require('./routes/badgeScanIntegration'));

// === Batch 08 Gaps & Frontend Mounts ===
app.use('/api/gap-no-ai-post-event-sentiment-analysis-of-attendees', require('./routes/gapNoAiPostEventSentimentAnalysisOfAttendees'));
app.use('/api/gap-no-ai-lead-quality-clustering', require('./routes/gapNoAiLeadQualityClustering'));
app.use('/api/gap-no-ai-booth-traffic-anomaly-detection', require('./routes/gapNoAiBoothTrafficAnomalyDetection'));
app.use('/api/gap-limited-crm-integration-single-integration-module-not-salesforce', require('./routes/gapLimitedCrmIntegrationSingleIntegrationModuleNotSalesforce'));
app.use('/api/gap-no-email-campaign-platform-integration', require('./routes/gapNoEmailCampaignPlatformIntegration'));
app.use('/api/gap-no-attendee-badge-integration-for-real-time-tracking', require('./routes/gapNoAttendeeBadgeIntegrationForRealTimeTracking'));
app.use('/api/gap-no-post-event-survey-automation', require('./routes/gapNoPostEventSurveyAutomation'));
app.use('/api/gap-no-webhooks', require('./routes/gapNoWebhooks'));
app.use('/api/gap-no-notifications-subsystem', require('./routes/gapNoNotificationsSubsystem'));
app.use('/api/gap-no-audit-logging', require('./routes/gapNoAuditLogging'));

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
