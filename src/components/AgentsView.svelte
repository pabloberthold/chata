<script lang="ts">
  import { onMount } from "svelte";
  import { listAgents, deleteAgent } from "../storage/agentStore";
  import type { AgentDefinition } from "../types/agent";

  let agents = $state<AgentDefinition[]>([]);
  let searchQuery = $state("");
  let selectedCategory = $state("all");

  onMount(async () => {
    await load();

    document.getElementById("agent-search")?.addEventListener("input", (e) => {
      searchQuery = (e.target as HTMLInputElement).value;
    });

    document.getElementById("agent-categories")?.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest("[data-category]");
      if (btn) selectedCategory = btn.getAttribute("data-category")!;
    });
  });

  async function load() {
    agents = await listAgents();
  }

  function getCategoryName(cat: string): string {
    const map: Record<string, string> = {
      systems: "Sistemas",
      devops: "DevOps",
      development: "Desarrollo",
      content: "Contenido",
      iot: "IoT",
      networking: "Redes",
    };
    return map[cat] || cat;
  }

  const categories = $derived(Array.from(new Set(agents.map((a) => a.category))));
  const filtered = $derived(
    agents.filter((a) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!a.name.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q)) return false;
      }
      if (selectedCategory !== "all" && a.category !== selectedCategory) return false;
      return true;
    })
  );
</script>

<div class="max-w-4xl mx-auto">
  <div class="flex items-center justify-between mb-8">
    <h1 class="text-2xl font-semibold">Agentes</h1>
    <div class="flex items-center gap-3">
      <input
        id="agent-search"
        type="text"
        placeholder="Buscar agentes..."
        class="input-field text-sm w-48"
      />
    </div>
  </div>

  <div class="flex gap-2 mb-6 flex-wrap" id="agent-categories">
    <button
      data-category="all"
      class="px-3 py-1.5 rounded-lg text-sm transition-colors {selectedCategory === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}"
    >
      Todos
    </button>
    {#each categories as cat}
      <button
        data-category={cat}
        class="px-3 py-1.5 rounded-lg text-sm transition-colors {selectedCategory === cat ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}"
      >
        {getCategoryName(cat)}
      </button>
    {/each}
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each filtered as agent}
      <div class="card hover:border-gray-600 transition-colors">
        <div class="flex items-start gap-4">
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style="background-color: {agent.color}20; color: {agent.color}"
          >
            {agent.icon}
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-medium text-gray-200">{agent.name}</h3>
            <p class="text-sm text-gray-400 mt-1 line-clamp-2">{agent.description}</p>
            <div class="flex items-center gap-2 mt-2 flex-wrap">
              <span class="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                {agent.preferredModel.split("/").pop() || agent.preferredModel}
              </span>
              <span class="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                T: {agent.temperature}
              </span>
              {#if agent.builtIn}
                <span class="text-xs bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full">
                  Built-in
                </span>
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>

  {#if filtered.length === 0}
    <div class="text-center py-12">
      <p class="text-gray-500">No se encontraron agentes.</p>
    </div>
  {/if}
</div>
