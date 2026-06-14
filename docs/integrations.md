# Third-Party Integrations

## follow.it (email subscriptions)

- **Account:** `antonio.cumberbatch2@gmail.com`
- **Feed registered:** `https://www.antoniocumberbatch.com/rss.xml`
- **Form action URL:** `https://api.follow.it/subscription-form/ODV6eXovbUxrM0pVemdEMWdkaTlCTDZOREx0aEtPTUR6aEZCMCtJYW8xQUc1aXF5SkxJaWFCVStYL3R2TWt3VXQxVUFJYVRUN1pENHNpWTUrbThqWUpmYVpzR01DNEN1SWtDVVc4WDFZcjJpQnpLVkp3TEljcHg1WjFPaWhpSit8eFIrWjdmbnZQYlNrL1FEWklIOWZUbzQwWWpwbnQ3STdCV0taa2ZPV0NYVT0=/8`
- **Dashboard:** https://follow.it/dashboard
- Subscribers receive email when a new post is published (follow.it polls the RSS feed)

## OneSignal (web push notifications)

- **App ID:** `e7e4cd9f-52cd-4fae-836a-45605b70aaa5`
- **Dashboard:** https://app.onesignal.com
- Requires site verification and push prompt configuration in the dashboard
- SDK loaded on every page; prompt triggered by button on homepage

## PayPal (shop payments)

- Hosted Buttons SDK — button IDs managed in PayPal dashboard
- No server-side code required; PayPal handles the transaction
- `onApprove` callback shows a success state and booking link

## Google Calendar (booking)

- Public booking link: `https://calendar.app.google/hxSqa4yRVmLW5fubA`
- Linked from: contact page sidebar, shop success states (PayPal, Wise, Other tabs)
- Managed via Google Calendar's "Appointment schedule" feature

## Google Analytics

- **Property ID:** `G-B7EJB7Y1HL`
- **Dashboard:** https://analytics.google.com
- Tracking all pages via `gtag` in `BaseLayout.astro`

## n8n (AI chat widget)

- **Instance:** `https://automate.antoniocumberbatch.com`
- **Webhook ID:** `42b76170-0c5b-48b0-9932-78591565a136`
- Chat widget embedded on all pages via jsDelivr CDN
- Workflow in n8n handles chat messages and responses

## Azure Cosmos DB (visit counter)

- **Database:** `AzureResume`
- **Container:** `Counter`
- **Document:** `id = "1"`, `partitionKey = "1"`
- Connection string stored in Azure Functions app settings (not in code)

## Brevo (pending — contact form email)

- Not yet implemented
- Intended use: deliver contact form submissions to `antonio.cumberbatch@arccloudconsulting.com`
- See [pending.md](pending.md) for implementation options
