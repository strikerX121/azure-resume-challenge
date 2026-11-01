// 3 Stripes Technologies automation catalogue, public edition.
//
// Source: the 3ST team's cross-project n8n flow catalogue (25 October 2026), held in
// the vault under Businesses/3 Stripes Technologies/Source Evidence/
// Automation Catalog/. That document names clients, staff, sheets and
// credentials. NONE of that belongs here. Every entry below is rewritten
// generically: what the flow does and for what kind of team, never who.
//
// Deliberately left out of the public edition:
//   - client names, staff names, sheet names, bank names, endpoints
//   - credential and security notes from the catalogue's review section
//   - per-flow active/inactive status (it reflects an export, not production)
//   - the flow whose main feature is pacing bulk promotional messages
//
// scripts/check-content-policy.mjs fails the build if any known client or
// staff identifier from the source catalogue reaches the built site.

export interface ShowcaseFlow {
  title: string;
  forWho: string;
  what: string;
  trigger: string;
  stack: string[];
}

export interface ShowcaseCategory {
  id: string;
  label: string;
  intro: string;
  flows: ShowcaseFlow[];
}

export const CATALOGUE_STATS = {
  workflows: 21,
  categories: 5,
  // Credit is to the team, not a named individual (Antonio, 2026-11-01).
  // check-content-policy.mjs fails the build if an individual name returns.
  compiledBy: 'our team at 3 Stripes Technologies',
  compiled: 'October 2026',
};

export const SHOWCASE: ShowcaseCategory[] = [
  {
    id: 'sales',
    label: 'Sales and quotations',
    intro: 'Quotes that go quiet are revenue that goes quiet. These flows keep every open quote moving without a rep having to remember it.',
    flows: [
      {
        title: 'Quotation follow-up sequence',
        forWho: 'A B2B sales team with several reps and departments',
        what: 'Picks up approved quotations from each rep\'s pipeline and sends up to three personalised follow-ups on a set cadence, threaded in the original conversation. Quotes marked on hold, cancelled or lost are skipped. The third follow-up hands the account to the sales lead.',
        trigger: 'Weekly schedule per rep',
        stack: ['n8n', 'Gmail', 'Google Sheets', 'OpenAI', 'Supabase'],
      },
      {
        title: 'Quotation reply triage',
        forWho: 'The same sales team, on the inbound side',
        what: 'Catches customer replies to quote follow-ups, classifies the reply, drafts a response in the same thread, logs the outcome and alerts the sales lead with the quote number and status.',
        trigger: 'New email',
        stack: ['n8n', 'Gmail', 'Google Sheets', 'OpenAI', 'Supabase'],
      },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing, social and lead generation',
    intro: 'Campaigns run from a sheet the marketing team already understands. The automation does the sending, threading and bookkeeping.',
    flows: [
      {
        title: 'Personalised campaign emails',
        forWho: 'A distributor marketing to local and regional customer lists',
        what: 'When a campaign row is switched on, writes a personalised email for each contact, attaches campaign imagery, sends to the right list and records every send.',
        trigger: 'Campaign row updated',
        stack: ['n8n', 'Google Sheets', 'Google Drive', 'OpenAI', 'Gmail'],
      },
      {
        title: 'Campaign follow-up and interest detection',
        forWho: 'The same marketing team',
        what: 'Follows up in-thread with contacts who did not reply, reads the replies that do come in, detects genuine interest and responds while copying the marketing officer.',
        trigger: 'Schedule and new email',
        stack: ['n8n', 'Gmail', 'Google Sheets', 'OpenAI'],
      },
      {
        title: 'Scheduled LinkedIn and Instagram publishing',
        forWho: 'Any team planning social content in a spreadsheet',
        what: 'Publishes posts at their scheduled time, as text, a single image or an Instagram carousel, pulling images from Drive and marking each row done.',
        trigger: 'Daily and hourly schedules',
        stack: ['n8n', 'LinkedIn', 'Meta Graph API', 'Cloudinary', 'Google Drive'],
      },
      {
        title: 'Decision-maker lead enrichment',
        forWho: 'A B2B team working a target account list',
        what: 'Takes a list of organisations, finds the decision-makers and their business email addresses through enrichment services, and writes clean contacts back to the list.',
        trigger: 'On demand',
        stack: ['n8n', 'Apollo.io', 'Hunter.io', 'Apify', 'Google Sheets'],
      },
    ],
  },
  {
    id: 'messaging',
    label: 'Customer messaging',
    intro: 'Short, timely messages on the channel customers actually read, generated from the calendar or tracker the business already keeps.',
    flows: [
      {
        title: 'Appointment reminders',
        forWho: 'Clinics and fitness studios',
        what: 'Reads the day\'s calendar, recognises which events are real appointments or classes, and sends each customer a short WhatsApp reminder.',
        trigger: 'Daily schedule',
        stack: ['n8n', 'Google Calendar', 'OpenAI', 'WhatsApp'],
      },
      {
        title: 'Shipment status updates',
        forWho: 'Courier and freight operators',
        what: 'When a shipment\'s status changes in the tracker, writes a plain-language update and messages the customer, so nobody has to call to ask where their package is.',
        trigger: 'Tracker row changed',
        stack: ['n8n', 'Google Sheets', 'OpenAI', 'WhatsApp'],
      },
      {
        title: 'App-triggered parcel notifications',
        forWho: 'A logistics platform with its own customer app',
        what: 'The application calls the workflow, which messages every affected customer and records the delivery result of each message for audit.',
        trigger: 'Webhook from the application',
        stack: ['n8n', 'WhatsApp', 'MongoDB', 'OpenAI'],
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance and document processing',
    intro: 'Documents arrive as PDFs and attachments. These flows turn them into rows someone can actually reconcile.',
    flows: [
      {
        title: 'Invoice and payslip parser',
        forWho: 'A small business tracking contractor invoices',
        what: 'Collects invoice PDFs from shared folders and email attachments, extracts the figures with AI, writes them to an expense tracker and files each document by month.',
        trigger: 'Daily schedule',
        stack: ['n8n', 'Google Drive', 'Gmail', 'OpenAI', 'Google Sheets'],
      },
      {
        title: 'Payment reminders',
        forWho: 'Small and medium businesses with outstanding invoices',
        what: 'Finds invoices still pending payment and sends each one a professional, specific reminder.',
        trigger: 'On demand',
        stack: ['n8n', 'Google Sheets', 'OpenAI', 'Gmail'],
      },
      {
        title: 'Bank statement categorisation',
        forWho: 'Anyone reconciling statements by hand',
        what: 'Reads PDF or Excel statements as they land in a folder, extracts each transaction with a category, and appends them to a running ledger.',
        trigger: 'New file in folder',
        stack: ['n8n', 'Google Drive', 'OpenAI', 'Google Sheets'],
      },
      {
        title: 'Paper patient file digitisation',
        forWho: 'A medical practice moving off paper records',
        what: 'Runs scanned patient files through OCR and layout extraction, has AI organise the result into structured fields, and writes it to a sheet ready for import into an EMR.',
        trigger: 'On demand',
        stack: ['n8n', 'Azure AI Document Intelligence', 'OpenAI', 'Google Sheets'],
      },
      {
        title: 'Automatic payment receipts',
        forWho: 'A business taking payments through hosted payment links',
        what: 'When a checkout completes, writes and sends the customer a receipt email, so confirmations never depend on someone remembering.',
        trigger: 'Payment provider webhook',
        stack: ['n8n', 'Stripe', 'OpenAI', 'Outlook'],
      },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    intro: 'Support requests that start as a chat and end as a ticket someone owns.',
    flows: [
      {
        title: 'Chat-to-ticket IT support assistant',
        forWho: 'An operations team with an internal IT queue',
        what: 'A chat assistant takes the user\'s issue, including screenshots, creates a ticket on the team\'s board or shows the status of existing ones.',
        trigger: 'Chat message',
        stack: ['n8n', 'OpenAI agent', 'Trello'],
      },
    ],
  },
];

export interface IdeaGroup {
  business: string;
  ideas: { title: string; replaces: string }[];
}

// Potential automations for other businesses. Each idea is a pattern the
// catalogue above has already proven in some form, re-aimed at a new sector.
export const IDEAS: IdeaGroup[] = [
  {
    business: 'Clinics and healthcare practices',
    ideas: [
      { title: 'Appointment reminders and confirmations', replaces: 'Reception calling every patient the day before' },
      { title: 'Paper file digitisation into structured records', replaces: 'Retyping old files into a new system' },
      { title: 'Intake forms that land directly in the right record', replaces: 'Clipboards and re-entry' },
    ],
  },
  {
    business: 'Sales-led and distribution businesses',
    ideas: [
      { title: 'Quote follow-up on a fixed cadence', replaces: 'Quotes that quietly expire' },
      { title: 'Reply triage that alerts the right person', replaces: 'Hot replies sitting in a shared inbox' },
      { title: 'Lead enrichment from a target account list', replaces: 'Hours of manual prospect research' },
    ],
  },
  {
    business: 'Logistics, couriers and retail',
    ideas: [
      { title: 'Proactive status updates to customers', replaces: '"Where is my package?" calls' },
      { title: 'Order and delivery notifications from your system', replaces: 'Staff copying updates into chats' },
      { title: 'Receipts and confirmations on every payment', replaces: 'Manual confirmation emails' },
    ],
  },
  {
    business: 'Finance, admin and professional services',
    ideas: [
      { title: 'Invoice and statement extraction into a ledger', replaces: 'Copying figures out of PDFs' },
      { title: 'Polite, specific payment reminders', replaces: 'Awkward chase-up emails written from scratch' },
      { title: 'Chat-to-ticket support intake', replaces: 'Requests lost in email and messaging threads' },
    ],
  },
];
