---
title: "The Four Ingredients of a Good Copilot Prompt (Most People Use Two)"
description: "After dozens of workshops, the gap between prompts that work and prompts that don't comes down to the same four things: Goal, Context, Source, Expectation. Most people bring two."
pubDate: 2026-06-18
category: "AI & Automation"
tags: ["microsoft copilot", "prompting", "ai productivity", "prompt engineering"]
image: /images/blog/four-ingredients-of-a-good-copilot-prompt.svg
draft: false
---

After running dozens of Microsoft Copilot workshops across sectors, the pattern is consistent. The gap between prompts that produce something useful on the first try and prompts that produce something you have to rewrite twice is almost always the same four things.

The framework is called **Goal + Context + Source + Expectation**. Most people show up with Goal and Context. The real gains come from Source and Expectation.

## Goal: What you want Copilot to do

This is the part everyone gets. "Summarize this document." "Draft a reply." "Create talking points." The goal names the task.

Where people go wrong is stopping here and calling it a prompt. A goal alone tells Copilot what to do. It doesn't tell it what to draw on, who it's for, or what the output should look like. That leaves three decisions to Copilot, and Copilot will make them, just not the way you would.

## Context: What it needs to know

Context answers the background questions. Who is the audience? What's the purpose? What does Copilot need to understand about the situation to do this well?

"Draft a reply" is a goal. "Draft a professional but direct reply declining the meeting request, keeping it to two sentences" is a goal plus context. The second version gives Copilot the constraints it needs to produce something close to what you would actually send.

Most people include some context. They write a sentence or two about the situation. That's good. But context still doesn't tell Copilot where to look or how to format the output.

## Source: Where to look

This is the ingredient most prompts are missing, and it's the one that makes the biggest difference in output quality.

Copilot will look somewhere. If you don't tell it where, it decides based on what seems most relevant in your Microsoft 365 environment. That might be exactly right. It might also be an email thread from three weeks ago, a SharePoint document you forgot you had access to, or a Teams conversation that happens to contain some of the same words.

When the source is wrong, the output sounds right. Copilot doesn't say "I'm not sure if I found the right document." It answers confidently from whatever it found. That's the failure mode that's hard to catch.

Adding a source instruction collapses that ambiguity. "Using only the document I have open" is a source instruction. "Based on the email thread below" is a source instruction. "From my Teams messages in the last 7 days" is a source instruction.

Across workshops, adding a source instruction to a prompt that didn't have one improved results more than any other single change. Not sometimes. Consistently.

Copilot Notebooks take this further by giving Copilot exactly one bounded place to look. If you're doing work that requires Copilot to reference the same set of content repeatedly, a Notebook removes the guesswork entirely.

## Expectation: How the output should look

This is the second most-missed ingredient. Expectation tells Copilot how the output should be formatted and what form it should take.

Without it, Copilot formats output however it thinks is best. It's not bad at this. But "however it thinks is best" often produces something that needs reformatting before it can be used, especially in a professional context where the format matters as much as the content.

"In three short bullets" is an expectation. "As a table with columns for risk, likelihood, and owner" is an expectation. "As a professional email with a clear subject line, under 150 words" is an expectation.

Setting the expectation means the output is closer to usable immediately. That's the difference between Copilot saving you 20 minutes and Copilot saving you 5 minutes because you spent the other 15 reformatting.

## What a full prompt looks like

Here's the same task with and without all four ingredients.

Without them: *"Write a project update email."*

With all four: *"Write a project update email [Goal] for the steering committee, focused on what's on track and what needs a decision from them [Context], using the project summary I pasted below [Source], formatted as a professional email under 150 words with a clear subject line [Expectation]."*

The difference in output quality is not subtle. The second prompt produces something you can send with minor edits. The first produces something that needs to be rebuilt.

## The framework

**Goal**: what you want Copilot to do.
**Context**: what it needs to know about the situation.
**Source**: exactly where it should look for information.
**Expectation**: what the output should look like.

Use all four. Most people don't. That's the entire gap.

The good news is that building this habit is fast. After a session or two of prompting this way, it stops feeling like extra work and starts feeling like the natural way to ask for something. The results speak for themselves.

This is the kind of thing I cover in Copilot adoption workshops. If your team is rolling out Copilot and you want training that actually changes how people work, [here's how we can work together](/services).
