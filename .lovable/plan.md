# Complete the FinScope SaaS upgrade

## Safeguards
Complete the unfinished features incrementally. Preserve the dashboard, navy/gold/white appearance, financial calculations, English report format, existing exports and customer data. No backend migration, destructive reset, payment activation, charges or privileged account assignment without the required explicit approval.

## Current position
Accounts, private uploads, analysis, charts and PDF/Word/Excel exports already exist. Membership records and usage displays, protected roles, saved-report snapshots, reset safeguards, password controls, mobile navigation and a public-only offline foundation are present. Their presence is not proof of end-to-end verification.

The principal unfinished work is administrator management, enforceable usage limits, full report translation, verified subscription payments and deployed Netlify checks. Existing session activity code is present; validate it rather than add a duplicate timer. Offline financial history is deliberately not cached.

## 1. Account protection and administration
- Verify sign-in/out, password change and email recovery with hosted authentication settings and a normal session. Investigate missing-session-ID test tokens without weakening session validation.
- Validate the existing 15-minute inactivity default, warning, Continue Session, actual human activity, multiple tabs and background/mobile resume. Background reads must not extend inactivity. Check expired sessions against protected operations and private uploads.
- Add an administrator-only management page for users, plan/status/expiry, usage, verified payment status and suspension/reactivation. Show no passwords, card details or private financial documents.
- Add audited plan, feature and inactivity configuration. Keep privileged role assignment limited to Super Administrators. Confirm the first Super Administrator account before granting any role; other work can proceed without that grant.
- Keep AI and Integrations hidden without removing their services. Improve reset confirmation to describe the caller's own workspace and preserved reports/chat/membership. Verify cleanup on disposable test information only, with permission; never reset existing customer information as a test.

## 2. Membership and usage enforcement
- Provide configurable Free, Professional and Business / Enterprise allowances and feature access without inventing prices or limits.
- Build atomic server-side reservations and completion/release handling for analyses and report generation, plus company and translation entitlement checks. Retries and concurrent requests must not spend or bypass limits twice.
- Count generating a report separately from downloading an existing completed report; make the policy visible in administration. Reset never restores spent monthly allowance.
- Keep existing accounts unrestricted until an explicit rollout policy and configured plans are approved. Unconfigured paid plans cannot be purchased.
- Where Business team access is enabled, use invitations and explicit company membership; independent customers remain isolated.

## 3. Complete report translation
- Add **Translate Report**, with English, French, Spanish, Portuguese and German selection, selected-language indication and AI-assisted review notice.
- Translate every narrative, line-item explanation, recommendation, investor commentary, ratio interpretation, table heading and chart title/legend/label.
- Use a presentation-only translation layer with immutable financial fields and protected amounts, currency, ratios, dates and company names. Validate completeness and reject changed protected values.
- Preserve the original English report. Offer translated PDF downloads with long-label wrapping and suitable fonts; preserve existing Word/Excel downloads and chart calculations.
- Cache translations by owner, report version and language, respecting configured access.

## 4. Mobile and safe offline completion
- Verify navigation, dashboard, company forms, upload, financial tables, reports, settings and administration on desktop, tablet, Android-size and iPhone-size screens without redesigning the dashboard.
- Validate the existing manifest, icons, generated service worker, offline screen and preview registration exclusions under the PWA guidance.
- Keep authenticated financial responses and uploads out of automatic caches. Downloaded reports remain available in device files; analysis, chat, translation, billing and account changes require internet.
- Add only supported non-sensitive offline preparation/preferences with clear pending state and deduplicated synchronization after authentication. Clear account-scoped pending work on logout. Encrypted, opt-in financial history is a separate verification gate; if secure local protection cannot be established, keep it online-only and state that limitation.

## 5. Payments — separately approved
- The earlier eligibility check recommended Paddle for FinScope SaaS. Confirm the registered seller country and required payment methods before activation; Ghana mobile-money availability is not established.
- Ask for separate confirmation before enabling a test environment. Test payments use no real money; live payments require seller verification and Pro or higher is required for built-in payments.
- Create products only from confirmed prices, then implement checkout, billing portal, upgrades/downgrades, cancellation, renewal and verified billing history.
- Signed, idempotent webhooks/trusted confirmation control paid access, not payment-success URLs. Test duplicate/out-of-order events, failed renewals, refunds and effective-date handling.

## 6. Netlify deployment checkpoint
- Review Nitro output, Netlify routing, environment configuration, OAuth/recovery callbacks and runtime dependencies. Changing frontend hosting does not migrate Lovable Cloud.
- Do not assume managed credentials or AI/agent services transfer to Netlify. Verify a supported hosted-services connection before claiming analysis/chat work there; never request inaccessible Cloud service-role keys.
- If portability is blocked, explain the specific capability and present a separately approved secure hosting or migration option with backup, preserved accounts/files/history, rollback and isolation tests. No migration is authorized by this plan.
- An actual Netlify deployment and GitHub synchronization must be checked using available account access; local configuration alone is not verification.

## Technical approach and verification
Use focused modules for administration, entitlements/usage and translation; retain TanStack server boundaries, protected roles, explicit grants and owner-scoped database/storage policies. Apply additive schema changes only. Keep export rendering browser-only and report styling token-based.

Run focused rule tests for authorization, exact configured allowances, concurrency/idempotency, protected translation values, expiry and reset preservation. Exercise real signed-in flows and two-account isolation. Verify translated PDF downloads and desktop/mobile layouts. Verify payment-provider test flows and deployed offline/Netlify behavior only when their prerequisites are supplied.

## Decisions and external blockers
The questions about the first administrator, seller country and payment methods were skipped; none will be guessed. Administrator controls and entitlement mechanisms can be built before these are supplied, but privileged assignment, payment activation and restriction rollout remain gated. Prices/limits remain configurable and unset. Deployed Netlify verification needs the connected deployment/services access. Report these specific limitations, not a claim that all features are complete.