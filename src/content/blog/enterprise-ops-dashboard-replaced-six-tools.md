---
title: "We Replaced Google Drive, Azure Portal, and Three Spreadsheets with One Dashboard"
description: "Every morning meant opening six tools that didn't talk to each other. Here's how we consolidated it — and what the result looks like for a five-person IT firm managing four production apps."
pubDate: 2026-06-02
category: "Cloud & Azure"
tags: ["azure", "internal-tools", "ops", "cosmosdb", "nextjs"]
draft: false
---

Every morning started the same way. Open Azure Portal to check app health. Open Google Sheets to review the cost tracker. Pull up Toggl to see what the team billed last week. Check email for expense submissions. None of it talked to each other.

We were managing four production apps across two Azure subscriptions, a five-person team, and a finance workflow that lived entirely in spreadsheets. The information existed — it was just spread across six different places, and assembling it into a clear picture required twenty minutes of manual work before the actual workday started.

So we built the thing that tied it all together.

## What We Were Actually Replacing

**Azure Portal browsing** — checking app health and resource states required logging in and navigating between subscriptions. Fine occasionally. Painful as a daily routine across four apps.

**Google Sheets cost tracking** — our finance person maintained a monthly Azure cost tracker manually, pulling figures from Azure cost reports and entering them by hand. Always a week behind. Prone to entry errors. And if she had a question about a line item, she had to ask me.

**Expense email chains** — staff submitted expense receipts by email with PDF attachments. Finance tracked approvals in a separate spreadsheet. There was no single view of what was pending, what was approved, or what was paid.

**Toggl web UI** — time was tracked in Toggl, but getting useful billing summaries required an export-to-Excel session. Answering "what did we bill a specific client in Q1?" was a thirty-minute task.

## The Build Decision

We looked at off-the-shelf options. Nothing fit. The tools that exist are built for 500-person companies (too complex, too expensive) or solo freelancers (too simple). We're a five-person IT firm managing production enterprise apps for Caribbean clients with specific billing logic tied to our own product structure and team roles.

The custom build was the right call.

## How We Think About Internal Tools

The temptation with internal tools is to build a thin UI layer on top of your existing APIs — call the Azure API on page load, pull from Toggl on page load, fetch expenses from wherever they live.

We took the opposite approach: **sync everything to one database first. The dashboard reads from there.**

This matters because:

- Azure's cost data has a 24–48 hour lag anyway — calling it live gives you the same stale data, just slower
- Rate limits on external APIs become a concern as multiple users hit the dashboard simultaneously
- You lose the ability to query across data sources (e.g., "hours billed vs. cost incurred for a given client, this month")

Nightly automated workflows handle the syncing. The dashboard reads from a single database. Page loads are fast and consistent regardless of what any upstream API is doing.

## What the Dashboard Does

**App Health** — four production apps, current status visible to the whole team. Engineers don't need portal access for a daily health check.

**Cost Visibility** — month-to-date Azure spend broken down by product line and resource group. Our finance person has live cost visibility without ever touching Azure Portal. A dead-spend detector surfaces any resource under $1/month — we found $23/month in forgotten resources the first week.

**Team Hours** — time entry data synced from Toggl, displayed with role-scoped access. Staff see their own hours. Finance sees the full team. Billing summaries that used to take thirty minutes now take a filter click.

**Expense Workflow** — staff upload receipts, finance reviews and approves or rejects with a note, staff get notified, finance marks paid. The full workflow in one view. No email, no WhatsApp, no separate spreadsheet.

## Role-Based Access Was Non-Negotiable

Five roles across the team: different people need to see different things. The finance person should never see engineering data. Engineers shouldn't see payroll. Staff shouldn't see each other's expense submissions.

We built the access model before the first page was built — every API endpoint and every UI panel gates on the same permission layer. This is the kind of architectural decision that's cheap to make early and expensive to retrofit.

## The Result

Our finance person hasn't asked me to explain an Azure cost in three months. The Monday morning tab count went from six to one. Expense approvals happen the same day instead of accumulating over a week.

The platform is in daily use across the full team. It's Phase 1 of three: the next phases add a full accounting module and a client portal where our clients can see their Azure IT costs and pay invoices directly — without needing an Azure account.

---

*If you're managing a team, clients, and Azure infrastructure and dealing with the same tool sprawl — [let's talk about what this could look like for your business](/contact).*
