import { getAll, get, put, del } from "./db";
import type { AliasEntry, MaskEntry } from "../types";

const ALIAS_STORE = "aliases";
const MASK_STORE = "masks";

export async function listAliases(): Promise<AliasEntry[]> {
  return getAll<AliasEntry>(ALIAS_STORE);
}

export async function getAlias(alias: string): Promise<AliasEntry | null> {
  return get<AliasEntry>(ALIAS_STORE, alias);
}

export async function saveAlias(entry: AliasEntry): Promise<void> {
  return put(ALIAS_STORE, entry);
}

export async function deleteAlias(alias: string): Promise<void> {
  return del(ALIAS_STORE, alias);
}

export async function listMasks(): Promise<MaskEntry[]> {
  return getAll<MaskEntry>(MASK_STORE);
}

export async function saveMask(entry: MaskEntry): Promise<void> {
  return put(MASK_STORE, entry);
}

export async function deleteMask(original: string): Promise<void> {
  return del(MASK_STORE, original);
}
