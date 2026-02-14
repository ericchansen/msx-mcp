// Auth module for MSX Dataverse
// Uses AzureCliCredential — user must be logged in via `az login`
// Scope: https://microsoftsales.crm.dynamics.com/.default

import { AzureCliCredential, DeviceCodeCredential } from "@azure/identity";

const DATAVERSE_SCOPE = "https://microsoftsales.crm.dynamics.com/.default";

let credential: AzureCliCredential | DeviceCodeCredential;

export function getCredential() {
  if (!credential) {
    credential = new AzureCliCredential();
  }
  return credential;
}

export async function getAccessToken(): Promise<string> {
  const cred = getCredential();
  const token = await cred.getToken(DATAVERSE_SCOPE);
  if (!token) {
    throw new Error("Failed to acquire token for MSX Dataverse. Ensure you are logged in via 'az login'");
  }
  return token.token;
}

export function getDataverseUrl(): string {
  return process.env.DATAVERSE_URL || "https://microsoftsales.crm.dynamics.com";
}

/** Build a Dynamics 365 deep link for an entity record */
export function buildDynamicsUrl(entity: string, id: string): string {
  const base = getDataverseUrl();
  return `${base}/main.aspx?pagetype=entityrecord&etn=${entity}&id=${id}`;
}
