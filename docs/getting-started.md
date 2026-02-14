# Getting Started

Set up msx-mcp to pull live MSX sales data into GitHub Copilot CLI. This guide covers installation, authentication, and your first query.

## Prerequisites

| Requirement | Why |
|-------------|-----|
| **Node.js ≥ 18** | Runs the MCP server |
| **Azure CLI** | Authenticates to MSX Dataverse |
| **Microsoft Corporate VPN** | MSX Dataverse is IP-restricted |
| **[GitHub Copilot CLI](https://github.com/github/copilot-cli)** | The AI agent that uses the MCP tools |
| **MSX access** | You need a Dataverse license with read access to opportunities, deal teams, and account teams |

## Step 1: Install GitHub Copilot CLI

[GitHub Copilot CLI](https://github.com/github/copilot-cli) is in public preview. Install it using any of these methods:

**npm (any platform):**
```bash
npm install -g @github/copilot@prerelease
```

**macOS / Linux (Homebrew):**
```bash
brew install copilot-cli@prerelease
```

**Windows (WinGet):**
```bash
winget install GitHub.Copilot.Prerelease
```

**macOS / Linux (install script):**
```bash
curl -fsSL https://gh.io/copilot-install | bash
```

Verify it's working:

```bash
copilot --version
```

On first launch, you'll be prompted to log in with your GitHub account.

## Step 2: Clone and Build msx-mcp

```bash
cd ~/repos
git clone https://github.com/ericchansen/msx-mcp.git
cd msx-mcp
npm install
npm run build
```

Verify the build succeeded — you should see a `dist/` directory with compiled JavaScript.

## Step 3: Configure the MCP Server

**Option A: Let Copilot do it.** Open Copilot CLI in the msx-mcp directory and ask:

```
copilot
# then type: "Set up this MCP server so I can use it from anywhere"
```

Copilot will read the project and offer to add it to your `~/.copilot/mcp-config.json`.

**Option B: Manual.** Create or edit `~/.copilot/mcp-config.json`:

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

> **Tip:** Use the absolute path to `dist/index.js`. On Windows, use forward slashes (e.g., `C:/Users/you/repos/msx-mcp/dist/index.js`).

If you're using the [copilot-config](https://github.com/ericchansen/copilot-config) repo, msx-mcp is already registered — just run `setup.ps1`.

## Step 4: Authenticate to MSX

Sign in with Azure CLI using your corporate account:

```bash
az login
```

This opens a browser window. Sign in with your corporate account that has MSX access.

Verify your token works:

```bash
az account get-access-token --resource https://microsoftsales.crm.dynamics.com/ --query accessToken -o tsv
```

If you see a long JWT string, authentication is working.

## Step 5: Connect to VPN

MSX Dataverse enforces IP-based access control. You **must** be on the Microsoft corporate VPN.

The MCP server runs a preflight health check at startup — if VPN or auth is missing, you'll see a clear error message in the Copilot CLI output.

## Step 6: Test the MCP Server

Start a Copilot CLI session and try a simple query:

```
copilot "Show me my MSX deal team memberships"
```

Copilot should call the `get_my_deals` tool and return a list of your opportunities.

## Troubleshooting

### "Dataverse request failed [403]"
You're not on VPN. Connect to your corporate VPN and retry.

### "AzureCliCredential authentication failed"
Run `az login` again. Tokens expire after ~1 hour of inactivity.

### "No deals found"
You may not have any deal team memberships in MSX. Try `get_account_team` instead — if that returns results, your auth is working but you're not on any deal teams.

### MCP server not showing up in Copilot
1. Verify `mcp-config.json` path is correct
2. Run `npm run build` in the msx-mcp directory
3. Restart Copilot CLI
4. Check that `dist/index.js` exists

## Next Steps

- Try the [example prompts](./example-prompts.md) to explore what's possible
- Run your first monthly report: `"Generate my monthly opportunity report"`
- Generate a weekly report: `"Create my weekly impact report"`
