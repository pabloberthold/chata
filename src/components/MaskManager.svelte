<script lang="ts">
  import { onMount } from "svelte";
  import { listMasks, saveMask, deleteMask } from "../storage/aliasStore";
  import type { MaskEntry } from "../types";

  let masks = $state<MaskEntry[]>([]);
  let testInput = $state("");
  let testOutput = $state("");

  onMount(async () => {
    await load();

    document.getElementById("mask-original")?.addEventListener("input", (e) => {
      const el = e.target as HTMLInputElement;
      el.dataset.value = el.value;
    });
    document.getElementById("mask-masked")?.addEventListener("input", (e) => {
      const el = e.target as HTMLInputElement;
      el.dataset.value = el.value;
    });
    document.getElementById("btn-add-mask")?.addEventListener("click", add);

    document.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest("[data-mask]");
      if (btn && document.getElementById("mask-list")?.contains(btn as Node)) {
        remove(btn.getAttribute("data-mask")!);
      }
    });

    document.getElementById("mask-test-input")?.addEventListener("input", (e) => {
      testInput = (e.target as HTMLTextAreaElement).value;
      applyTest();
    });
  });

  async function load() {
    masks = await listMasks();
  }

  async function add() {
    const origInput = document.getElementById("mask-original") as HTMLInputElement | null;
    const maskedInput = document.getElementById("mask-masked") as HTMLInputElement | null;
    const original = origInput?.dataset.value || origInput?.value || "";
    const masked = maskedInput?.dataset.value || maskedInput?.value || "";
    if (!original.trim() || !masked.trim()) return;
    await saveMask({ original: original.trim(), masked: masked.trim(), enabled: true });
    if (origInput) { origInput.value = ""; origInput.dataset.value = ""; }
    if (maskedInput) { maskedInput.value = ""; maskedInput.dataset.value = ""; }
    await load();
    applyTest();
  }

  function applyTest() {
    const enabledMasks = masks.filter((m) => m.enabled);
    let out = testInput;
    for (const m of enabledMasks) {
      const regex = new RegExp(escapeRegex(m.original), "gi");
      out = out.replace(regex, m.masked);
    }
    testOutput = out;
  }

  async function remove(original: string) {
    await deleteMask(original);
    masks = await listMasks();
    applyTest();
  }

  function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
</script>

<div class="space-y-3">
  <div class="flex gap-2">
    <input id="mask-original" placeholder="Original (ej: Empresa XYZ)" class="input-field text-sm flex-1" />
    <input id="mask-masked" placeholder="Enmascarado (ej: Cliente Alfa)" class="input-field text-sm flex-1" />
    <button id="btn-add-mask" class="btn-primary text-sm whitespace-nowrap">Agregar</button>
  </div>
  {#if masks.length > 0}
    <div class="space-y-1 max-h-48 overflow-y-auto" id="mask-list">
      {#each masks as entry}
        <div class="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2 text-sm">
          <span class="text-gray-300">{entry.original}</span>
          <span class="text-gray-500">→</span>
          <span class="text-primary-400">{entry.masked}</span>
          <span class="text-xs text-gray-600">{entry.enabled ? "✓" : "✗"}</span>
          <button data-mask={entry.original} class="text-gray-500 hover:text-red-400 text-xs ml-auto">✕</button>
        </div>
      {/each}
    </div>
  {:else}
    <p class="text-xs text-gray-500">No hay máscaras configuradas.</p>
  {/if}

  <details class="text-sm">
    <summary class="cursor-pointer text-gray-400 hover:text-gray-200">Probar máscaras</summary>
    <div class="mt-2 space-y-2">
      <textarea id="mask-test-input" rows="3" placeholder="Pega texto aquí para probar las máscaras..." class="input-field text-sm w-full font-mono"></textarea>
      {#if testOutput}
        <div class="bg-gray-800/50 rounded-lg p-3 text-sm">
          <p class="text-xs text-gray-500 mb-1">Resultado:</p>
          <p class="text-gray-200 whitespace-pre-wrap">{testOutput}</p>
        </div>
      {/if}
    </div>
  </details>
</div>