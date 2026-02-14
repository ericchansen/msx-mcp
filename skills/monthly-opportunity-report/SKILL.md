---
name: monthly-opportunity-report
description: >-
  Generate monthly SE Opportunity Update reports for your pod. Use when asked to "create my
  monthly report", "write my opportunity update", "generate monthly SE report", "prepare my
  pod update", "monthly opportunity review", "monthly account summary", "SE manager report",
  "monthly update for pod lead", "solution area review", or "SDP report". Pulls deal data from
  MSX MCP tools and activity evidence from WorkIQ. Do NOT use for weekly reports, ad-hoc deal
  lookups, or Word document creation — this skill outputs markdown first.
---

# Monthly Opportunity Report

Generate a structured monthly SE Opportunity Update report matching the standard SDP pod template.

> **CRITICAL:** Your output MUST match the format shown in the anonymized examples in `references/`. Read ALL of them before generating anything. They are the definitive specification for structure, tone, depth, and formatting.

> **Output markdown first.** Iterate with the user on the markdown. Do NOT generate a Word document, PowerPoint, or any other format until Step 6 — and only when the user explicitly asks.

> **Prerequisites:** Microsoft corporate VPN must be connected, and `az login` must have been run this session.

## Reference Examples

Before generating, read these anonymized examples to calibrate your output:

| Example | File | Highlights |
|---------|------|------------|
| Apps & AI SE (3 opps, contributions) | `references/anonymized-example-1-apps-ai.md` | Full report with 3 detailed opportunities, empty MACC, 4 contribution rows |
| Data SE (3 opps, filled MACC) | `references/anonymized-example-2-data.md` | Full report with filled MACC section, 2 contribution rows |
| Data SE (4 opps, no contributions) | `references/anonymized-example-3-data.md` | Shows 4 opportunities, empty MACC, no contribution section |
| Apps & AI SE (1 opp, contributions) | `references/anonymized-example-4-apps-ai.md` | Minimal report with 1 opportunity, 4 contribution rows |

These examples show the exact table format, level of detail, and professional tone expected.

## Workflow

### Step 1: Auto-Discovery — Build the Full Picture

Before asking the user anything, gather all available data. Run these **in parallel**:

**MSX MCP Calls (structured data):**

1. `get_account_team` → user's assigned accounts, roles, solution areas
2. `get_pipeline_summary` → pipeline by sales stage with dollar totals
3. `suggest_top_opportunities` with `count: 5, criteria: "by_value"` → ranked deals
4. `get_my_deals` → all deal team memberships

**WorkIQ Call (activity evidence):**

5. Ask WorkIQ: *"What are my key accomplishments, customer engagements, and contributions for [PREVIOUS MONTH]? Include meetings, emails, Teams conversations, and documents. Focus on technical work, customer blockers resolved, architecture guidance, and deal progression."*

### Step 2: Present Choices — Let the User Confirm

Present a concise summary using the auto-discovered data. Use `ask_user` with choices where possible.

**Show:**
- Pipeline snapshot (deal count, total value)
- Account list with roles (pre-select accounts with active deals)
- Top 5 opportunities ranked by value, with estimated value and sales stage
- Suggested reporting month (default: previous calendar month, but confirm — user may be mid-month)

**Rules:**
- Pre-select top 3 opportunities and all accounts with active deals
- The user should NEVER need to provide an opportunity ID, MSX ID, or GUID — resolve everything automatically
- If the user names an opportunity not in the list, use `search_opportunities` to find it
- Also confirm: solution area, pod name/number (use from memory if available)

### Step 3: Deep Dive — Gather Detailed Evidence

For each **selected opportunity**:

**MSX MCP:**
- `get_opportunity_details` with the opportunity name → MSX ID, sales stage, estimated value, billed revenue, forecast comments, deal type, sales play, close date, owner, deal team

**WorkIQ (per account):**
- *"For [ACCOUNT] during [MONTH YEAR], what specific meetings, emails, and Teams conversations did I participate in? What technical topics were discussed? Were there any decisions made, blockers resolved, or deliverables created?"*

**WorkIQ (internal contributions):**
- *"What internal contributions did I make during [MONTH YEAR]? Include hiring interviews, guild participation, enablement sessions, workshops, internal tools, and cross-team collaboration."*

**WorkIQ (Copilot session data — for contribution ordering):**
- *"What Copilot CLI sessions did I have during [MONTH YEAR]? What projects, repos, or technical work was I doing? How much time did I spend on each?"*
- This data is critical for ordering the Contribution/Impact section by actual time invested

### Step 4: Generate Markdown Report

Generate the report as **markdown**. Your output MUST follow the exact format from the reference examples.

**Format rules:**
- Use the 4-section structure: Portfolio Summary → Opportunity Details (repeat) → MACC Snapshot → Contribution/Impact
- Each section uses a **Field | Description | Input / Insight** markdown table
- Opportunity MSX IDs must be hyperlinks: `[7-XXXXXXXXXX](DYNAMICS_URL)` where the URL comes from the **Dynamics URL** field returned by MCP tools
- The GUID for the link comes from the `opportunityId` field returned by MSX MCP tools
- Separate sections with `---` horizontal rules
- Use `### Opportunity N` or `### N — Account Name` headings for each opportunity

**Field-by-field data source mapping:**

| Field | Primary Source | MCP Tool |
|-------|---------------|----------|
| Coverage / accounts | MSX | `get_account_team` |
| Top 3 Highlights | User + WorkIQ | narrative |
| Roll-Up Metrics | MSX + User | `get_pipeline_summary` |
| Account / Opp Name / MSX ID | MSX | `get_opportunity_details` → `name`, `msp_opportunitynumber`, `Dynamics URL` |
| Solution Play & Workloads | MSX | `get_opportunity_details` → `msp_salesplay` |
| Sales Stage & TD Status | MSX | `get_opportunity_details` → `msp_activesalesstage`, `stepname` |
| Dollar Movement | MSX + User | `get_opportunity_details` → `estimatedvalue`, `msp_billedrevenue` |
| Close Plan | User + WorkIQ | narrative |
| Risks / Blockers | User + WorkIQ | narrative |
| MACC Signal | User | usually manual |
| Owner & V-Team | MSX | `get_opportunity_details` → deal team members |
| Contribution / Impact | WorkIQ + User | narrative |

**Content rules:**
- MSX data fills structured fields (names, IDs, stages, dollar values, deal teams)
- WorkIQ fills narrative fields (what happened, blockers resolved, deliverables)
- For fields with no data, leave them **empty** — do not use placeholder text
- **Never fabricate.** If WorkIQ returns an activity you're unsure about, ask the user before including it. Better to omit than hallucinate.
- **Tone: succinct and factual.** State facts directly. Do not embellish, use resume-speak ("Spearheaded", "Orchestrated", "Named co-lead"), or pad with adjectives. Get the facts across as quickly as possible.
- **Links, not names.** When referencing Loop pages, docs, or other artifacts, include the actual URL. If WorkIQ can't provide a URL, omit the reference rather than using a quoted name.
- Order opportunities by impact/importance, not alphabetically
- **Contribution/Impact ordering:** Order by actual time invested, not perceived importance. Use Copilot session data and WorkIQ calendar data to estimate time allocation. Activities with the most evidence of time spent go first.

### Step 5: Review with the User

Present the full markdown to the user. Ask:
- "Are the featured opportunities correct?"
- "I found these activities from WorkIQ — are they all accurate?" (list key claims)
- "Anything to add/remove from Contribution/Impact?"

Iterate until the user is satisfied. **Stay in markdown.**

### Step 6: Final Format (only when asked)

Only when the user explicitly asks for a final document:

1. **Invoke the `docx` skill** to convert markdown to Word
2. Save as `monthly-update-YYYY-MM.docx`
3. The user will paste into OneNote

Do NOT jump to this step automatically. The user may want to edit the markdown further, paste it directly, or skip docx entirely.

---

## Template Reference

See `references/template.md` for the fillable template with all sections and MCP tool mapping hints.

## Usage Notes

- Run monthly, typically mid-month (covering the current or prior month — confirm with user)
- **VPN required:** Microsoft corporate VPN must be connected (MSX Dataverse is IP-restricted)
- **Azure CLI auth:** `az login` before first run each session
- Organize opportunities by impact/importance, not alphabetically
- Be conservative — only include what MSX or WorkIQ can evidence
- When in doubt, omit rather than fabricate
