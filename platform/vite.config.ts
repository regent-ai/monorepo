import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";

function openSeaDevApi(): Plugin {
  return {
    name: "regent-opensea-dev-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/opensea", async (req, res, next) => {
        if (req.method !== "GET") return next();

        try {
          const url = new URL(req.url ?? "", "http://localhost");
          const address = String(url.searchParams.get("address") ?? "")
            .trim()
            .toLowerCase();
          const collection = (url.searchParams.get("collection") ?? "")
            .trim()
            .toLowerCase();

          if (!address) {
            res.statusCode = 400;
            res.setHeader("content-type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ error: "Missing address" }));
            return;
          }

          const SLUG1 = "animata";
          const SLUG2 = "regent-animata-ii";
          const SLUG3 = "animata-pass";

          const apiKey = process.env.OPENSEA_API_KEY;
          if (!apiKey) {
            res.statusCode = 500;
            res.setHeader("content-type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ error: "Server missing OPENSEA_API_KEY" }));
            return;
          }

          const headers: HeadersInit = {
            accept: "application/json",
            "x-api-key": apiKey,
          };

          interface OpenSeaNftItem {
            identifier: string;
            collection?: string;
            contract: string;
          }
          interface OpenSeaResponse {
            next?: string | null;
            nfts: OpenSeaNftItem[];
          }

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

              const apiRes = await fetch(apiUrl.toString(), {
                headers,
                cache: "no-store",
              });

              if (!apiRes.ok) {
                const text = await apiRes.text();
                res.statusCode = apiRes.status;
                res.setHeader("content-type", "application/json; charset=utf-8");
                res.end(
                  JSON.stringify({
                    error: `OpenSea error ${apiRes.status}: ${text}`,
                  })
                );
                return tokenIds;
              }

              const data = (await apiRes.json()) as OpenSeaResponse;
              for (const n of data.nfts) {
                if (!n.collection || n.collection.toLowerCase() === slug) {
                  const idNum = Number(n.identifier);
                  if (Number.isFinite(idNum)) tokenIds.push(idNum);
                }
              }

              cursor = data.next ?? null;
              safety += 1;
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

          res.statusCode = 200;
          res.setHeader("content-type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ address, animata1, animata2, animataPass }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("content-type", "application/json; charset=utf-8");
          res.end(
            JSON.stringify({
              error: (err as any)?.message ?? "unknown error",
            })
          );
        }
      });
    },
  };
}

export default defineConfig({
  envPrefix: ["VITE_", "BASE_"],
  plugins: [
    devtools(),
    tanstackStart(),
    // https://tanstack.com/start/latest/docs/framework/react/guide/hosting
    nitro(),
    viteReact({
      // https://react.dev/learn/react-compiler
      babel: {
        plugins: [
          [
            "babel-plugin-react-compiler",
            {
              target: "19",
            },
          ],
        ],
      },
    }),
    tailwindcss(),
    openSeaDevApi(),
  ],
  resolve: {
    alias: {
      "~": resolve(__dirname, "src"),
      "@": resolve(__dirname, "src"),
    },
  },
});
