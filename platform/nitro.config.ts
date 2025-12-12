import { defineNitroConfig } from "nitro/config";

const GITBOOK_PROXY_BASE = "https://proxy.gitbook.site/sites/site_4BMeH";

export default defineNitroConfig({
  routeRules: {
    // Serve GitBook docs under /docs on all deployments (Vercel build output routes everything to SSR).
    "/docs": { proxy: GITBOOK_PROXY_BASE },
    "/docs/**": { proxy: `${GITBOOK_PROXY_BASE}/**` },
  },
});


