import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { query } from "../lib/dataverse.js";

export function registerSearchOpportunities(server: McpServer) {
  server.tool(
    "search_opportunities",
    "Search MSX opportunities by name, account, status, sales stage, value range, or close date range. Returns matching opportunities with key details.",
    {
      search_text: z
        .string()
        .optional()
        .describe("Search text to match against opportunity name (contains filter)"),
      account_name: z
        .string()
        .optional()
        .describe("Filter by parent account name (contains filter, client-side)"),
      status: z
        .enum(["open", "won", "lost"])
        .optional()
        .describe("Filter by opportunity status: open (active), won, or lost"),
      min_value: z
        .number()
        .optional()
        .describe("Minimum estimated value filter"),
      sales_stage: z
        .string()
        .optional()
        .describe("Filter by active sales stage (contains filter)"),
      limit: z
        .number()
        .optional()
        .default(20)
        .describe("Maximum number of results to return (default 20, max 100)"),
    },
    async ({ search_text, account_name, status, min_value, sales_stage, limit }) => {
      const filters: string[] = [];

      if (search_text) {
        filters.push(`contains(name,'${escapeOData(search_text)}')`);
      }

      if (status) {
        const stateMap: Record<string, number> = { open: 0, won: 1, lost: 2 };
        filters.push(`statecode eq ${stateMap[status]}`);
      }

      if (min_value !== undefined) {
        filters.push(`estimatedvalue ge ${min_value}`);
      }

      if (sales_stage) {
        filters.push(`contains(msp_activesalesstage,'${escapeOData(sales_stage)}')`);
      }

      const effectiveLimit = Math.min(limit ?? 20, 100);

      // When filtering by account_name client-side, fetch more rows to compensate
      const fetchTop = account_name ? Math.min(effectiveLimit * 5, 500) : effectiveLimit;

      const result = await query("opportunities", {
        select: [
          "name",
          "estimatedvalue",
          "estimatedclosedate",
          "stepname",
          "statecode",
          "msp_activesalesstage",
          "msp_criticaldeal",
          "msp_dealtype",
          "msp_opportunitynumber",
        ],
        filter: filters.length ? filters.join(" and ") : undefined,
        expand: "parentaccountid($select=name)",
        orderby: "estimatedvalue desc",
        top: fetchTop,
      });

      let opportunities = result.value;

      // Client-side filter for account name since OData navigation property filters
      // are not reliably supported on all Dataverse deployments
      if (account_name) {
        const lowerAccount = account_name.toLowerCase();
        opportunities = opportunities.filter(
          (opp: any) =>
            opp.parentaccountid?.name?.toLowerCase().includes(lowerAccount)
        );
      }

      opportunities = opportunities.slice(0, effectiveLimit);

      if (opportunities.length === 0) {
        return {
          content: [
            { type: "text" as const, text: "No opportunities found matching the specified criteria." },
          ],
        };
      }

      const statusLabels: Record<number, string> = { 0: "Open", 1: "Won", 2: "Lost" };

      const formatted = opportunities.map((opp: any, i: number) => {
        const lines = [
          `${i + 1}. ${opp.name}`,
          `   MSX ID: ${opp.msp_opportunitynumber ?? "N/A"}`,
          `   Opportunity ID: ${opp.opportunityid ?? "N/A"}`,
          `   Account: ${opp.parentaccountid?.name ?? "N/A"}`,
          `   Est. Value: ${opp.estimatedvalue != null ? `$${Number(opp.estimatedvalue).toLocaleString()}` : "N/A"}`,
          `   Close Date: ${opp.estimatedclosedate ?? "N/A"}`,
          `   Status: ${statusLabels[opp.statecode] ?? opp.statecode}`,
          `   Sales Stage: ${opp.msp_activesalesstage ?? "N/A"}`,
          `   Step: ${opp.stepname ?? "N/A"}`,
          `   Deal Type: ${opp.msp_dealtype ?? "N/A"}`,
          `   Critical Deal: ${opp.msp_criticaldeal ?? "N/A"}`,
        ];
        return lines.join("\n");
      });

      const summary = `Found ${opportunities.length} opportunit${opportunities.length === 1 ? "y" : "ies"}:\n\n`;
      return {
        content: [{ type: "text" as const, text: summary + formatted.join("\n\n") }],
      };
    }
  );
}

export function escapeOData(value: string): string {
  return value.replace(/'/g, "''");
}
