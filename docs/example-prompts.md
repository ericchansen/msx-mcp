---
layout: page
title: Example Prompts
permalink: /example-prompts/
---

Real-world prompts you can use with Copilot CLI once msx-mcp is configured. All examples below use fabricated company names — replace with your actual accounts.

## Monthly Opportunity Report

The flagship use case. Copilot auto-discovers your accounts and deals, then builds the report.

- "Generate my monthly opportunity report" — Copilot calls MSX MCP tools + WorkIQ automatically, presents your accounts and top deals, and lets you pick which to feature.
- "Create my monthly opportunity update for January 2026. Feature the top 5 deals instead of 3."
- "Swap out the Northwind deal and add the Fabrikam Copilot Rollout instead." (after the initial suggestion)
- "Generate my monthly update but focus primarily on Contoso Ltd — they had the most activity this month."

---

## Weekly Impact Report

Evidence-based weekly reports focused on measurable business outcomes.

- "Create my weekly impact report"
- "Generate my weekly report and include MSX deal context for any opportunities I worked on this week."
- "Create my weekly report and generate the PowerPoint slide too."

---

## Direct MCP Tool Queries

Use these when you need specific data points without generating a full report.

- "Show me my current pipeline summary — how many deals do I have and what are they worth?" → calls `get_pipeline_summary`
- "What are my top 3 opportunities by dollar value?" → calls `suggest_top_opportunities`
- "Which accounts am I assigned to in MSX?" → calls `get_account_team`
- "List all my deal team memberships with forecast comments." → calls `get_my_deals`
- "Tell me everything about the Contoso Azure AI opportunity." → calls `get_opportunity_details`
- "Find all open opportunities worth more than $500K that are closing before March 2026." → calls `search_opportunities`

---

## Combining with Other Tools

- "I have a call with Contoso tomorrow. Pull my MSX deals for Contoso, check WorkIQ for recent emails and meetings, and summarize what I need to know."
- "I have a pipeline review with my manager. Show me my pipeline summary, flag any deals closing in the next 30 days, and highlight anything marked as a critical deal."
- "I just got assigned to Fabrikam Inc. Show me my account team details, any existing opportunities, and find any recent emails or meetings from WorkIQ about this account."

---

## Tips

- No IDs needed — always refer to opportunities by name or account. The system resolves IDs for you.
- VPN + auth first — if you get 403 errors, reconnect VPN and run `az login`.
- Combine sources — MSX gives you structured data (values, stages, IDs); WorkIQ gives you activity evidence (meetings, emails). Use both together.
- Iterate — after the first draft, ask to swap opportunities, fill placeholders, or adjust tone.
