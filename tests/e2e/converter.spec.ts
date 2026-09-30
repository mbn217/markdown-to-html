import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const markdown = '# Hello World\n\nThis is **real HTML**.\n\n- [x] Ready\n\n```javascript\nconst hello = "world";\n```\n\n| Name | Value |\n| --- | --- |\n| Test | Works |';

async function upload(page: Page, name = "hello.md", content = markdown) {
  await page.getByLabel("Choose a Markdown file").setInputFiles({ name, mimeType: "text/markdown", buffer: Buffer.from(content) });
  await expect(page.getByRole("button", { name: "Open HTML", exact: true })).toBeEnabled();
}

test.beforeEach(async ({ page }) => { await page.goto("./"); });

test("initial workspace and example conversion", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Good Markdown. Beautiful HTML." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open HTML", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Try an example" }).click();
  await expect(page.getByText("Conversion complete", { exact: true })).toBeVisible();
  await expect(page.frameLocator('iframe[title="Generated HTML preview"]').getByRole("heading", { level: 1 })).toHaveText("A little Markdown.");
});

test("home link and favicon respect the deployment path", async ({ page, request }) => {
  const home = new URL(page.url());
  const link = page.getByRole("link", { name: "Markdown to HTML home" });
  const target = new URL((await link.getAttribute("href"))!, home);
  expect(target.pathname.replace(/\/$/, "")).toBe(home.pathname.replace(/\/$/, ""));
  const icon = await page.locator('link[rel="icon"][href$="icon.svg"]').getAttribute("href");
  const iconUrl = new URL(icon!, home);
  expect(iconUrl.pathname).toBe(`${home.pathname.replace(/\/$/, "")}/icon.svg`);
  const response = await request.get(iconUrl.href);
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
});

test("uploads, previews, opens rendered HTML, and detaches opener", async ({ page }) => {
  await upload(page);
  const preview = page.frameLocator('iframe[title="Generated HTML preview"]');
  await expect(preview.getByRole("heading", { name: "Hello World" })).toBeVisible();
  await expect(preview.locator("table")).toHaveCount(1);
  await expect(preview.locator(".hljs-keyword")).toHaveText("const");
  await expect(page.locator(".document-frame")).toHaveAttribute("sandbox", "");
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Open HTML", exact: true }).click();
  const popup = await popupPromise;
  await expect(popup.getByRole("heading", { name: "Hello World" })).toBeVisible();
  expect(popup.url()).toMatch(/^blob:/);
  expect(await popup.evaluate(() => window.opener)).toBeNull();
  await expect(popup.locator("script")).toHaveCount(0);
  await popup.close();
});

test("downloads a complete independently rendered HTML document", async ({ page, context }) => {
  await upload(page, "notes.markdown");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download HTML" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("notes.html");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const html = Buffer.concat(chunks).toString();
  expect(html).toContain("<!DOCTYPE html>");
  expect(html).toContain("<style>");
  expect(html).not.toContain("/_next/");
  const offline = await context.newPage();
  await offline.setContent(html);
  await expect(offline.getByRole("heading", { name: "Hello World" })).toBeVisible();
  await offline.close();
});

test("copies full HTML and supports clipboard denial", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await upload(page);
  await page.getByRole("button", { name: "Copy HTML", exact: true }).click();
  await expect(page.getByRole("button", { name: "Copied!" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("<!DOCTYPE html>");
  await page.evaluate(() => { Object.defineProperty(navigator.clipboard, "writeText", { configurable: true, value: () => Promise.reject(new Error("Denied")) }); });
  await page.getByRole("button", { name: "Copied!" }).click();
  await expect(page.getByRole("dialog", { name: "Copy your HTML" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "HTML to copy" })).toHaveValue(/<!DOCTYPE html>/);
});

test("validates file types, empty content, invalid encoding, and size", async ({ page }) => {
  const input = page.getByLabel("Choose a Markdown file");
  for (const item of [
    { name: "wrong.txt", buffer: Buffer.from("Hello"), error: /Unsupported file type/ },
    { name: "empty.md", buffer: Buffer.from(""), error: /file is empty/ },
    { name: "spaces.md", buffer: Buffer.from("  \n"), error: /file is empty/ },
    { name: "invalid.md", buffer: Buffer.from([0xc3, 0x28]), error: /encoding/ },
    { name: "large.md", buffer: Buffer.alloc(2 * 1024 * 1024 + 1, "a"), error: /too large/ },
  ]) {
    await input.setInputFiles({ name: item.name, mimeType: "text/plain", buffer: item.buffer });
    await expect(page.locator(".error-banner")).toContainText(item.error);
  }
  await upload(page);
  await expect(page.locator(".error-banner")).toHaveCount(0);
});

test("file read failure preserves an existing document", async ({ page }) => {
  await upload(page);
  await page.evaluate(() => { File.prototype.arrayBuffer = () => Promise.reject(new Error("Read failed")); });
  await page.getByLabel("Choose a Markdown file").setInputFiles({ name: "other.md", mimeType: "text/plain", buffer: Buffer.from("other") });
  await expect(page.locator(".error-banner")).toContainText("couldn’t read this file");
  await expect(page.locator(".error-banner")).toContainText("previous document is still available");
  await expect(page.getByRole("button", { name: "Open HTML", exact: true })).toBeEnabled();
});

test("drag and drop highlights, accepts files, and rejects multiple files", async ({ page }) => {
  const transfer = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(new File(["# Dropped document"], "drop.md", { type: "text/markdown" }));
    return data;
  });
  const dropZone = page.getByRole("region", { name: "Markdown input", exact: true });
  await dropZone.dispatchEvent("dragenter", { dataTransfer: transfer });
  await expect(page.getByText("Release your file to convert")).toBeVisible();
  await dropZone.dispatchEvent("drop", { dataTransfer: transfer });
  await expect(page.getByText("Conversion complete", { exact: true })).toBeVisible();
  await expect(page.frameLocator('iframe[title="Generated HTML preview"]').getByRole("heading", { name: "Dropped document" })).toBeVisible();
  await transfer.dispose();
  const multiple = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(new File(["# A"], "a.md")); data.items.add(new File(["# B"], "b.md"));
    return data;
  });
  await dropZone.dispatchEvent("drop", { dataTransfer: multiple });
  await expect(page.locator(".error-banner")).toContainText("One document at a time");
  await multiple.dispose();
});

test("theme, source tabs, expanded preview, and clear work", async ({ page }) => {
  await upload(page);
  await page.getByRole("button", { name: "Midnight theme" }).click();
  await expect(page.getByRole("button", { name: "Midnight theme" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.frameLocator('iframe[title="Generated HTML preview"]').locator("body")).toHaveCSS("background-color", "rgb(22, 24, 31)");
  await page.getByRole("tab", { name: "HTML", exact: true }).click();
  await expect(page.getByLabel("Generated HTML source")).toContainText("<!DOCTYPE html>");
  await page.getByRole("button", { name: "Expand HTML preview" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Expand HTML preview" })).toBeFocused();
  await page.getByRole("button", { name: "Remove file" }).click();
  await expect(page.getByRole("button", { name: "Browse files" })).toBeFocused();
  await expect(page.getByRole("button", { name: "Open HTML", exact: true })).toBeDisabled();
  await upload(page);
  await page.getByRole("button", { name: "Convert another" }).click();
  await expect(page.getByRole("button", { name: "Browse files" })).toBeVisible();
});

test("blocked popups produce a helpful recovery message", async ({ page }) => {
  await upload(page);
  await page.evaluate(() => { window.open = () => null; });
  await page.getByRole("button", { name: "Open HTML", exact: true }).click();
  await expect(page.locator(".toast-error")).toContainText("Allow popups");
});

test("untrusted HTML cannot execute or initiate image requests without consent", async ({ page }) => {
  let externalRequests = 0;
  await page.route("https://image.example.test/**", (route) => { externalRequests++; return route.fulfill({ status: 200, contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>' }); });
  await upload(page, "unsafe.md", '# Safe content\n\n<script>window.compromised=true</script>\n\n<img src="https://image.example.test/raw" onerror="alert(1)">\n\n![Image](https://image.example.test/image.svg)');
  const frame = page.frameLocator('iframe[title="Generated HTML preview"]');
  await expect(frame.getByRole("heading", { name: "Safe content" })).toBeVisible();
  await expect(frame.locator("script")).toHaveCount(0);
  expect(externalRequests).toBe(0);
  await page.getByRole("checkbox", { name: /Load 1 external image/ }).check();
  await expect.poll(() => externalRequests).toBe(1);
});

test("mobile layout remains usable without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByRole("button", { name: "Browse files" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await upload(page, `${"long-name-".repeat(20)}.md`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole("button", { name: "Open HTML", exact: true })).toBeEnabled();
});

test("main interface and documentation pass automated accessibility checks", async ({ page }) => {
  // Sandboxed cross-origin frames cannot be audited through axe's script injection.
  // Their semantic HTML is tested separately above and in the conversion tests.
  const audit = async () => (await new AxeBuilder({ page }).exclude("iframe").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations.map((violation) => ({ id: violation.id, nodes: violation.nodes.map((node) => ({ target: node.target, issue: node.failureSummary })) }));
  expect(await audit()).toEqual([]);
  await upload(page);
  expect(await audit()).toEqual([]);
  await page.getByRole("button", { name: "Documentation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await audit()).toEqual([]);
});

test("conversion keeps file contents off the network and out of storage", async ({ page }) => {
  const secretMarker = "local-document-privacy-regression-marker";
  const leakedRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes(secretMarker) || request.postData()?.includes(secretMarker)) {
      leakedRequests.push(request.url());
    }
  });
  await upload(page, "private.md", `# Private\n\n${secretMarker}`);
  expect(leakedRequests).toEqual([]);
  const stored = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  expect(JSON.stringify(stored)).not.toContain(secretMarker);
});

test("a cancelled read cannot restore a removed file", async ({ page }) => {
  await page.clock.install();
  await page.evaluate(() => {
    const original = File.prototype.arrayBuffer;
    File.prototype.arrayBuffer = function () {
      return new Promise((resolve, reject) => setTimeout(() => original.call(this).then(resolve, reject), 10_000));
    };
  });
  await page.getByLabel("Choose a Markdown file").setInputFiles({ name: "slow.md", mimeType: "text/markdown", buffer: Buffer.from("# Slow document") });
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.clock.fastForward(11_000);
  await expect(page.getByRole("button", { name: "Browse files" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open HTML", exact: true })).toBeDisabled();
});

test("slow conversions time out with a recoverable error", async ({ page }) => {
  await page.clock.install();
  await page.evaluate(() => {
    Object.defineProperty(window, "Worker", { value: class {
      postMessage() {}
      terminate() {}
    } });
  });
  await page.getByRole("button", { name: "Try an example" }).click();
  await expect(page.getByText("Converting locally…", { exact: true })).toBeVisible();
  await page.clock.fastForward(21_000);
  await expect(page.locator(".error-banner")).toContainText("taking too long");
  await expect(page.getByRole("button", { name: "Browse files" })).toBeVisible();
});

test("object URLs are revoked after the download grace period", async ({ page }) => {
  await upload(page);
  await page.clock.install();
  await page.evaluate(() => {
    const original = URL.revokeObjectURL;
    Object.defineProperty(window, "revokedUrls", { value: [] });
    URL.revokeObjectURL = (url) => {
      (window as unknown as { revokedUrls: string[] }).revokedUrls.push(url);
      original(url);
    };
  });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download HTML" }).click();
  await download;
  await page.clock.fastForward(61_000);
  const urls = await page.evaluate(() => (window as unknown as { revokedUrls: string[] }).revokedUrls);
  expect(urls).toHaveLength(1);
  expect(urls[0]).toMatch(/^blob:/);
});