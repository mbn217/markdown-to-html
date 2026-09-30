import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

// Use Node rather than shell-specific environment assignment (Windows-compatible).
const build = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
  stdio: "inherit",
  env: { ...process.env, GITHUB_PAGES: "true", NEXT_TELEMETRY_DISABLED: "1" },
});
if (build.error) {
  console.error(build.error.message);
  process.exit(1);
}
if (build.status !== 0) process.exit(build.status ?? 1);
writeFileSync("out/.nojekyll", "");