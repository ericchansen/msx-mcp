import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { whoAmI, queryAll } from "../lib/dataverse.js";

interface StageSummary {
  count: number;
  estimatedValue: number;
  billedRevenue: number;
}

export function registerGetPipelineSummary(server: McpServer) {
  server.tool(
    "get_pipeline_summary",
    "Get an aggregate pipeline summary of your MSX deal team opportunities grouped by sales stage. Shows total value, count per stage, and critical deals.",
    {},
    async () => {
      try {
        const me = await whoAmI();
        const userId = me.UserId;

        // Query all deal team records for this user, expanding the parent opportunity
        const dealTeams = await queryAll("msp_dealteams", {
          filter: `_msp_dealteamuserid_value eq '${userId}'`,
          expand:
            "msp_parentopportunityid($select=name,estimatedvalue,msp_activesalesstage,msp_criticaldeal,msp_billedrevenue,statecode)",
        });

        // Deduplicate by opportunity ID and filter to open opportunities (statecode === 0)
        const seen = new Set<string>();
        const openOpps: any[] = [];

        for (const dt of dealTeams) {
          const opp = dt.msp_parentopportunityid;
          if (!opp) continue;
          const oppId: string =
            opp.opportunityid ?? dt._msp_parentopportunityid_value;
          if (!oppId || seen.has(oppId)) continue;
          if (opp.statecode !== 0) continue;
          seen.add(oppId);
          openOpps.push(opp);
        }

        // Aggregate by sales stage
        const stageMap = new Map<string, StageSummary>();
        let totalValue = 0;
        let totalBilled = 0;
        let criticalCount = 0;

        for (const opp of openOpps) {
          const stage: string = opp.msp_activesalesstage ?? "Unknown";
          const estValue: number = opp.estimatedvalue ?? 0;
          const billed: number = opp.msp_billedrevenue ?? 0;
          const isCritical: boolean = opp.msp_criticaldeal === true;

          if (!stageMap.has(stage)) {
            stageMap.set(stage, { count: 0, estimatedValue: 0, billedRevenue: 0 });
          }
          const summary = stageMap.get(stage)!;
          summary.count++;
          summary.estimatedValue += estValue;
          summary.billedRevenue += billed;

          totalValue += estValue;
          totalBilled += billed;
          if (isCritical) criticalCount++;
        }

        const totalCount = openOpps.length;
        const avgDealSize = totalCount > 0 ? totalValue / totalCount : 0;

        // Format output
        const fmt = (n: number) =>
          n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

        const lines: string[] = [
          "=== Pipeline Summary ===",
          "",
          `Total Deals: ${totalCount}`,
          `Total Pipeline Value: ${fmt(totalValue)}`,
          `Total Billed Revenue: ${fmt(totalBilled)}`,
          `Average Deal Size: ${fmt(avgDealSize)}`,
          `Critical Deals: ${criticalCount}`,
          "",
          "--- By Sales Stage ---",
        ];

        // Sort stages by estimated value descending
        const sorted = [...stageMap.entries()].sort(
          (a, b) => b[1].estimatedValue - a[1].estimatedValue
        );

        for (const [stage, s] of sorted) {
          lines.push("");
          lines.push(`  ${stage}`);
          lines.push(`    Count: ${s.count}`);
          lines.push(`    Estimated Value: ${fmt(s.estimatedValue)}`);
          lines.push(`    Billed Revenue: ${fmt(s.billedRevenue)}`);
        }

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error building pipeline summary: ${err.message ?? err}`,
            },
          ],
        };
      }
    }
  );
}
