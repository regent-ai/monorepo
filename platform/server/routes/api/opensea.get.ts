// server/routes/api/opensea.get.ts
import { defineEventHandler, getQuery, createError } from "h3";

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

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const address = String(query.address || "").toLowerCase();
    const collection =
      (query.collection as string | undefined)?.toLowerCase() ?? null;

    if (!address) {
      return { error: "Missing address" };
    }

    const apiKey = process.env.OPENSEA_API_KEY;
    if (!apiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: "Server missing OPENSEA_API_KEY",
      });
    }

    const headers: HeadersInit = {
      accept: "application/json",
      "x-api-key": apiKey,
    };

    async function fetchAllForCollection(slug: string): Promise<number[]> {
      const tokenIds: number[] = [];
      let cursor: string | null | undefined = null;
      let safety = 0;

      do {
        const url = new URL(
          `https://api.opensea.io/api/v2/chain/base/account/${address}/nfts`
        );
        url.searchParams.set("collection", slug);
        url.searchParams.set("limit", "100");
        if (cursor) url.searchParams.set("next", cursor);

        const res = await fetch(url.toString(), {
          headers,
          cache: "no-store",
        });

        if (!res.ok) {
          const text = await res.text();
          throw createError({
            statusCode: res.status,
            statusMessage: `OpenSea error ${res.status}: ${text}`,
          });
        }

        const data = (await res.json()) as OpenSeaResponse;

        for (const n of data.nfts) {
          if (
            !n.collection ||
            n.collection.toLowerCase() === slug.toLowerCase()
          ) {
            const idNum = Number(n.identifier);
            if (Number.isFinite(idNum)) tokenIds.push(idNum);
          }
        }

        cursor = data.next ?? null;
        safety++;
      } while (cursor && safety < 10);

      return tokenIds.sort((a, b) => a - b);
    }

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

    return {
      address,
      animata1,
      animata2,
      animataPass,
    };
  } catch (err: any) {
    if (err.statusCode) {
      throw err;
    }
    throw createError({
      statusCode: 500,
      statusMessage: err?.message ?? "unknown error",
    });
  }
});
