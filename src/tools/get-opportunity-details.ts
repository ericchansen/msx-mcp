import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { get, query } from "../lib/dataverse.js";
import { buildDynamicsUrl } from "../lib/auth.js";

const OPPORTUNITY_FIELDS = [
  "name",
  "estimatedvalue",
  "estimatedclosedate",
  "stepname",
  "statecode",
  "statuscode",
  "msp_activesalesstage",
  "msp_criticaldeal",
  "msp_forecastcomments",
  "msp_billedrevenue",
  "msp_billedrevenuestatus",
  "msp_dealtype",
  "msp_salesplay",
  "msp_transactiontype",
  "msp_engagementstatus",
  "msp_rollupestrevenue",
  "msp_dealrole",
  "msp_closependingstatus",
  "msp_opportunitynumber",
];

const EXPAND = "parentaccountid($select=name)";

function formatOpportunity(opp: any): string {
  const lines: string[] = [
    `## ${opp.name ?? "(unnamed)"}`,
    "",
    `**MSX ID:** ${opp.msp_opportunitynumber ?? "N/A"}`,
    `**Opportunity GUID:** ${opp.opportunityid ?? "N/A"}`,
    `**Dynamics URL:** ${opp.opportunityid ? buildDynamicsUrl("opportunity", opp.opportunityid) : "N/A"}`,
    `**Account:** ${opp.parentaccountid?.name ?? "N/A"}`,
    `**Estimated Value:** ${opp.estimatedvalue != null ? `$${Number(opp.estimatedvalue).toLocaleString()}` : "N/A"}`,
    `**Est. Close Date:** ${opp.estimatedclosedate ?? "N/A"}`,
    `**Step Name:** ${opp.stepname ?? "N/A"}`,
    `**State:** ${opp["statecode@OData.Community.Display.V1.FormattedValue"] ?? opp.statecode ?? "N/A"}`,
    `**Status:** ${opp["statuscode@OData.Community.Display.V1.FormattedValue"] ?? opp.statuscode ?? "N/A"}`,
    `**Active Sales Stage:** ${opp.msp_activesalesstage ?? "N/A"}`,
    `**Critical Deal:** ${opp.msp_criticaldeal ?? "N/A"}`,
    `**Forecast Comments:** ${opp.msp_forecastcomments ?? "N/A"}`,
    `**Billed Revenue:** ${opp.msp_billedrevenue != null ? `$${Number(opp.msp_billedrevenue).toLocaleString()}` : "N/A"}`,
    `**Billed Revenue Status:** ${opp.msp_billedrevenuestatus ?? "N/A"}`,
    `**Deal Type:** ${opp.msp_dealtype ?? "N/A"}`,
    `**Sales Play:** ${opp.msp_salesplay ?? "N/A"}`,
    `**Transaction Type:** ${opp.msp_transactiontype ?? "N/A"}`,
    `**Engagement Status:** ${opp.msp_engagementstatus ?? "N/A"}`,
    `**Rollup Est. Revenue:** ${opp.msp_rollupestrevenue != null ? `$${Number(opp.msp_rollupestrevenue).toLocaleString()}` : "N/A"}`,
    `**Deal Role:** ${opp.msp_dealrole ?? "N/A"}`,
    `**Close Pending Status:** ${opp.msp_closependingstatus ?? "N/A"}`,
  ];
  return lines.join("\n");
}

export function registerGetOpportunityDetails(server: McpServer) {
  server.tool(
    "get_opportunity_details",
    "Get full details for a specific MSX opportunity by ID or name search. Returns all fields needed for monthly SE opportunity reports.",
    {
      opportunity_id: z.string().optional().describe("Dataverse opportunity GUID"),
      name_search: z.string().optional().describe("Search text to find opportunity by name (uses contains filter)"),
    },
    async ({ opportunity_id, name_search }) => {
      if (!opportunity_id && !name_search) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: Provide either opportunity_id or name_search.",
            },
          ],
        };
      }

      try {
        if (opportunity_id) {
          const opp = await get("opportunities", opportunity_id, {
            select: OPPORTUNITY_FIELDS,
            expand: EXPAND,
          });
          return {
            content: [{ type: "text" as const, text: formatOpportunity(opp) }],
          };
        }

        // name_search path
        const result = await query("opportunities", {
          filter: `contains(name,'${name_search!.replace(/'/g, "''")}')`,
          select: OPPORTUNITY_FIELDS,
          expand: EXPAND,
          top: 10,
          orderby: "modifiedon desc",
        });

        if (result.value.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No opportunities found matching "${name_search}".`,
              },
            ],
          };
        }

        const text = result.value.map(formatOpportunity).join("\n\n---\n\n");
        return {
          content: [
            {
              type: "text" as const,
              text: `Found ${result.value.length} opportunity(ies):\n\n${text}`,
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error fetching opportunity details: ${err.message}`,
            },
          ],
        };
      }
    }
  );
}
