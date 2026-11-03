# Proposed real contact-form delivery, separate approval required

Status: recommendation only, 2026-11-03. No backend, resource, permission,
DNS change, paid service or send is implemented by the contact-funnel branch.
The current form truthfully opens an email-app draft. Booking, WhatsApp and
selectable email remain available even if the visitor has no mail handler.

## Decision requested

Keep the static site and choose one explicit server-side sending path only
after the existing Function app, runtime, ownership, permissions and cost
boundary are inspected read-only. The counter Function in `api/` is evidence
of source, not proof that a suitable running endpoint or mailbox exists.
Do not revive the retired browser counter or expose its credentials.

1. **Preferred if Antonio approves an existing business mailbox path:** a
   small HTTPS POST handler in the existing, suitable Function app, then
   Microsoft Graph `POST /users/{approved-mailbox}/sendMail`. Send from the
   approved ARC mailbox to a fixed approved business recipient. Use a
   managed identity or a server-only credential, and narrowly scoped Exchange
   application access/RBAC to that mailbox. `Mail.Send` and tenant/admin
   approval, the mailbox's eligibility/licensing, and the ability to constrain
   application access must be proven first. Do not assume existing Graph
   consent. Visitor email is Reply-To only, never a spoofed From address.
   A provider `202 Accepted` is acceptance for processing, not delivery proof.
2. **Alternative only with resource/spend approval:** Function POST handler
   to Azure Communication Services Email using an approved sender domain,
   then a fixed recipient. Confirm resource provisioning, consumption charges,
   sender/domain verification, SPF/DKIM and DNS ownership before choosing it.
   This is not a zero-cost assumption and does not fit the present no-new-
   resources approval.
3. **If neither path is approved:** retain the honest draft and direct-contact
   options. A Teams incoming workflow could notify a team but is not an email
   delivery replacement; it needs its own named owner, permission, retention
   and failure-handling approval. No browser-side transactional API keys.

## Required request and abuse controls

- POST JSON only, strict content type and small body limit, for example 16 KiB.
  Allowlisted subject values and server-side required-field/type/length
  validation: name 1-120, email max 254, message 1-5000 characters. Confirm
  these proposed limits with Antonio. Support ordinary Unicode names.
- Reject CR/LF in all header-bound values, parse and validate email addresses,
  keep recipient/sender/subject routing under server control, encode all text
  in the chosen email template. No attachments or arbitrary URLs fetched by
  the server. Never treat client validation as security.
- Honeypot plus timestamp as low-friction signals, not a security boundary.
  Server-enforced rate limits with shared/atomic storage when scaled out,
  bounded per-source and global quotas, retry caps and monitoring for abuse.
  Identify the existing suitable storage/gateway before approval; a process-
  local in-memory limiter cannot protect multiple Function instances. No new
  datastore or paid CAPTCHA is implicitly approved.
- Same-origin routing if already feasible, otherwise exact allowed-origin
  CORS and Origin checks. These are supplemental controls, not bot prevention.
  No permissive wildcard or public Function secret in the browser.
- Short-lived deduplication/idempotency for retries; disable duplicate submit
  while pending; bounded upstream timeout and backoff without duplicate sends.
- HTTPS, server-only secrets/identity, least privilege, dependency scanning,
  redacted structured operational logs, no message/email/name in analytics or
  query strings. Confirm who can read logs and delete retained data.

## Visitor consent and honest state

Present a concise collection notice next to submit: the named recipient,
purpose (reply to this enquiry), chosen processor/path and retention. Link
/privacy and get Antonio's approval for updated policy and deletion/contact
process. Do not bundle marketing consent; newsletter signup stays separate.
Do not promise delivery from an accepted/queued provider response. Distinguish
validation error, rate limited, sending, accepted for processing and failure.
Keep entered text on recoverable failures and always retain direct contact.
Record any later submit intent once after valid submission, respecting GPC/DNT
and existing opt-outs. Do not label an intent or provider acceptance a lead.

## Approval checklist before implementation

- [ ] Antonio chooses mailbox/recipient, sender and email vs notification path.
- [ ] Cloud owner verifies existing Function host/runtime/route and safe identity.
- [ ] Tenant/mail owner approves the minimum Graph/Exchange access, or explicitly
      approves ACS resources, domain work and a bounded budget.
- [ ] Agree on abuse-control storage, limits, retention and privacy wording.
- [ ] Approve an isolated test recipient and nonproduction send tests. No real
      enquiries or production analytics events during automated testing.
- [ ] Test malformed/oversized input, header injection, replay/duplicates,
      rate limits across instances, provider timeout/rejection and retry UX.
- [ ] Parent reviews code and test evidence before any merge. `main` auto-
      deploys; backend deploy and configuration require separate approval.

## Primary references checked read-only

- Microsoft Graph `user: sendMail`, permissions, HTTP 202 semantics:
  https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0
- Azure Communication Services Email overview, sender domains and usage-based
  service: https://learn.microsoft.com/en-us/azure/communication-services/concepts/email/email-overview
- OWASP Input Validation Cheat Sheet, server-side validation and allowlists:
  https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html

Read-only text evidence is saved outside git in the audit artifact directory:
`graph-sendmail.txt`, `acs-email.txt`, `owasp-validation.txt`. No configuration
or send operation was used to inspect these documents.
