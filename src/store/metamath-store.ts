import { create } from "zustand";
import type {
  LoadingPhase,
  VerifyResultMessage,
  WorkerResponse,
} from "@/lib/metamath/worker-protocol";
import type { MetamathIndex } from "@/lib/metamath/types";
import { SET_MM_SOURCE_URL } from "@/lib/metamath/config";

interface MetamathState {
  phase: LoadingPhase;
  index: MetamathIndex | null;
  enriched: boolean;
  fromCache: boolean;
  receivedBytes: number;
  totalBytes: number | undefined;
  error: string | null;
  verifyResults: Record<string, VerifyResultMessage>;
  pendingVerifications: Set<string>;
  load: (forceRefresh?: boolean) => void;
  verify: (label: string) => void;
  clearCache: () => void;
}

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL("../workers/metamath.worker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      handleWorkerMessage(event.data);
    };
  }
  return worker;
}

function handleWorkerMessage(message: WorkerResponse) {
  const set = useMetamathStore.setState;
  if (message.type === "progress") {
    set({
      phase: message.phase,
      receivedBytes: message.receivedBytes ?? 0,
      totalBytes: message.totalBytes,
    });
  } else if (message.type === "ready") {
    set({
      phase: "ready",
      index: message.index,
      enriched: message.enriched,
      fromCache: message.fromCache,
      error: null,
    });
  } else if (message.type === "error") {
    set({ phase: "error", error: message.message });
  } else if (message.type === "verify-result") {
    set((state) => {
      const pending = new Set(state.pendingVerifications);
      pending.delete(message.label);
      return {
        verifyResults: { ...state.verifyResults, [message.label]: message },
        pendingVerifications: pending,
      };
    });
  }
}

export const useMetamathStore = create<MetamathState>((set, get) => ({
  phase: "idle",
  index: null,
  enriched: false,
  fromCache: false,
  receivedBytes: 0,
  totalBytes: undefined,
  error: null,
  verifyResults: {},
  pendingVerifications: new Set(),

  load: (forceRefresh = false) => {
    set({ phase: "fetching", error: null });
    getWorker().postMessage({
      type: "load",
      sourceUrl: SET_MM_SOURCE_URL,
      forceRefresh,
    });
  },

  verify: (label: string) => {
    if (get().pendingVerifications.has(label)) return;
    set((state) => ({
      pendingVerifications: new Set(state.pendingVerifications).add(label),
    }));
    getWorker().postMessage({ type: "verify", label });
  },

  clearCache: () => {
    set({
      phase: "idle",
      index: null,
      enriched: false,
      fromCache: false,
      verifyResults: {},
    });
    getWorker().postMessage({ type: "clear-cache" });
  },
}));
