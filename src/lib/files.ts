export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_FILE_LABEL = "2 MB";

export class MarkdownFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MarkdownFileError";
  }
}

export function validateFile(file: Pick<File, "name" | "size">): void {
  if (!/\.(md|markdown)$/i.test(file.name)) {
    throw new MarkdownFileError("Unsupported file type. Please upload a Markdown (.md) file.");
  }
  if (file.size === 0) {
    throw new MarkdownFileError("This file is empty. Add a little Markdown and try again.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new MarkdownFileError(`This file is too large. Please choose a file smaller than ${MAX_FILE_LABEL}.`);
  }
}

export function decodeMarkdown(buffer: ArrayBuffer): string {
  if (buffer.byteLength > MAX_FILE_BYTES) {
    throw new MarkdownFileError(`This file is too large. Please choose a file smaller than ${MAX_FILE_LABEL}.`);
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    throw new MarkdownFileError("We couldn’t read this file’s encoding. Save it as UTF-8 and try again.");
  }
  if (text.includes("\0")) {
    throw new MarkdownFileError("This doesn’t look like a text file. Please choose a UTF-8 Markdown file.");
  }
  if (!text.trim()) {
    throw new MarkdownFileError("This file is empty. Add a little Markdown and try again.");
  }
  return text;
}

export async function readMarkdownFile(file: File): Promise<string> {
  validateFile(file);
  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    throw new MarkdownFileError("We couldn’t read this file. Try selecting it again, or use a different file.");
  }
  return decodeMarkdown(buffer);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function htmlFilename(filename: string): string {
  return `${filename.replace(/\.(md|markdown)$/i, "").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-") || "document"}.html`;
}