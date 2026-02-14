# Monthly SE Opportunity Update Template

Use this template to generate the monthly report. Fill each `[___]` placeholder using the indicated MCP tool or user input.

---

## Portfolio Summary

| Field | Description | Input / Insight |
|-------|-------------|-----------------|
| **Month & Coverage** | Reporting month and accounts covered | [MONTH YEAR]. [ACCOUNT LIST — from `get_account_team`]. |
| **Top 3 Highlights** | Key wins or movements | 1. [Account: highlight — from WorkIQ + user] 2. [Account: highlight] 3. [Account: highlight] |
| **Roll-Up Metrics** | Quick stats on performance | [ACR, attainment %, MoM growth, YoY growth — from `get_pipeline_summary` + user] |
| **Other 1** | Any other business / Comments | [Optional — EBCs, pipeline notes, territory changes] |
| **Other 2** | Any other business / Comments | [Optional] |

---

## Opportunity Details

Repeat this section for each top opportunity (typically 3). Order by impact, not alphabetically.

### Opportunity [N]

| Field | Description | Input / Insight |
|-------|-------------|-----------------|
| **Account / Opp Name / MSX ID** | Customer and opportunity | [Account] – [Opp Name — from `get_opportunity_details` → `name`] [MSX ID as link — `[7-XXX](https://microsoftsales.crm.dynamics.com/main.aspx?pagetype=entityrecord&etn=opportunity&id={GUID})`] |
| **Solution Play & Workloads** | FY26 Solution Play + Azure Services | [from `get_opportunity_details` → `msp_salesplay`]; Workloads: [Azure services — user/WorkIQ] |
| **Sales Stage & TD Status** | MCEM Stage + TD win/loss/progressing | [from `get_opportunity_details` → `msp_activesalesstage`, `stepname`] |
| **Dollar Movement** | U2C or Closed | [from `get_opportunity_details` → `estimatedvalue`, `msp_billedrevenue`]; [committed/uncommitted — user] |
| **Close Plan (30–60d)** | Key next steps | [from WorkIQ + user — what's happening next 30-60 days] |
| **Risks / Blockers** | Type, impact, owner | [from WorkIQ + user — blockers, competition, hygiene issues] |
| **MACC Signal** | MACC impact (if applicable) | [user input — consumed under MACC / will add / N/A] |
| **Asks / Help Needed** | Specific support | [user input — what you need from leadership, product teams] |
| **Owner & V-Team** | SE + Contributors | Owner: [from `get_opportunity_details` → deal team] · SE: [names] · Partner: [if applicable] |
| **Other 1** | Any other business / Comments | [Optional] |
| **Other 2** | Any other business / Comments | [Optional] |

---

## MACC Account Snapshot (if applicable)

| Field | Description | Input / Insight |
|-------|-------------|-----------------|
| **MACC Basics** | Enrollment, term, growth | [user input — enrollment type, term length, growth %] |
| **Execution View** | PBO vs. Budget | [user input — PBO %, Coverage %] |
| **Consumption Plan** | Moves | [user input — milestone adds/skips in MSX] |
| **Investments & Programs** | ECIF, Unified, Marketplace | [user input — investment details] |
| **Risks & Mitigation** | Shortfall plan | [user input — risk and mitigation plan] |
| **Asks / Help Needed** | Specific support | [user input] |
| **Other 1** | Any other business / Comments | [Optional] |
| **Other 2** | Any other business / Comments | [Optional] |

---

## Contribution / Impact Summary

| Customer | Engagement Type | Contribution w/ Impact |
|----------|----------------|----------------------|
| [Customer or Internal team] | [Type — see descriptors below] | [What you did + impact. From WorkIQ + user input. Include artifacts left behind.] |

### Engagement Type Descriptors

- Architecture Design
- Envisioning Workshop
- Technical Briefing
- Proof of Concept (POC)
- Always-On Hiring
- Insiders Assistance
- Pace Setters Contribution
- Implementation Guidance
- Modernization Workshop
- AI Architecture / Enablement
- Discovery Calls
- Guild / Community Leadership

### Contribution Guidelines

- Describe the contribution AND the impact it made
- Note any artifacts left behind (architecture diagrams, presentations, code samples)
- Include audience size for events/sessions
- Be honest about your role level: "attended," "contributed to," "led," "created"
