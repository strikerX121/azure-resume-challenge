// WAM card payments for /shop.
//
// Account: the 3 Stripes Technologies WAM BUSINESS account. Not the personal
// WAM account. WAM's own docs put card acceptance, payment links and the
// payment API behind a business account (docs.wam.money: Business Guide >
// Accepting Payments, and Payment Integration > Prerequisites: "Wam Business
// account"). A personal account can share a wallet-to-wallet receive request
// but has no card acceptance.
//
// Why there is no API call here: WAM's API creates a payment intent
// server-side with a secret key and confirms it by signed webhook. This site
// is static, so a key here would be published to every visitor. The safe
// static options are:
//
//   a) a pre-generated payment link per package, created in the WAM Business
//      Portal (Payment Requests), pasted below; or
//   b) the request-a-link flow on /shop, where the visitor emails and a link
//      is issued from the Business Portal for their booking.
//
// (b) is what renders while every entry below is null. WAM documents payment
// requests as carrying a Pending / Paid status, so a single shared link may
// not be reusable across customers; confirm that with one real request before
// pasting a link here.
//
// Only https://wam.money/pay/... URLs are accepted; anything else fails the
// build (validated in src/pages/shop.astro frontmatter).

export const WAM_PAYMENT_LINKS: Record<string, string | null> = {
  'Discovery Call': null,
  'Cloud Readiness Audit': null,
  'AI Workflow Consultation': null,
};

export const WAM_LINK_PATTERN = /^https:\/\/wam\.money\/pay\/[A-Za-z0-9/_-]+$/;
