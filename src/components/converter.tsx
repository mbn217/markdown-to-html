"use client";

import { useConverter } from "@/hooks/use-converter";
import { createHtmlDocument, type DocumentTheme } from "@/lib/document";
import { formatBytes, htmlFilename, MAX_FILE_LABEL } from "@/lib/files";
import type { ConversionResult } from "@/lib/markdown";
import { SAMPLE_FILENAME, SAMPLE_MARKDOWN } from "@/lib/sample";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import {
    ArrowDown, ArrowDownToLine, ArrowRight, ArrowUpRight, Braces, Check,
    CheckCheck, ChevronRight, CircleAlert, Code2, Copy, Expand, ExternalLink,
    FileCode2, FileText, Globe2, Info, LoaderCircle, LockKeyhole, Moon,
    RotateCcw, ShieldCheck, Sparkles, Sun, Upload, X, Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { HelpDialog } from "./help-dialog";

const steps = [
  { title: "Upload", text: "Drop in your Markdown" },
  { title: "Convert", text: "We take care of the HTML" },
  { title: "Preview", text: "See your words come to life" },
  { title: "Open & share", text: "Your page, ready for the web" },
];

type Notice = { text: string; error?: boolean } | null;

export function Converter({ example }: { example: ConversionResult }) {
  const { document: loaded, busy, pendingFilename, error, load, clear, setError } = useConverter();
  const [theme, setTheme] = useState<DocumentTheme>("paper");
  const [allowImages, setAllowImages] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [sourceTab, setSourceTab] = useState("markdown");
  const [notice, setNotice] = useState<Notice>(null);
  const [copied, setCopied] = useState(false);
  const [copyFallback, setCopyFallback] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const browse = useRef<HTMLButtonElement>(null);
  const dragDepth = useRef(0);
  const urls = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const result = loaded?.result ?? example;
  const html = useMemo(() => createHtmlDocument(result, theme), [result, theme]);
  const preview = useMemo(() => createHtmlDocument(result, theme, allowImages), [result, theme, allowImages]);
  const ready = Boolean(loaded) && !busy;

  useEffect(() => {
    const activeUrls = urls.current;
    return () => {
      activeUrls.forEach((timeout, url) => { clearTimeout(timeout); URL.revokeObjectURL(url); });
      activeUrls.clear();
    };
  }, []);

  useEffect(() => {
    if (!notice || notice.error) return;
    const timeout = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    // Prevent accidental navigation if a dropped file misses the upload area.
    const preventNavigation = (event: globalThis.DragEvent) => {
      if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
    };
    window.addEventListener("dragover", preventNavigation);
    window.addEventListener("drop", preventNavigation);
    return () => {
      window.removeEventListener("dragover", preventNavigation);
      window.removeEventListener("drop", preventNavigation);
    };
  }, []);

  function acceptFiles(files: FileList | File[]) {
    if (!files.length) return;
    if (files.length !== 1) {
      setError("One document at a time, please. Choose a single Markdown file.");
      return;
    }
    setNotice(null);
    setCopied(false);
    setAllowImages(false);
    setSourceTab("markdown");
    void load(files[0]);
  }

  function reset() {
    clear();
    setNotice(null);
    setCopied(false);
    setAllowImages(false);
    setSourceTab("markdown");
    if (input.current) input.current.value = "";
    requestAnimationFrame(() => browse.current?.focus());
  }

  function drop(event: DragEvent) {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    acceptFiles(event.dataTransfer.files);
  }

  function makeUrl() {
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(url);
      urls.current.delete(url);
    }, 60_000);
    urls.current.set(url, timeout);
    return url;
  }

  function revokeUrl(url: string) {
    clearTimeout(urls.current.get(url));
    urls.current.delete(url);
    URL.revokeObjectURL(url);
  }

  function openHtml() {
    if (!ready) return;
    const url = makeUrl();
    try {
      // Open synchronously to preserve user activation; detach opener before navigation.
      const tab = window.open("about:blank", "_blank");
      if (!tab) {
        revokeUrl(url);
        setNotice({ error: true, text: "Your browser blocked the new tab. Allow popups for this site, or download the HTML and open it directly." });
        return;
      }
      tab.opener = null;
      tab.location.replace(url);
      setNotice({ text: "Your HTML page is open in a new tab." });
    } catch {
      revokeUrl(url);
      setNotice({ error: true, text: "We couldn’t open a new tab. Allow popups for this site, or use Download HTML instead." });
    }
  }

  function downloadHtml() {
    if (!loaded || !ready) return;
    const url = makeUrl();
    const link = document.createElement("a");
    link.href = url;
    link.download = htmlFilename(loaded.filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setNotice({ text: "Download started. One HTML file, ready to go anywhere." });
  }

  async function copyHtml() {
    if (!ready) return;
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setNotice({ text: "Complete HTML document copied to your clipboard." });
    } catch {
      setCopyFallback(true);
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace">Skip to converter</a>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Markdown to HTML home">
          <span className="brand-mark"><FileCode2 size={23} strokeWidth={1.8} /></span>
          <span>Markdown <span className="brand-arrow">→</span> HTML<span className="brand-dot">.</span></span>
        </Link>
        <nav aria-label="Main navigation">
          <a href="#how-it-works" className="nav-link">How it works</a>
          <HelpDialog><button className="nav-link documentation-link">Documentation <ArrowUpRight size={14} /></button></HelpDialog>
          <span className="header-divider" />
          <span className="private-pill"><span className="status-dot" /> Local. Private. Yours.</span>
        </nav>
      </header>

      <main className="main-content">
        <section className="hero" aria-labelledby="hero-title">
          <div className="eyebrow"><span className="eyebrow-icon"><Zap size={12} fill="currentColor" /></span> SMALL TOOL. BEAUTIFUL OUTPUT.</div>
          <h1 id="hero-title">Good Markdown.<br /><span>Beautiful HTML.</span></h1>
          <p>Your words deserve a great-looking page. Turn Markdown into<br className="desktop-break" /> clean, standalone HTML — right in your browser.</p>
          <div className="hero-details"><span><Check size={13} /> No uploads</span><span className="detail-dot">·</span><span><Check size={13} /> No sign-up</span><span className="detail-dot">·</span><span><Check size={13} /> Just your ideas</span></div>
        </section>

        <section id="how-it-works" className="steps" aria-label="How it works">
          {steps.map((step, index) => (
            <div className="step" key={step.title}>
              <span className="step-number">0{index + 1}</span>
              <div><h2>{step.title}</h2><p>{step.text}</p></div>
              {index < 3 && <ChevronRight className="step-chevron" size={15} />}
            </div>
          ))}
        </section>

        <section id="workspace" className="workspace" aria-label="Markdown converter" tabIndex={-1}>
          <div className="workspace-heading">
            <div className="workspace-title"><span className="workspace-icon"><Code2 size={19} /></span><div><h2>Your workspace</h2><p>A little text in. A beautiful page out.</p></div></div>
            <span className={`conversion-status ${ready ? "is-ready" : ""}`} role="status">
              {busy ? <LoaderCircle className="spin" size={13} /> : <span className="status-dot" />}
              {busy ? "Converting locally…" : ready ? "Conversion complete" : "Ready when you are"}
            </span>
          </div>

          <input ref={input} type="file" accept=".md,.markdown" className="sr-only" tabIndex={-1} aria-label="Choose a Markdown file" onChange={(event) => { if (event.target.files) acceptFiles(event.target.files); event.target.value = ""; }} />

          {error && <div className="error-banner" role="alert"><CircleAlert size={17} /><span>{error}{loaded && " Your previous document is still available."}</span><button className="icon-button" aria-label="Dismiss error" onClick={() => setError(null)}><X size={16} /></button></div>}

          <div className="workspace-panels">
            <section className={`source-panel ${dragging ? "is-dragging" : ""}`} aria-label="Markdown input"
              onDragEnter={(event) => { event.preventDefault(); if (event.dataTransfer.types.includes("Files")) { dragDepth.current++; setDragging(true); } }}
              onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }}
              onDragLeave={(event) => { event.preventDefault(); dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragging(false); }}
              onDrop={drop}>
              <div className="panel-heading"><span><span className="panel-index">01</span> YOUR MARKDOWN</span><span className="file-type">.md <ArrowRight size={12} /> .html</span></div>
              {dragging && <div className="drop-overlay"><Upload size={36} /><strong>Drop it like it’s Markdown.</strong><span>Release your file to convert</span></div>}
              {busy ? (
                <div className="upload-content processing" aria-live="polite"><span className="upload-illustration"><LoaderCircle className="spin" size={35} /></span><h3>A little transformation…</h3><p className="pending-filename">{pendingFilename}</p><p>Reading, styling, and keeping it all local.</p><button className="button button-secondary" onClick={reset}>Cancel</button></div>
              ) : loaded ? (
                <div className="loaded-source">
                  <div className="file-card"><span className="file-icon"><FileText size={22} /></span><div><strong title={loaded.filename}>{loaded.filename}</strong><span>{formatBytes(loaded.bytes)} <span>·</span> {loaded.result.wordCount.toLocaleString()} words</span></div><span className="file-check"><CheckCheck size={17} /></span><button className="icon-button" onClick={reset} aria-label="Remove file"><X size={17} /></button></div>
                  <Tabs.Root value={sourceTab} onValueChange={setSourceTab} className="source-tabs">
                    <Tabs.List className="source-tab-list" aria-label="Document source"><Tabs.Trigger value="markdown"><FileText size={13} /> Markdown</Tabs.Trigger><Tabs.Trigger value="html"><Code2 size={14} /> HTML</Tabs.Trigger></Tabs.List>
                    <Tabs.Content value="markdown" className="source-tab-content"><pre aria-label="Markdown source" tabIndex={0}>{loaded.source}</pre></Tabs.Content>
                    <Tabs.Content value="html" className="source-tab-content"><pre aria-label="Generated HTML source" tabIndex={0}>{html}</pre></Tabs.Content>
                  </Tabs.Root>
                  <div className="source-footer"><LockKeyhole size={12} /> Only in your browser <button onClick={() => input.current?.click()}>Replace file <ArrowRight size={12} /></button></div>
                </div>
              ) : (
                <div className="upload-content">
                  <div className="upload-illustration"><span className="back-file" /><span className="front-file"><FileText size={33} strokeWidth={1.35} /><span className="file-md">MD</span></span><span className="upload-badge"><ArrowDown size={15} strokeWidth={2.4} /></span></div>
                  <h3>A fresh page starts here.</h3>
                  <p>Drag & drop your Markdown file<br />or pick one from your computer.</p>
                  <button ref={browse} className="button button-primary browse-button" onClick={() => input.current?.click()}><Upload size={16} /> Browse files</button>
                  <span className="upload-limit">.md or .markdown <span>·</span> Up to {MAX_FILE_LABEL}</span>
                  <div className="example-prompt">Just looking around? <button onClick={() => acceptFiles([new File([SAMPLE_MARKDOWN], SAMPLE_FILENAME, { type: "text/markdown" })])}>Try an example <ArrowUpRight size={12} /></button></div>
                </div>
              )}
              {!loaded && !busy && <div className="upload-privacy"><LockKeyhole size={12} /> Your file never leaves your device.</div>}
            </section>

            <section className="preview-panel" aria-label="HTML preview">
              <div className="panel-heading"><span><span className="panel-index">02</span> HTML PREVIEW</span><div className="preview-tools">
                <div className="theme-switch" role="group" aria-label="Document theme"><button aria-label="Paper theme" aria-pressed={theme === "paper"} onClick={() => setTheme("paper")}><Sun size={13} /><span>Paper</span></button><button aria-label="Midnight theme" aria-pressed={theme === "midnight"} onClick={() => setTheme("midnight")}><Moon size={13} /></button></div>
                <Dialog.Root><Dialog.Trigger asChild><button className="icon-button expand-button" aria-label="Expand HTML preview"><Expand size={15} /></button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-content expanded-preview"><div className="expanded-header"><div><Dialog.Title>{result.title}</Dialog.Title><Dialog.Description>Sandboxed HTML preview · {theme === "paper" ? "Paper" : "Midnight"} theme</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Close expanded preview"><X size={20} /></Dialog.Close></div><iframe title="Expanded HTML preview" srcDoc={preview} sandbox="" referrerPolicy="no-referrer" /></Dialog.Content></Dialog.Portal></Dialog.Root>
              </div></div>
              <div className={`preview-body ${theme === "midnight" ? "preview-dark" : ""}`}>
                <div className="preview-meta"><span className="preview-address"><Globe2 size={12} /> {loaded ? htmlFilename(loaded.filename) : "your-next-great-page.html"}</span><span className={`preview-label ${loaded ? "preview-label-live" : ""}`}>{loaded ? <><span className="status-dot" /> LIVE PREVIEW</> : "EXAMPLE PREVIEW"}</span></div>
                <iframe title="Generated HTML preview" srcDoc={preview} sandbox="" referrerPolicy="no-referrer" className="document-frame" />
                {!loaded && <div className="preview-example-note"><Sparkles size={12} /> A glimpse of what your Markdown can become</div>}
              </div>
            </section>
          </div>

          {loaded && (result.externalImageCount > 0 || result.warnings.length > 0) && <div className="document-notes">
            {result.warnings.map((warning) => <p key={warning}><Info size={15} />{warning}</p>)}
            {result.externalImageCount > 0 && <label><input type="checkbox" checked={allowImages} onChange={(event) => setAllowImages(event.target.checked)} /> Load {result.externalImageCount} external {result.externalImageCount === 1 ? "image" : "images"} in preview <span>(contacts image hosts; enabled in exports)</span></label>}
          </div>}

          <div className="action-bar">
            <div className="primary-actions"><button className="button button-primary open-button" onClick={openHtml} disabled={!ready}>Open HTML <ArrowUpRight size={16} /></button><button className="button button-secondary" onClick={downloadHtml} disabled={!ready}><ArrowDownToLine size={15} /><span>Download HTML</span></button><button className="button button-copy" onClick={copyHtml} disabled={!ready}>{copied ? <Check size={15} /> : <Copy size={15} />}<span>{copied ? "Copied!" : "Copy HTML"}</span></button></div>
            {loaded ? <button className="convert-another" onClick={reset}><RotateCcw size={13} /> Convert another</button> : <span className="action-hint"><ExternalLink size={12} /> One file. Any browser.</span>}
          </div>
        </section>

        <div className="under-workspace"><span><ShieldCheck size={14} /> No servers. No storage. No worries.</span><span>Thoughtfully simple. Entirely free.</span></div>

        <section className="features" aria-label="Made for your workflow">
          <article><span className="feature-icon"><LockKeyhole size={20} strokeWidth={1.6} /></span><h2>Your files stay yours.</h2><p>Everything happens in your browser.<br />Your words are nobody else’s business.</p></article>
          <article><span className="feature-icon"><Braces size={20} strokeWidth={1.6} /></span><h2>Markdown, with all the extras.</h2><p>Tables, task lists, highlighted code.<br />The syntax you love, beautifully rendered.</p></article>
          <article><span className="feature-icon"><Globe2 size={20} strokeWidth={1.6} /></span><h2>A page that travels well.</h2><p>Clean HTML with styles built right in.<br />Open it anywhere. Make it your own.</p></article>
        </section>
      </main>

      <footer className="site-footer"><span className="footer-brand"><FileCode2 size={15} /> Markdown <span>→</span> HTML</span><p>Less friction. More creating.</p><HelpDialog><button>Made for the way you write <ArrowUpRight size={12} /></button></HelpDialog></footer>

      {notice && <div className={`toast ${notice.error ? "toast-error" : ""}`} role={notice.error ? "alert" : "status"}>{notice.error ? <CircleAlert size={19} /> : <Check size={18} />}<span>{notice.text}</span><button className="icon-button" onClick={() => setNotice(null)} aria-label="Dismiss notification"><X size={15} /></button></div>}

      <Dialog.Root open={copyFallback} onOpenChange={setCopyFallback}><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-content copy-dialog"><div className="dialog-heading"><Copy size={23} /><Dialog.Close className="icon-button" aria-label="Close copy dialog"><X size={20} /></Dialog.Close></div><Dialog.Title>Copy your HTML</Dialog.Title><Dialog.Description>Your browser couldn’t access the clipboard. Select the HTML below, then press Ctrl+C (or ⌘C on Mac).</Dialog.Description><textarea aria-label="HTML to copy" readOnly value={html} onFocus={(event) => event.currentTarget.select()} /><Dialog.Close className="button button-primary">Done</Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>
    </div>
  );
}