# msx-mcp

MCP server + Copilot skills for Microsoft Sales Experience (MSX) — pulls structured sales data from MSX Dataverse for use in GitHub Copilot.

## What It Does

Connects to the MSX Dataverse Web API to provide 6 MCP tools for querying opportunities, deal teams, accounts, and pipeline data. Ships with 2 Copilot skills that use these tools to generate SE reports.

### MCP Tools

| Tool | Description |
|------|-------------|
| `get_my_deals` | Your deal team memberships with opportunity details |
| `get_opportunity_details` | Full details for a specific opportunity (by ID or name) |
| `get_account_team` | Your account assignments, roles, and solution areas |
| `search_opportunities` | Filter opportunities by account, status, value, stage, dates |
| `get_pipeline_summary` | Pipeline aggregated by sales stage with dollar totals |
| `suggest_top_opportunities` | Ranked deals for monthly report inclusion |

### Copilot Skills

| Skill | Description |
|-------|-------------|
| `monthly-opportunity-report` | Auto-generates monthly SE Opportunity Update reports (discovers accounts + deals, presents choices, builds report) |
| `weekly-impact-report` | Evidence-based weekly impact reports with optional MSX deal context |

## Quick Start

```bash
winget install GitHub.Copilot.Prerelease
git clone https://github.com/ericchansen/msx-mcp.git
cd msx-mcp
az login
# connect to corporate VPN
copilot --yolo # then ask: "Set up this MCP server & skills so I can use it"
```

Copilot handles the rest — installing dependencies, building, configuring MCP. Once it's done, you'll have to close and re-enter Copilot for it to automatically start the MCP server. Then try asking it to "Generate my monthly opportunity report".

If you'd rather do it yourself, refer to the [manual setup](docs/getting-started.md#manual-setup) docs.

> VPN required — MSX Dataverse is IP-restricted to Microsoft corporate network. The server runs a preflight check at startup and will tell you if VPN or auth is missing.

## Documentation

- **[Getting Started](docs/getting-started.md)** — Detailed setup, authentication, and troubleshooting
- **[Example Prompts](docs/example-prompts.md)** — Real-world prompts for reports and data queries

## Architecture

```
GitHub Copilot (VS Code / CLI)
  │
  ├── stdio ──▶ MSX MCP Server (TypeScript)
  │                    │
  │             Dataverse Web API (OData v4)
  │                    │
  │             MSX D365 Sales
  │             (microsoftsales.crm.dynamics.com)
  │
  └── Skills ──▶ skills/monthly-opportunity-report/
                 skills/weekly-impact-report/
```

## Prerequisites

- **[GitHub Copilot CLI](https://github.com/github/copilot-cli)** — The AI agent that uses the MCP tools
- **Microsoft Corporate VPN** — MSX Dataverse has IP-based access control
- **Azure CLI** — `az login` with your corporate account
- **Node.js** ≥ 18
- **MSX access** — Dataverse read permissions on `opportunities`, `msp_dealteams`, `msp_accountteams`

## Development

```bash
npm run build     # Compile TypeScript
npm run dev       # Build + watch
npm test          # Run unit tests (vitest)
```
