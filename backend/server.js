const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const auth = require('./middleware/auth');
const { validateRuntime } = require('./governance/runtime');
const { createProviderGate } = require('./governance/providerGate');

validateRuntime();

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;
const allowedOrigins = String(process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',').map((value) => value.trim()).filter(Boolean);
const providerPrefixes = [
  '/api/ai', '/api/attendee-sentiment', '/api/abm-targeting',
  '/api/live-booth-heatmap', '/api/competitor-winloss',
  '/api/portfolio-event-optimizer', '/api/badge-scan-integration', '/api/gap-',
];

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin denied'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/governance', require('./governance/router'));
app.use('/api', auth);
app.use(createProviderGate(providerPrefixes));

const protectedRoutes = [
  ['/api/events', './routes/events'],
  ['/api/booths', './routes/booths'],
  ['/api/leads', './routes/leads'],
  ['/api/expenses', './routes/expenses'],
  ['/api/staff', './routes/staff'],
  ['/api/sponsors', './routes/sponsors'],
  ['/api/materials', './routes/materials'],
  ['/api/competitors', './routes/competitors'],
  ['/api/followups', './routes/followups'],
  ['/api/budgets', './routes/budgets'],
  ['/api/dashboard', './routes/dashboard'],
  ['/api/custom-views', './routes/customViews'],
];
for (const [routePath, modulePath] of protectedRoutes) app.use(routePath, require(modulePath));

if (process.env.ENABLE_LEGACY_PROVIDER_ROUTES === 'true') {
  const legacyRoutes = [
    ['/api/ai', './routes/ai'],
    ['/api/attendee-sentiment', './routes/attendeeSentiment'],
    ['/api/abm-targeting', './routes/abmTargeting'],
    ['/api/live-booth-heatmap', './routes/liveBoothHeatmap'],
    ['/api/competitor-winloss', './routes/competitorWinloss'],
    ['/api/portfolio-event-optimizer', './routes/portfolioEventOptimizer'],
    ['/api/badge-scan-integration', './routes/badgeScanIntegration'],
    ['/api/gap-no-ai-post-event-sentiment-analysis-of-attendees', './routes/gapNoAiPostEventSentimentAnalysisOfAttendees'],
    ['/api/gap-no-ai-lead-quality-clustering', './routes/gapNoAiLeadQualityClustering'],
    ['/api/gap-no-ai-booth-traffic-anomaly-detection', './routes/gapNoAiBoothTrafficAnomalyDetection'],
    ['/api/gap-limited-crm-integration-single-integration-module-not-salesforce', './routes/gapLimitedCrmIntegrationSingleIntegrationModuleNotSalesforce'],
    ['/api/gap-no-email-campaign-platform-integration', './routes/gapNoEmailCampaignPlatformIntegration'],
    ['/api/gap-no-attendee-badge-integration-for-real-time-tracking', './routes/gapNoAttendeeBadgeIntegrationForRealTimeTracking'],
    ['/api/gap-no-post-event-survey-automation', './routes/gapNoPostEventSurveyAutomation'],
    ['/api/gap-no-webhooks', './routes/gapNoWebhooks'],
    ['/api/gap-no-notifications-subsystem', './routes/gapNoNotificationsSubsystem'],
    ['/api/gap-no-audit-logging', './routes/gapNoAuditLogging'],
  ];
  for (const [routePath, modulePath] of legacyRoutes) app.use(routePath, require(modulePath));
}

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));

module.exports = app;
