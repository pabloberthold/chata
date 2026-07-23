<script lang="ts">
  import { onMount } from "svelte";
  import { listAliases, saveAlias, deleteAlias } from "../storage/aliasStore";
  import type { AliasEntry } from "../types";

  let aliases = $state<AliasEntry[]>([]);
  let newAlias = $state("");
  let newValue = $state("");
  let newCategory = $state("general");

  onMount(async () => {
    await load();

    document.getElementById("alias-alias")?.addEventListener("input", (e) => {
      newAlias = (e.target as HTMLInputElement).value;
    });
    document.getElementById("alias-value")?.addEventListener("input", (e) => {
      newValue = (e.target as HTMLInputElement).value;
    });
    document.getElementById("alias-category")?.addEventListener("change", (e) => {
      newCategory = (e.target as HTMLSelectElement).value;
    });
    document.getElementById("btn-add-alias")?.addEventListener("click", add);

    document.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest("[data-alias]");
      if (btn && document.getElementById("alias-list")?.contains(btn as Node)) {
        remove(btn.getAttribute("data-alias")!);
      }
    });
  });

  async function load() {
    aliases = await listAliases();
  }

  async function add() {
    if (!newAlias.trim() || !newValue.trim()) return;
    await saveAlias({ alias: newAlias.trim(), value: newValue.trim(), category: newCategory });
    newAlias = "";
    newValue = "";
    const aliasInput = document.getElementById("alias-alias") as HTMLInputElement | null;
    const valueInput = document.getElementById("alias-value") as HTMLInputElement | null;
    if (aliasInput) aliasInput.value = "";
    if (valueInput) valueInput.value = "";
    await load();
  }

  async function remove(alias: string) {
    await deleteAlias(alias);
    await load();
  }
</script>

<div class="space-y-3">
  <div class="flex gap-2">
    <input id="alias-alias" placeholder="Alias (ej: linux1)" class="input-field text-sm flex-1" />
    <input id="alias-value" placeholder="Valor real (ej: srv-rhel09)" class="input-field text-sm flex-[2]" />
    <select id="alias-category" class="input-field text-sm">
      <option value="general">general</option>
      <option value="hostname">hostname</option>
      <option value="ip">ip</option>
    </select>
    <button id="btn-add-alias" class="btn-primary text-sm whitespace-nowrap">Agregar</button>
  </div>
  {#if aliases.length > 0}
    <div class="space-y-1 max-h-48 overflow-y-auto" id="alias-list">
      {#each aliases as entry}
        <div class="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2 text-sm">
          <span class="text-primary-400 font-mono">{entry.alias}</span>
          <span class="text-gray-500">→</span>
          <span class="text-gray-300 flex-1">{entry.value}</span>
          <span class="text-xs text-gray-600">{entry.category}</span>
          <button data-alias={entry.alias} class="text-gray-500 hover:text-red-400 text-xs">✕</button>
        </div>
      {/each}
    </div>
  {:else}
    <p class="text-xs text-gray-500">No hay alias configurados.</p>
  {/if}
</div>
