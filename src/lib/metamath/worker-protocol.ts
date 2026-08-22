import type { MetamathIndex } from "./types";

export type LoadingPhase =
  "idle" | "fetching" | "parsing" | "indexing" | "linking" | "ready" | "error";

export interface ProgressMessage {
  type: "progress";
  phase: LoadingPhase;
  receivedBytes?: number;
  totalBytes?: number;
  processedStatements?: number;
  fromCache?: boolean;
}

export interface ReadyMessage {
  type: "ready";
  index: MetamathIndex;
  fromCache: boolean;
  /** False on the first ("basic") ready event of a cold start: browsing,
   * search and the dependency graph are usable, but hypotheses and
   * on-demand proof verification are not until the heavier scope-aware
   * pass finishes and a second `ready` (enriched: true) is sent. */
  enriched: boolean;
}

export interface ErrorMessage {
  type: "error";
  message: string;
}

export interface VerifyResultMessage {
  type: "verify-result";
  label: string;
  ok: boolean;
  error?: string;
  steps?: Array<{
    ref: string | number;
    typecode: string;
    expression: string[];
    args: Array<number | string>;
  }>;
  durationMs: number;
}

export type WorkerResponse =
  ProgressMessage | ReadyMessage | ErrorMessage | VerifyResultMessage;

export interface LoadCommand {
  type: "load";
  sourceUrl: string;
  forceRefresh?: boolean;
}

export interface VerifyCommand {
  type: "verify";
  label: string;
}

export interface ClearCacheCommand {
  type: "clear-cache";
}

export type WorkerCommand = LoadCommand | VerifyCommand | ClearCacheCommand;
