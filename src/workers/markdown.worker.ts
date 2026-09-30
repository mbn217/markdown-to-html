import type { ConversionResult } from "../lib/markdown";

export type WorkerRequest = { id: number; source: string; filename: string };
export type WorkerResponse =
  | { id: number; ok: true; result: ConversionResult }
  | { id: number; ok: false; error: string };

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, source, filename } = event.data;
  try {
    // Catch module-loading failures as well as parser failures.
    const { convertMarkdown } = await import("../lib/markdown");
    const result = await convertMarkdown(source, filename);
    self.postMessage({ id, ok: true, result } satisfies WorkerResponse);
  } catch {
    self.postMessage({ id, ok: false, error: "We couldn’t convert this document. Check the Markdown and try again." } satisfies WorkerResponse);
  }
};