// /shop packages. Prices are NOT typed here: they are resolved at build time
// from src/data/pricing.snapshot.json, which scripts/sync-pricing.mjs
// generates from the ARC pricing playbook (arc-client-os/references/
// pricing-and-playbook.md). See that script for the full pipeline.
//
// Resolution order for each package:
//   1. A fixed price for this exact title in the playbook's optional
//      "## Website Packages" table.
//   2. Otherwise, if the package has `hours`, Antonio's playbook hourly rate
//      multiplied by those hours.
//   3. Otherwise the package is quote-only: no Pay Now button, a quote link
//      instead. Nothing on this page invents a number the playbook lacks.

import snapshot from './pricing.snapshot.json';

export interface ShopPackageDef {
  title: string;
  /** Billable time, used only when the playbook has no fixed price. */
  hours?: number;
  duration: string;
  desc: string;
  includes: string[];
  featured: boolean;
}

export interface PricedPackage extends ShopPackageDef {
  /** null when the playbook gives no basis for a price. */
  price: null | {
    ttd: number;
    usd: number;
    /** The currency the playbook sets the price in; the other figure is derived. */
    primary: 'USD' | 'TTD';
    /** How the figure was obtained, kept for the build log and the page source. */
    basis: string;
  };
}

const DEFS: ShopPackageDef[] = [
  {
    title: 'Discovery Call',
    hours: 1,
    duration: '60 minutes',
    desc: 'Strategy session covering cloud architecture, AI automation, or custom software. Walk away with a clear action plan.',
    includes: ['60-min video call', 'Written action plan', 'Resource recommendations', 'Follow-up email'],
    featured: false,
  },
  {
    title: 'Cloud Readiness Audit',
    duration: '5-7 business days',
    desc: 'Full Azure environment review with a written report and prioritised recommendations. Know exactly where you stand and what to fix.',
    includes: ['Azure environment assessment', 'Security posture review', 'Written report (PDF)', 'Priority recommendations', '30-min debrief call'],
    featured: true,
  },
  {
    title: 'AI Workflow Consultation',
    hours: 1.5,
    duration: '90 minutes',
    desc: 'Deep dive into automating a specific business process with n8n, GPT-4, or custom integrations. We map the workflow, identify the tools, and outline the build.',
    includes: ['90-min working session', 'Workflow diagram', 'Tool recommendations', 'Build estimate'],
    featured: false,
  },
];

type Snapshot = {
  antonioRateTTDPerHour: number;
  usdToTtd: number;
  packages: Record<string, { currency: 'USD' | 'TTD'; amount: number }>;
  sourceSha256: string;
  syncedAt: string;
};

const snap = snapshot as unknown as Snapshot;

function resolve(def: ShopPackageDef): PricedPackage {
  const fixed = snap.packages?.[def.title];
  if (fixed) {
    const usd = fixed.currency === 'USD' ? fixed.amount : Math.round(fixed.amount / snap.usdToTtd);
    const ttd = fixed.currency === 'TTD' ? fixed.amount : Math.round(fixed.amount * snap.usdToTtd);
    return { ...def, price: { usd, ttd, primary: fixed.currency, basis: `playbook fixed price (${fixed.currency} ${fixed.amount})` } };
  }
  if (def.hours) {
    const ttd = Math.round(def.hours * snap.antonioRateTTDPerHour);
    const usd = Math.round(ttd / snap.usdToTtd);
    return { ...def, price: { usd, ttd, primary: 'TTD', basis: `playbook hourly rate TTD ${snap.antonioRateTTDPerHour} x ${def.hours}h, USD at ${snap.usdToTtd}` } };
  }
  return { ...def, price: null };
}

export const SHOP_PACKAGES: PricedPackage[] = DEFS.map(resolve);
export const PRICING_SOURCE = { sha: snap.sourceSha256.slice(0, 12), syncedAt: snap.syncedAt };
