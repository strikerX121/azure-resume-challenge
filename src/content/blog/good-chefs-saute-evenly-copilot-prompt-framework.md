---
title: "Good Chefs Sauté Evenly: The Four-Ingredient Copilot Prompt Framework"
description: "The mnemonic that stuck with thousands of workshop participants: Good Chefs Sauté Evenly. Goal, Context, Source, Expectation. Most prompts use two. Here's why all four matter."
pubDate: 2026-06-18
category: "AI & Automation"
tags: ["microsoft copilot", "prompting", "ai productivity", "prompt engineering"]
image: /images/blog/good-chefs-saute-evenly-copilot-prompt-framework.svg
draft: false
---

**Good Chefs Sauté Evenly.**

That's the mnemonic. I taught it to thousands of people across dozens of Copilot workshops, and it's the line that stuck. Some people groaned at it. Most of them remembered it on the drive home. That's the whole point of a mnemonic.

It stands for: **Goal, Context, Source, Expectation.**

These are the four ingredients of a prompt that works. Most people show up with two: Goal and Context. The real gains come from the other two. Adding Source and Expectation to a prompt that didn't have them improved output quality more than any other single change I saw across the entire workshop program.

Here's what each one means and why it matters.

## G — Goal: What you want Copilot to do

This is the part everyone gets right. "Summarize this document." "Draft a reply." "Create talking points." The goal names the task.

Where people go wrong is stopping here and calling it a prompt. A goal alone tells Copilot what to do. It doesn't tell it where to look, who the output is for, or what form it should take. That leaves three decisions to Copilot. And Copilot will make them — just not necessarily the way you would.

## C — Context: What it needs to know

Context answers the background questions. Who is the audience? What's the purpose? What constraint matters here?

"Draft a reply" is a goal. "Draft a professional but direct reply declining the meeting request, keeping it to two sentences" is a goal with context. The second version gives Copilot the constraints it needs to produce something close to what you'd actually send.

Most people include some context. They write a sentence or two about the situation. That's fine. But context still doesn't tell Copilot where to look or how to format the output. That's what S and E are for.

## S — Source: Where to look

This is the ingredient most prompts are missing. It's also the one that moves the needle the most.

Copilot will look somewhere. If you don't tell it where, it picks a source based on what seems most relevant across your Microsoft 365 environment: emails, SharePoint, Teams, open documents. That choice might be exactly right. It might also be an email thread from three weeks ago, a SharePoint file you forgot you had access to, or a Teams conversation that happens to contain similar words.

When the source is wrong, the output sounds right. Copilot doesn't say "I'm not sure which document you meant." It answers confidently from whatever it found. That's the failure mode that's hardest to catch.

Adding a source instruction collapses that ambiguity. "Using only the document I have open" is a source instruction. "Based on the email thread below" is a source instruction. "From my Teams messages in the last seven days" is a source instruction.

In session after session: adding one line specifying the source improved results more than any other single change in the prompt. Not sometimes. Every time.

Copilot Notebooks take this further by giving Copilot exactly one bounded place to look, with no wandering into the rest of your environment. But even without Notebooks, specifying the source in the prompt is a habit worth building immediately.

## E — Expectation: How the output should look

The second most-missed ingredient. Expectation tells Copilot what form the output should take and how it should be formatted.

Without it, Copilot formats output however it thinks is best. It's not bad at this. But "however it thinks is best" often produces something that needs reformatting before it can be used — especially when the format matters as much as the content.

"In three short bullets" is an expectation. "As a table with columns for risk, likelihood, and owner" is an expectation. "As a professional email under 150 words with a clear subject line" is an expectation.

Setting the expectation means the output is closer to usable on the first attempt. That's the difference between Copilot saving you 20 minutes and saving you 5 because you spent 15 reformatting.

## What a full prompt looks like

Without the framework: *"Write a project update email."*

With all four: *"Write a project update email [Goal] for the steering committee, focused on what's on track and what needs a decision from them [Context], using the project summary I pasted below [Source], formatted as a professional email under 150 words with a clear subject line [Expectation]."*

The difference in output quality is not subtle. The second prompt produces something you can send with minor edits. The first produces something you have to rebuild.

## The framework, one more time

**G — Goal**: what you want Copilot to do.
**C — Context**: what it needs to know about the situation.
**S — Source**: exactly where it should look for information.
**E — Expectation**: what the output should look like.

**Good Chefs Sauté Evenly.**

Most people use G and C. Adding S and E is where the real gains are. The habit builds fast. After a session or two of prompting this way, it stops feeling like extra effort and starts feeling like the obvious way to ask for something.

Sing it on the car ride home. Use it the next time you open Copilot. The results will be different.

This is the kind of thing I cover in Copilot adoption workshops — practical frameworks that change how people actually work, not just feature walkthroughs. If your team is rolling out Copilot, [here's how we can work together](/services). And if you want to know whether your team is ready to make the most of it, grab the [AI & Copilot Staff Readiness Checklist](/resources) — it's free.
