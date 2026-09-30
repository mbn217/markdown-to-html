# Markdown → HTML

**Good Markdown. Beautiful HTML.**

A private, browser-based developer tool for turning Markdown files into polished standalone HTML pages. Drop a file, review its rendered preview, and open or download a finished page. No account, database, document upload endpoint, or API key.

## Features

- Drag-and-drop or browse for `.md` / `.markdown` files, including uppercase extensions.
- Automatic conversion in a cancellable Web Worker; the interface stays responsive.
- UTF-8 validation, a 2 MiB file limit, friendly errors, and a 20-second conversion timeout.
- GitHub-flavored Markdown: headings, lists, nested lists, emphasis, strikethrough, links, images, blockquotes, tables, task lists, and fenced code blocks.
- Syntax highlighting for supported fenced languages; unknown languages remain readable plain code.
- Sandboxed HTML preview, expandable preview dialog, and Markdown/HTML source tabs.
- Paper and Midnight document themes, including responsive and print styles.
- One-click **Open HTML**, **Download HTML**, and **Copy HTML**, with popup-blocking guidance and manual-copy fallback.
- Remove, replace, cancel, or convert another file; an invalid replacement preserves the previous successful document.
- Built-in example and documentation. Responsive layout, keyboard navigation, focus restoration, reduced motion, and accessible Radix dialogs/tabs.
- Locally served fonts. No analytics or document persistence.

## Stack

Next.js **16.3.7** App Router / Turbopack, React **19.2.8**, TypeScript **5.9**, Tailwind CSS **4**, Radix UI, Lucide, and the unified/remark/rehype ecosystem. Next.js is the only application framework and build system; **no Vite**. Dependencies are locked with npm.

## Run locally

Requires Node.js **22+** and npm. No environment variables or services are required.

```sh
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The VS Code task **Start Markdown to HTML** starts the same development server. Browser developer tools and source maps can be used to debug the UI and worker.

For production, the container workflow below is recommended. For a direct Node.js deployment, build and prepare Next.js standalone output (the copy step also works in PowerShell):

```sh
npm run build
node -e "const fs=require('node:fs');fs.cpSync('public','.next/standalone/public',{recursive:true});fs.cpSync('.next/static','.next/standalone/.next/static',{recursive:true});"
node .next/standalone/server.js
```

The standalone directory is a deployable runtime; it includes the traced server dependencies. Start its generated server rather than using `next start` for standalone deployments. `PORT` and `HOSTNAME` configure its port and bind address. Standard Next.js hosting on Vercel is also supported. Serve over HTTPS for clipboard support outside localhost. No backend conversion service, database, secrets, or writable document storage is needed.

The route is prerendered. The bundled example is converted at build time; **user-selected files are only processed in the browser**.

## GitHub Pages deployment

This app can run entirely as static HTML, CSS, and JavaScript. GitHub Pages does **not** run a Next.js server or Docker containers; it serves the separate static export produced by `npm run build:pages`. The normal `npm run build` continues producing standalone output for Docker/Node hosting.

Repository: [mbn217/markdown-to-html](https://github.com/mbn217/markdown-to-html)

Pages URL after deployment: **[https://mbn217.github.io/markdown-to-html/](https://mbn217.github.io/markdown-to-html/)**

### One-time GitHub setup

1. Open the repository's [Settings → Pages](https://github.com/mbn217/markdown-to-html/settings/pages) while signed in as an administrator.
2. Under **Build and deployment → Source**, select **GitHub Actions**. Do not choose a branch/folder source or add a separate Jekyll workflow.
3. Push to the existing **master** branch, or go to **Actions → Deploy GitHub Pages → Run workflow** and select `master`.
4. Wait for both the build and deployment jobs to succeed. The `github-pages` environment shows the published URL. If an environment approval is required, approve the deployment.
5. Open the Pages URL above. Future pushes to `master` automatically rebuild, test, and publish it.

The workflow in [.github/workflows/pages.yml](.github/workflows/pages.yml) uses the automatic `GITHUB_TOKEN` with repository-content read access and deployment-only `pages: write` / `id-token: write`. No personal access token, additional repository secret, committed build output, or `gh-pages` branch is needed. Pull requests build and test the static site but do **not** publish it. Existing Docker CI remains separate.

### Build and test locally

```sh
npm ci
npm run build:pages
npm run preview:pages
```

Open [http://127.0.0.1:4173/markdown-to-html/](http://127.0.0.1:4173/markdown-to-html/). The preview is a real static-file server: it does not supply Next.js routes or an SPA fallback. Its repository subpath catches broken home links, favicons, fonts, and worker URLs before deployment. Stop it with Ctrl+C.

Set `PLAYWRIGHT_PAGES=true` in your shell, then run `npm run test:e2e` to automatically start the static preview and run the browser suite. Set `PLAYWRIGHT_CHANNEL=chrome` if using locally installed Chrome. The build and preview scripts work in both PowerShell and Bash; only shell environment-variable assignment differs.

The Pages build selects `output: "export"`, sets `basePath: "/markdown-to-html"` and trailing slashes, and creates the deployable `out` directory with a `.nojekyll` marker. The directory is ignored by Git and uploaded as a Pages artifact. Ordinary development and Docker builds have no base path.

If the repository name changes, or you use a custom domain at the domain root, set `NEXT_PUBLIC_BASE_PATH` to the new `/repository-name` or an empty string **when building** and when previewing. For the workflow, set it in the build job's environment and update the browser test URL accordingly. The base path is compiled into the application, so changing it requires a rebuild.

### Pages limitations and troubleshooting

- GitHub Pages cannot apply the HTTP headers returned by Next.js `headers()`. That configuration is disabled for the static build; `X-Frame-Options`, Permissions Policy, and other server headers remain available on Docker/Node hosting only. Markdown sanitization, the iframe sandbox, no-referrer settings on generated documents/images, and standalone-export CSP remain intact in both hosting modes.
- Never add server actions, upload APIs, dynamic route handlers, or runtime secrets to the Pages build. Files still stay in the visitor's browser.
- **Pages setup/404 errors in the deployment job:** select **GitHub Actions** in repository Pages settings, verify Pages is available for the repository's visibility/plan, then rerun the workflow. Repository rules may require approval of the `github-pages` environment.
- **Blank page, missing styles, or failed workers:** use the full `/markdown-to-html/` URL and rebuild with the matching base path. Do not deploy standalone server output to Pages.
- **Workflow not running:** check the Actions tab, branch filters (`master`), and repository workflow permissions. The Pages workflow supports manual runs.

Validated locally: static export and all **17 browser tests** at `/markdown-to-html/`, including actual rendered HTML tabs, downloads, clipboard behavior, accessibility, and worker conversion.

## Container deployment

### Requirements and quick start

Install Docker Engine with BuildKit and Docker Compose **v2.20+** (Compose v5 also works). On Windows/macOS, start Docker Desktop and use **Linux containers**. No host Node.js installation is required for the container workflow. The first build needs access to Docker Hub and the npm registry.

From the repository root:

```sh
docker compose up --build --detach --wait --wait-timeout 120
```

Open **[http://localhost:8080](http://localhost:8080)**. The container listens on port 3000 internally; Compose publishes port 8080 on the host's loopback interface, leaving development port 3000 available. `--wait` returns successfully only when the container becomes healthy.

Common operations:

```sh
docker compose ps
docker compose logs --follow --tail 100 app
docker compose stop
docker compose start --wait
docker compose down
```

`stop` preserves the stopped container; `down` removes this project's container and network but not its image or build cache. No document data volumes exist. These commands only manage this Compose project.

To rebuild after source changes and refresh the base image:

```sh
docker compose build --pull
docker compose up --detach --wait --wait-timeout 120
```

The image is tagged `markdown-to-html:local`. Source is compiled into the image; there are no source bind mounts or hot reload. Continue using `npm run dev` for interactive development.

### Configuration

| Setting | Default | Purpose |
| --- | --- | --- |
| `HOST_PORT` | `8080` | Published host port; container port stays 3000 |
| `BIND_ADDRESS` | `127.0.0.1` | Host interface exposed by Compose |
| `NODE_IMAGE` (build argument) | `node:22-bookworm-slim` | Base image used for all build and runtime stages |

Set Compose variables in your shell or an optional root `.env` file. For example, PowerShell users can set `$env:HOST_PORT = "8081"` before the quick-start command; Bash users can prefix it with `HOST_PORT=8081`. Use `docker compose config --quiet` to validate the configuration. No environment file is required, copied into the image, or passed into the container.

The runtime sets `NODE_ENV=production`, `NEXT_TELEMETRY_DISABLED=1`, `HOSTNAME=0.0.0.0`, and `PORT=3000`. Build telemetry is also disabled. Keep the internal port aligned with the port mapping if changing it.

The base-image tag follows Node 22 security updates when rebuilt with `--pull`. For immutable releases, supply an approved `node:22-bookworm-slim@sha256:...` digest using the `NODE_IMAGE` build argument and use versioned application image tags. Scan and regularly rebuild the image; the npm audit does not scan operating-system packages. No image is pushed to a registry automatically.

### Image and runtime security

- [Dockerfile](Dockerfile) uses separate dependency, build, and runtime stages. `npm ci` uses the committed lockfile and a BuildKit cache. Build tools and the full development dependency tree are not copied into the runtime.
- Next.js `output: "standalone"` packages the traced server dependencies. Browser/worker chunks and public assets are copied separately so conversion works without a CDN.
- The image runs as `node`, **UID/GID 1000**, and directly starts the generated server without an npm wrapper. Compose enables an init process and a 20-second shutdown grace period.
- [compose.yaml](compose.yaml) uses a **read-only root filesystem**, a 64 MiB temporary in-memory directory, dropped Linux capabilities, and `no-new-privileges`. It mounts no source, host directories, or Docker socket. Runtime logs are bounded to three 10 MB files.
- The image health check requests `/` using Node's built-in HTTP client; no curl or additional health endpoint is needed. It checks every 30 seconds, allows 20 seconds for startup, and marks the container unhealthy after three failures. The restart policy restarts exited processes, **not merely unhealthy ones**; production monitoring should handle unhealthy instances.
- [.dockerignore](.dockerignore) allowlists only required build inputs. Local dependencies, Windows build output, Git history, editor configuration, test artifacts, documents outside the app source/assets, and environment files never enter the build context. Do not place secrets in application source or public assets.

The current app is prerendered and needs no writable application cache. If adding ISR, server-side caching, or image optimization later, revisit the read-only policy and explicitly mount only the required cache paths rather than making the entire filesystem writable.

### HTTPS and deployment boundaries

The default service is reachable **only from the local host**. For public deployment, put it behind an HTTPS reverse proxy or load balancer; clipboard APIs require a secure context outside localhost. A host-based proxy can forward to `127.0.0.1:8080`; a proxy container on the same Compose network can use `app:3000`.

Set `BIND_ADDRESS=0.0.0.0` only when intentionally exposing the service to other machines and after configuring firewall rules and TLS. Do not change the internal `HOSTNAME=0.0.0.0` to loopback: that would prevent Docker's port forwarding from reaching the server. TLS certificates and reverse-proxy infrastructure are not bundled.

Containerization does **not** change document privacy: the container serves the application and static assets, while selected Markdown is still read and converted in each user's browser. The service has no upload API or document persistence.

### Troubleshooting and verification

- **Cannot connect to the Docker daemon / missing Docker Desktop Linux pipe:** start Docker Desktop, wait for its engine to be ready, and confirm Linux container mode.
- **Port already allocated:** change `HOST_PORT`, then rerun Compose. No need to stop development on port 3000.
- **Image or npm download fails:** check proxy/network access to Docker Hub and npm; no registry credentials belong in the build context.
- **Unhealthy or restarting:** inspect `docker compose ps` and `docker compose logs --tail 100 app`; verify the listening address and port. Do not disable the health check to mask a startup failure.
- **Styles or converter worker missing after a manual deployment:** include both the public assets and `.next/static` alongside the standalone output. The Dockerfile already does this.

Validated locally on Docker Desktop's Linux engine: image build and Dockerfile checks, healthy startup, UID/GID 1000, read-only application filesystem, security headers, and the browser suite against the container. Local lint, TypeScript, 15 unit tests, and production build also pass.

## Usage

1. Drop one Markdown file into **Your Markdown**, or select **Browse files**.
2. Conversion begins automatically. File size, word count, and the source appear alongside the rendered preview.
3. Choose **Paper** or **Midnight**, inspect the source, or expand the preview.
4. Choose **Open HTML** to open a real HTML document in a new tab, **Download HTML** to save a portable file, or **Copy HTML** to copy the complete document.
5. Use **Remove file**, **Replace file**, or **Convert another** to continue.

The exported file contains a doctype, language, UTF-8 charset, viewport, escaped document title, security policy, semantic HTML, and inline CSS. It does not depend on React, Next.js, JavaScript, external fonts, or the converter to render. Its title comes from the first H1, falling back to the filename.

### Practical limits

- One UTF-8 text file at a time, up to **2 MiB (2,097,152 bytes)**. A UTF-8 BOM is supported; UTF-16, malformed UTF-8, binary/null-byte content, and blank files are rejected.
- Raw embedded HTML is omitted. This is a Markdown converter, not an HTML/MDX execution environment.
- Local and relative images/links cannot be bundled from a single uploaded file. They are disabled with a warning; use full HTTP(S) URLs instead.
- Remote images are **not embedded**. Exported pages need internet access to load them. Text and styles work offline.
- No executable scripts, custom CSS injection, Mermaid execution, math extensions, frontmatter interpretation, or multi-file bundling.
- Blob URLs belong to the current browser session. Share the downloaded HTML file, **not** the temporary URL. URLs are revoked after a 60-second grace period or component teardown; already rendered pages remain visible, but refreshing an expired Blob URL may fail.
- The converter needs JavaScript and a current browser with Web Workers, Blob URLs, and `TextDecoder`. Clipboard support requires HTTPS or localhost; a manual fallback is provided. Automated browser validation is performed in Chrome.

## Security and privacy

### Processing boundary

`File.arrayBuffer()` and a fatal UTF-8 decoder read the document locally. The application never sends file contents to a server or stores them in cookies, local storage, session storage, or a database. The 2 MiB input limit, independent worker, timeout, cancellation, and request sequence IDs limit resource exhaustion and prevent stale conversions from replacing newer state.

The initial page, worker modules, styles, and fonts are ordinary same-origin asset requests. Hosting access logs can record these page requests; the app contains no analytics. Next.js may collect framework development/build telemetry, separate from application document handling; set `NEXT_TELEMETRY_DISABLED=1` to opt out when running Next.js.

### Conversion pipeline

1. `remark-parse` parses Markdown.
2. `remark-gfm` enables GitHub-flavored syntax.
3. `remark-rehype` creates the HTML tree **without permitting raw HTML**.
4. `rehype-sanitize` applies its allowlist, removing dangerous elements, attributes, and URL protocols.
5. A small trusted transform adds safe external-link attributes, counts images, and disables nonportable references.
6. `rehype-highlight` adds trusted syntax-highlighting spans/classes after sanitization.
7. `rehype-stringify` serializes the sanitized tree. The document wrapper separately escapes the title.

Do not replace this with unsanitized `dangerouslySetInnerHTML`. Keep sanitization before the trusted highlighter and do not introduce plugins that generate arbitrary HTML after sanitization.

Turbopack currently selects the DOM-specific `decode-named-character-reference` browser export inside workers. The configuration aliases it to the same library’s portable entity-table implementation. Keep this alias while using this toolchain; otherwise the worker can fail with `document is not defined`. No dependency sources are patched.

### Preview isolation

The preview uses `iframe srcDoc` with an **empty sandbox**: no scripts, same-origin access, forms, top navigation, or popup capability. Markdown never enters the application's DOM as HTML. The preview's CSP also blocks all remote resources by default.

Remote images only load in the preview after the user checks the explicit consent control. Doing so contacts the image hosts and exposes normal request information, such as IP address. `referrerpolicy="no-referrer"` prevents referrer disclosure. Preview links are deliberately restricted by the sandbox; open the exported page to follow external links.

### Standalone export

The exported document includes a restrictive meta CSP:

```text
default-src 'none'; script-src 'none'; style-src 'unsafe-inline';
img-src https: http:; base-uri 'none'; form-action 'none';
object-src 'none'; frame-src 'none'
```

Inline CSS is required for portability; inline scripts are not allowed. Exported images may contact their HTTP(S) hosts. External links use `target="_blank"` and `rel="noopener noreferrer"`. A no-referrer policy is included. Sanitization and the CSP protect both a downloaded file and a Blob URL, which otherwise shares the app's origin.

**Open HTML** synchronously opens a blank tab during the click handler, checks whether the popup was blocked, clears its `opener`, and navigates it to a `text/html` Blob. This avoids losing user activation while preventing access back to the converter. The Blob registry handles revocation and cleanup. Downloaded files render independently.

On Docker/Node hosting, the application also sends `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, and a restrictive camera/microphone/geolocation Permissions Policy. GitHub Pages does not support these custom response headers. Export CSP is intentionally separate from the Next.js app's scripts and works on both hosting targets.

## Quality checks

```sh
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
```

| Command | Purpose |
| --- | --- |
| `npm run lint` | ESLint with zero warnings |
| `npm run typecheck` | Generate Next.js route types, then strict TypeScript |
| `npm test` | 15 Node/tsx unit tests for parsing, sanitization, export, file validation, and encoding |
| `npm run test:e2e` | 17 Playwright browser tests, including axe accessibility and deployment-path checks |
| `npm run check` | Lint + type checks + unit tests |
| `npm run build` | Optimized production build |
| `npm run build:pages` | GitHub Pages static export with the repository base path |
| `npm run preview:pages` | Serve the static export locally at its repository base path |

Browser tests cover upload, drag-and-drop, rendered new tabs, detached openers, downloads, clipboard success/denial, validation, read errors, retained documents, theme switching, source tabs, dialogs, clearing, blocked popups, malicious HTML, image consent, mobile overflow, privacy, cancellation, timeouts, and URL revocation. Accessibility tests cover empty/loaded states and documentation; opaque sandboxed frames cannot accept axe injection and are validated separately through semantic conversion and browser assertions. Automated checks are not a substitute for a full assistive-technology audit.

If browser downloads are blocked, set `PLAYWRIGHT_CHANNEL=chrome` or `PLAYWRIGHT_CHANNEL=msedge` to use an installed browser. Set `PLAYWRIGHT_BASE_URL` to test a running production server instead of starting development mode; for the default Compose service use `http://127.0.0.1:8080`. For Pages use `PLAYWRIGHT_PAGES=true`, or supply the full static preview URL with a trailing slash. Browser validation covers production containers and the static Pages build. Production dependency audit: zero known vulnerabilities at the initial application validation; this is not an operating-system/container vulnerability scan.

Container CI in [.github/workflows/ci.yml](.github/workflows/ci.yml) installs dependencies and Chromium, runs checks and a production build, validates Compose, builds and waits for the production container, then runs the browser suite against port 8080. It prints container logs on failure, always tears down the Compose service, and retains browser traces/screenshots for failures. It does not publish images. The separate [Pages workflow](.github/workflows/pages.yml) tests static output and deploys it to GitHub Pages only from `master`.

## Project map

- [.github/workflows/pages.yml](.github/workflows/pages.yml): tested static build and GitHub Pages deployment.
- [scripts/build-pages.mjs](scripts/build-pages.mjs): cross-platform static-export build.
- [scripts/preview-pages.mjs](scripts/preview-pages.mjs): local static preview at the repository subpath.
- [Dockerfile](Dockerfile): multi-stage standalone production image and health check.
- [compose.yaml](compose.yaml): local port mapping and hardened runtime defaults.
- [.dockerignore](.dockerignore): build-context allowlist and secret/artifact exclusions.
- [src/app/page.tsx](src/app/page.tsx): server-rendered page and build-time example.
- [src/components/converter.tsx](src/components/converter.tsx): upload UI, preview, export actions, and Blob lifecycle.
- [src/components/help-dialog.tsx](src/components/help-dialog.tsx): accessible in-app documentation.
- [src/hooks/use-converter.ts](src/hooks/use-converter.ts): reading, worker lifecycle, cancellation, stale-result protection.
- [src/workers/markdown.worker.ts](src/workers/markdown.worker.ts): isolated conversion entry point.
- [src/lib/markdown.ts](src/lib/markdown.ts): parser, sanitizer, and trusted transforms.
- [src/lib/document.ts](src/lib/document.ts): standalone wrapper, CSP, and themes.
- [src/lib/files.ts](src/lib/files.ts): limits, UTF-8 validation, file errors, export filenames.
- [src/app/globals.css](src/app/globals.css): visual system and responsive/accessibility styles.
- [tests](tests): unit and browser regression coverage.

To change limits, update the shared constants and tests. To add document themes, update the theme type, export CSS, and theme controls together. Keep uploaded content local and preserve the sanitization, sandbox, and CSP boundaries.
