import type {
  FleetAgentsResponse,
  FleetChatResponse,
  FleetEventsResponse,
  FleetOrchestrator,
  FleetTenantInfoResponse,
  FleetTenantsResponse,
} from "~/lib/fleet/types";

function buildFleetApiPath(path: string): string {
  if (path.startsWith("/")) return `/api/fleet${path}`;
  return `/api/fleet/${path}`;
}

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { accept: "application/json", ...(init?.headers ?? {}) },
  });

  if (res.status === 204) return {} as T;

  const text = await res.text();
  if (!res.ok) {
    const err = new Error(text || `Request failed (${res.status})`);
    (err as any).status = res.status;
    throw err;
  }

  return JSON.parse(text) as T;
}

export async function fetchFleetTenants(): Promise<FleetTenantsResponse> {
  return await fetchJson<FleetTenantsResponse>(buildFleetApiPath("/tenants"));
}

export async function fetchFleetOrchestrator(
  erc8004Id: string
): Promise<FleetOrchestrator | null> {
  try {
    const data = await fetchJson<FleetTenantInfoResponse>(
      buildFleetApiPath(`/agent/${encodeURIComponent(erc8004Id)}/info`)
    );
    return data.orchestrator;
  } catch (err) {
    const status = (err as any)?.status;
    if (status === 404) return null;
    throw err;
  }
}

export async function fetchFleetCommandAgents(
  erc8004Id: string
): Promise<FleetAgentsResponse> {
  return await fetchJson<FleetAgentsResponse>(
    buildFleetApiPath(`/agent/${encodeURIComponent(erc8004Id)}/agents`)
  );
}

export async function fetchFleetEvents(
  erc8004Id: string,
  { limit = 50 }: { limit?: number } = {}
): Promise<FleetEventsResponse> {
  return await fetchJson<FleetEventsResponse>(
    buildFleetApiPath(
      `/agent/${encodeURIComponent(erc8004Id)}/events?limit=${encodeURIComponent(
        String(limit)
      )}`
    )
  );
}

export async function fetchFleetChat(
  erc8004Id: string,
  { limit = 300 }: { limit?: number } = {}
): Promise<FleetChatResponse> {
  return await fetchJson<FleetChatResponse>(
    buildFleetApiPath(
      `/agent/${encodeURIComponent(erc8004Id)}/chat?limit=${encodeURIComponent(
        String(limit)
      )}`
    )
  );
}

export async function ensureFleetTenant(
  erc8004Id: string
): Promise<FleetTenantInfoResponse> {
  return await fetchJson<FleetTenantInfoResponse>(
    buildFleetApiPath(`/agent/${encodeURIComponent(erc8004Id)}/ensure`),
    { method: "POST" }
  );
}

export async function sendFleetChat(
  erc8004Id: string,
  message: string
): Promise<{ status: string; message: string }> {
  return await fetchJson<{ status: string; message: string }>(
    buildFleetApiPath(`/agent/${encodeURIComponent(erc8004Id)}/chat/send`),
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message }),
    }
  );
}


