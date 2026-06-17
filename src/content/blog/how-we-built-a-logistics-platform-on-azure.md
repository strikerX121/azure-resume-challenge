---
title: "How We Built a Logistics Platform on Azure — From WhatsApp to 200+ Users"
description: "SASSI is a Trinidad-based package forwarding business that ran on WhatsApp, spreadsheets, and phone calls. Here's how ARC Cloud Consulting replaced all of that with a full-stack Azure platform."
pubDate: 2026-04-28
category: "Cloud & Azure"
tags: ["azure", "logistics", "saas", "n8n", "case-study"]
image: /images/blog/how-we-built-a-logistics-platform-on-azure.svg
draft: false
---

Before ARC Cloud Consulting built the SASSI Logistics Platform, this is what running a package forwarding business in Trinidad looked like:

A client messages on WhatsApp to say a package is on the way. The team logs it in a spreadsheet. The package arrives at the US warehouse. Someone updates the spreadsheet. The client asks for an update — someone manually replies. The shipment arrives in Trinidad. The client is notified — manually. An invoice is created — in Google Docs. Payment is tracked — in a separate spreadsheet.

Multiply that by 200 clients and you understand the problem.

## The Ask

SASSI's founder came to us with a clear brief: stop drowning in manual work. Every new client added linearly to the operational burden. Notifying 50 clients about their shipments took the same effort as notifying 5 — because every notification was a manual action.

The platform we were asked to build needed to handle the full forwarding workflow: clients pre-alert the team about incoming packages, packages arrive and get received into inventory, invoices get generated, clients pay, shipments go out.

The value wasn't in any one feature. It was in removing the human-in-the-loop from every routine step.

## What We Built

The SASSI Logistics Platform is a full-stack web application currently in production with 200+ active users. ARC Cloud Consulting built the entire platform — architecture, backend, frontend, automation — over several months.

**Client portal**: clients can submit pre-alerts, view their package inventory, see and pay invoices, and track their wallet balance. No WhatsApp message required.

**Admin portal**: the SASSI team has a dashboard for receiving packages into the warehouse, managing pre-alerts, creating invoices, and running reports. What took 20 minutes per client now takes seconds.

**SNS (Shop & Ship)**: a purchase-on-behalf service where clients submit purchase requests and SASSI handles buying from US vendors and shipping to Trinidad.

**Warehouse Receipt module**: currently in active development. Will fully digitise the receiving workflow at the warehouse door.

## The Architecture Decisions That Mattered

Everything runs on Azure. We made that choice early for a few reasons: the client needed enterprise-grade reliability, we had deep Azure expertise, and the cost model for a growing SaaS product made sense.

The infrastructure sits behind Azure Front Door, which handles SSL termination and provides basic WAF protection. We learned the value of this the hard way — early in deployment, bots hitting the frontend caused CPU spikes that were impacting real users. Front Door resolved that.

The database is PostgreSQL on Azure. We chose PostgreSQL over Cosmos DB because the relational model fit the data — packages have owners, owners have invoices, invoices have line items. A document database would have made these relationships more complex to query.

## The AI Support Chatbot

One of the more interesting additions to the platform is the AI-powered support ticket system.

Before: a client messages on WhatsApp with a support issue. Antonio sees it (eventually), creates a Trello ticket, assigns it, and follows up.

After: a client messages in the support chat. An n8n workflow intercepts the message, checks for duplicate tickets (based on client ID and issue type), creates a Trello ticket if none exists, assigns it to the right team member, notifies the dev team on Slack, and replies to the client with a ticket reference.

Antonio's direct involvement in routine support requests dropped from "every single one" to "only the ones that need a human decision."

This is GPT-4 doing the triage, n8n doing the orchestration, and Trello doing the tracking. Three tools that each do one thing well.

## What 200 Users Looks Like on Azure

The platform is genuinely multi-tenant — each client has their own account, wallet, and package history. At 200 active users, we're not stressing the infrastructure, but the architecture was built to scale.

Azure App Service handles the backend. The frontend is static (served from Azure Blob Storage behind Front Door). This split means the static assets are globally cached and the API layer scales independently.

The platform has been valued at $70,000–$90,000 USD based on the features delivered and market comparables for logistics SaaS. SASSI runs it as a fully managed product — ARC Cloud Consulting handles all infrastructure and development.

## The Lesson

The real lesson from SASSI isn't technical. It's that the biggest productivity gains aren't from complex AI — they're from removing humans from loops that didn't need humans in them.

The WhatsApp notification loop didn't need a person. The invoice creation loop didn't need a person. The support ticket creation loop didn't need a person.

Once you remove the human from each of those, the person in the business has time to do the things that actually need them.
