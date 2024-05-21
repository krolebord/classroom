import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from "@remix-run/dev";
import { defineConfig } from "vite";

import { getLoadContext } from "./load-context.js";

export default defineConfig({
  plugins: [
    remixCloudflareDevProxy({
      getLoadContext,
      persist: {
        path: "../../.data",
      },
    }),
    remix(),
  ],
  ssr: {
    resolve: {
      conditions: ["workerd", "worker", "browser"],
    },
  },
  resolve: {
    mainFields: ["browser", "module", "main"],
  },
  build: {
    minify: true,
  },
});
