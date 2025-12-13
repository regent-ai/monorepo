import { defineEventHandler, createError } from "h3";
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

  const url = new URL(`/agent/${encodeURIComponent(erc8004Id)}/info`, baseUrl);
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



