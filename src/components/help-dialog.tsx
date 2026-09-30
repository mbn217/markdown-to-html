"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, BookOpen, FileCode2, LockKeyhole, X } from "lucide-react";

export function HelpDialog({ children }: { children: React.ReactNode }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content help-dialog">
          <div className="dialog-heading">
            <span className="icon-tile"><BookOpen size={21} /></span>
            <Dialog.Close className="icon-button" aria-label="Close documentation"><X size={20} /></Dialog.Close>
          </div>
          <Dialog.Title>A little guide to beautiful HTML.</Dialog.Title>
          <Dialog.Description>Everything you need to turn plain text into a page worth sharing.</Dialog.Description>
          <section className="help-section">
            <h3><FileCode2 size={17} /> From file to finished page</h3>
            <p>Drop one <strong>.md</strong> or <strong>.markdown</strong> file into the workspace, or browse your computer. Files must be UTF-8 text, up to 2 MB. Conversion happens automatically.</p>
            <p>Review your document, choose Paper or Midnight, then use <strong>Open HTML</strong>, <strong>Download HTML</strong>, or <strong>Copy HTML</strong>. Your export includes its own styles and needs no app, scripts, or external fonts.</p>
          </section>
          <section className="help-section">
            <h3><BookOpen size={17} /> Real Markdown, beautifully handled</h3>
            <p>Headings, emphasis, links, images, nested lists, quotes, tables, task lists, strikethrough, and fenced code blocks are supported. Add a language after the opening code fence for syntax highlighting.</p>
            <p>Use full https:// URLs for images and external links. Relative files aren’t bundled. Raw embedded HTML is intentionally omitted for safety.</p>
          </section>
          <section className="help-section">
            <h3><LockKeyhole size={17} /> Private by design</h3>
            <p>Your Markdown stays in this browser tab. We don’t upload, store, or track your documents. Conversion runs in a local worker, and the sanitized preview lives in a sandboxed frame.</p>
            <p>Remote images are blocked in the preview unless you enable them. Exported documents may load their linked images from the internet; those images aren’t embedded for offline use. Scripts and forms are disabled.</p>
          </section>
          <div className="help-callout"><ArrowUpRight size={18} /><p>New tab didn’t open? Allow popups for this site, or download the HTML and open it directly in your browser.</p></div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}