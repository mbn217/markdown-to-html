import assert from "node:assert/strict";
import { test } from "node:test";
import { convertMarkdown } from "../src/lib/markdown";
import { createHtmlDocument, escapeHtml } from "../src/lib/document";
import { SAMPLE_MARKDOWN } from "../src/lib/sample";

test("converts the complete example with GFM and highlighted fenced code", async () => {
  const result = await convertMarkdown(SAMPLE_MARKDOWN, "example.md");
  assert.equal(result.title, "A little Markdown.");
  for (const tag of ["h1", "h2", "h3", "strong", "ul", "li", "blockquote", "table", "hr", "pre"]) {
    assert.match(result.fragment, new RegExp(`<${tag}[\\s>]`));
  }
  assert.match(result.fragment, /type="checkbox"/);
  assert.match(result.fragment, /hljs-keyword/);
  assert.ok(result.wordCount > 60);
});

test("supports all headings, emphasis, nested lists, escaping and links", async () => {
  const result = await convertMarkdown("# One\n## Two\n### Three\n#### Four\n##### Five\n###### Six\n\n*em* **bold** ~~old~~ `inline` \\*literal\\*\n\n1. First\n   - Nested\n\n[Web](https://example.com) [Mail](mailto:hello@example.com)", "features.markdown");
  for (const tag of ["h1", "h2", "h3", "h4", "h5", "h6", "em", "strong", "del", "code", "ol", "ul"]) {
    assert.match(result.fragment, new RegExp(`<${tag}[\\s>]`));
  }
  assert.match(result.fragment, /\*literal\*/);
  assert.match(result.fragment, /rel="noopener noreferrer"/);
  assert.match(result.fragment, /mailto:hello@example.com/);
});

test("drops raw HTML, script, iframe, event handlers and dangerous protocols", async () => {
  const result = await convertMarkdown('# Safe\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n<iframe src="https://evil.test"></iframe>\n\n[x](javascript:alert%281%29)\n\n![x](data:image/svg+xml,evil)\n\n<form action="https://evil.test"><input name="secret"></form>', "unsafe.md");
  assert.doesNotMatch(result.fragment, /<script|<iframe|onerror|javascript:|data:image|<form|<input/);
  assert.match(result.fragment, /<h1>Safe<\/h1>/);
});

test("preserves code as text, including HTML-looking code", async () => {
  const result = await convertMarkdown('```html\n<script>alert("text only")</script>\n```', "code.md");
  assert.doesNotMatch(result.fragment, /<script>/);
  assert.match(result.fragment, /&#x3C;|&lt;/);
});

test("unknown code languages do not crash conversion", async () => {
  const result = await convertMarkdown("```unknown-language\nhello\n```", "code.md");
  assert.match(result.fragment, /hello/);
});

test("tracks external images and disables nonportable resources", async () => {
  const result = await convertMarkdown("![Remote](https://example.com/image.png)\n![Local](./image.png)\n[Relative](./notes.md)\n[Anchor](#hello)", "images.md");
  assert.equal(result.externalImageCount, 1);
  assert.equal(result.warnings.length, 1);
  assert.match(result.fragment, /referrerpolicy="no-referrer"/);
  assert.doesNotMatch(result.fragment, /src="\.\/|href="\.\//);
  assert.match(result.fragment, /href="#hello"/);
});

test("exports a standalone responsive HTML document with CSP and escaped metadata", async () => {
  const result = await convertMarkdown("No heading here", '</title><script>alert(1)</script>.md');
  const html = createHtmlDocument(result);
  assert.match(html, /^<!DOCTYPE html>/);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /<style>/);
  assert.match(html, /script-src 'none'/);
  assert.match(html, /base-uri 'none'/);
  assert.match(html, /<main><p>No heading here<\/p><\/main>/);
  assert.doesNotMatch(html, /<script|<link|src="\/_next/);
  assert.match(html, /&lt;\/title&gt;/);
});

test("preview denies external images; exports permit them; themes are self-contained", async () => {
  const result = await convertMarkdown("# Test", "test.md");
  assert.match(createHtmlDocument(result, "paper", false), /img-src 'none'/);
  assert.match(createHtmlDocument(result), /img-src https: http:/);
  assert.match(createHtmlDocument(result, "midnight"), /color-scheme: dark/);
  assert.match(createHtmlDocument(result, "paper"), /color-scheme: light/);
});

test("escapes all HTML metadata delimiters", () => {
  assert.equal(escapeHtml(`<>&"'`), "&lt;&gt;&amp;&quot;&#39;");
});