// Internal linking map — single source of truth for blog -> case study and
// blog -> capability hub links, so the related-links module in BlogPost.astro
// stays in lockstep with the case studies it points at.
//
// Mapping follows the internal-linking plan in the 2026-10-01 discoverability
// audit: engineering/Azure posts were link dead ends, and the proof pages they
// describe were getting no internal link equity from them.

export interface InternalLink {
  href: string;
  label: string;
  blurb: string;
}

export const CASE_STUDIES: Record<string, InternalLink> = {
  sassi: {
    href: '/work/sassi',
    label: 'SASSI Logistics Platform',
    blurb: 'WhatsApp, spreadsheets and phone calls replaced by a full-stack Azure platform serving 200+ active users.',
  },
  threeStripes: {
    href: '/work/3-stripes-tech',
    label: '3 Stripes Tech EMR',
    blurb: "The Caribbean's first regional cloud EMR — 11 doctors, 7,000+ patient records, near-paperless.",
  },
  esvd: {
    href: '/work/esvd-dashboard',
    label: 'Enterprise Apps Masterview',
    blurb: 'One operations dashboard that replaced Azure Portal, Google Sheets, expense email chains and the Toggl UI.',
  },
  qualitech: {
    href: '/work/qualitech',
    label: 'QT Digital — Qualitech',
    blurb: 'Seven isolated spreadsheets consolidated into one database, with automation across five departments.',
  },
  wiman: {
    href: '/work/wiman-dlp',
    label: 'Wiman — Microsoft 365 Identity & Endpoints',
    blurb: 'SAML 2.0 identity federation, Intune endpoint management and licensing architecture.',
  },
};

export const CAPABILITIES_LINK: InternalLink = {
  href: '/capabilities',
  label: 'AI Operations Architecture',
  blurb: 'AI consulting and business process automation for teams still running on spreadsheets, email and WhatsApp.',
};

// Post slug -> the proof pages that post should feed.
export const POST_LINKS: Record<string, InternalLink[]> = {
  'azure-front-door-dropped-our-server-load-from-95-to-35-percent': [CASE_STUDIES.threeStripes],
  'client-side-pagination-kills-app-performance': [CASE_STUDIES.threeStripes],
  'how-we-built-a-logistics-platform-on-azure': [CASE_STUDIES.sassi],
  'enterprise-ops-dashboard-replaced-six-tools': [CASE_STUDIES.esvd, CAPABILITIES_LINK],
  'azure-cost-management-api-for-developers': [CASE_STUDIES.esvd],
  'rbac-nextjs-cosmosdb-not-jwts': [CASE_STUDIES.esvd],
  'automate-data-not-spreadsheets': [CASE_STUDIES.qualitech, CAPABILITIES_LINK],
  'three-microsoft-365-problems-small-businesses-miss': [CASE_STUDIES.wiman],
  'build-to-be-recommended-not-found': [CAPABILITIES_LINK],
  '2019-visibility-strategy-2026-world': [CAPABILITIES_LINK],
};

export function postSlug(post: { id?: string; slug?: string }): string {
  return (post.slug ?? post.id ?? '').replace(/\.mdx?$/, '');
}

export function linksForPost(slug: string): InternalLink[] {
  return POST_LINKS[slug] ?? [];
}

/**
 * Pick related posts for a given post: same category first, then shared tags,
 * then most recent, never including the post itself. Returns at most `limit`.
 */
export function relatedPosts<
  T extends { id?: string; slug?: string; data: { category: string; tags?: string[]; pubDate: Date } }
>(current: T, all: T[], limit = 3): T[] {
  const currentTags = new Set(current.data.tags ?? []);
  const currentSlug = postSlug(current);

  const scored = all
    .filter((p) => postSlug(p) !== currentSlug)
    .map((p) => {
      let score = 0;
      if (p.data.category === current.data.category) score += 3;
      for (const tag of p.data.tags ?? []) {
        if (currentTags.has(tag)) score += 1;
      }
      return { post: p, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.post.data.pubDate.valueOf() - a.post.data.pubDate.valueOf();
    });

  return scored.slice(0, limit).map((s) => s.post);
}
