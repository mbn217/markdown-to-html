import type { ConversionResult } from "./markdown";

export type DocumentTheme = "paper" | "midnight";

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

export function documentStyles(theme: DocumentTheme): string {
  const dark = theme === "midnight";
  return `
  :root { color-scheme: ${dark ? "dark" : "light"}; --bg: ${dark ? "#16181f" : "#ffffff"}; --text: ${dark ? "#e0e2ea" : "#35353f"}; --heading: ${dark ? "#f6f5fa" : "#252430"}; --muted: ${dark ? "#a4a7ba" : "#71717f"}; --border: ${dark ? "#333643" : "#e8e7ed"}; --soft: ${dark ? "#20232d" : "#f6f5f9"}; --accent: ${dark ? "#b8a0ff" : "#7453cb"}; }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.85 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; overflow-wrap: anywhere; }
  main { width: min(100%, 840px); padding: 52px 48px 76px; margin: 0 auto; }
  h1,h2,h3,h4,h5,h6 { color: var(--heading); font-weight: 700; line-height: 1.3; letter-spacing: -.025em; margin: 1.65em 0 .65em; scroll-margin-top: 24px; }
  h1 { font-size: 2.25em; margin-top: 0; letter-spacing: -.04em; }
  h2 { font-size: 1.5em; padding-bottom: .35em; border-bottom: 1px solid var(--border); }
  h3 { font-size: 1.18em; } h4 { font-size: 1.05em; } h5,h6 { font-size: 1em; }
  p { margin: 0 0 1.25em; } a { color: var(--accent); text-underline-offset: 3px; }
  a:not([href]) { color: var(--muted); } strong { color: var(--heading); }
  ul,ol { padding-left: 1.65em; margin: 0 0 1.25em; } li { padding-left: .2em; margin: .35em 0; } li > ul,li > ol { margin: .4em 0; }
  blockquote { border-left: 3px solid var(--accent); margin: 1.6em 0; padding: 12px 20px; background: var(--soft); color: var(--muted); border-radius: 0 6px 6px 0; } blockquote p:last-child { margin-bottom: 0; }
  code,kbd { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; font-size: .85em; background: var(--soft); border: 1px solid var(--border); border-radius: 5px; padding: .15em .4em; }
  pre { padding: 21px 23px; overflow-x: auto; border-radius: 9px; background: ${dark ? "#101219" : "#f6f5f9"}; border: 1px solid var(--border); line-height: 1.75; tab-size: 2; }
  pre code { padding: 0; border: 0; background: transparent; border-radius: 0; overflow-wrap: normal; font-size: 12px; }
  table { display: block; width: 100%; overflow-x: auto; border-spacing: 0; border-collapse: collapse; margin: 1.5em 0; font-size: .9em; }
  th,td { text-align: left; padding: 10px 15px; border: 1px solid var(--border); min-width: 100px; } th { background: var(--soft); color: var(--heading); font-weight: 600; }
  img { max-width: 100%; height: auto; border-radius: 8px; } img:not([src]) { display: inline-block; color: var(--muted); }
  hr { border: 0; border-top: 1px solid var(--border); margin: 2em 0; }
  .contains-task-list { list-style: none; padding-left: .15em; } .task-list-item input { margin-right: 9px; accent-color: var(--accent); }
  .hljs-comment,.hljs-quote { color: ${dark ? "#8d94aa" : "#818096"}; font-style: italic; }
  .hljs-keyword,.hljs-selector-tag,.hljs-literal,.hljs-built_in { color: ${dark ? "#c6a0f6" : "#8752ba"}; }
  .hljs-string,.hljs-attr,.hljs-addition { color: ${dark ? "#a6d8a5" : "#427d59"}; }
  .hljs-number,.hljs-symbol,.hljs-bullet { color: ${dark ? "#f2bd8e" : "#a05d2b"}; }
  .hljs-title,.hljs-section { color: ${dark ? "#8ab6ee" : "#3b69b6"}; } .hljs-deletion { color: #d45d70; }
  :focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; }
  @media(max-width: 600px) { main { padding: 30px 24px 48px; } body { font-size: 14px; } h1 { font-size: 2em; } pre { padding: 16px; } }
  @media(prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
  @media print { :root { --bg: #fff; --text: #222; --heading: #111; --border: #ddd; --soft: #f5f5f5; --accent: #553399; } main { max-width: none; padding: 0; } pre,blockquote { break-inside: avoid; } a { color: inherit; } }
  `;
}

export function createHtmlDocument(result: ConversionResult, theme: DocumentTheme = "paper", allowExternalImages = true): string {
  const csp = `default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src ${allowExternalImages ? "https: http:" : "'none'"}; base-uri 'none'; form-action 'none'; object-src 'none'; frame-src 'none'`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="referrer" content="no-referrer">
  <meta name="generator" content="Markdown → HTML">
  <title>${escapeHtml(result.title)}</title>
  <style>${documentStyles(theme)}</style>
</head>
<body>
  <main>${result.fragment}</main>
</body>
</html>`;
}