import { defineNitroConfig } from "nitro/config";

const DOCS_URL = "https://docs.regent.cx";

export default defineNitroConfig({
  routeRules: {
    // Canonical docs live on the docs subdomain; keep /docs working for bookmarks.
    "/docs": { redirect: DOCS_URL },
    "/docs/**": { redirect: `${DOCS_URL}/**` },
  },
});


