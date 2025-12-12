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

  const query = getQuery(event);
  const limit = Number(query.limit ?? 100);
  const offset = Number(query.offset ?? 0);

  const url = new URL("/tenants", baseUrl);
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


