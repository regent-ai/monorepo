import { defineEventHandler, getQuery, createError } from "h3";
import { env } from "~/env/server";

export default defineEventHandler(async (event) => {
  const baseUrl = env.FLEET_API_BASE_URL;
  if (!baseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: "Server missing FLEET_API_BASE_URL",
    });
  }

  const erc8004Id = event.context.params?.erc8004Id;
  if (!erc8004Id) {
    throw createError({ statusCode: 400, statusMessage: "Missing erc8004Id" });
  }

  const query = getQuery(event);
  const agentId = typeof query.agent_id === "string" ? query.agent_id : undefined;
  const taskSlug = typeof query.task_slug === "string" ? query.task_slug : undefined;
  const eventTypes = typeof query.event_types === "string" ? query.event_types : undefined;
  const limit = Number(query.limit ?? 50);
  const offset = Number(query.offset ?? 0);

  const url = new URL(`/agent/${encodeURIComponent(erc8004Id)}/events`, baseUrl);
  if (agentId) url.searchParams.set("agent_id", agentId);
  if (taskSlug) url.searchParams.set("task_slug", taskSlug);
  if (eventTypes) url.searchParams.set("event_types", eventTypes);
  if (Number.isFinite(limit)) url.searchParams.set("limit", String(limit));
  if (Number.isFinite(offset)) url.searchParams.set("offset", String(offset));

  const res = await fetch(url.toString(), { headers: { accept: "application/json" } });
  if (!res.ok) {
    const text = await res.text();
    throw createError({
      statusCode: res.status,
      statusMessage: `Fleet API error ${res.status}: ${text}`,
    });
  }

  return await res.json();
});



