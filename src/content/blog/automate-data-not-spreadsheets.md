---
title: "Why Building Automations on Spreadsheets Is a Trap"
description: "Most automation projects fail not because the tools are wrong but because the data isn't in the right place to automate against. The fix is sequencing."
pubDate: 2026-06-09
category: "AI & Automation"
tags: ["n8n", "automation", "postgresql", "workflow", "operations"]
image: /images/blog/automate-data-not-spreadsheets.svg
draft: false
---

The most common automation project we get brought in to fix follows the same pattern.

A company wants to automate their operations: follow-up emails, purchase order tracking, reporting summaries. They've already tried something, usually Zapier or Make connected to Google Sheets. It worked for a while. Now it's breaking, or the outputs are unreliable, or the team has quietly stopped trusting the numbers it produces.

The problem is almost never the automation tool.

## What Google Sheets looks like from an automation's perspective

Spreadsheets feel like databases. They have structure, columns with names, data in rows. You can share them and write formulas.

The difference that matters: a database guarantees that a record either exists or it doesn't. A date column holds a date. A number column holds a number. Constraints are enforced at write time.

Sheets don't work this way. A row can be in the wrong tab. A date column can have "TBD" in it. A cell the automation was reading yesterday can be blank today because someone cleared it accidentally. None of this is caught before the automation tries to process it.

Any automation tool reads what's there. If what's there is inconsistent, the automation inherits that inconsistency and produces inconsistent outputs. Most teams eventually conclude the tool is unreliable, when the actual issue is that the data source is unreliable.

## The fix is sequencing, not tool selection

Before automating, centralise the data into a database.

This means moving the source of truth off spreadsheets and into a structure that enforces types, constraints, and relationships. In our current stack that's PostgreSQL on Azure. n8n connects to it directly via the native Postgres node, reads from it, and writes back to it.

Once the data lives in the database, the automation is working against records that behave predictably. A date column is always a date. A foreign key always points to a real record. The automation can make assumptions that are actually safe to make, which is the only kind of automation that works reliably.

The sequence:

1. Map what the automation actually needs: what it reads, what it writes, what it needs to look up
2. Build that schema in the database
3. Migrate the existing spreadsheet data across
4. Build the automation against the database

Steps 1 to 3 take longer than most teams expect. Step 4 moves faster than they expect, because building against a proper database is easier than constantly working around sheet quirks.

## Build the portal last

A lot of companies want to build the dashboard first. The visible thing, the thing they can show leadership. We push back on this consistently.

A portal is a read layer on top of data. If the underlying data is scattered across spreadsheets, half the portal development ends up handling edge cases that only exist because the data is inconsistent. It's slower to build and less reliable when it ships.

Get the data right first. The portal builds quickly when the database is already clean and populated with real records.

On one of our current engagements, automations were running and reliable for several months before portal development started. The portal is being built now against a database with good data in it. We've had almost no data-related bugs in portal development because we didn't try to build both at the same time.

## How to structure the automation and API layers

n8n handles all workflow logic and writes directly to the database. No workflow logic lives in the API layer.

NestJS sits as a thin layer that handles authentication, reads data for dashboards, and sends real-time notifications. It doesn't know anything about the automation workflows. It just serves data.

This separation matters for debugging. When an automation breaks, it breaks in n8n, and you can see the exact execution history: which step failed, what the payload looked like at that point, what error came back. When a dashboard breaks, it breaks in NestJS. These two concerns don't bleed into each other.

Embedding automation logic in the API, or worse in the frontend, creates a system where a failure in one place can only be diagnosed by tracing through all of them. Keep the concerns separated from the start.

The tool almost never matters. The architecture always does.
