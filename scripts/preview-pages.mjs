import { existsSync } from "node:fs";
import { createServer } from "node:http";
import sirv from "sirv";

// Local validation only: a real static server, with no SPA fallback or Next runtime.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/markdown-to-html";
const port = Number(process.env.PAGES_PREVIEW_PORT ?? 4173);
if (!existsSync("out/index.html")) {
  console.error("No static export found. Run npm run build:pages first.");
  process.exit(1);
}
const serve = sirv("out", { dev: true, etag: true });
const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  if (basePath && url.pathname === basePath) {
    response.writeHead(308, { Location: `${basePath}/${url.search}` });
    response.end();
    return;
  }
  if (!url.pathname.startsWith(`${basePath}/`)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  request.url = `${url.pathname.slice(basePath.length)}${url.search}`;
  serve(request, response);
});
server.listen(port, "127.0.0.1", () => {
  console.log(`Static Pages preview: http://127.0.0.1:${port}${basePath}/`);
});
server.on("error", (error) => { console.error(error.message); process.exit(1); });