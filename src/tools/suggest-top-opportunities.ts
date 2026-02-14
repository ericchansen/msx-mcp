import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { queryAll, whoAmI } from "../lib/dataverse.js";
import { buildDynamicsUrl } from "../lib/auth.js";

const STAGE_ORDER: Record<string, number> = {
  "Realize Value": 4,
  "Empower & Achieve": 3,
  "Inspire & Design": 2,
  "Listen & Consult": 1,
};

function stageRank(stage: string | null | undefined): number {
  if (!stage) return 0;
  return STAGE_ORDER[stage] ?? 0;
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "$0";
  return "$" + value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface DealTeamRecord {
  msp_dealteamid: string;
  msp_dateadded?: string;
  _msp_parentopportunityid_value?: string;
  msp_parentopportunityid?: {
    opportunityid?: string;
    name?: string;
    estimatedvalue?: number;
    estimatedclosedate?: string;
    stepname?: string;
    msp_activesalesstage?: string;
    msp_criticaldeal?: boolean;
    msp_forecastcomments?: string;
    msp_billedrevenue?: number;
    msp_dealtype?: string;
    msp_opportunitynumber?: string;
    createdon?: string;
    modifiedon?: string;
    statecode?: number;
  };
}

interface RankedOpportunity {
  opportunityId: string;
  msxId: string | null;
  name: string;
  estimatedValue: number;
  estimatedCloseDate: string | undefined;
  stage: string | undefined;
  activeSalesStage: string | undefined;
  criticalDeal: boolean;
  forecastComments: string | undefined;
  billedRevenue: number | undefined;
  dealType: string | undefined;
  dateAdded: string | undefined;
  modifiedOn: string | undefined;
  rationale: string;
}

export function registerSuggestTopOpportunities(server: McpServer) {
  server.tool(
    "suggest_top_opportunities",
    "Suggest which opportunities to highlight in your monthly SE report. Ranks your deals by value, recency, critical status, or activity and provides a rationale for each suggestion.",
    {
      criteria: z
        .enum(["by_value", "by_recency", "by_stage_progress", "critical_only"])
        .optional()
        .default("by_value")
        .describe(
          "Ranking criteria: by_value (highest deal value), by_recency (most recently added to your deal team), by_stage_progress (most advanced sales stage), critical_only (critical deals sorted by value)"
        ),
      count: z
        .number()
        .int()
        .min(1)
        .max(10)
        .optional()
        .default(3)
        .describe("Number of top opportunities to return (1-10)"),
    },
    async ({ criteria, count }) => {
      // 1. Get current user
      const me = await whoAmI();
      const userId = me.UserId;

      // 2. Query all deal team records for the user, expanding opportunity
      const dealTeams = (await queryAll("msp_dealteams", {
        filter: `_msp_dealteamuserid_value eq '${userId}'`,
        expand:
          "msp_parentopportunityid($select=name,estimatedvalue,estimatedclosedate,stepname,msp_activesalesstage,msp_criticaldeal,msp_forecastcomments,msp_billedrevenue,msp_dealtype,msp_opportunitynumber,createdon,modifiedon,statecode)",
        select: ["msp_dealteamid", "msp_dateadded"],
      })) as DealTeamRecord[];

      // 3. Deduplicate by opportunity ID and filter to open opportunities
      const seen = new Set<string>();
      const openDeals: { deal: DealTeamRecord; opp: NonNullable<DealTeamRecord["msp_parentopportunityid"]>; oppId: string }[] = [];

      for (const dt of dealTeams) {
        const opp = dt.msp_parentopportunityid;
        if (!opp) continue;

        const oppId =
          opp.opportunityid ?? dt._msp_parentopportunityid_value ?? "";
        if (!oppId || seen.has(oppId)) continue;

        // Filter to open only (statecode 0)
        if (opp.statecode !== 0) continue;

        seen.add(oppId);
        openDeals.push({ deal: dt, opp, oppId });
      }

      if (openDeals.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No open opportunities found on your deal team. Make sure you have active deal team memberships in MSX.",
            },
          ],
        };
      }

      // 4. Sort based on criteria
      let sorted = [...openDeals];

      switch (criteria) {
        case "by_value":
          sorted.sort(
            (a, b) => (b.opp.estimatedvalue ?? 0) - (a.opp.estimatedvalue ?? 0)
          );
          break;
        case "by_recency":
          sorted.sort((a, b) => {
            const da = a.deal.msp_dateadded ?? "";
            const db = b.deal.msp_dateadded ?? "";
            return db.localeCompare(da);
          });
          break;
        case "by_stage_progress":
          sorted.sort((a, b) => {
            const diff =
              stageRank(b.opp.msp_activesalesstage) -
              stageRank(a.opp.msp_activesalesstage);
            if (diff !== 0) return diff;
            return (b.opp.estimatedvalue ?? 0) - (a.opp.estimatedvalue ?? 0);
          });
          break;
        case "critical_only":
          sorted = sorted.filter((d) => d.opp.msp_criticaldeal === true);
          sorted.sort(
            (a, b) => (b.opp.estimatedvalue ?? 0) - (a.opp.estimatedvalue ?? 0)
          );
          if (sorted.length === 0) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "No critical deals found on your deal team. Try a different criteria such as by_value or by_stage_progress.",
                },
              ],
            };
          }
          break;
      }

      // 5. Take top N
      const topN = sorted.slice(0, count);

      // 6. Build ranked results with rationale
      const ranked: RankedOpportunity[] = topN.map((item, idx) => {
        const { opp, deal } = item;
        let rationale: string;

        switch (criteria) {
          case "by_value":
            rationale = `Highest estimated value at ${formatCurrency(opp.estimatedvalue)} (#${idx + 1} by deal size)`;
            break;
          case "by_recency":
            rationale = `Most recently added to your deal team on ${formatDate(deal.msp_dateadded)}`;
            break;
          case "by_stage_progress":
            rationale = `Most advanced stage: ${opp.msp_activesalesstage ?? opp.stepname ?? "Unknown"}`;
            break;
          case "critical_only":
            rationale = `Critical deal flagged by management, valued at ${formatCurrency(opp.estimatedvalue)}`;
            break;
        }

        return {
          opportunityId: item.oppId,
          msxId: opp.msp_opportunitynumber ?? null,
          name: opp.name ?? "Unnamed Opportunity",
          estimatedValue: opp.estimatedvalue ?? 0,
          estimatedCloseDate: opp.estimatedclosedate,
          stage: opp.stepname,
          activeSalesStage: opp.msp_activesalesstage,
          criticalDeal: opp.msp_criticaldeal ?? false,
          forecastComments: opp.msp_forecastcomments,
          billedRevenue: opp.msp_billedrevenue,
          dealType: opp.msp_dealtype,
          dateAdded: deal.msp_dateadded,
          modifiedOn: opp.modifiedon,
          rationale,
        };
      });

      // 7. Format output
      const criteriaLabel: Record<string, string> = {
        by_value: "Highest Value",
        by_recency: "Most Recently Added",
        by_stage_progress: "Most Advanced Stage",
        critical_only: "Critical Deals",
      };

      const lines: string[] = [
        `## Top ${ranked.length} Opportunities — ${criteriaLabel[criteria]}`,
        `*Suggested highlights for your monthly SE report*`,
        "",
      ];

      for (let i = 0; i < ranked.length; i++) {
        const r = ranked[i];
        lines.push(`### #${i + 1}: ${r.name}`);
        lines.push(`- **MSX ID:** ${r.msxId ?? "N/A"}`);
        lines.push(`- **Opportunity ID:** ${r.opportunityId}`);
        lines.push(`- **Dynamics URL:** ${buildDynamicsUrl("opportunity", r.opportunityId)}`);
        lines.push(`- **Value:** ${formatCurrency(r.estimatedValue)}`);
        lines.push(`- **Close Date:** ${formatDate(r.estimatedCloseDate)}`);
        lines.push(
          `- **Stage:** ${r.activeSalesStage ?? r.stage ?? "N/A"}`
        );
        lines.push(`- **Critical Deal:** ${r.criticalDeal ? "Yes ⚠️" : "No"}`);
        if (r.dealType) lines.push(`- **Deal Type:** ${r.dealType}`);
        if (r.billedRevenue != null)
          lines.push(
            `- **Billed Revenue:** ${formatCurrency(r.billedRevenue)}`
          );
        if (r.forecastComments)
          lines.push(`- **Forecast Comments:** ${r.forecastComments}`);
        lines.push(`- **Added to Deal Team:** ${formatDate(r.dateAdded)}`);
        lines.push(`- **Last Modified:** ${formatDate(r.modifiedOn)}`);
        lines.push(`- **💡 Rationale:** ${r.rationale}`);
        lines.push("");
      }

      lines.push(
        `---`,
        `_${openDeals.length} total open opportunities on your deal team. Showing top ${ranked.length} by "${criteriaLabel[criteria]}"._`
      );

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );
}
