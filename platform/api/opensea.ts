import type { IncomingMessage, ServerResponse } from "node:http";

interface OpenSeaNftItem {
  identifier: string;
  collection?: string;
  contract: string;
}

interface OpenSeaResponse {
  next?: string | null;
  nfts: OpenSeaNftItem[];
}

const SLUG1 = "animata";
const SLUG2 = "regent-animata-ii";
const SLUG3 = "animata-pass";

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") {
    res.setHeader("allow", "GET");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const apiKey = process.env.OPENSEA_API_KEY;
  if (!apiKey) return sendJson(res, 500, { error: "Server missing OPENSEA_API_KEY" });

  const url = new URL(req.url ?? "", `https://${req.headers.host ?? "localhost"}`);
  const address = String(url.searchParams.get("address") ?? "").trim().toLowerCase();
  const collection = String(url.searchParams.get("collection") ?? "").trim().toLowerCase();

  if (!address) return sendJson(res, 400, { error: "Missing address" });

  const headers: HeadersInit = {
    accept: "application/json",
    "x-api-key": apiKey,
  };

  async function fetchAllForCollection(slug: string): Promise<number[]> {
    const tokenIds: number[] = [];
    let cursor: string | null | undefined = null;
    let safety = 0;

    do {
      const apiUrl = new URL(
        `https://api.opensea.io/api/v2/chain/base/account/${address}/nfts`
      );
      apiUrl.searchParams.set("collection", slug);
      apiUrl.searchParams.set("limit", "100");
      if (cursor) apiUrl.searchParams.set("next", cursor);

      const apiRes = await fetch(apiUrl.toString(), { headers, cache: "no-store" });
      if (!apiRes.ok) {
        const text = await apiRes.text();
        throw new Error(`OpenSea error ${apiRes.status}: ${text}`);
      }

      const data = (await apiRes.json()) as OpenSeaResponse;

      for (const n of data.nfts) {
        if (!n.collection || n.collection.toLowerCase() === slug.toLowerCase()) {
          const idNum = Number(n.identifier);
          if (Number.isFinite(idNum)) tokenIds.push(idNum);
        }
      }

      cursor = data.next ?? null;
      safety += 1;
    } while (cursor && safety < 10);

    return tokenIds.sort((a, b) => a - b);
  }

  try {
    let animata1: number[] = [];
    let animata2: number[] = [];
    let animataPass: number[] = [];

    if (collection === SLUG1) {
      animata1 = await fetchAllForCollection(SLUG1);
    } else if (collection === SLUG2) {
      animata2 = await fetchAllForCollection(SLUG2);
    } else if (collection === SLUG3) {
      animataPass = await fetchAllForCollection(SLUG3);
    } else {
      [animata1, animata2, animataPass] = await Promise.all([
        fetchAllForCollection(SLUG1),
        fetchAllForCollection(SLUG2),
        fetchAllForCollection(SLUG3),
      ]);
    }

    return sendJson(res, 200, { address, animata1, animata2, animataPass });
  } catch (err) {
    return sendJson(res, 500, { error: (err as any)?.message ?? "unknown error" });
  }
}


