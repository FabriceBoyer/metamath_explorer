import { get, set, clear, createStore } from "idb-keyval";
import type { MetamathIndex } from "@/lib/metamath/types";

// Two separate databases rather than two stores in one DB: idb-keyval's
// createStore() only creates the store named in whichever call first
// triggers the DB's version-1 upgrade, so a second store name on the same
// DB name would silently never get created.
const rawStore = createStore("metamath-explorer-raw", "raw-source");
const indexStore = createStore("metamath-explorer-index", "parsed-index");

export interface CachedRaw {
  url: string;
  text: string;
  sha256: string;
  byteLength: number;
  fetchedAt: string;
}

export async function getCachedRaw(
  url: string,
): Promise<CachedRaw | undefined> {
  return get<CachedRaw>(url, rawStore);
}

export async function setCachedRaw(value: CachedRaw): Promise<void> {
  return set(value.url, value, rawStore);
}

export async function getCachedIndex(
  sha256: string,
): Promise<MetamathIndex | undefined> {
  return get<MetamathIndex>(sha256, indexStore);
}

export async function setCachedIndex(
  sha256: string,
  index: MetamathIndex,
): Promise<void> {
  return set(sha256, index, indexStore);
}

export async function clearAllCaches(): Promise<void> {
  await Promise.all([clear(rawStore), clear(indexStore)]);
}
