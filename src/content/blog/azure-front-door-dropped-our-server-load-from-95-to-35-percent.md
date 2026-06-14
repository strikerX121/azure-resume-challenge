---
title: "Azure Front Door Dropped Our Server Load from 95% to 35%"
description: "When bots hit the 3 Stripes Tech EMR frontend, CPU spiked to near-100%. Here's the exact problem, the decision to add Azure Front Door, and what happened after."
pubDate: 2026-04-10
category: "Cloud & Azure"
tags: ["azure", "front-door", "waf", "healthcare", "performance"]
draft: false
---

When we launched V3 of the 3 Stripes Tech EMR in May 2025, the deployment went smoothly. The app was fast, the database was behaving, and the first clinic was onboarded without incident.

Then the CPU numbers started climbing.

## The Problem

Three days after launch, the Azure App Service hosting the backend was sitting at 80–100% CPU utilisation. Not under load from real users — we had one clinic with 13 staff. Under load from bots.

This is a common pattern that newer developers miss: as soon as you deploy a public endpoint, scanners and crawlers start hitting it. Most of them are looking for vulnerabilities — open redirects, exposed APIs, login forms to brute-force. They don't care that you're running a healthcare app with a handful of real users.

The frontend of the EMR is a React SPA deployed as static files on Azure Blob Storage. But the static file requests were being served directly from the storage account, and the API requests were hitting the App Service. With bots hammering both, the App Service was spending most of its compute time serving bot traffic.

Real users — the doctors and receptionists — were experiencing slowdowns.

## The Decision

We evaluated three options:

**Option 1: Scale up the App Service.** More CPU, more memory. This would absorb the bot traffic but at ongoing cost and without solving the root cause.

**Option 2: Rate limiting in application code.** Implement IP-based rate limiting at the API layer. This would require code changes, testing, and wouldn't stop the bots from consuming resources before hitting the limit.

**Option 3: Azure Front Door with WAF.** Place Front Door in front of both the static frontend and the API. Use the Web Application Firewall to block bot traffic before it reaches the origin.

We chose Option 3.

## What Azure Front Door Does Here

Front Door sits between the internet and your origins. Every request goes through Front Door first, then gets routed to the appropriate backend — in our case, either Azure Blob Storage (for the frontend) or Azure App Service (for the API).

The WAF (Web Application Firewall) in Front Door has built-in managed rulesets for common attacks. We enabled the Microsoft-managed bot protection ruleset. This identifies and blocks known bad bots, scanners, and crawlers before they ever reach the origin.

The setup took about four hours total: provisioning the Front Door profile, configuring the two origins, setting up the routing rules, enabling the WAF policy, and testing that the CORS headers and authentication flows still worked correctly through the proxy.

The CORS configuration required some care — the frontend needed to send requests to the Front Door hostname, not directly to the App Service. One missed environment variable would have broken authentication entirely.

## The Numbers

Before Front Door: App Service CPU sitting at **80–100%** consistently, even with minimal real user load.

After Front Door: App Service CPU settled at **30–40%** under the same real user load, with bot traffic effectively blocked.

The reduction wasn't because we scaled the server. It was because the server stopped processing requests it should never have seen.

## The Cost Consideration

Front Door is not free. For this deployment, we're running Front Door Standard tier, which adds roughly $35–50 USD/month to the infrastructure cost.

For a healthcare application where a slow system means doctors waiting during patient consultations, that cost is justified. For a simple static marketing site, you'd weigh it differently.

The calculation is straightforward: what's the cost of degraded performance to real users versus the cost of prevention? For the EMR, that's not a close call.

## The Broader Lesson

Every public endpoint gets hammered by scanners within hours of deployment. This is not a special risk for healthcare applications — it's the default state of anything on the public internet.

The question isn't whether to protect your app. It's where in the stack to put the protection. Doing it at the application layer (rate limiting in code) is cheaper but incomplete. Doing it at the network edge (WAF) is more expensive but stops traffic before it costs you anything.

Front Door is Azure's answer to that second approach. For production applications that handle sensitive data or have SLA requirements, it should be the default architecture — not an afterthought added after the first production incident.

We added it after the first incident. We won't make that mistake on the next deployment.
