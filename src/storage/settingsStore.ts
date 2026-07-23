import { get, put } from "./db";
import type { AppSettings } from "../types";

const STORE = "settings";
const SETTINGS_KEY = "app-settings";

const DEFAULTS: AppSettings = {
  openRouterKey: "",
  theme: "dark",
  defaultModel: "meta-llama/llama-3.2-3b-instruct:free",
  defaultAgent: "assistant",
  fontSize: 14,
  enterToSend: true,
};

export async function getSettings(): Promise<AppSettings> {
  const stored = await get<{ key: string; value: AppSettings }>(STORE, SETTINGS_KEY);
  if (stored) {
    return { ...DEFAULTS, ...stored.value };
  }
  return { ...DEFAULTS };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await put(STORE, { key: SETTINGS_KEY, value: settings });
}

export async function getApiKey(): Promise<string> {
  const settings = await getSettings();
  return settings.openRouterKey;
}

export async function saveApiKey(key: string): Promise<void> {
  const settings = await getSettings();
  settings.openRouterKey = key;
  await saveSettings(settings);
}
