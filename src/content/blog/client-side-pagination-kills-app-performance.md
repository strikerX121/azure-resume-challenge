---
title: "Your List View Works Fine at 200 Records. Here's What Happens at 7,000."
description: "A list view that loaded fast in development took 10 seconds in production. The cause was one architectural decision made early that nobody flagged until the data grew."
pubDate: 2026-05-12
category: "Engineering"
tags: ["performance", "pagination", "database", "architecture", "web-dev"]
draft: false
---

The app worked fine during development. A few hundred records in the test environment, fast load times, no complaints.

Then the real data grew.

By the time the table had 7,000 records, the list view was taking between 5 and 10 seconds to open. Not on a slow machine or bad network. On a normal computer, standard internet connection, 5 to 10 seconds of nothing every single time someone needed to look up a record.

The cause was one decision made early in development that nobody had questioned: the entire dataset was being loaded client-side on every page request.

## What client-side pagination actually does

The list looked paginated. Users saw 25 records at a time. Turned out the database query was fetching all 7,000 records on every load, sending them to the browser, and then letting JavaScript slice down to the visible 25.

So the user sees one page. The database is doing a full table scan. The network is transferring 7,000 records. The browser is filtering them down to 25.

At 200 records this is invisible. At 7,000 it's 10 seconds. At 50,000, which is a normal number for a production system running for five years, it stops working.

The original decision wasn't careless. It's a pattern that works until it doesn't, and development environments almost never have enough data to feel the problem before it ships.

## The architectural fix

Server-driven pagination means the query itself carries the limit and offset. The server returns exactly what the user needs to see — 25 records starting at page 3 — and nothing else crosses the wire.

The API contract looks like:

```
GET /records?page=3&limit=25
```

The database runs `LIMIT 25 OFFSET 50`. The response includes the page of data plus a total count so the frontend can build page numbers. No full table transfer. No client-side filtering.

The change touches three places: the database query, the API response shape, and the frontend pagination component. When a codebase is already built around client-side filtering, that is a meaningful refactor. In our case, the architecture was not designed to accommodate it incrementally, so we rebuilt.

## What the numbers looked like after

Same dataset, same hardware. Load time went from 5 to 10 seconds down to under a second.

The query is now a bounded operation instead of a full scan. The network is moving 25 records instead of 7,000. The browser has nothing to sort through.

For an application where someone opens a record list 30 times a day, the difference between 8 seconds and under a second is not a minor improvement. It is whether the software is actually usable in daily practice.

## When to build this right

If the list will ever hold more than a few hundred records, build server-driven pagination from the start. During initial development it adds maybe a few hours of work. Retrofitting it later, once the codebase has grown around client-side assumptions, takes considerably longer.

The pattern to watch for: if your frontend fetches all records and handles filtering or sorting in the browser, this problem is in front of you. It just hasn't shown itself yet.
