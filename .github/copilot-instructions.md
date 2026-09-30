- [x] Verify project instructions exist.
- [x] Clarify requirements: Next.js, React, TypeScript, Tailwind; local Markdown conversion without a backend.
- [x] Scaffold the project: Next.js 16, React 19, TypeScript, Tailwind 4, npm.
- [x] Customize the project: responsive converter, sandboxed preview, worker conversion, standalone exports.
- [x] Install required extensions: none required.
- [x] Compile and test the project: lint, TypeScript, 15 unit tests, 17 browser tests, and production builds pass.
- [x] Create and run development task: Start Markdown to HTML at http://localhost:3000.
- [x] Launch and validate the application: desktop/mobile, accessibility, and full production browser suite checked.
- [x] Complete documentation: usage, deployment, security model, limitations, testing, and CI.

## Development conventions
- Use Next.js App Router and npm. Never add Vite.
- Keep uploaded document content client-side. No analytics, persistence, or upload endpoints.
- Sanitize Markdown-generated HTML and preserve the sandboxed iframe and export CSP.
- Run lint, TypeScript checks, unit tests, browser tests, and production build before completing changes.
- Use accessible native controls and Radix primitives; honor reduced motion.
- Keep the standalone Docker runtime non-root and preserve Compose's read-only filesystem, health check, and loopback-only default binding.
- Validate container changes with Docker build checks, Compose health checks, and browser tests against http://127.0.0.1:8080; include both public assets and .next/static in the runtime image.
- Preserve both hosting targets: normal builds use standalone output; build:pages uses a static export under /markdown-to-html. Test Pages with PLAYWRIGHT_PAGES=true. GitHub Pages cannot apply Next.js response headers.