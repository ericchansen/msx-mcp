# Example Prompts

Real-world prompts you can use with Copilot CLI once msx-mcp is configured. All examples below use fabricated company names — replace with your actual accounts.

## Monthly Opportunity Report

The flagship use case. Copilot auto-discovers your accounts and deals, then builds the report.

### Quick Start
```
Generate my monthly opportunity report
```
> Copilot will call MSX MCP tools + WorkIQ automatically, present your accounts and top deals, and let you pick which to feature.

### With Preferences
```
Create my monthly opportunity update for January 2026. Feature the top 5 deals instead of 3.
```

### Swap an Opportunity
After the initial suggestion:
```
Swap out the Northwind deal and add the Fabrikam Copilot Rollout instead.
```

### Focus on a Specific Account
```
Generate my monthly update but focus primarily on Contoso Ltd — they had the most activity this month.
```

---

## Weekly Impact Report

Evidence-based weekly reports focused on measurable business outcomes.

### Quick Start
```
Create my weekly impact report
```

### With Deal Context
```
Generate my weekly report and include MSX deal context for any opportunities I worked on this week.
```

### PowerPoint Output
```
Create my weekly report and generate the PowerPoint slide too.
```

---

## Direct MCP Tool Queries

Use these when you need specific data points without generating a full report.

### Pipeline Overview
```
Show me my current pipeline summary — how many deals do I have and what are they worth?
```
> Calls `get_pipeline_summary`

### Top Deals
```
What are my top 3 opportunities by dollar value?
```
> Calls `suggest_top_opportunities`

### Account Team
```
Which accounts am I assigned to in MSX?
```
> Calls `get_account_team`

### All Deals
```
List all my deal team memberships with forecast comments.
```
> Calls `get_my_deals`

### Specific Opportunity
```
Tell me everything about the Contoso Azure AI opportunity.
```
> Calls `get_opportunity_details` with a name search

### Search by Criteria
```
Find all open opportunities worth more than $500K that are closing before March 2026.
```
> Calls `search_opportunities` with value and date filters

---

## Combining with Other Tools

### Research for a Customer Call
```
I have a call with Contoso tomorrow. Pull my MSX deals for Contoso, check WorkIQ for recent 
emails and meetings, and summarize what I need to know.
```

### Pipeline Review Prep
```
I have a pipeline review with my manager. Show me my pipeline summary, flag any deals closing 
in the next 30 days, and highlight anything marked as a critical deal.
```

### New Account Onboarding
```
I just got assigned to Fabrikam Inc. Show me my account team details, any existing opportunities, 
and find any recent emails or meetings from WorkIQ about this account.
```

---

## Tips

- **No IDs needed** — always refer to opportunities by name or account. The system resolves IDs for you.
- **VPN + auth first** — if you get 403 errors, reconnect VPN and run `az login`.
- **Combine sources** — MSX gives you structured data (values, stages, IDs); WorkIQ gives you activity evidence (meetings, emails). Use both together.
- **Iterate** — after the first draft, ask to swap opportunities, fill placeholders, or adjust tone.
