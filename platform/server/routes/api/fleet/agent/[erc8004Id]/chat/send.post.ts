import { readBody, defineEventHandler, createError } from "h3";
import { env } from "~/env/server";

interface SendChatBody {
  message?: string;
}

export default defineEventHandler(async (event) => {
  const baseUrl = env.FLEET_API_BASE_URL;
  if (!baseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: "Server missing FLEET_API_BASE_URL",
    });
  }

  const token = env.FLEET_ADMIN_TOKEN;
  if (!token) {
    throw createError({
      statusCode: 503,
      statusMessage: "Server missing FLEET_ADMIN_TOKEN (admin ops disabled)",
    });
  }

  const erc8004Id = event.context.params?.erc8004Id;
  if (!erc8004Id) {
    throw createError({ statusCode: 400, statusMessage: "Missing erc8004Id" });
  }

  const body = (await readBody<SendChatBody>(event)) || {};
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    throw createError({ statusCode: 400, statusMessage: "Missing message" });
  }

  const url = new URL(`/agent/${encodeURIComponent(erc8004Id)}/chat/send`, baseUrl);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw createError({
      statusCode: res.status,
      statusMessage: `Fleet API error ${res.status}: ${text}`,
    });
  }

  return await res.json();
});


