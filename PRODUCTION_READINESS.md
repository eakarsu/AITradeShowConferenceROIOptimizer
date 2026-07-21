# Production readiness

The governed API at `/api/governance` is the supported event-ROI reconciliation path. It records tenant-scoped event/budget/system evidence, lead attribution, outcomes, owner review, ROI approval, follow-up receipts, connector failures, an idempotent outbox, immutable attempts, bounded retry scheduling, and dead-letter state. It never writes CRM records or launches campaigns automatically.

## Deployment sequence

1. Review and back up the database, then apply `backend/migrations/001_governed_event_roi.sql` as a separate controlled migration.
2. Copy `.env.example` to `.env`, replace placeholders, and configure a unique 32-plus-character JWT secret and explicit production CORS allowlist.
3. Install locked dependencies explicitly. `start.sh` performs no installation, seeding, database creation, or unrelated process termination.
4. Provision tenant memberships and separately reviewed workers for CRM, badge, finance, marketing, survey, identity, and webhook outbox items. Store credentials in a secret manager and return opaque receipts.

Production rejects legacy provider routes, mock/demo flags, wildcard CORS, weak secrets, and startup schema mutation. Generated AI/CRM-gap routes are quarantined by default.

## Required external validation

Validate source-of-truth ownership, consent, identity resolution, CRM and badge contracts, attribution windows, currency/tax handling, duplicate events, retry exhaustion, dead-letter recovery, and financial reconciliation on versioned fixtures. Finance and event owners retain final ROI approval. No CRM write, badge-provider call, campaign launch, or real-world ROI validation was performed here.
