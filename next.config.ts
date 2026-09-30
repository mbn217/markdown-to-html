import type { NextConfig } from "next";

const isPages = process.env.GITHUB_PAGES === "true";
const basePath = isPages ? (process.env.NEXT_PUBLIC_BASE_PATH ?? "/markdown-to-html") : "";

const nextConfig: NextConfig = {
  output: isPages ? "export" : "standalone",
  basePath,
  trailingSlash: isPages,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    root: process.cwd(),
    // Turbopack currently selects the DOM export even inside a Web Worker.
    // Use the library's own portable implementation, not a document shim.
    resolveAlias: {
      "decode-named-character-reference": "./node_modules/decode-named-character-reference/index.js",
    },
  },
  poweredByHeader: false,
  devIndicators: false,
  // Static hosts cannot apply Next.js HTTP headers. Keep the preview/export CSP.
  headers: isPages ? undefined : async () => [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }],
};

export default nextConfig;
