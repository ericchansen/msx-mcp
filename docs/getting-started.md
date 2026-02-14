---
layout: page
title: Getting Started
permalink: /getting-started/
---

Set up msx-mcp to pull live MSX sales data into GitHub Copilot CLI.

## The Short Version

```bash
winget install GitHub.Copilot.Prerelease
git clone https://github.com/ericchansen/msx-mcp.git
cd msx-mcp
az login
# connect to corporate VPN
copilot --yolo # then ask: "Set up this MCP server & skills so I can use it"
```

Copilot handles the rest — installing dependencies, building, configuring MCP. Once it's done, you'll have to close and re-enter Copilot for it to automatically start the MCP server. Then try asking it to "Generate my monthly opportunity report".

## Install Options for Copilot CLI

[GitHub Copilot CLI](https://github.com/github/copilot-cli) is in public preview:

| Platform | Command |
|----------|---------|
| Windows | `winget install GitHub.Copilot.Prerelease` |
| npm (any) | `npm install -g @github/copilot@prerelease` |
| macOS / Linux | `brew install copilot-cli@prerelease` |

On first launch, you'll be prompted to log in with your GitHub account.

## Auth & VPN

1. `az login` — sign in with your corporate account that has MSX access
2. Connect to corporate VPN — MSX Dataverse is IP-restricted

The MCP server runs a preflight health check at startup and will tell you if either is missing.

## Troubleshooting

### `Dataverse request failed [403]`
You're not on VPN. Connect to your corporate VPN and retry.

### `AzureCliCredential authentication failed`
Run `az login` again. Tokens expire after ~1 hour of inactivity.

### `No deals found`
You may not have any deal team memberships in MSX. Try `get_account_team` instead — if that returns results, your auth is working but you're not on any deal teams.

### MCP server not showing up in Copilot
1. Verify `mcp-config.json` path is correct
2. Run `npm run build` in the msx-mcp directory
3. Restart Copilot CLI
4. Check that `dist/index.js` exists

## Manual Setup

<details markdown="1">
<summary>Click to expand manual build, configuration, and skill setup steps</summary>

#### Build

```bash
cd msx-mcp
npm install
npm run build
```

Verify the build succeeded — you should see a `dist/` directory with compiled JavaScript.

#### Configure MCP

Create or edit `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "msx-mcp": {
      "type": "local",
      "command": "node",
      "tools": ["*"],
      "args": ["/absolute/path/to/msx-mcp/dist/index.js"]
    }
  }
}
```

Use the absolute path to `dist/index.js`. On Windows, use forward slashes (e.g., `C:/Users/you/repos/msx-mcp/dist/index.js`).

If you're using the [copilot-config](https://github.com/ericchansen/copilot-config) repo, msx-mcp is already registered — just run `setup.ps1`.

#### Install Skills

The MCP tools work automatically once configured, but the Copilot Skills (monthly-opportunity-report, weekly-impact-report) need to be installed separately. Skills are markdown-based prompts that live in the `skills/` directory and give Copilot structured instructions for multi-step workflows like generating reports. Without them, you can still use the raw MCP tools but won't get the guided report generation experience.

Copy the skill folders into your Copilot skills directory:

```bash
cp -r skills/monthly-opportunity-report ~/.copilot/skills/
cp -r skills/weekly-impact-report ~/.copilot/skills/
```

On Windows:

```powershell
Copy-Item -Recurse skills\monthly-opportunity-report $env:USERPROFILE\.copilot\skills\
Copy-Item -Recurse skills\weekly-impact-report $env:USERPROFILE\.copilot\skills\
```

#### Auth

```bash
az account get-access-token --resource https://microsoftsales.crm.dynamics.com/ --query accessToken -o tsv
```

If you see a long JWT string, authentication is working.

</details>

## Next Steps

- Try the [example prompts](/msx-mcp/example-prompts/) to explore what's possible
- Run your first monthly report: `"Generate my monthly opportunity report"`
- Generate a weekly report: `"Create my weekly impact report"`
