<script lang="ts">
  import { onMount } from "svelte";
  import { listConversations, deleteConversation, searchConversations, getConversation } from "../storage/conversationStore";
  import { refreshConvs } from "../stores/conv";
  import { exportAsMarkdown, exportAsJson, downloadFile } from "../services/exportService";
  import { formatDate } from "../utils/tokenizer";

  let convs = $state<Array<{ id: string; title: string; messageCount: number; createdAt: number; updatedAt: number; modelId: string; agentId: string; estimatedTokens: number; pinned: boolean }>>([]);
  let searchQuery = $state("");

  onMount(async () => {
    await load();

    const searchInput = document.getElementById("history-search") as HTMLInputElement | null;
    let debounceTimer: number | undefined;
    searchInput?.addEventListener("input", () => {
      searchQuery = searchInput.value;
      clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(load, 200);
    });

    document.getElementById("conv-list")?.addEventListener("click", async (e) => {
      const target = e.target as HTMLElement;
      const convEl = target.closest("[data-conv-id]");
      if (!convEl) return;
      const cid = convEl.getAttribute("data-conv-id")!;
      const action = target.closest("[data-action]")?.getAttribute("data-action");
      if (action === "export-md") await handleExportMarkdown(cid);
      else if (action === "export-json") await handleExportJson(cid);
      else if (action === "delete") await handleDelete(cid);
      else navigateToChat(cid);
    });
  });

  async function load() {
    convs = searchQuery ? await searchConversations(searchQuery) : await listConversations();
  }

  async function handleDelete(id: string) {
    await deleteConversation(id);
    await load();
    refreshConvs();
  }

  async function handleExportMarkdown(id: string) {
    const conv = await getConversation(id);
    if (!conv) return;
    const md = exportAsMarkdown(conv);
    downloadFile(md, `${conv.title}.md`, "text/markdown");
  }

  async function handleExportJson(id: string) {
    const conv = await getConversation(id);
    if (!conv) return;
    const json = exportAsJson(conv);
    downloadFile(json, `${conv.title}.json`, "application/json");
  }

  function navigateToChat(id: string) {
    window.location.href = `/?chat=${encodeURIComponent(id)}`;
  }
</script>

<div class="max-w-4xl mx-auto">
  <div class="flex items-center justify-between mb-8">
    <h1 class="text-2xl font-semibold">Historial</h1>
    <input
      id="history-search"
      type="text"
      placeholder="Buscar en conversaciones..."
      class="input-field text-sm w-64"
    />
  </div>

  {#if convs.length === 0}
    <div class="text-center py-12">
      <p class="text-gray-500">No hay conversaciones aún.</p>
      <a href="/" class="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block">Comenzar una nueva</a>
    </div>
  {/if}

  <div class="space-y-2" id="conv-list">
    {#each convs as conv}
      <div class="card hover:border-gray-600 transition-colors py-3" data-conv-id={conv.id}>
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0 text-left cursor-pointer">
            <h3 class="text-sm font-medium text-gray-200 truncate">{conv.title}</h3>
            <div class="flex items-center gap-3 text-xs text-gray-500 mt-1">
              <span>{formatDate(conv.updatedAt)}</span>
              <span>{conv.messageCount} mensajes</span>
              <span class="font-mono">{conv.modelId.split("/").pop()}</span>
              <span>~{conv.estimatedTokens} tokens</span>
            </div>
          </div>
          <div class="flex items-center gap-1 ml-4">
            <button data-action="export-md" class="btn-ghost text-xs p-1" title="Exportar MD">📄</button>
            <button data-action="export-json" class="btn-ghost text-xs p-1" title="Exportar JSON">📋</button>
            <button data-action="delete" class="btn-ghost text-xs p-1 hover:text-red-400" title="Eliminar">🗑️</button>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
