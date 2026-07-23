<script lang="ts">
  import { onMount } from "svelte";
  import { generateId } from "../utils/tokenizer";
  import { deleteConversation } from "../storage/conversationStore";
  import { subscribeConvs, refreshConvs } from "../stores/conv";

  let { currentPage = "chat" }: { currentPage?: string } = $props();

  let currentConvId = $state("");

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    currentConvId = params.get("chat") || "";
  });

  let collapsed = $state(false);
  let searchQuery = $state("");
  let convList = $state<Array<{ id: string; title: string; updatedAt: number }>>([]);

  function navigate(path: string) {
    window.location.href = path;
  }

  function navigateToChat(id: string) {
    const url = new URL(window.location.href);
    if (id) {
      url.searchParams.set("chat", id);
    } else {
      url.searchParams.delete("chat");
    }
    window.location.href = url.pathname + url.search;
  }

  function newChat() {
    const id = generateId();
    navigateToChat(id);
  }

  async function deleteConv(id: string, e: MouseEvent) {
    e.stopPropagation();
    await deleteConversation(id);
    await refreshConvs();
  }

  onMount(() => {
    refreshConvs();
    const unsub = subscribeConvs((list) => {
      convList = list;
    });
    return unsub;
  });

  const filteredConvs = $derived(
    searchQuery
      ? convList.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
      : convList
  );
</script>

<div class="sidebar flex flex-col h-screen bg-[#0f0f1a] border-r border-gray-800 transition-all duration-200 {$collapsed ? 'w-16' : 'w-64'}">
  <div class="flex items-center justify-between p-3 border-b border-gray-800">
    {#if !collapsed}
      <button onclick={newChat} class="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium flex-1 mr-2">
        <span class="text-lg">+</span>
        <span>Nuevo Chat</span>
      </button>
    {:else}
      <button onclick={newChat} class="mx-auto bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition-colors text-lg">
        +
      </button>
    {/if}
    <button onclick={() => collapsed = !collapsed} class="text-gray-500 hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {#if collapsed}
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        {:else}
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        {/if}
      </svg>
    </button>
  </div>

  {#if !collapsed}
    <div class="px-3 py-2">
      <input
        type="text"
        placeholder="Buscar conversaciones..."
        bind:value={searchQuery}
        class="input-field text-xs"
      />
    </div>
  {/if}

  <nav class="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
    <button onclick={() => navigate("/")} class="sidebar-item w-full text-left {$currentPage === 'chat' ? 'active' : ''}" title="Chat">
      <span class="text-lg">💬</span>
      {#if !collapsed}<span class="text-sm">Chat</span>{/if}
    </button>
    <button onclick={() => navigate("/agents")} class="sidebar-item w-full text-left {$currentPage === 'agents' ? 'active' : ''}" title="Agentes">
      <span class="text-lg">🤖</span>
      {#if !collapsed}<span class="text-sm">Agentes</span>{/if}
    </button>
    <button onclick={() => navigate("/prompts")} class="sidebar-item w-full text-left {$currentPage === 'prompts' ? 'active' : ''}" title="Prompts">
      <span class="text-lg">📝</span>
      {#if !collapsed}<span class="text-sm">Prompts</span>{/if}
    </button>
    <button onclick={() => navigate("/models")} class="sidebar-item w-full text-left {$currentPage === 'models' ? 'active' : ''}" title="Modelos">
      <span class="text-lg">🧠</span>
      {#if !collapsed}<span class="text-sm">Modelos</span>{/if}
    </button>
    <button onclick={() => navigate("/settings")} class="sidebar-item w-full text-left {$currentPage === 'settings' ? 'active' : ''}" title="Configuración">
      <span class="text-lg">⚙️</span>
      {#if !collapsed}<span class="text-sm">Configuración</span>{/if}
    </button>

    {#if !collapsed && filteredConvs.length > 0}
      <div class="border-t border-gray-800 my-2"></div>
      <div class="text-xs text-gray-500 px-3 py-1 font-medium uppercase tracking-wider">Conversaciones</div>
      {#each filteredConvs as conv}
        <button
          onclick={() => navigateToChat(conv.id)}
          class="sidebar-item w-full text-left group {$currentConvId === conv.id ? 'active' : ''}"
        >
          <span class="text-sm flex-1 truncate">{conv.title}</span>
          <span role="button" tabindex="0" onclick={(e) => deleteConv(conv.id, e)} onkeydown={(e) => e.key === 'Enter' && deleteConv(conv.id, e)} class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all text-xs cursor-pointer">
            ✕
          </span>
        </button>
      {/each}
    {/if}
  </nav>

  <div class="p-3 border-t border-gray-800">
    <button onclick={() => navigate("/about")} class="sidebar-item w-full text-left {$currentPage === 'about' ? 'active' : ''}">
      <span class="text-lg">ℹ️</span>
      {#if !collapsed}<span class="text-sm">Acerca de</span>{/if}
    </button>
  </div>
</div>

<style>
  .sidebar {
    flex-shrink: 0;
  }
</style>
