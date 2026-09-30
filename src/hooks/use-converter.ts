"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MarkdownFileError, readMarkdownFile } from "@/lib/files";
import type { ConversionResult } from "@/lib/markdown";
import type { WorkerResponse, WorkerRequest } from "@/workers/markdown.worker";

export interface LoadedDocument {
  filename: string;
  bytes: number;
  source: string;
  result: ConversionResult;
}

export function useConverter() {
  const [document, setDocument] = useState<LoadedDocument | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingFilename, setPendingFilename] = useState("");
  const [error, setError] = useState<string | null>(null);
  const sequence = useRef(0);
  const worker = useRef<Worker | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    worker.current?.terminate();
    worker.current = null;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => () => { sequence.current++; stop(); }, [stop]);

  const clear = useCallback(() => {
    sequence.current++;
    stop();
    setDocument(null);
    setBusy(false);
    setPendingFilename("");
    setError(null);
  }, [stop]);

  const load = useCallback(async (file: File) => {
    const id = ++sequence.current;
    stop();
    setError(null);
    setBusy(true);
    setPendingFilename(file.name);

    try {
      const source = await readMarkdownFile(file);
      if (id !== sequence.current) return;
      const conversionWorker = new Worker(new URL("../workers/markdown.worker.ts", import.meta.url), { type: "module" });
      worker.current = conversionWorker;

      const fail = (message: string) => {
        if (id !== sequence.current) return;
        stop();
        setError(message);
        setBusy(false);
      };
      timer.current = setTimeout(() => fail("This document is taking too long to convert. Try a smaller file or simplify very large tables."), 20_000);
      conversionWorker.onerror = () => fail("The converter couldn’t start. Refresh the page and try again in a current browser.");
      conversionWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.id !== sequence.current) return;
        stop();
        setBusy(false);
        if (!event.data.ok) {
          setError(event.data.error);
          return;
        }
        setDocument({ filename: file.name, bytes: file.size, source, result: event.data.result });
      };
      conversionWorker.postMessage({ id, source, filename: file.name } satisfies WorkerRequest);
    } catch (cause) {
      if (id !== sequence.current) return;
      stop();
      setBusy(false);
      setError(cause instanceof MarkdownFileError ? cause.message : "Something went wrong reading your file. Please try again.");
    }
  }, [stop]);

  return { document, busy, pendingFilename, error, load, clear, setError };
}