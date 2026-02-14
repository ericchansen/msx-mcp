import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGetAccountTeam } from "./tools/get-account-team.js";
import { registerGetMyDeals } from "./tools/get-my-deals.js";
import { registerGetPipelineSummary } from "./tools/get-pipeline-summary.js";
import { registerGetOpportunityDetails } from "./tools/get-opportunity-details.js";
import { registerSuggestTopOpportunities } from "./tools/suggest-top-opportunities.js";
import { registerSearchOpportunities } from "./tools/search-opportunities.js";
import { whoAmI } from "./lib/dataverse.js";

const server = new McpServer({
  name: "msx-mcp",
  version: "0.1.0",
});

// Register tools
registerGetAccountTeam(server);
registerGetMyDeals(server);
registerGetPipelineSummary(server);
registerSuggestTopOpportunities(server);
registerGetOpportunityDetails(server);
registerSearchOpportunities(server);

async function preflight() {
  try {
    const me = await whoAmI();
    console.error(`✓ Connected to MSX Dataverse (UserId: ${me.UserId})`);
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    if (msg.includes("az login") || msg.includes("AzureCliCredential")) {
      console.error("✗ Auth failed — run: az login");
    } else if (msg.includes("ETIMEDOUT") || msg.includes("ECONNREFUSED") || msg.includes("fetch failed")) {
      console.error("✗ Cannot reach MSX Dataverse — ensure Microsoft VPN is connected");
    } else {
      console.error(`✗ MSX preflight failed: ${msg}`);
    }
    // Non-fatal: server still starts so user sees the error in tool output
  }
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MSX MCP server running on stdio");
  await preflight();
}

main().catch(console.error);
