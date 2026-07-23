<script lang="ts">
  import { onMount } from "svelte";
  import { fetchModels, getCachedModels } from "../services/modelService";
  import { getSettings } from "../storage/settingsStore";
  import { getApiKey } from "../storage/settingsStore";
  import type { LLMModel } from "../providers/types";

  let models = $state<LLMModel[]>([]);
  let loading = $state(false);
  let error = $state("");
  let searchQuery = $state("");
  let selectedProvider = $state("all");
  let hasKey = $state(false);

  onMount(async () => {
    await checkKey();
    await loadModels();

    document.getElementById("model-search")?.addEventListener("input", (e) => {
      searchQuery = (e.target as HTMLInputElement).value;
    });

    document.getElementById("provider-select")?.addEventListener("change", (e) => {
      selectedProvider = (e.target as HTMLSelectElement).value;
    });

    document.getElementById("btn-refresh-models")?.addEventListener("click", handleRefresh);
  });

  async function checkKey() {
    const key = await getApiKey();
    hasKey = !!key;
  }

  async function loadModels() {
    const cached = getCachedModels();
    if (cached.length > 0) {
      models = cached;
    }
  }

  async function handleRefresh() {
    loading = true;
    error = "";
    try {
      models = await fetchModels(true);
    } catch (err) {
      error = err instanceof Error ? err.message : "Error al cargar modelos";
    } finally {
      loading = false;
    }
  }

  const providers = $derived(Array.from(new Set(models.map((m) => m.provider))));
  const filtered = $derived(
    models.filter((m) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!m.id.toLowerCase().includes(q) && !m.name.toLowerCase().includes(q)) return false;
      }
      if (selectedProvider !== "all" && m.provider !== selectedProvider) return false;
      return true;
    })
  );
</script>

<div class="max-w-4xl mx-auto">
  <div class="flex items-center justify-between mb-8">
    <h1 class="text-2xl font-semibold">Modelos</h1>
    <button id="btn-refresh-models" disabled={loading} class="btn-primary text-sm">
      {loading ? "Cargando..." : "Actualizar lista"}
    </button>
  </div>

  {#if !hasKey}
    <div class="card bg-yellow-600/10 border-yellow-600/30 mb-6">
      <p class="text-sm text-yellow-400">
        Configura tu API Key de OpenRouter en <a href="/settings" class="underline">Configuración</a> para ver los modelos disponibles.
      </p>
    </div>
  {/if}

  {#if error}
    <div class="card bg-red-600/10 border-red-600/30 mb-6">
      <p class="text-sm text-red-400">{error}</p>
    </div>
  {/if}

  <div class="flex items-center gap-3 mb-6">
    <input
      id="model-search"
      type="text"
      placeholder="Buscar modelos..."
      class="input-field text-sm w-64"
    />
    <select id="provider-select" class="input-field text-sm">
      <option value="all">Todos los proveedores</option>
      {#each providers as prov}
        <option value={prov}>{prov}</option>
      {/each}
    </select>
    <span class="text-xs text-gray-500">{filtered.length} modelos</span>
  </div>

  <div class="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
    {#each filtered as model}
      <div class="card hover:border-gray-600 transition-colors py-3">
        <div class="flex items-center justify-between">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-medium text-gray-200 truncate">{model.name}</h3>
              <span class="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded uppercase">{model.provider}</span>
            </div>
            <p class="text-xs text-gray-500 mt-0.5 font-mono">{model.id}</p>
            {#if model.description}
              <p class="text-xs text-gray-500 mt-1 line-clamp-1">{model.description}</p>
            {/if}
          </div>
          <div class="flex items-center gap-3 ml-4 text-xs text-gray-500 flex-shrink-0">
            <span title="Contexto">{model.contextLength.toLocaleString()} ctx</span>
            <span title="Precio prompt">${model.pricing.prompt}/M</span>
            <span title="Precio completion">${model.pricing.completion}/M</span>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
