import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { query, whoAmI } from "../lib/dataverse.js";

export function registerGetAccountTeam(server: McpServer) {
  server.tool(
    "get_account_team",
    "Get your MSX account team memberships showing which accounts you're assigned to, your role, and solution area.",
    {
      limit: z
        .number()
        .optional()
        .describe("Maximum number of results to return (default 50)"),
    },
    async ({ limit }) => {
      const top = limit ?? 50;

      const identity = await whoAmI();
      const userId = identity.UserId;

      // Try with $expand first to get account name inline
      let records: any[];
      try {
        const result = await query("msp_accountteams", {
          filter: `_msp_systemuserid_value eq '${userId}'`,
          select: [
            "msp_name",
            "msp_fullname",
            "msp_rolename",
            "msp_roletype",
            "msp_solutionarea",
            "msp_title",
            "msp_qualifier1",
            "msp_qualifier2",
          ],
          expand: "msp_AccountId($select=name)",
          top,
        });
        records = result.value;
      } catch {
        // Fallback: use lookup annotation for account name
        const result = await query("msp_accountteams", {
          filter: `_msp_systemuserid_value eq '${userId}'`,
          select: [
            "msp_name",
            "msp_fullname",
            "msp_rolename",
            "msp_roletype",
            "msp_solutionarea",
            "msp_title",
            "msp_qualifier1",
            "msp_qualifier2",
            "_msp_accountid_value",
          ],
          top,
        });
        records = result.value;
      }

      if (records.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No account team memberships found for your user.",
            },
          ],
        };
      }

      const lines = records.map((r, i) => {
        const accountName =
          r.msp_AccountId?.name ??
          r["_msp_accountid_value@OData.Community.Display.V1.FormattedValue"] ??
          r._msp_accountid_value ??
          "Unknown";

        const parts = [
          `${i + 1}. **${accountName}**`,
          r.msp_rolename ? `   Role: ${r.msp_rolename}` : null,
          r.msp_roletype ? `   Role Type: ${r.msp_roletype}` : null,
          r.msp_solutionarea ? `   Solution Area: ${r.msp_solutionarea}` : null,
          r.msp_title ? `   Title: ${r.msp_title}` : null,
          r.msp_fullname ? `   Name: ${r.msp_fullname}` : null,
          r.msp_qualifier1 ? `   Qualifier 1: ${r.msp_qualifier1}` : null,
          r.msp_qualifier2 ? `   Qualifier 2: ${r.msp_qualifier2}` : null,
        ];
        return parts.filter(Boolean).join("\n");
      });

      const text = `Found ${records.length} account team membership(s):\n\n${lines.join("\n\n")}`;

      return {
        content: [{ type: "text" as const, text }],
      };
    }
  );
}
