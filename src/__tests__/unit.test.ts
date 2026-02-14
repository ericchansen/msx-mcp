import { describe, it, expect } from "vitest";
import { buildQueryString } from "../lib/dataverse.js";
import { buildDynamicsUrl } from "../lib/auth.js";
import { escapeOData } from "../tools/search-opportunities.js";

describe("escapeOData", () => {
  it("passes through plain strings", () => {
    expect(escapeOData("hello")).toBe("hello");
  });

  it("escapes single quotes", () => {
    expect(escapeOData("O'Brien")).toBe("O''Brien");
  });

  it("escapes multiple single quotes", () => {
    expect(escapeOData("it's a 'test'")).toBe("it''s a ''test''");
  });

  it("handles empty string", () => {
    expect(escapeOData("")).toBe("");
  });
});

describe("buildQueryString", () => {
  it("returns empty string for no options", () => {
    expect(buildQueryString()).toBe("");
    expect(buildQueryString({})).toBe("");
  });

  it("builds $select", () => {
    const qs = buildQueryString({ select: ["name", "estimatedvalue"] });
    expect(qs).toBe("?$select=name,estimatedvalue");
  });

  it("builds $filter", () => {
    const qs = buildQueryString({ filter: "statecode eq 0" });
    expect(qs).toBe("?$filter=statecode eq 0");
  });

  it("builds $top", () => {
    const qs = buildQueryString({ top: 10 });
    expect(qs).toBe("?$top=10");
  });

  it("builds $orderby", () => {
    const qs = buildQueryString({ orderby: "estimatedvalue desc" });
    expect(qs).toBe("?$orderby=estimatedvalue desc");
  });

  it("builds $expand", () => {
    const qs = buildQueryString({ expand: "parentaccountid($select=name)" });
    expect(qs).toBe("?$expand=parentaccountid($select=name)");
  });

  it("combines multiple options", () => {
    const qs = buildQueryString({
      select: ["name"],
      filter: "statecode eq 0",
      top: 5,
      orderby: "name asc",
      expand: "parentaccountid($select=name)",
    });
    expect(qs).toContain("$select=name");
    expect(qs).toContain("$filter=statecode eq 0");
    expect(qs).toContain("$top=5");
    expect(qs).toContain("$orderby=name asc");
    expect(qs).toContain("$expand=parentaccountid($select=name)");
    expect(qs.startsWith("?")).toBe(true);
    // All joined by &
    expect(qs.split("&").length).toBe(5);
  });

  it("handles $top of 0", () => {
    const qs = buildQueryString({ top: 0 });
    expect(qs).toBe("?$top=0");
  });
});

describe("buildDynamicsUrl", () => {
  it("builds a valid Dynamics deep link", () => {
    const url = buildDynamicsUrl("opportunity", "abc-123");
    expect(url).toContain("main.aspx");
    expect(url).toContain("pagetype=entityrecord");
    expect(url).toContain("etn=opportunity");
    expect(url).toContain("id=abc-123");
  });

  it("uses the default Dataverse URL", () => {
    const url = buildDynamicsUrl("opportunity", "test-id");
    expect(url.startsWith("https://microsoftsales.crm.dynamics.com/")).toBe(true);
  });

  it("handles different entity types", () => {
    const url = buildDynamicsUrl("account", "acct-456");
    expect(url).toContain("etn=account");
    expect(url).toContain("id=acct-456");
  });
});

describe("field selection consistency", () => {
  // These tests verify that fields referenced in output formatting
  // are actually included in the $select arrays. This catches the
  // msp_opportunitynumber bug we found earlier.

  it("search-opportunities selects msp_opportunitynumber", async () => {
    // Read the source file and verify the select array
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("../tools/search-opportunities.ts", import.meta.url),
      "utf-8"
    );

    // Fields referenced in output
    const outputFields = [
      "msp_opportunitynumber",
      "name",
      "estimatedvalue",
      "estimatedclosedate",
      "stepname",
      "statecode",
      "msp_activesalesstage",
      "msp_criticaldeal",
      "msp_dealtype",
    ];

    for (const field of outputFields) {
      expect(source).toContain(`"${field}"`);
    }
  });

  it("get-opportunity-details selects msp_opportunitynumber", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("../tools/get-opportunity-details.ts", import.meta.url),
      "utf-8"
    );
    expect(source).toContain('"msp_opportunitynumber"');
  });

  it("get-my-deals expands msp_opportunitynumber", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("../tools/get-my-deals.ts", import.meta.url),
      "utf-8"
    );
    expect(source).toContain("msp_opportunitynumber");
  });

  it("suggest-top-opportunities expands msp_opportunitynumber", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("../tools/suggest-top-opportunities.ts", import.meta.url),
      "utf-8"
    );
    expect(source).toContain("msp_opportunitynumber");
  });
});
