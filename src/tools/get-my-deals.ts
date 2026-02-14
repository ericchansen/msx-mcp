import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { query, whoAmI } from "../lib/dataverse.js";

export function registerGetMyDeals(server: McpServer) {
  server.tool(
    "get_my_deals",
    "Get all opportunities you are on via MSX deal team membership. Returns opportunity name, account, sales stage, estimated value, close date, and more.",
    {
      limit: z.number().optional().describe("Maximum number of results to return (default 50)"),
    },
    async ({ limit }) => {
      const top = limit ?? 50;

      // Get the current user's Dataverse system user ID
      const me = await whoAmI();
      const userId = me.UserId;

      // Query deal team entries for this user, expanding the parent opportunity
      const result = await query("msp_dealteams", {
        filter: `_msp_dealteamuserid_value eq '${userId}'`,
        expand:
          "msp_parentopportunityid($select=name,estimatedvalue,estimatedclosedate,stepname,msp_activesalesstage,msp_criticaldeal,msp_forecastcomments,msp_billedrevenue,msp_dealtype,msp_salesplay,msp_opportunitynumber)",
        orderby: "msp_dateadded desc",
        top: top + 20, // over-fetch to account for duplicates
      });

      // Deduplicate by opportunity ID
      const seen = new Set<string>();
      const opportunities: any[] = [];
      for (const entry of result.value) {
        const opp = entry.msp_parentopportunityid;
        if (!opp) continue;
        const oppId: string =
          opp.opportunityid ?? entry._msp_parentopportunityid_value;
        if (!oppId || seen.has(oppId)) continue;
        seen.add(oppId);
        opportunities.push(opp);
        if (opportunities.length >= top) break;
      }

      if (opportunities.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No opportunities found for your deal team membership.",
            },
          ],
        };
      }

      const lines = opportunities.map((opp, i) => {
        const parts = [
          `${i + 1}. ${opp.name ?? "Unnamed Opportunity"}`,
          `   MSX ID: ${opp.msp_opportunitynumber ?? "N/A"}`,
          `   Opportunity ID: ${opp.opportunityid ?? "N/A"}`,
          `   Sales Stage: ${opp.msp_activesalesstage ?? opp.stepname ?? "N/A"}`,
          `   Estimated Value: ${opp.estimatedvalue != null ? `$${Number(opp.estimatedvalue).toLocaleString()}` : "N/A"}`,
          `   Close Date: ${opp.estimatedclosedate ?? "N/A"}`,
          `   Deal Type: ${opp.msp_dealtype ?? "N/A"}`,
          `   Sales Play: ${opp.msp_salesplay ?? "N/A"}`,
          `   Critical Deal: ${opp.msp_criticaldeal ?? "N/A"}`,
          `   Billed Revenue: ${opp.msp_billedrevenue != null ? `$${Number(opp.msp_billedrevenue).toLocaleString()}` : "N/A"}`,
          `   Forecast Comments: ${opp.msp_forecastcomments ?? "N/A"}`,
        ];
        return parts.join("\n");
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${opportunities.length} opportunities:\n\n${lines.join("\n\n")}`,
          },
        ],
      };
    }
  );
}
