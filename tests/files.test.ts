import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeMarkdown, formatBytes, htmlFilename, MAX_FILE_BYTES, readMarkdownFile, validateFile } from "../src/lib/files";

test("accepts both case-insensitive Markdown extensions", () => {
  for (const name of ["a.md", "a.markdown", "README.MD", "NOTES.MARKDOWN"]) {
    assert.doesNotThrow(() => validateFile({ name, size: 20 }));
  }
});

test("rejects unsupported, empty, and oversized files", () => {
  for (const name of ["test.txt", "test.md.exe", "test.html", "md"]) {
    assert.throws(() => validateFile({ name, size: 1 }), /Unsupported file type/);
  }
  assert.throws(() => validateFile({ name: "test.md", size: 0 }), /empty/);
  assert.throws(() => validateFile({ name: "test.md", size: MAX_FILE_BYTES + 1 }), /too large/);
  assert.doesNotThrow(() => validateFile({ name: "test.md", size: MAX_FILE_BYTES }));
});

test("decodes UTF-8, Unicode, and UTF-8 BOM", () => {
  const buffer = new TextEncoder().encode("\uFEFF# Héllo 世界 🌍").buffer;
  assert.equal(decodeMarkdown(buffer), "# Héllo 世界 🌍");
});

test("rejects malformed encodings, binary content, and whitespace-only files", () => {
  assert.throws(() => decodeMarkdown(new Uint8Array([0xc3, 0x28]).buffer), /encoding/);
  assert.throws(() => decodeMarkdown(new Uint8Array([0xff, 0xfe, 0x23, 0x00]).buffer), /encoding/);
  assert.throws(() => decodeMarkdown(new TextEncoder().encode("a\0b").buffer), /text file/);
  assert.throws(() => decodeMarkdown(new TextEncoder().encode("  \n\t").buffer), /empty/);
  assert.throws(() => decodeMarkdown(new ArrayBuffer(MAX_FILE_BYTES + 1)), /too large/);
});

test("reads a real File and reports read failures without leaking errors", async () => {
  assert.equal(await readMarkdownFile(new File(["# Hello"], "hello.md")), "# Hello");
  const file = new File(["test"], "test.md");
  Object.defineProperty(file, "arrayBuffer", { value: () => Promise.reject(new Error("OS error")) });
  await assert.rejects(readMarkdownFile(file), /couldn’t read this file/);
});

test("produces portable HTML filenames and friendly sizes", () => {
  assert.equal(htmlFilename("My Notes.MARKDOWN"), "My Notes.html");
  assert.equal(htmlFilename("a<>b.md"), "a--b.html");
  assert.equal(formatBytes(200), "200 B");
  assert.equal(formatBytes(1024), "1.0 KB");
  assert.equal(formatBytes(MAX_FILE_BYTES), "2.0 MB");
});