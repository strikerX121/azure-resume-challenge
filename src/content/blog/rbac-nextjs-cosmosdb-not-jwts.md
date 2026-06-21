---
title: "Building Real RBAC in Next.js 15: Why Roles Belong in the Database, Not the JWT"
description: "Most auth tutorials store roles in the JWT and call it done. That works until you need to change someone's role and they're locked to the old one until the token expires. Here's the better approach."
pubDate: 2026-06-09
category: "Engineering"
tags: ["nextjs", "auth", "rbac", "cosmosdb", "nextauth"]
draft: false
---

Most role-based access tutorials do the same thing: store the role in the JWT, read it on the client, gate the route. Ship it.

That works. Until someone gets promoted, and you need to change their role immediately, and you realise they're locked to the old JWT until it expires. Depending on your token lifetime, that could be hours or days.

We hit this exact problem building the Enterprise Apps Masterview — an internal ops dashboard for our IT team at 3 Stripes Technologies. Five distinct roles, different visibility requirements for every module, and a finance person who cannot see engineering data under any circumstances. Getting this wrong wasn't a cosmetic issue.

## The Problem with JWT-Only Role Storage

JWTs are signed and stateless. That's their value — you don't query a database on every request because all the information is in the token.

The downside is the same thing. If the role in the token is stale, you're serving stale access rules until the token expires and refreshes.

For most JWT claims — user ID, email — staleness isn't a practical problem. For roles, it is. Roles change at key moments: onboarding, promotion, offboarding. Those are exactly the moments where the change needs to take effect now, not on the next token refresh.

Embedding roles in a long-lived JWT means accepting that lag, or building a token invalidation system. Token invalidation is significantly more complex than just not doing it in the first place.

## The Approach That Actually Works

The key insight: **store the role in your database, look it up at sign-in, and inject it into the JWT there.**

When a user authenticates, the auth callback fetches their current role from the database and writes it into the token at that moment. The JWT carries the role for the session — fast, no live database calls on every request — but the source of truth is always the database.

When you update someone's role in the database, the next time they authenticate, they get the updated role. For an internal tool with daily active users, "takes effect at the next sign-in" is close enough to immediate.

The cost is one database read per sign-in event. At sign-in, users expect a brief moment. This is not perceptible.

## The Permission Layer

Having a role is one thing. Using it consistently is what makes or breaks a multi-role app.

The mistake is gating things ad-hoc: checking for admin in one place, constructing `role === 'finance' || role === 'admin'` in another, and ending up with no clear picture of what each role can actually do. When requirements change, you're hunting through the codebase for every place a role is checked.

The right approach: a single `can(role, permission)` function that every access check in the codebase goes through. Not a permission check per role per route — one function, one list of what each role is allowed to do.

This function gets used in two places:
- **Client side** — to gate which sidebar items and UI panels are visible
- **Server side** — to protect API routes with the same permission keys

Same logic, both layers. If the permission key exists, access is granted. If it doesn't, it's denied. Both the UI and the API enforce this independently, so bypassing the UI doesn't bypass the API.

## What This Unlocked for Our Team

Our finance person has never opened Azure Portal. She doesn't have an Azure account.

She can see the full cost dashboard, review and approve expense submissions, and pull billing summaries — all through the dashboard, with exactly the access her role permits.

Engineers see app health and their own billable hours. They don't see cost data or anyone else's time.

Staff submit expenses and see their own submission history. They don't see the approval queue or aggregate numbers.

This is what role-based access is supposed to do: enforce organisational boundaries in the application layer, so you're not relying on people's discipline or platform-level access controls to keep sensitive data siloed.

## The Broader Point

The architecture here isn't complicated. One database field per user. One permission lookup function. One point in the auth flow where the role gets injected into the session.

What's easy to underestimate is how much of the product design flows from this decision. When every access check goes through the same function, adding a new role or changing what a role can do is a one-line change that propagates everywhere automatically.

Getting RBAC right early is cheap. Retrofitting it after you've shipped ad-hoc checks across fifty routes is expensive.

---

*We build multi-role web applications on Azure for Caribbean businesses. If you're dealing with a similar access control problem — whether it's an internal tool or a client-facing product — [get in touch](/contact).*
