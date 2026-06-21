---
title: "Azure Cost Management for Developers: Building Live Cost Dashboards Without PowerBI"
description: "Azure's built-in cost views are fine if you're a finance person. For a developer-operator managing multiple tenants, they're noise. Here's the approach we use — and what it takes to build exactly the view you need."
pubDate: 2026-06-16
category: "Cloud & Azure"
tags: ["azure", "cost-management", "multi-tenant", "internal-tools"]
draft: false
---

Azure's built-in cost analysis views are designed for finance teams. The default breakdown is by meter category, subscription, and billing period — useful if you're reconciling an invoice. If you're a developer-operator trying to understand which product is burning money and why, the default views give you a wall of Azure service names that don't map to anything in your business.

We needed something different: MTD spend broken down by product, resource group drill-down, a cost trend line, and a dead-spend detector that flags any resource under $1/month. All of it accessible to our finance person — who has never opened Azure Portal — from the same internal dashboard she uses to review expense submissions.

Here's the approach we took, and what you need to know before building your own.

## The API Exists. Most Developers Don't Know About It.

Azure Cost Management has a full REST API. It's the same API the portal uses when you run a cost analysis — you're just querying it programmatically instead of clicking through a UI.

The API lets you:
- Query by any time range (MTD, last month, custom dates)
- Group by subscription, resource group, service, resource name, or custom tags
- Aggregate to a total or break down by day
- Filter to specific resource types or resource groups

For a multi-subscription setup — which we have (one for our internal infrastructure, one for a client) — you can query each subscription separately and merge the results into a unified view. The finance person sees one number. The breakdown by subscription lives one click away.

## The Architecture Decision That Matters Most

The tempting approach is to call the Cost Management API on every dashboard page load. That's the wrong call for three reasons.

**Rate limits.** The API has per-subscription rate limits. A dashboard that multiple team members have open simultaneously will hit those limits quickly.

**Data lag.** Azure cost data typically lags 24–48 hours for fully materialised figures. Calling the API live doesn't give you real-time cost data — it gives you partially materialised data that will change by tomorrow. The last two days of any month are always incomplete.

**Latency.** Cost Management queries can take several seconds to return, especially for large subscriptions or long date ranges. That's not acceptable for a dashboard page load.

Our solution: sync cost data to our own database nightly via an automated workflow. The dashboard reads from our database — fast, consistent, no rate limit concerns. The data is as fresh as the last sync, and the sync is always fresher than what the portal would show you anyway (because we time it after Azure's overnight reconciliation runs).

For the two-day data lag, we visually differentiate the last two days on the cost trend chart — a dashed line vs. a solid line. Small detail, but it prevents the finance team from misreading an artificially low figure as a real cost reduction.

## What the Dashboard Actually Shows

**MTD total by product** — we tag Azure resource groups with a product name, and the dashboard aggregates by that tag. Finance sees cost by product line, not a list of Azure service names.

**Resource group breakdown** — each product line is collapsible into its underlying resource groups. This is where engineers investigate "why did this product's cost jump 30% this month."

**Cost trend** — MTD spend charted day-by-day, with the current month plotted against last month's actuals. Useful for spotting unexpected spikes early.

**Dead spend detector** — any resource with less than $1/month in cost gets flagged in a separate panel. We found $23/month in forgotten resources in the first week: a load balancer from a decommissioned project, two static IPs not attached to anything, a storage account from a dev environment no one remembered to delete. That's $276/year for nothing.

## What It Takes to Build This

Getting a basic cost query working against the API is a half-day task if you know Azure auth well. Getting a production-grade cost dashboard right — multi-subscription, synced nightly, tagged by product, with history preserved and lag handled correctly — is a different project.

The complexity lives in:
- Designing the right data model so past months' costs are preserved even as Azure retroactively adjusts figures
- Handling the auth correctly for multi-subscription queries (Service Principal with the right role on each subscription)
- Getting the sync timing right relative to Azure's reconciliation runs
- Mapping Azure's resource hierarchy to your business's product structure via tags

Done well, it means your finance person never needs to log into Azure Portal. Done poorly, you have a dashboard that shows numbers that don't match the invoice.

---

*We've built this for 3 Stripes Technologies' internal operations, and we can build it for yours. If you're managing Azure costs across multiple subscriptions and want visibility that doesn't require Azure access, [let's talk](/contact).*
