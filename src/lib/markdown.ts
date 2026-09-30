import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root, Element, RootContent } from "hast";

export interface ConversionResult {
  fragment: string;
  title: string;
  wordCount: number;
  readingMinutes: number;
  externalImageCount: number;
  warnings: string[];
}

function textContent(node: RootContent): string {
  if (node.type === "text") return node.value;
  if ("children" in node) return node.children.map(textContent).join("");
  return "";
}

/** Raw HTML is intentionally not passed through remark-rehype. */
export async function convertMarkdown(markdown: string, filename: string): Promise<ConversionResult> {
  let title = filename.replace(/\.(md|markdown)$/i, "") || "Untitled document";
  let foundHeading = false;
  let externalImageCount = 0;
  let relativeResources = false;
  let words = "";

  function prepareDocument() {
    return (tree: Root) => {
      visit(tree, "element", (node: Element) => {
        if (node.tagName === "h1" && !foundHeading) {
          title = textContent(node).trim() || title;
          foundHeading = true;
        }
        if (node.tagName === "a") {
          const href = String(node.properties.href ?? "");
          if (/^(https?:|mailto:)/i.test(href)) {
            node.properties.target = "_blank";
            node.properties.rel = ["noopener", "noreferrer"];
          } else if (href && !href.startsWith("#")) {
            delete node.properties.href;
            relativeResources = true;
          }
        }
        if (node.tagName === "img") {
          const src = String(node.properties.src ?? "");
          if (/^https?:\/\//i.test(src)) {
            externalImageCount++;
            node.properties.loading = "lazy";
            node.properties.referrerPolicy = "no-referrer";
          } else {
            delete node.properties.src;
            relativeResources = true;
          }
        }
      });
      visit(tree, "text", (node) => { words += `${node.value} `; });
    };
  }

  const output = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(prepareDocument)
    // Highlight only after sanitization. This trusted plugin adds spans/classes, never scripts.
    .use(rehypeHighlight, { detect: false, ignoreMissing: true })
    .use(rehypeStringify)
    .process(markdown);

  const wordCount = words.trim().split(/\s+/u).filter(Boolean).length;
  const warnings: string[] = [];
  if (relativeResources) {
    warnings.push("Local and relative file references can’t travel with an HTML file. Use full https:// URLs for images and links.");
  }
  return {
    fragment: String(output), title, wordCount,
    readingMinutes: Math.max(1, Math.ceil(wordCount / 220)),
    externalImageCount, warnings,
  };
}