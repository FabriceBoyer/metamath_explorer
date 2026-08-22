/// <reference lib="webworker" />
import type { MM } from "@/vendor/metamath-js/engine";
import {
  buildFastIndex,
  enrichIndexWithEngine,
} from "@/lib/metamath/index-builder";
import {
  getCachedRaw,
  setCachedRaw,
  getCachedIndex,
  setCachedIndex,
  clearAllCaches,
} from "@/lib/db/cache";
import { sha256Hex } from "@/lib/db/hash";
import type {
  WorkerCommand,
  WorkerResponse,
} from "@/lib/metamath/worker-protocol";

declare const self: DedicatedWorkerGlobalScope;

let liveMm: MM | undefined;

function post(message: WorkerResponse) {
  self.postMessage(message);
}

async function fetchWithProgress(
  url: string,
): Promise<{ text: string; byteLength: number }> {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download set.mm (HTTP ${response.status})`);
  }
  const totalBytes =
    Number(response.headers.get("content-length")) || undefined;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let received = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    chunks.push(decoder.decode(value, { stream: true }));
    post({
      type: "progress",
      phase: "fetching",
      receivedBytes: received,
      totalBytes,
    });
  }
  chunks.push(decoder.decode());

  const text = chunks.join("");
  return { text, byteLength: received };
}

async function loadDatabase(sourceUrl: string, forceRefresh: boolean) {
  try {
    let text: string;
    let byteLength: number;
    let sha256: string;
    let fetchedAt: string;

    const cachedRaw = forceRefresh ? undefined : await getCachedRaw(sourceUrl);
    if (cachedRaw) {
      ({ text, byteLength, sha256, fetchedAt } = cachedRaw);
      post({
        type: "progress",
        phase: "fetching",
        receivedBytes: byteLength,
        totalBytes: byteLength,
        fromCache: true,
      });
    } else {
      post({ type: "progress", phase: "fetching", receivedBytes: 0 });
      const fetched = await fetchWithProgress(sourceUrl);
      text = fetched.text;
      byteLength = fetched.byteLength;
      fetchedAt = new Date().toISOString();
      sha256 = await sha256Hex(text);
      await setCachedRaw({
        url: sourceUrl,
        text,
        sha256,
        byteLength,
        fetchedAt,
      });
    }

    const cachedIndex = forceRefresh ? undefined : await getCachedIndex(sha256);
    if (cachedIndex) {
      post({
        type: "ready",
        index: cachedIndex,
        fromCache: true,
        enriched: true,
      });
      // Still rebuild the live engine in the background so on-demand
      // verification works, without blocking the (already complete) view.
      queueMicrotask(() => {
        const { mm } = enrichIndexWithEngine(text, cachedIndex);
        liveMm = mm;
      });
      return;
    }

    post({ type: "progress", phase: "parsing" });
    const index = buildFastIndex(text, {
      sourceUrl,
      fetchedAt,
      byteLength,
      sha256,
    });
    post({
      type: "progress",
      phase: "indexing",
      processedStatements: index.meta.statementCount,
    });
    post({ type: "ready", index, fromCache: false, enriched: false });

    post({
      type: "progress",
      phase: "linking",
      processedStatements: index.meta.statementCount,
    });
    const { mm } = enrichIndexWithEngine(text, index);
    liveMm = mm;
    await setCachedIndex(sha256, index);
    post({ type: "ready", index, fromCache: false, enriched: true });
  } catch (error) {
    post({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function verifyLabel(label: string) {
  const start = performance.now();
  if (!liveMm) {
    post({
      type: "verify-result",
      label,
      ok: false,
      error: "engine-not-ready",
      durationMs: performance.now() - start,
    });
    return;
  }

  try {
    const labels = liveMm.labels as Record<string, unknown[]>;
    const entry = labels[label];
    if (!entry) throw new Error(`Unknown label "${label}"`);
    const resultFn = entry[2] as (
      generate?: boolean,
      markers?: boolean,
    ) => Array<[string | number, [string, string[]], Array<number | string>]>;
    // markers=false fully expands the proof so every returned step is a
    // plain label reference — no back-reference bookkeeping to render.
    const rawSteps = resultFn(false, false);
    const steps = rawSteps.map(([ref, [typecode, expression], args]) => ({
      ref,
      typecode,
      expression,
      args,
    }));
    post({
      type: "verify-result",
      label,
      ok: true,
      steps,
      durationMs: performance.now() - start,
    });
  } catch (error) {
    post({
      type: "verify-result",
      label,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      durationMs: performance.now() - start,
    });
  }
}

self.onmessage = (event: MessageEvent<WorkerCommand>) => {
  const command = event.data;
  if (command.type === "load") {
    void loadDatabase(command.sourceUrl, command.forceRefresh ?? false);
  } else if (command.type === "verify") {
    verifyLabel(command.label);
  } else if (command.type === "clear-cache") {
    liveMm = undefined;
    void clearAllCaches().then(() => {
      post({ type: "progress", phase: "idle" });
    });
  }
};
