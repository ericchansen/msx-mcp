import { getAccessToken, getDataverseUrl } from "./auth.js";

const API_PATH = "/api/data/v9.2/";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export interface QueryOptions {
  select?: string[];
  filter?: string;
  top?: number;
  orderby?: string;
  expand?: string;
}

interface ODataCollectionResponse {
  value: any[];
  "@odata.nextLink"?: string;
}

// Build OData query string from options
export function buildQueryString(options?: QueryOptions): string {
  if (!options) return "";
  const params: string[] = [];
  if (options.select?.length) params.push(`$select=${options.select.join(",")}`);
  if (options.filter) params.push(`$filter=${options.filter}`);
  if (options.top !== undefined) params.push(`$top=${options.top}`);
  if (options.orderby) params.push(`$orderby=${options.orderby}`);
  if (options.expand) params.push(`$expand=${options.expand}`);
  return params.length ? `?${params.join("&")}` : "";
}

// Core request function with auth, OData headers, and retry on 429
async function request<T>(path: string, method = "GET"): Promise<T> {
  const baseUrl = getDataverseUrl();
  const url = path.startsWith("http") ? path : `${baseUrl}${API_PATH}${path}`;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const token = await getAccessToken();

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        Accept: "application/json",
        Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
      },
    });

    if (res.ok) {
      return (await res.json()) as T;
    }

    // Retry on 429 or 5xx with exponential backoff
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
      const retryAfter = res.headers.get("Retry-After");
      const delayMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : BASE_DELAY_MS * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }

    // Extract OData error details
    let errorMessage: string;
    try {
      const body = await res.json();
      errorMessage =
        body?.error?.message ?? body?.Message ?? JSON.stringify(body);
    } catch {
      errorMessage = res.statusText;
    }

    lastError = new Error(
      `Dataverse request failed [${res.status}]: ${errorMessage} (${method} ${url})`
    );
  }

  throw lastError ?? new Error("Dataverse request failed after retries");
}

/** Query an entity set with OData options. */
export async function query(
  entitySet: string,
  options?: QueryOptions
): Promise<{ value: any[]; nextLink?: string }> {
  const qs = buildQueryString(options);
  const data = await request<ODataCollectionResponse>(`${entitySet}${qs}`);
  return {
    value: data.value,
    nextLink: data["@odata.nextLink"],
  };
}

/** Query an entity set and follow all @odata.nextLink pages (max 2000 records). */
export async function queryAll(
  entitySet: string,
  options?: QueryOptions
): Promise<any[]> {
  const MAX_RECORDS = 2000;
  const results: any[] = [];
  let page = await query(entitySet, options);
  results.push(...page.value);

  while (page.nextLink && results.length < MAX_RECORDS) {
    const data = await request<ODataCollectionResponse>(page.nextLink);
    results.push(...data.value);
    page = {
      value: data.value,
      nextLink: data["@odata.nextLink"],
    };
  }

  return results;
}

/** Get a single record by entity set name and record ID. */
export async function get(
  entitySet: string,
  id: string,
  options?: Pick<QueryOptions, "select" | "expand">
): Promise<any> {
  const qs = buildQueryString(options);
  return request<any>(`${entitySet}(${id})${qs}`);
}

/** Call the WhoAmI unbound function. */
export async function whoAmI(): Promise<{
  UserId: string;
  OrganizationId: string;
  BusinessUnitId: string;
}> {
  return request("WhoAmI");
}
