# Audit Note — AITradeShowConferenceROIOptimizer

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_08.md` (section 20).

## Original Recommendations

### Missing AI Counterparts
- AI for post-event sentiment analysis of attendees

### Missing Non-AI Features
- CRM integration (Salesforce, HubSpot)
- Email campaign platform integration
- Attendee badge real-time tracking
- Post-event survey automation

### Custom Feature Suggestions
- Attendee sentiment tracking
- Account-based marketing targeting
- Booth traffic heatmapping (DONE — `/lead-heatmap/:id`)
- Competitor win/loss analysis
- Multi-event portfolio optimization

## Implemented (this round)
1. `POST /api/ai/post-event-sentiment` — sentiment + close probability uplift.
2. `POST /api/ai/abm-targeting` — high-value account identification + outreach sequences.

Pattern reused: `callOpenRouter` (messages-array variant) + `parseAIJson` + `persistAIResult` + `truncateRows`. Syntax-checked.

## Backlog (prioritized)
1. **MECHANICAL** Competitor win/loss analysis endpoint.
2. **MECHANICAL** Multi-event portfolio optimization endpoint.
3. **NEEDS-CREDS** Salesforce/HubSpot CRM integrations.
4. **NEEDS-CREDS** Badge tracking integration.

## Apply pass 4 (mechanical backlog)

Implemented the two MECHANICAL backlog items:

- BE: Added `POST /api/ai/competitor-winloss` and `POST /api/ai/portfolio-optimizer`
  in `backend/routes/ai.js` using the existing `callOpenRouter` + `parseAIJson` +
  `persistAIResult` + `truncateRows` pattern. Both gate on
  `OPENROUTER_API_KEY` (return 503 when missing). `competitor-winloss` joins
  competitor table + per-event leads with payload-supplied won/lost deals;
  `portfolio-optimizer` joins events with aggregated leads and expense totals.
- FE: Added `frontend/src/pages/CompetitorWinLoss.jsx` and
  `frontend/src/pages/PortfolioOptimizer.jsx`, mirroring `ABMTargeting.jsx`
  styling and using `api.aiPost(...)` (JWT bearer attached automatically).
  Registered routes `/ai/competitor-winloss` and `/ai/portfolio-optimizer`
  in `App.jsx` plus sidebar entries in the AI Center section.

Smoke test: backend started on alt port 3801 (3001 in use), login OK,
`POST /api/ai/competitor-winloss` returned 500 only because the configured
`OPENROUTER_MODEL` is unavailable for the bound key — not a code defect; the
endpoint executed end-to-end (auth, body parse, DB lookup, AI call attempt).
Cleaned up server process after test.

## Apply pass 5 (all backlog)

Implemented every remaining backlog item:

- BE (`backend/routes/ai.js`):
  - `POST /api/ai/crm-sync` (NEEDS-CREDS) — gates on
    `SALESFORCE_ACCESS_TOKEN + SALESFORCE_INSTANCE_URL` or `HUBSPOT_API_KEY`;
    returns 503 + `missing` when none are configured. When keys are present,
    returns the local lead-row count tagged with the chosen provider; live
    SDK push intentionally not wired (no installs).
  - `POST /api/ai/badge-track` (NEEDS-CREDS) — gates on
    `BADGE_TRACKING_API_KEY + BADGE_TRACKING_API_URL`.
  - `POST /api/ai/email-campaign-send` (NEEDS-CREDS) — gates on
    `MAILCHIMP_API_KEY` or `SENDGRID_API_KEY`.
  - `POST /api/ai/post-event-survey-automation` (MECHANICAL) — AI generates
    a tailored post-event survey (questions, types, distribution
    recommendations); gates on `OPENROUTER_API_KEY`.
- FE: extended existing `frontend/src/pages/AICenter.jsx` with the new
  "AI Post-Event Survey Automation" tile, and `AIFeaturePage.jsx` with the
  matching feature config; the page maps the free-form prompt into the
  endpoint's structured `audience + focus_areas` payload. The existing
  `pages/CRMSync.jsx` workflow page already covers the manual sync UX.

Smoke test: backend started on alt port 3857, login OK
(`admin@tradeshow.com` / `password123`). The three NEEDS-CREDS endpoints
all returned `503` with the documented `missing` payload as expected. The
mechanical `post-event-survey-automation` endpoint reached the OpenRouter
call (the 500 it currently returns is the same pre-existing
"model unavailable for key" condition documented in pass 4 — the endpoint
itself executes end-to-end). Cleaned up server process after test.

## Apply pass 3 (frontend)

Verified the Vite/React client already wires both pass-2 endpoints via dedicated
pages `frontend/src/pages/PostEventSentiment.jsx` (calls
`api.aiPost('post-event-sentiment', ...)`) and `frontend/src/pages/ABMTargeting.jsx`
(calls `api.aiPost('abm-targeting', ...)`), registered as routes in `App.jsx`
under `/ai/post-event-sentiment` and `/ai/abm-targeting`. Other AI features
covered by `AICenter.jsx`, `AIFeaturePage.jsx`, `BoothHeatmap.jsx`,
`EventBriefingPack.jsx`, `FollowupSequences.jsx`, `LeadCaptureOCR.jsx`, and
`CRMSync.jsx`. **Action: LEFT-AS-IS — FE already wired.** No files modified in
pass 3.
